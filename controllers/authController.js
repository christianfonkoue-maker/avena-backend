/**
 * AVENA — Auth Controller
 * controllers/authController.js
 */

const db = require('../config/db');
const User = require('../models/User');
const { generateToken } = require('../utils/jwt');
const { 
  sendVerificationEmail, 
  sendPasswordResetEmail, 
  sendTwoFactorEmail 
} = require('../utils/email');
const { generateCode, generateToken: generateRandomToken } = require('../utils/helpers');

/**
 * Register a new user
 */
async function register(req, res) {
  const { firstName, lastName, email, studentId, password, program, year } = req.body;
  
  try {
    // Check if user already exists
    const existingUser = await User.findByEmail(email);
    if (existingUser) {
      return res.status(400).json({ ok: false, error: 'An account with this email already exists.' });
    }
    
    // Check if student ID is already used
    const existingStudent = await User.findByStudentId(studentId);
    if (existingStudent) {
      return res.status(400).json({ ok: false, error: 'This student ID is already registered.' });
    }
    
    // Get university from email domain
    const domain = email.split('@')[1].toLowerCase();
    const universityResult = await db.query(
      'SELECT id FROM universities WHERE domain = $1',
      [domain]
    );
    
    if (universityResult.rows.length === 0) {
      return res.status(400).json({ ok: false, error: 'Only registered university emails are accepted.' });
    }
    
    const universityId = universityResult.rows[0].id;
    
    // Create user
    const user = await User.create({
      firstName,
      lastName,
      email: email.toLowerCase(),
      studentId,
      universityId,
      program: program || null,
      year: year || 1,
      password,
    });
    
    // Generate verification code
    const verificationCode = generateCode();
    await db.query(
      `INSERT INTO email_verifications (user_id, code, expires_at)
       VALUES ($1, $2, NOW() + INTERVAL '15 minutes')`,
      [user.id, verificationCode]
    );
    
    // Send verification email
    await sendVerificationEmail(email, firstName, verificationCode);
    
    res.status(201).json({
      ok: true,
      message: 'Account created! Please check your email for verification code.',
      userId: user.id,
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ ok: false, error: 'Internal server error.' });
  }
}

/**
 * Login user
 */
async function login(req, res) {
  const { email, password } = req.body;
  
  try {
    const user = await User.findByEmail(email.toLowerCase());
    if (!user) {
      return res.status(401).json({ ok: false, error: 'Invalid credentials.' });
    }
    
    const isValid = await User.verifyPassword(user, password);
    if (!isValid) {
      return res.status(401).json({ ok: false, error: 'Invalid credentials.' });
    }
    
    // Check if email is verified
    if (!user.email_verified) {
      return res.status(401).json({ 
        ok: false, 
        error: 'Please verify your email first.',
        needsVerify: true,
      });
    }
    
    // Check if 2FA is enabled
    if (user.two_factor_enabled) {
      const twoFACode = generateCode();
      await db.query(
        `INSERT INTO email_verifications (user_id, code, expires_at)
         VALUES ($1, $2, NOW() + INTERVAL '10 minutes')`,
        [user.id, twoFACode]
      );
      await sendTwoFactorEmail(email, twoFACode);
      
      return res.status(200).json({
        ok: false,
        needs2FA: true,
        message: '2FA code sent to your email.',
      });
    }
    
    // Generate JWT
    const token = generateToken(user.id, user.email, user.role);
    
    // Store session
    await db.query(
      `INSERT INTO sessions (user_id, token, expires_at)
       VALUES ($1, $2, NOW() + INTERVAL '7 days')`,
      [user.id, token]
    );
    
    // Return user info (without sensitive data)
    const { password_hash, ...safeUser } = user;
    
    res.json({
      ok: true,
      token,
      user: safeUser,
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ ok: false, error: 'Internal server error.' });
  }
}

/**
 * Verify email with code
 */
async function verifyEmail(req, res) {
  const { email, code } = req.body;
  
  try {
    const user = await User.findByEmail(email.toLowerCase());
    if (!user) {
      return res.status(404).json({ ok: false, error: 'User not found.' });
    }
    
    const verification = await db.query(
      `SELECT * FROM email_verifications 
       WHERE user_id = $1 AND code = $2 AND expires_at > NOW()`,
      [user.id, code]
    );
    
    if (verification.rows.length === 0) {
      return res.status(400).json({ ok: false, error: 'Invalid or expired verification code.' });
    }
    
    await User.verifyEmail(user.id);
    await db.query(`DELETE FROM email_verifications WHERE user_id = $1`, [user.id]);
    
    res.json({ ok: true, message: 'Email verified successfully! You can now log in.' });
  } catch (error) {
    console.error('Verify email error:', error);
    res.status(500).json({ ok: false, error: 'Internal server error.' });
  }
}

