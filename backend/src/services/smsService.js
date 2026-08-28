'use strict';

/**
 * Service to dispatch SMS OTP messages for PlaceMate AI user verification.
 * Supports Twilio API if credentials are provided in process.env, with a
 * seamless fallback to simulated console dispatch for local development.
 */

async function sendOtpSms({ phone, name, otp }) {
  try {
    let rawPhone = phone ? phone.trim().replace(/[\s-]/g, '') : '';
    if (!rawPhone) {
      throw new Error('Phone number is required to send SMS OTP.');
    }

    // Auto-prefix Indian 10-digit mobile numbers with +91 if missing country code
    let formattedPhone = rawPhone;
    if (/^\d{10}$/.test(rawPhone)) {
      formattedPhone = `+91${rawPhone}`;
    } else if (/^\d{11,15}$/.test(rawPhone) && !rawPhone.startsWith('+')) {
      formattedPhone = `+${rawPhone}`;
    }

    const userName = name || 'User';
    const messageBody = `PlaceMate AI Verification Code: ${otp}. Valid for 10 minutes. Do not share this code with anyone.`;

    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const fromPhone = process.env.TWILIO_PHONE_NUMBER;

    // Optional real Twilio SMS dispatch
    if (accountSid && authToken && fromPhone) {
      try {
        const twilio = require('twilio')(accountSid, authToken);
        const message = await twilio.messages.create({
          body: messageBody,
          from: fromPhone,
          to: formattedPhone,
        });
        console.log(`[PlaceMate AI SMS OTP] Real SMS sent to ${formattedPhone} via Twilio SID: ${message.sid}`);
        return {
          success: true,
          channel: 'PHONE',
          target: formattedPhone,
          messageId: message.sid,
          isReal: true,
        };
      } catch (twilioErr) {
        console.warn(`[PlaceMate AI SMS OTP Warning] Twilio API call failed, falling back to simulated SMS:`, twilioErr.message);
      }
    }

    // Fallback: Simulated SMS dispatch for local development
    console.log(`\n==================================================`);
    console.log(`📱 [PlaceMate AI SMS OTP Verification]`);
    console.log(`To: ${formattedPhone} (${userName})`);
    console.log(`Message: ${messageBody}`);
    console.log(`OTP Code: [ ${otp} ]`);
    console.log(`==================================================\n`);

    return {
      success: true,
      channel: 'PHONE',
      target: formattedPhone,
      isReal: false,
      simulated: true,
    };
  } catch (err) {
    console.error(`[PlaceMate AI SMS OTP Error] Failed to dispatch SMS OTP:`, err.message);
    return {
      success: false,
      error: err.message,
    };
  }
}

module.exports = {
  sendOtpSms,
};
