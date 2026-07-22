import nodemailer from 'nodemailer';

export async function sendEmail({ to, subject, html, cc }) {
    const gmailUser = process.env.GMAIL_USER || 'barbarapalmamena@gmail.com';
    const gmailPass = process.env.GMAIL_APP_PASSWORD;

    if (!gmailPass) {
        throw new Error('Falta la variable GMAIL_APP_PASSWORD en Vercel. Por favor créala en la cuenta de Google.');
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
        cc: cc, // Copia opcional al admin
        subject: subject,
        html: html
    };

    const info = await transporter.sendMail(mailOptions);
    return info;
}