/**
 * Resend verification code
 */
async function resendVerification(req, res) {
  const { email } = req.body;
  
  try {
    const user = await User.findByEmail(email.toLowerCase());
    if (!user) {
      return res.status(404).json({ ok: false, error: 'User not found.' });
    }
    
    if (user.email_verified) {
      return res.status(400).json({ ok: false, error: 'Email already verified.' });
    }
    
    // Delete old codes
    await db.query(`DELETE FROM email_verifications WHERE user_id = $1`, [user.id]);
    
    // Generate new code
    const verificationCode = generateCode();
    await db.query(
      `INSERT INTO email_verifications (user_id, code, expires_at)
       VALUES ($1, $2, NOW() + INTERVAL '15 minutes')`,
      [user.id, verificationCode]
    );
    
    await sendVerificationEmail(email, user.first_name, verificationCode);
    
    res.json({ ok: true, message: 'New verification code sent to your email.' });
  } catch (error) {
    console.error('Resend verification error:', error);
    res.status(500).json({ ok: false, error: 'Internal server error.' });
  }
}

/**
 * Forgot password - send reset link
 */
async function forgotPassword(req, res) {
  const { email } = req.body;
  
  try {
    const user = await User.findByEmail(email.toLowerCase());
    if (!user) {
      // Don't reveal that user doesn't exist for security
      return res.json({ ok: true, message: 'If this email exists, a reset link was sent.' });
    }
    
    const resetToken = generateRandomToken();
    await db.query(
      `INSERT INTO password_resets (user_id, token, expires_at)
       VALUES ($1, $2, NOW() + INTERVAL '1 hour')`,
      [user.id, resetToken]
    );
    
    const resetLink = `${process.env.FRONTEND_URL}/pages/auth/reset-password.html?token=${resetToken}&email=${encodeURIComponent(email)}`;
    await sendPasswordResetEmail(email, user.first_name, resetLink);
    
    res.json({ ok: true, message: 'If this email exists, a reset link was sent.' });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ ok: false, error: 'Internal server error.' });
  }
}

/**
 * Reset password
 */
async function resetPassword(req, res) {
  const { token, newPassword } = req.body;
  
  try {
    const resetEntry = await db.query(
      `SELECT * FROM password_resets WHERE token = $1 AND expires_at > NOW()`,
      [token]
    );
    
    if (resetEntry.rows.length === 0) {
      return res.status(400).json({ ok: false, error: 'Invalid or expired reset token.' });
    }
    
    const userId = resetEntry.rows[0].user_id;
    await User.updatePassword(userId, newPassword);
    await db.query(`DELETE FROM password_resets WHERE user_id = $1`, [userId]);
    
    res.json({ ok: true, message: 'Password reset successfully! You can now log in.' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ ok: false, error: 'Internal server error.' });
  }
}

/**
 * Verify 2FA code
 */
async function verify2FA(req, res) {
  const { email, code } = req.body;
  
  try {
    const user = await User.findByEmail(email.toLowerCase());
    if (!user) {
      return res.status(404).json({ ok: false, error: 'User not found.' });
    }
    
    const verification = await db.query(
      `SELECT * FROM email_verifications 
       WHERE user_id = $1 AND code = $2 AND expires_at > NOW()`,
      [user.id, code]
    );
    
    if (verification.rows.length === 0) {
      return res.status(400).json({ ok: false, error: 'Invalid or expired 2FA code.' });
    }
    
    await db.query(`DELETE FROM email_verifications WHERE user_id = $1`, [user.id]);
    
    const token = generateToken(user.id, user.email, user.role);
    await db.query(
      `INSERT INTO sessions (user_id, token, expires_at)
       VALUES ($1, $2, NOW() + INTERVAL '7 days')`,
      [user.id, token]
    );
    
    const { password_hash, ...safeUser } = user;
    
    res.json({ ok: true, token, user: safeUser });
  } catch (error) {
    console.error('2FA verification error:', error);
    res.status(500).json({ ok: false, error: 'Internal server error.' });
  }
}

/**
 * Logout user
 */
async function logout(req, res) {
  const token = req.headers.authorization?.split(' ')[1];
  
  if (token) {
    await db.query(`DELETE FROM sessions WHERE token = $1`, [token]);
  }
  
  res.json({ ok: true, message: 'Logged out successfully.' });
}

/**
 * Get current user
 */
async function getMe(req, res) {
  res.json({ ok: true, user: req.user });
}

module.exports = {
  register,
  login,
  verifyEmail,
  resendVerification,
  forgotPassword,
  resetPassword,
  verify2FA,
  logout,
  getMe,
};