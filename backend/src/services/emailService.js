import nodemailer from 'nodemailer';
import config from '../config/env.js';

/**
 * Configure Nodemailer Transporter
 * Using Turkticaret.Net SMTP settings
 */
const transporter = nodemailer.createTransport({
    host: config.smtp.host,
    port: config.smtp.port,
    secure: false, // true for 465, false for other ports
    auth: {
        user: config.smtp.email,
        pass: config.smtp.password,
    },
    tls: {
        rejectUnauthorized: false // To prevent certificate errors in some environments
    },
    debug: true,
    logger: true
});

// Verify SMTP connection on startup
transporter.verify()
    .then(() => console.log('✅ SMTP bağlantısı başarılı — mail gönderilebilir'))
    .catch((err) => console.error('❌ SMTP bağlantı hatası:', err.message));

/**
 * Common layout wrapper for HTML emails
 */
const emailLayout = (content) => `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            margin: 0;
            padding: 0;
            background-color: #f4f7f6;
        }
        .container {
            max-width: 600px;
            margin: 20px auto;
            background: #ffffff;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        }
        .header {
            background-color: #004a99;
            color: #ffffff;
            padding: 30px;
            text-align: center;
        }
        .header h1 {
            margin: 0;
            font-size: 28px;
            letter-spacing: 1px;
        }
        .content {
            padding: 30px;
        }
        .button {
            display: inline-block;
            padding: 12px 25px;
            background-color: #007bff;
            color: #ffffff !important;
            text-decoration: none;
            border-radius: 5px;
            font-weight: bold;
            margin: 20px 0;
        }
        .footer {
            background-color: #f4f7f6;
            color: #777;
            padding: 20px;
            text-align: center;
            font-size: 12px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Finbot</h1>
        </div>
        <div class="content">
            ${content}
        </div>
        <div class="footer">
            <p>&copy; ${new Date().getFullYear()} Finbot Global. Tüm hakları saklıdır.</p>
            <p>Bu e-posta otomatik olarak gönderilmiştir, lütfen yanıtlamayınız.</p>
        </div>
    </div>
</body>
</html>
`;

/**
 * Send Welcome Email
 * @param {string} userEmail - Recipient's email
 * @param {string} userName - Recipient's name
 */
export const sendWelcomeEmail = async (userEmail, userName) => {
    const html = emailLayout(`
        <h2>Hoşgeldin, ${userName}!</h2>
        <p>Finbot ailesine katıldığın için mutluyuz. Finansal yolculuğunda sana en iyi desteği sağlamak için buradayız.</p>
        <p>Hemen platformumuzu keşfetmeye başlayabilir, piyasa analizlerine ve AI destekli yatırım botlarına göz atabilirsin.</p>
        <a href="${config.frontendUrl}" class="button">Platforma Git</a>
        <p>Eğer herhangi bir sorun olursa, bu e-postayı yanıtlamaktan çekinme (veya destek ekibimize ulaş).</p>
    `);

    try {
        await transporter.sendMail({
            from: config.smtp.from,
            to: userEmail,
            subject: 'Finbot\'a Hoş Geldiniz!',
            html
        });
        console.log(`✅ Welcome email sent to: ${userEmail}`);
    } catch (error) {
        console.error(`❌ Error sending welcome email:`, error);
        throw error;
    }
};

/**
 * Send Password Reset Email
 * @param {string} userEmail - Recipient's email
 * @param {string} resetToken - The tokens/link for password reset
 */
export const sendPasswordResetEmail = async (userEmail, resetToken) => {
    const resetLink = `${process.env.CLIENT_URL}/reset-password/${resetToken}`;

    const html = emailLayout(`
        <h2>Şifre Sıfırlama İsteği</h2>
        <p>Hesabınız için bir şifre sıfırlama isteği aldık. Şifrenizi sıfırlamak için aşağıdaki butona tıklayın:</p>
        <a href="${resetLink}" class="button">Şifremi Sıfırla</a>
        <p>Eğer bu isteği siz yapmadıysanız, lütfen bu e-postayı görmezden gelin. Hesabınız güvende kalacaktır.</p>
        <p>Bu bağlantı 1 saat içinde geçerliliğini yitirecektir.</p>
    `);

    try {
        await transporter.sendMail({
            from: config.smtp.from,
            to: userEmail,
            subject: 'Finbot Şifre Sıfırlama',
            html
        });
        console.log(`✅ Password reset email sent to: ${userEmail}`);
    } catch (error) {
        console.error(`❌ Error sending password reset email:`, error);
        throw error;
    }
};

