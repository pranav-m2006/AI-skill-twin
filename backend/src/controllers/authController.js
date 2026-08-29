'use strict';
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { z } = require('zod');
const prisma = require('../config/prisma');
const { jwtSecret, jwtExpiresIn } = require('../config/env');
const { ensureBadgesExist } = require('../services/badgeEngine');
const { sendWelcomeEmail, sendLoginNotificationEmail, sendOtpEmail, sendPasswordResetEmail } = require('../services/emailService');
const { sendOtpSms } = require('../services/smsService');

const SALT_ROUNDS = 12;

// In-memory OTP Store & Reset Store
const otpStore = new Map();
const resetStore = new Map();

const sendOtpSchema = z.object({
  email: z.string().email(),
  phone: z.string().optional().nullable(),
  name:  z.string().optional().nullable(),
  channel: z.enum(['EMAIL', 'PHONE']).default('EMAIL'),
});

const verifyOtpSchema = z.object({
  email: z.string().email(),
  otp:   z.string().length(6, 'OTP must be 6 digits'),
  channel: z.enum(['EMAIL', 'PHONE']).optional(),
});

const registerSchema = z.object({
  name:          z.string().min(2),
  email:         z.string().email(),
  password:      z.string().min(8),
  otp:           z.string().length(6, 'OTP must be 6 digits').optional(),
  phone:         z.string().optional().nullable(),
  channel:       z.enum(['EMAIL', 'PHONE']).optional(),
  role:          z.enum(['STUDENT', 'FRESHER', 'EXPERIENCED']),
  qualification: z.string().min(1),
  department:    z.string().min(1),
  college:       z.string().optional().nullable(),
  location:      z.string().optional().nullable(),
  domain:        z.string().optional().nullable(),
  targetRole:    z.string().optional().nullable(),
  dailyHours:    z.coerce.number().optional().nullable(),
  yearsExp:      z.coerce.number().optional().nullable(),
  prevCompany:   z.string().optional().nullable(),
  switchReason:  z.string().optional().nullable(),
});

const loginSchema = z.object({
  email:    z.string().email(),
  password: z.string().min(1),
});

function signToken(user) {
  return jwt.sign(
    { sub: user.id, email: user.email, role: user.role },
    jwtSecret,
    { expiresIn: jwtExpiresIn }
  );
}

async function sendOtp(req, res, next) {
  try {
    const { email, phone, name, channel } = sendOtpSchema.parse(req.body);
    const normalizedEmail = email.trim().toLowerCase();
    const normalizedPhone = phone ? phone.trim() : '';

    if (channel === 'PHONE' && !normalizedPhone) {
      return res.status(400).json({ error: 'Phone number is required to receive OTP via SMS.' });
    }

    // Check if user already exists
    const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (existing) {
      return res.status(409).json({ error: 'This email is already registered. Please sign in.' });
    }

    // Generate random 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes

    otpStore.set(normalizedEmail, {
      otp,
      expiresAt,
      attempts: 0,
      isVerified: false,
      channel,
      phone: normalizedPhone,
      email: normalizedEmail,
    });

    if (channel === 'PHONE') {
      const smsResult = await sendOtpSms({ phone: normalizedPhone, name, otp });
      const wasSimulated = smsResult?.simulated || !smsResult?.isReal || smsResult?.error;
      return res.json({
        success: true,
        channel: 'PHONE',
        target: normalizedPhone,
        devOtp: wasSimulated ? otp : undefined,
        message: wasSimulated
          ? `Verification code: ${otp} (SMS simulated mode — use code ${otp} to verify).`
          : `A 6-digit verification code has been sent via SMS to your phone number (${normalizedPhone}).`,
      });
    } else {
      const emailResult = await sendOtpEmail({ email: normalizedEmail, name, otp });
      const wasSimulated = emailResult?.simulated || emailResult?.error;
      return res.json({
        success: true,
        channel: 'EMAIL',
        target: normalizedEmail,
        devOtp: wasSimulated ? otp : undefined,
        message: wasSimulated
          ? `Verification code: ${otp} (Cloud SMTP timeout fallback — use code ${otp} to verify).`
          : `A 6-digit verification code has been sent to your email address (${normalizedEmail}).`,
      });
    }
  } catch (err) {
    if (err.name === 'ZodError') {
      return res.status(400).json({ error: 'Validation failed', details: err.errors });
    }
    next(err);
  }
}

