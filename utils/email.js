/**
 * AVENA — Email Service
 * utils/email.js
 * 
 * Uses Nodemailer with SMTP (Gmail, SendGrid, etc.)
 * Supports multiple templates: verification, password reset, event confirmation
 */

const nodemailer = require('nodemailer');
require('dotenv').config();

// Create transporter
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: parseInt(process.env.EMAIL_PORT),
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Email templates
const templates = {
  /**
   * Email verification template
   */
  verification: (name, code) => ({
    subject: 'Verify your Avena account',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #4361ee; padding: 20px; text-align: center;">
          <h1 style="color: white;">Avena</h1>
        </div>
        <div style="padding: 30px; background: #ffffff;">
          <h2>Hi ${name}!</h2>
          <p>Thanks for joining Avena — your campus marketplace.</p>
          <p>Please verify your email address by entering this code:</p>
          <div style="background: #f4f6fb; padding: 15px; text-align: center; font-size: 32px; letter-spacing: 8px; font-weight: bold; margin: 20px 0;">
            ${code}
          </div>
          <p>This code expires in 15 minutes.</p>
          <p>If you didn't create an account, you can safely ignore this email.</p>
          <hr style="margin: 20px 0;">
          <p style="color: #7a7f9a; font-size: 12px;">Avena — Connect, Buy, Sell, Grow</p>
        </div>
      </div>
    `,
  }),

  /**
   * Password reset template
   */
  resetPassword: (name, link) => ({
    subject: 'Reset your Avena password',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #4361ee; padding: 20px; text-align: center;">
          <h1 style="color: white;">Avena</h1>
        </div>
        <div style="padding: 30px; background: #ffffff;">
          <h2>Hi ${name}!</h2>
          <p>We received a request to reset your password. Click the button below to set a new one:</p>
          <div style="text-align: center; margin: 25px 0;">
            <a href="${link}" style="background: #4361ee; color: white; padding: 12px 30px; text-decoration: none; border-radius: 40px;">Reset Password</a>
          </div>
          <p>This link expires in 1 hour.</p>
          <p>If you didn't request this, you can safely ignore this email.</p>
          <hr style="margin: 20px 0;">
          <p style="color: #7a7f9a; font-size: 12px;">Avena — Connect, Buy, Sell, Grow</p>
        </div>
      </div>
    `,
  }),

  /**
   * Two-factor authentication template
   */
  twoFactor: (code) => ({
    subject: 'Your Avena login code',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #4361ee; padding: 20px; text-align: center;">
          <h1 style="color: white;">Avena</h1>
        </div>
        <div style="padding: 30px; background: #ffffff;">
          <h2>Login Verification</h2>
          <p>Your one-time verification code is:</p>
          <div style="background: #f4f6fb; padding: 15px; text-align: center; font-size: 32px; letter-spacing: 8px; font-weight: bold; margin: 20px 0;">
            ${code}
          </div>
          <p>This code expires in 10 minutes.</p>
          <p>If you didn't attempt to log in, please ignore this email.</p>
          <hr style="margin: 20px 0;">
          <p style="color: #7a7f9a; font-size: 12px;">Avena — Connect, Buy, Sell, Grow</p>
        </div>
      </div>
    `,
  }),

  /**
   * Event confirmation template
   */
  eventConfirmation: (name, eventTitle, date, location) => ({
    subject: `You're registered for ${eventTitle}!`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #4361ee; padding: 20px; text-align: center;">
          <h1 style="color: white;">Avena</h1>
        </div>
        <div style="padding: 30px; background: #ffffff;">
          <h2>Registration Confirmed! 🎉</h2>
          <p>Hi ${name},</p>
          <p>You're successfully registered for:</p>
          <div style="background: #eef0fd; padding: 15px; border-radius: 12px; margin: 15px 0;">
            <h3 style="margin: 0 0 8px 0;">${eventTitle}</h3>
            <p>📅 ${date}</p>
            <p>📍 ${location}</p>
          </div>
          <p>We'll send you a reminder before the event.</p>
          <p>See you there!</p>
          <hr style="margin: 20px 0;">
          <p style="color: #7a7f9a; font-size: 12px;">Avena — Connect, Buy, Sell, Grow</p>
        </div>
      </div>
    `,
  }),
};

/**
 * Send email using nodemailer
 */
async function sendEmail(to, subject, html) {
  try {
    const info = await transporter.sendMail({
      from: `"Avena" <${process.env.EMAIL_USER}>`,
      to: to,
      subject: subject,
      html: html,
    });
    console.log(`📧 Email sent to ${to}: ${subject}`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error(`❌ Email failed to ${to}:`, error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Send verification code email
 */
async function sendVerificationEmail(email, name, code) {
  const { subject, html } = templates.verification(name, code);
  return sendEmail(email, subject, html);
}

/**
 * Send password reset email
 */
async function sendPasswordResetEmail(email, name, resetLink) {
  const { subject, html } = templates.resetPassword(name, resetLink);
  return sendEmail(email, subject, html);
}

/**
 * Send 2FA code email
 */
async function sendTwoFactorEmail(email, code) {
  const { subject, html } = templates.twoFactor(code);
  return sendEmail(email, subject, html);
}

/**
 * Send event confirmation email
 */
async function sendEventConfirmationEmail(email, name, eventTitle, date, location) {
  const { subject, html } = templates.eventConfirmation(name, eventTitle, date, location);
  return sendEmail(email, subject, html);
}

module.exports = {
  sendEmail,
  sendVerificationEmail,
  sendPasswordResetEmail,
  sendTwoFactorEmail,
  sendEventConfirmationEmail,
};