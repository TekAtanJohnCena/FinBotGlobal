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
    }
});

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

export default {
    sendWelcomeEmail,
    sendPasswordResetEmail
};