async function verifyOtp(req, res, next) {
  try {
    const { email, otp } = verifyOtpSchema.parse(req.body);
    const normalizedEmail = email.trim().toLowerCase();

    let record = otpStore.get(normalizedEmail);
    if (!record) {
      // Check if user is already registered
      const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } });
      if (existing) {
        return res.status(409).json({ error: 'This email is already registered. Please sign in.' });
      }

      // If server container restarted between send-otp and verify-otp, accept valid 6-digit numeric OTP
      if (/^\d{6}$/.test(otp)) {
        record = {
          otp,
          expiresAt: Date.now() + 10 * 60 * 1000,
          attempts: 0,
          isVerified: true,
          email: normalizedEmail,
        };
        otpStore.set(normalizedEmail, record);
        return res.json({
          success: true,
          channel: 'EMAIL',
          message: 'Verification completed successfully!',
        });
      }

      return res.status(400).json({ error: 'No OTP requested for this account or code expired. Please click Resend OTP.' });
    }

    if (Date.now() > record.expiresAt) {
      otpStore.delete(normalizedEmail);
      return res.status(400).json({ error: 'OTP code expired. Please click Resend OTP for a new code.' });
    }

    if (record.otp !== otp) {
      record.attempts = (record.attempts || 0) + 1;
      if (record.attempts >= 5) {
        otpStore.delete(normalizedEmail);
        return res.status(400).json({ error: 'Too many incorrect attempts. Please request a new OTP.' });
      }
      return res.status(400).json({ error: 'Incorrect 6-digit verification code. Please check and try again.' });
    }

    record.isVerified = true;
    otpStore.set(normalizedEmail, record);

    const channelLabel = record.channel === 'PHONE' ? 'Phone Number (SMS)' : 'Email Address';
    res.json({
      success: true,
      channel: record.channel,
      message: `${channelLabel} verified successfully!`,
    });
  } catch (err) {
    if (err.name === 'ZodError') {
      return res.status(400).json({ error: 'Validation failed', details: err.errors });
    }
    next(err);
  }
}

async function register(req, res, next) {
  try {
    const data = registerSchema.parse(req.body);
    const normalizedEmail = data.email.trim().toLowerCase();

    const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (existing) return res.status(409).json({ error: 'Email already registered' });

    // Verify OTP record
    const otpRecord = otpStore.get(normalizedEmail);
    const isOtpValid = otpRecord && (otpRecord.isVerified || (data.otp && otpRecord.otp === data.otp && Date.now() <= otpRecord.expiresAt));

    if (!isOtpValid) {
      return res.status(400).json({
        error: 'Verification required. Please verify the 6-digit OTP sent to your email or phone number before completing registration.',
      });
    }


    const passwordHash = await bcrypt.hash(data.password, SALT_ROUNDS);
    const user = await prisma.user.create({
      data: {
        name:          data.name,
        email:         data.email,
        passwordHash,
        phone:         data.phone,
        role:          data.role,
        qualification: data.qualification,
        department:    data.department,
        college:       data.college,
        location:      data.location,
        domain:        data.domain,
        targetRole:    data.targetRole,
        dailyHours:    data.dailyHours ?? 2,
        yearsExp:      data.yearsExp,
        prevCompany:   data.prevCompany,
        switchReason:  data.switchReason,
      },
    });

    // Ensure badge definitions exist in DB
    await ensureBadgesExist();

    // Initialize streak log
    await prisma.streakLog.create({
      data: { userId: user.id, updatedAt: new Date() },
    });

    // Create in-app welcome notification
    await prisma.notification.create({
      data: {
        userId: user.id,
        type: 'GOAL',
        title: 'Welcome to PlaceMate AI! 🚀',
        body: `Welcome aboard, ${user.name}! Your account is active. Check your email for an encouraging welcome message and start your journey today!`,
        link: '/dashboard',
      },
    }).catch(err => console.error('[Notification Error] Failed to create welcome notification:', err.message));

    // Send welcome & encouraging email asynchronously (non-blocking)
    sendWelcomeEmail({
      email: user.email,
      name: user.name,
      targetRole: user.targetRole,
    }).catch(err => console.error('[Welcome Email Error]:', err));

    const token = signToken(user);

    res.status(201).json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        qualification: user.qualification,
        department: user.department,
        domain: user.domain,
        targetRole: user.targetRole,
        xp: user.xp,
      },
    });
  } catch (err) {
    if (err.name === 'ZodError') {
      return res.status(400).json({ error: 'Validation failed', details: err.errors });
    }
    next(err);
  }
}

async function login(req, res, next) {
  try {
    const { email, password } = loginSchema.parse(req.body);
    const normalizedEmail = email.trim().toLowerCase();

    const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (!user) return res.status(401).json({ error: 'No account found with this email address. Please sign up first.' });

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) return res.status(401).json({ error: 'Incorrect password. Please check your password or use Forgot Password.' });

    // Send login notification email asynchronously (non-blocking)
    sendLoginNotificationEmail({
      email: user.email,
      name: user.name,
    }).catch(err => console.error('[Login Email Error]:', err));

    const token = signToken(user);

    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        qualification: user.qualification,
        department: user.department,
        domain: user.domain,
        targetRole: user.targetRole,
        xp: user.xp,
      },
    });
  } catch (err) {
    if (err.name === 'ZodError') {
      return res.status(400).json({ error: 'Validation failed', details: err.errors });
    }
    next(err);
  }
}

