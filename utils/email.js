const nodemailer = require('nodemailer');
require('dotenv').config();

// Création du transporteur SMTP (Gmail)
const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Templates email
async function sendEmail(to, subject, html) {
  try {
    const info = await transporter.sendMail({
      from: `"Avena" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html,
    });
    console.log(`✅ Email envoyé à ${to}`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error(`❌ Erreur email à ${to}:`, error.message);
    return { success: false, error: error.message };
  }
}

async function sendVerificationEmail(email, name, code) {
  return sendEmail(email, 'Vérifie ton email Avena', `
    <h1>Bonjour ${name} !</h1>
    <p>Bienvenue sur Avena, ta plateforme campus.</p>
    <p>Ton code de vérification est : <strong style="font-size:1.2rem">${code}</strong></p>
    <p>Ce code expire dans 15 minutes.</p>
    <hr>
    <p>L'équipe Avena</p>
  `);
}

async function sendPasswordResetEmail(email, name, link) {
  return sendEmail(email, 'Réinitialisation mot de passe Avena', `
    <h1>Bonjour ${name}</h1>
    <p>Clique sur le lien ci-dessous pour réinitialiser ton mot de passe :</p>
    <p><a href="${link}">${link}</a></p>
    <p>Ce lien expire dans 1 heure.</p>
  `);
}

async function sendEventConfirmationEmail(email, name, eventTitle) {
  return sendEmail(email, `Inscription confirmée : ${eventTitle}`, `
    <h1>Bonjour ${name}</h1>
    <p>Tu es bien inscrit(e) à l'événement <strong>${eventTitle}</strong>.</p>
    <p>À bientôt sur le campus !</p>
  `);
}

module.exports = {
  sendVerificationEmail,
  sendPasswordResetEmail,
  sendEventConfirmationEmail,
};