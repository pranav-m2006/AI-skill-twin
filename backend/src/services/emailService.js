'use strict';

const nodemailer = require('nodemailer');

/**
 * Dispatches an email via Resend.com REST API (HTTPS Port 443).
 * Bypasses cloud host SMTP port blocking completely.
 */
async function sendEmailViaResend({ to, subject, html, text }) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return null;

  const from = process.env.RESEND_FROM || 'PlaceMate AI <onboarding@resend.dev>';

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      signal: controller.signal,
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from,
        to: Array.isArray(to) ? to : [to],
        subject,
        html,
        text,
      }),
    });
    clearTimeout(timeoutId);

    const data = await response.json();
    if (!response.ok) {
      console.warn('[PlaceMate AI Resend API Warning]:', data.message || response.statusText);
      return { success: false, error: data.message || response.statusText };
    }

    console.log(`[PlaceMate AI Resend API] Email sent successfully to ${to}:`, data.id);
    return { success: true, messageId: data.id };
  } catch (err) {
    console.warn('[PlaceMate AI Resend API Error]:', err.message);
    return { success: false, error: err.message };
  }
}

// Helper to create a nodemailer transporter based on env config
async function createTransporter() {
  const host = process.env.SMTP_HOST || 'smtp.gmail.com';
  const port = parseInt(process.env.SMTP_PORT || '465', 10);
  const user = process.env.SMTP_USER || 'pranavmahe6@gmail.com';
  const pass = process.env.SMTP_PASS || 'vfuptcnonvpqqadd';

  if (user && pass) {
    return {
      transporter: nodemailer.createTransport({
        host,
        port,
        secure: port === 465,
        auth: { user, pass },
        connectionTimeout: 4000,
        greetingTimeout: 4000,
        socketTimeout: 4000,
      }),
      isReal: true,
    };
  }

  // Fallback to auto-created Ethereal test account for local dev testing
  try {
    const testAccount = await nodemailer.createTestAccount();
    const testTransporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });
    return { transporter: testTransporter, isReal: false };
  } catch (err) {
    return {
      transporter: nodemailer.createTransport({ jsonTransport: true }),
      isReal: false,
    };
  }
}

/**
 * Sends an email using nodemailer with a strict timeout to prevent HTTP request delays.
 */
function sendMailWithTimeout(transporter, mailOptions, timeoutMs = 5000) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(`SMTP mail dispatch timed out after ${timeoutMs}ms`));
    }, timeoutMs);

    transporter.sendMail(mailOptions)
      .then(info => {
        clearTimeout(timer);
        resolve(info);
      })
      .catch(err => {
        clearTimeout(timer);
        reject(err);
      });
  });
}


/**
 * Sends a welcome & encouraging email to a newly signed up user.
 */
