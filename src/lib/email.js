import nodemailer from 'nodemailer';

export async function sendEmail({ to, subject, html, cc }) {
    const gmailUser = process.env.GMAIL_USER || 'barbarapalmamena@gmail.com';
    const rawPass = process.env.GMAIL_APP_PASSWORD || 'ohsadtvotirubbhc';
    const gmailPass = rawPass ? rawPass.replace(/\s+/g, '') : '';

    if (!gmailPass) {
        throw new Error('Falta la contraseña de aplicación de Gmail.');
    }

    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: gmailUser,
            pass: gmailPass
        }
    });

    const mailOptions = {
        from: `"Biblioteca Tupahue" <${gmailUser}>`,
        to: to,
        cc: cc, // Copia de respaldo al admin
        subject: subject,
        html: html
    };

    const info = await transporter.sendMail(mailOptions);
    return info;
}
