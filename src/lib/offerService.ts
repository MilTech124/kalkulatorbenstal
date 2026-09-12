// Wspolna logika wysylki oferty e-mail dla zapisu z kalkulatora i ponownej wysylki z panelu.
import type { HydratedDocument } from 'mongoose';
import { sendMail } from '@/lib/mail';
import { renderOfferEmail } from '@/lib/offerEmail';
import { getActivePriceList } from '@/lib/pricing/repository';
import type { QuoteDoc } from '@/models/Quote';

export async function sendOfferForQuote(
  quote: HydratedDocument<QuoteDoc>,
  opts: { to: string; offeredTotal?: number; note?: string; appOrigin: string },
): Promise<void> {
  const total = opts.offeredTotal ?? quote.offeredTotal ?? quote.total;
  const pl = await getActivePriceList();
  const mail = renderOfferEmail({
    number: quote.number,
    customer: quote.customer,
    input: quote.input,
    priceList: pl.data,
    effectiveHeight: quote.result?.effectiveHeight ?? quote.input.height,
    total,
    appOrigin: opts.appOrigin,
    note: opts.note ?? quote.offerNote ?? undefined,
  });
  await sendMail({ to: opts.to, subject: mail.subject, html: mail.html, text: mail.text, replyTo: process.env.MAIL_REPLY_TO || undefined });
  quote.offeredTotal = total;
  if (opts.note !== undefined) quote.offerNote = opts.note;
  quote.emailSentAt = new Date();
  quote.emailTo = opts.to;
  await quote.save();
}

/** Bazowy URL aplikacji (do linkow/logo w mailu): APP_URL albo z naglowkow requestu. */
export function appOriginFrom(request: Request): string {
  const env = process.env.APP_URL;
  if (env) return env.replace(/\/+$/, '');
  const url = new URL(request.url);
  const proto = request.headers.get('x-forwarded-proto') ?? url.protocol.replace(':', '');
  const host = request.headers.get('x-forwarded-host') ?? request.headers.get('host') ?? url.host;
  return `${proto}://${host}`;
}