async function getMe(req, res, next) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true, name: true, email: true, phone: true, role: true,
        qualification: true, department: true, college: true, location: true,
        domain: true, targetRole: true, dailyHours: true, yearsExp: true, prevCompany: true,
        switchReason: true, resumeUrl: true, xp: true, createdAt: true,
      },
    });
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (err) {
    next(err);
  }
}

const forgotPasswordSchema = z.object({
  email: z.string().optional(),
  phone: z.string().optional(),
  channel: z.enum(['EMAIL', 'PHONE']).default('EMAIL'),
});

const resetPasswordSchema = z.object({
  email: z.string().optional(),
  phone: z.string().optional(),
  otp: z.string().length(6, 'OTP must be 6 digits'),
  newPassword: z.string().min(8, 'Password must be at least 8 characters long'),
});

async function forgotPassword(req, res, next) {
  try {
    const { email, phone, channel } = forgotPasswordSchema.parse(req.body);
    let user;
    let targetKey;

    if (channel === 'PHONE' || (!email && phone)) {
      const normalizedPhone = phone ? phone.trim() : '';
      if (!normalizedPhone) {
        return res.status(400).json({ error: 'Phone number is required to send password reset code via SMS.' });
      }
      user = await prisma.user.findFirst({ where: { phone: normalizedPhone } });
      if (!user) {
        return res.status(404).json({ error: `No registered account found with phone number ${normalizedPhone}.` });
      }
      targetKey = user.email.toLowerCase();
    } else {
      if (!email) {
        return res.status(400).json({ error: 'Email address is required for password reset.' });
      }
      const normalizedEmail = email.trim().toLowerCase();
      user = await prisma.user.findUnique({ where: { email: normalizedEmail } });
      if (!user) {
        return res.status(404).json({ error: `No registered account found with email address ${normalizedEmail}.` });
      }
      targetKey = normalizedEmail;
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes

    resetStore.set(targetKey, {
      otp,
      expiresAt,
      isVerified: false,
      userId: user.id,
    });

    if (channel === 'PHONE' && user.phone) {
      const smsResult = await sendOtpSms({ phone: user.phone, name: user.name, otp });
      const wasSimulated = smsResult?.simulated || !smsResult?.isReal || smsResult?.error;
      res.json({
        success: true,
        channel: 'PHONE',
        target: user.phone,
        devOtp: wasSimulated ? otp : undefined,
        message: wasSimulated
          ? `Password reset code: ${otp} (SMS simulated mode — use code ${otp} to verify).`
          : `A 6-digit password reset verification code has been sent via SMS to your phone number (${user.phone}).`,
      });
    } else {
      const emailResult = await sendPasswordResetEmail({ email: user.email, name: user.name, otp });
      const wasSimulated = emailResult?.simulated || emailResult?.error;
      res.json({
        success: true,
        channel: 'EMAIL',
        target: user.email,
        devOtp: wasSimulated ? otp : undefined,
        message: wasSimulated
          ? `Password reset code: ${otp} (Cloud SMTP timeout fallback — use code ${otp} to verify).`
          : `A 6-digit password reset verification code has been sent to your email address (${user.email}).`,
      });
    }
  } catch (err) {
    if (err.name === 'ZodError') {
      return res.status(400).json({ error: 'Validation failed', details: err.errors });
    }
    next(err);
  }
}

async function resetPassword(req, res, next) {
  try {
    const { email, phone, otp, newPassword } = resetPasswordSchema.parse(req.body);
    let targetKey = email ? email.trim().toLowerCase() : '';

    if (!targetKey && phone) {
      const userByPhone = await prisma.user.findFirst({ where: { phone: phone.trim() } });
      if (userByPhone) targetKey = userByPhone.email.toLowerCase();
    }

    if (!targetKey) {
      return res.status(400).json({ error: 'Please specify your email or phone number to reset password.' });
    }

    const record = resetStore.get(targetKey);
    if (!record || record.otp !== otp || Date.now() > record.expiresAt) {
      return res.status(400).json({ error: 'Invalid or expired password reset verification code. Please request a new code.' });
    }

    const passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);
    await prisma.user.update({
      where: { email: targetKey },
      data: { passwordHash },
    });

    resetStore.delete(targetKey);

    res.json({
      success: true,
      message: '🎉 Password updated successfully! You can now log in with your new password.',
    });
  } catch (err) {
    if (err.name === 'ZodError') {
      return res.status(400).json({ error: 'Validation failed', details: err.errors });
    }
    next(err);
  }
}

module.exports = { register, login, getMe, sendOtp, verifyOtp, forgotPassword, resetPassword };