async function sendWelcomeEmail({ email, name, targetRole }) {
  try {
    const roleText = targetRole ? ` as a ${targetRole}` : '';
    const subject = `Welcome to PlaceMate AI - Account Registration Confirmed`;

    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: 'Segoe UI', Arial, sans-serif; background-color: #f4f6f9; color: #1e293b; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 30px auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.08); }
    .header { background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%); padding: 36px 30px; text-align: center; color: #ffffff; }
    .header h1 { margin: 0; font-size: 26px; font-weight: 700; letter-spacing: -0.5px; }
    .header p { margin: 8px 0 0 0; opacity: 0.9; font-size: 15px; }
    .content { padding: 32px 30px; line-height: 1.65; }
    .greeting { font-size: 18px; font-weight: 600; color: #0f172a; margin-bottom: 16px; }
    .badge { display: inline-block; background-color: #e0e7ff; color: #4338ca; padding: 6px 14px; border-radius: 20px; font-weight: 600; font-size: 13px; margin-bottom: 20px; }
    .quote-box { background: #f8fafc; border-left: 4px solid #6366f1; border-radius: 0 8px 8px 0; padding: 18px 20px; margin: 24px 0; font-style: italic; color: #334155; }
    .cta-container { text-align: center; margin: 32px 0 24px 0; }
    .cta-btn { background: #4f46e5; color: #ffffff !important; text-decoration: none; padding: 14px 28px; border-radius: 8px; font-weight: 600; font-size: 15px; display: inline-block; }
    .footer { background-color: #f8fafc; border-top: 1px solid #e2e8f0; padding: 20px 30px; text-align: center; font-size: 13px; color: #64748b; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>PlaceMate AI</h1>
      <p>Your AI-Powered Career & Placement Accelerator</p>
    </div>
    <div class="content">
      <div class="greeting">Hello ${name},</div>
      <div class="badge">Registration Confirmed</div>
      
      <p>Welcome to <strong>PlaceMate AI</strong>! We are excited to confirm that your registration is complete${roleText}.</p>
      
      <div class="quote-box">
        "Every expert was once a beginner. By taking this step today, you have set yourself on a powerful path towards achieving your career goals. Believe in your potential, stay consistent, and remember: small daily efforts compound into monumental success!"
      </div>

      <p>Here is what you can do right away to kickstart your preparation:</p>
      <ul>
        <li><strong>Build Your Custom Roadmap:</strong> Get daily step-by-step tasks tailored to your target role.</li>
        <li><strong>Master Aptitude & Coding:</strong> Practice curated question sets and track your progress.</li>
        <li><strong>Build Your Daily Streak:</strong> Stay motivated and earn XP badges as you level up.</li>
        <li><strong>Explore Jobs & Internships:</strong> Get matched with top opportunities aligned with your skills.</li>
      </ul>

      <p>If you have any questions or need support along the way, we are always here to help.</p>

      <p>Best regards,<br><strong>The PlaceMate AI Team</strong></p>
    </div>
    <div class="footer">
      &copy; ${new Date().getFullYear()} PlaceMate AI. All rights reserved.<br>
      You received this email because you registered on PlaceMate AI.
    </div>
  </div>
</body>
</html>
    `;

    const textContent = `
Hello ${name},

Welcome to PlaceMate AI! We are thrilled to confirm that you have successfully registered on PlaceMate AI${roleText}.

"Every expert was once a beginner. By taking this step today, you have set yourself on a powerful path towards achieving your career goals. Believe in your potential, stay consistent, and remember: small daily efforts compound into monumental success!"

Wishing you the very best on your placement journey!

Best regards,
The PlaceMate AI Team
    `;

    if (process.env.RESEND_API_KEY) {
      const resendRes = await sendEmailViaResend({ to: email, subject, html: htmlContent, text: textContent });
      if (resendRes && resendRes.success) return resendRes;
    }

    const { transporter } = await createTransporter();
    const senderEmail = process.env.SMTP_USER || 'pranavmahe6@gmail.com';
    const fromAddress = `"PlaceMate AI" <${senderEmail}>`;

    const mailOptions = {
      from: fromAddress,
      replyTo: senderEmail,
      to: email,
      subject,
      text: textContent,
      html: htmlContent,
      headers: {
        'X-Priority': '1',
        'X-MSMail-Priority': 'High',
        'Importance': 'High',
        'Auto-Submitted': 'auto-generated',
        'List-Unsubscribe': `<mailto:${senderEmail}?subject=unsubscribe>`,
        'X-Report-Abuse-To': `<mailto:${senderEmail}>`,
      },
    };

    const info = await sendMailWithTimeout(transporter, mailOptions, 5000);
    console.log(`[PlaceMate AI Email] Welcome email dispatched to ${email}:`, info.messageId || info);
    return { success: true, messageId: info.messageId };

  } catch (err) {
    console.error(`[PlaceMate AI Email Error] Failed to send welcome email to ${email}:`, err.message);
    return { success: false, error: err.message };
  }
}

/**
 * Sends a login alert/confirmation email when user logs in.
 */
async function sendLoginNotificationEmail({ email, name }) {
  try {
    const senderEmail = process.env.SMTP_USER || 'pranavmahe6@gmail.com';
    const fromAddress = `"PlaceMate AI" <${senderEmail}>`;
    const timeString = new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata', dateStyle: 'medium', timeStyle: 'short' });

    const subject = `PlaceMate AI Security Alert: Successful Login Notice`;

    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: 'Segoe UI', Arial, sans-serif; background-color: #f4f6f9; color: #1e293b; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 30px auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.08); }
    .header { background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%); padding: 32px 30px; text-align: center; color: #ffffff; }
    .header h1 { margin: 0; font-size: 24px; font-weight: 700; }
    .content { padding: 32px 30px; line-height: 1.65; }
    .greeting { font-size: 18px; font-weight: 600; color: #0f172a; margin-bottom: 16px; }
    .badge { display: inline-block; background-color: #dcfce7; color: #15803d; padding: 6px 14px; border-radius: 20px; font-weight: 600; font-size: 13px; margin-bottom: 20px; }
    .footer { background-color: #f8fafc; border-top: 1px solid #e2e8f0; padding: 20px 30px; text-align: center; font-size: 13px; color: #64748b; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>PlaceMate AI</h1>
      <p>Security Alert Notification</p>
    </div>
    <div class="content">
      <div class="greeting">Hello ${name},</div>
      <div class="badge">Security Notice: New Login</div>
      
      <p>We detected a new successful login to your PlaceMate AI account.</p>

      <table style="width:100%; border-collapse: collapse; margin: 20px 0; background: #f8fafc; border-radius: 8px;">
        <tr><td style="padding: 12px 16px; border-bottom: 1px solid #e2e8f0; font-weight: 600;">Account Email:</td><td style="padding: 12px 16px; border-bottom: 1px solid #e2e8f0;">${email}</td></tr>
        <tr><td style="padding: 12px 16px; font-weight: 600;">Login Time:</td><td style="padding: 12px 16px;">${timeString} (IST)</td></tr>
      </table>

      <p>If this was you, no action is needed.</p>

      <p>Best regards,<br><strong>PlaceMate AI Security Team</strong></p>
    </div>
    <div class="footer">
      &copy; ${new Date().getFullYear()} PlaceMate AI. All rights reserved.
    </div>
  </div>
</body>
</html>
    `;

    const textContent = `
Hello ${name},

We detected a successful login to your PlaceMate AI account at ${timeString} (IST).

If this was you, no action is required.

Best regards,
PlaceMate AI Security Team
    `;

    if (process.env.RESEND_API_KEY) {
      const resendRes = await sendEmailViaResend({ to: email, subject, html: htmlContent, text: textContent });
      if (resendRes && resendRes.success) return resendRes;
    }

    const { transporter } = await createTransporter();

    const mailOptions = {
      from: fromAddress,
      replyTo: senderEmail,
      to: email,
      subject,
      text: textContent,
      html: htmlContent,
      headers: {
        'X-Priority': '1',
        'X-MSMail-Priority': 'High',
        'Importance': 'High',
        'Auto-Submitted': 'auto-generated',
        'List-Unsubscribe': `<mailto:${senderEmail}?subject=unsubscribe>`,
      },
    };

    const info = await sendMailWithTimeout(transporter, mailOptions, 5000);
    console.log(`[PlaceMate AI Email] Login notification dispatched to ${email}:`, info.messageId || info);
    return { success: true, messageId: info.messageId };
  } catch (err) {
    console.error(`[PlaceMate AI Email Error] Failed to send login email to ${email}:`, err.message);
    return { success: false, error: err.message };
  }
}

/**
 * Sends a 6-digit OTP verification code to a user during account registration.
 */
async function sendOtpEmail({ email, name, otp }) {
  const userName = name || 'User';

  console.log(`\n==================================================`);
  console.log(`🔑 [PlaceMate AI Email OTP Verification]`);
  console.log(`To: ${email} (${userName})`);
  console.log(`OTP Code: [ ${otp} ]`);
  console.log(`==================================================\n`);

  try {
    const senderEmail = process.env.SMTP_USER || 'pranavmahe6@gmail.com';
    const fromAddress = `"PlaceMate AI Verification" <${senderEmail}>`;
    const subject = `PlaceMate AI Verification Code: ${otp}`;

    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: 'Segoe UI', Arial, sans-serif; background-color: #f4f6f9; color: #1e293b; margin: 0; padding: 0; }
    .container { max-width: 550px; margin: 30px auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.08); }
    .header { background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%); padding: 28px 24px; text-align: center; color: #ffffff; }
    .header h1 { margin: 0; font-size: 24px; font-weight: 700; }
    .content { padding: 28px 24px; line-height: 1.65; }
    .greeting { font-size: 16px; font-weight: 600; color: #0f172a; margin-bottom: 12px; }
    .otp-box { font-size: 34px; font-weight: 800; letter-spacing: 10px; color: #4f46e5; background: #e0e7ff; padding: 18px 24px; border-radius: 12px; text-align: center; font-family: 'Courier New', monospace; margin: 24px 0; border: 2px dashed #6366f1; }
    .note { font-size: 13px; color: #64748b; background: #f8fafc; padding: 12px 16px; border-radius: 8px; border-left: 4px solid #4f46e5; }
    .footer { background-color: #f8fafc; border-top: 1px solid #e2e8f0; padding: 16px 24px; text-align: center; font-size: 12px; color: #64748b; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>PlaceMate AI</h1>
      <p>Account Verification</p>
    </div>
    <div class="content">
      <div class="greeting">Hello ${userName},</div>
      <p>Thank you for signing up on <strong>PlaceMate AI</strong>. Please enter the 6-digit verification code below to verify your account:</p>
      
      <div class="otp-box">${otp}</div>

      <div class="note">
        This code is valid for <strong>10 minutes</strong>. Do not share this OTP code with anyone for account security.
      </div>
      <br>
      <p>If you did not request this verification, please ignore this message.</p>

      <p>Best regards,<br><strong>PlaceMate AI Team</strong></p>
    </div>
    <div class="footer">
      &copy; ${new Date().getFullYear()} PlaceMate AI. All rights reserved.
    </div>
  </div>
</body>
</html>
    `;

    const textContent = `
Hello ${userName},

Your PlaceMate AI verification code is: ${otp}

This code is valid for 10 minutes. Please enter this code on the registration page to complete your account setup.

Best regards,
PlaceMate AI Team
    `;

    if (process.env.RESEND_API_KEY) {
      const resendRes = await sendEmailViaResend({ to: email, subject, html: htmlContent, text: textContent });
      if (resendRes && resendRes.success) return { success: true, messageId: resendRes.messageId, otp };
    }

    const { transporter } = await createTransporter();
    const mailOptions = {
      from: fromAddress,
      replyTo: senderEmail,
      to: email,
      subject,
      text: textContent,
      html: htmlContent,
      headers: {
        'X-Priority': '1',
        'X-MSMail-Priority': 'High',
        'Importance': 'High',
        'Auto-Submitted': 'auto-generated',
        'List-Unsubscribe': `<mailto:${senderEmail}?subject=unsubscribe>`,
        'X-Report-Abuse-To': `<mailto:${senderEmail}>`,
      },
    };

    const info = await sendMailWithTimeout(transporter, mailOptions, 5000);
    console.log(`[PlaceMate AI Email OTP] Verification OTP (${otp}) dispatched to ${email}:`, info.messageId || info);
    return { success: true, messageId: info.messageId, otp };
  } catch (err) {
    console.warn(`[PlaceMate AI Email OTP Warning] SMTP email dispatch warning for ${email}:`, err.message);
    return { success: true, simulated: true, error: err.message };
  }
}

/**
 * Sends a 6-digit password reset verification code.
 */
async function sendPasswordResetEmail({ email, name, otp }) {
  const userName = name || 'User';

  console.log(`\n==================================================`);
  console.log(`🔐 [PlaceMate AI Password Reset Request]`);
  console.log(`To: ${email} (${userName})`);
  console.log(`Reset Code: [ ${otp} ]`);
  console.log(`==================================================\n`);

  try {
    const senderEmail = process.env.SMTP_USER || 'pranavmahe6@gmail.com';
    const fromAddress = `"PlaceMate AI Security" <${senderEmail}>`;

    const subject = `PlaceMate AI Password Reset Code: ${otp}`;

    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: 'Segoe UI', Arial, sans-serif; background-color: #f4f6f9; color: #1e293b; margin: 0; padding: 0; }
    .container { max-width: 550px; margin: 30px auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.08); }
    .header { background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%); padding: 28px 24px; text-align: center; color: #ffffff; }
    .header h1 { margin: 0; font-size: 24px; font-weight: 700; }
    .content { padding: 28px 24px; line-height: 1.65; }
    .greeting { font-size: 16px; font-weight: 600; color: #0f172a; margin-bottom: 12px; }
    .otp-box { font-size: 34px; font-weight: 800; letter-spacing: 10px; color: #4f46e5; background: #e0e7ff; padding: 18px 24px; border-radius: 12px; text-align: center; font-family: 'Courier New', monospace; margin: 24px 0; border: 2px dashed #6366f1; }
    .note { font-size: 13px; color: #64748b; background: #f8fafc; padding: 12px 16px; border-radius: 8px; border-left: 4px solid #4f46e5; }
    .footer { background-color: #f8fafc; border-top: 1px solid #e2e8f0; padding: 16px 24px; text-align: center; font-size: 12px; color: #64748b; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>PlaceMate AI</h1>
      <p>Password Reset Request</p>
    </div>
    <div class="content">
      <div class="greeting">Hello ${userName},</div>
      <p>We received a request to reset your PlaceMate AI account password. Please enter the 6-digit code below to verify and create a new password:</p>
      
      <div class="otp-box">${otp}</div>

      <div class="note">
        This code is valid for <strong>10 minutes</strong>. If you did not request a password reset, please ignore this message.
      </div>
      <br>
      <p>Best regards,<br><strong>PlaceMate AI Security Team</strong></p>
    </div>
    <div class="footer">
      &copy; ${new Date().getFullYear()} PlaceMate AI. All rights reserved.
    </div>
  </div>
</body>
</html>
    `;

    const textContent = `
Hello ${userName},

Your PlaceMate AI password reset code is: ${otp}

This code is valid for 10 minutes. If you did not request a password reset, please ignore this email.

Best regards,
PlaceMate AI Security Team
    `;

    if (process.env.RESEND_API_KEY) {
      const resendRes = await sendEmailViaResend({ to: email, subject, html: htmlContent, text: textContent });
      if (resendRes && resendRes.success) return { success: true, messageId: resendRes.messageId, otp };
    }

    const { transporter } = await createTransporter();
    const mailOptions = {
      from: fromAddress,
      replyTo: senderEmail,
      to: email,
      subject,
      text: textContent,
      html: htmlContent,
      headers: {
        'X-Priority': '1',
        'X-MSMail-Priority': 'High',
        'Importance': 'High',
        'Auto-Submitted': 'auto-generated',
        'List-Unsubscribe': `<mailto:${senderEmail}?subject=unsubscribe>`,
        'X-Report-Abuse-To': `<mailto:${senderEmail}>`,
      },
    };

    const info = await sendMailWithTimeout(transporter, mailOptions, 5000);
    console.log(`[PlaceMate AI Reset Email] Password reset code (${otp}) sent to ${email}:`, info.messageId || info);
    return { success: true, messageId: info.messageId, otp };
  } catch (err) {
    console.warn(`[PlaceMate AI Reset Warning] Password reset email warning for ${email}:`, err.message);
    return { success: true, simulated: true, error: err.message };
  }
}

module.exports = {
  sendWelcomeEmail,
  sendLoginNotificationEmail,
  sendOtpEmail,
  sendPasswordResetEmail,
};
