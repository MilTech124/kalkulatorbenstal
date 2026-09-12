// Wysylka e-maili przez SMTP (nodemailer). Konfiguracja wylacznie ze zmiennych srodowiskowych.
import nodemailer from 'nodemailer';

export function mailConfigured(): boolean {
  return Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);
}

function transporter() {
  const port = Number(process.env.SMTP_PORT ?? 465);
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port,
    secure: process.env.SMTP_SECURE ? process.env.SMTP_SECURE === 'true' : port === 465,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    connectionTimeout: 15000,
  });
}

export async function sendMail(opts: { to: string; subject: string; html: string; text: string; replyTo?: string }) {
  if (!mailConfigured()) throw new Error('Wysyłka e-mail nie jest skonfigurowana (SMTP_HOST / SMTP_USER / SMTP_PASS).');
  const from = process.env.MAIL_FROM || process.env.SMTP_USER!;
  const bcc = process.env.MAIL_BCC || undefined;
  const info = await transporter().sendMail({ from, to: opts.to, bcc, subject: opts.subject, html: opts.html, text: opts.text, replyTo: opts.replyTo });
  return info.messageId;
}
