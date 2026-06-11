import nodemailer from 'nodemailer';

const sendEmail = async (options) => {
  const smtpHost = process.env.SMTP_HOST;
  const smtpPort = process.env.SMTP_PORT || 2525;
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;
  const smtpFrom = process.env.SMTP_FROM || 'noreply@kssports.com';

  // Fallback to console logging if SMTP config is missing (ideal for local development)
  if (!smtpHost || !smtpUser || !smtpPass) {
    console.warn('--- EMAIL CONSOLE FALLBACK ---');
    console.warn(`To: ${options.email}`);
    console.warn(`Subject: ${options.subject}`);
    console.warn(`Message:\n${options.message}`);
    console.warn('------------------------------');
    return { loggedToConsole: true };
  }

  const transporter = nodemailer.createTransport({
    host: smtpHost,
    port: smtpPort,
    auth: {
      user: smtpUser,
      pass: smtpPass,
    },
  });

  const mailOptions = {
    from: `K.S. Sports <${smtpFrom}>`,
    to: options.email,
    subject: options.subject,
    text: options.message,
  };

  await transporter.sendMail(mailOptions);
};

export default sendEmail;