/**
 * Send Verification Code Email
 * @param {string} userEmail 
 * @param {string} code 
 */
export const sendVerificationEmail = async (userEmail, code) => {
    const html = emailLayout(`
        <h2>Doğrulama Kodunuz</h2>
        <p>Finbot hesabınızı doğrulamak için lütfen aşağıdaki kodu kullanın:</p>
        <div style="font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #004a99; text-align: center; margin: 20px 0; padding: 10px; background: #eef2f5; border-radius: 8px;">
            ${code}
        </div>
        <p>Bu kod 15 dakika süreyle geçerlidir.</p>
        <p>Eğer bu kodu siz talep etmediyseniz, lütfen görmezden gelin.</p>
    `);

    try {
        await transporter.sendMail({
            from: config.smtp.from,
            to: userEmail,
            subject: 'Finbot Doğrulama Kodunuz',
            html
        });
        console.log(`✅ Verification email sent to: ${userEmail}`);
    } catch (error) {
        console.error(`❌ Error sending verification email:`, error);
        throw error;
    }
};

/**
 * Send Contact Form Email
 * Sends the contact form data to destek@finbot.com.tr
 * @param {Object} formData - { companyName, contactName, email, phone, employeeCount, message }
 */
export const sendContactEmail = async (formData) => {
    const { companyName, contactName, email, phone, employeeCount, message } = formData;

    const html = emailLayout(`
        <h2>📬 Yeni İletişim Formu Mesajı</h2>
        <table style="width:100%; border-collapse:collapse; margin:15px 0;">
            <tr><td style="padding:8px 12px; border-bottom:1px solid #eee; color:#666; width:140px;"><strong>Şirket Adı</strong></td><td style="padding:8px 12px; border-bottom:1px solid #eee;">${companyName || '-'}</td></tr>
            <tr><td style="padding:8px 12px; border-bottom:1px solid #eee; color:#666;"><strong>Yetkili Adı</strong></td><td style="padding:8px 12px; border-bottom:1px solid #eee;">${contactName}</td></tr>
            <tr><td style="padding:8px 12px; border-bottom:1px solid #eee; color:#666;"><strong>E-posta</strong></td><td style="padding:8px 12px; border-bottom:1px solid #eee;"><a href="mailto:${email}">${email}</a></td></tr>
            <tr><td style="padding:8px 12px; border-bottom:1px solid #eee; color:#666;"><strong>Telefon</strong></td><td style="padding:8px 12px; border-bottom:1px solid #eee;">${phone || '-'}</td></tr>
            <tr><td style="padding:8px 12px; border-bottom:1px solid #eee; color:#666;"><strong>Çalışan Sayısı</strong></td><td style="padding:8px 12px; border-bottom:1px solid #eee;">${employeeCount || '-'}</td></tr>
        </table>
        <h3 style="color:#004a99;">Mesaj</h3>
        <div style="background:#f4f7f6; padding:15px; border-radius:8px; margin-top:10px; white-space:pre-wrap;">${message}</div>
        <p style="margin-top:20px; font-size:12px; color:#999;">Bu mesaj finbot.com.tr iletişim formundan gönderilmiştir.</p>
    `);

    try {
        await transporter.sendMail({
            from: `Finbot İletişim <${config.smtp.email}>`, // Force auth user
            to: config.smtp.email, // destek@finbot.com.tr
            replyTo: email, // So replies go to the sender
            subject: `Finbot Iletisim Formu: ${companyName || contactName}`, // No emoji
            html
        });
        console.log(`✅ Destek mail gönderildi! From: "${email}", To: "${config.smtp.email}"`);
    } catch (error) {
        console.error(`❌ Error sending contact email:`, error);
        throw error;
    }
};

export default {
    sendWelcomeEmail,
    sendPasswordResetEmail,
    sendVerificationEmail,
    sendContactEmail
};
