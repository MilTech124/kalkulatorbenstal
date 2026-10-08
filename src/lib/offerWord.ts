import { zipSync } from 'fflate';
import fs from 'node:fs';
import path from 'node:path';
import { offerSummary } from '@/lib/offer';
import { offerCompanyProfile, offerCompanyTerms, type OfferCompany } from '@/lib/offerCompany';
import { formatAddress } from '@/lib/customer';
import { convertFromPln, formatMoney } from '@/lib/currency';
import type { OfferPdfData } from '@/lib/offerPdf';

const xml = (value: string | number) => String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');
const text = (value: string, bold = false, size = 17) => `<w:r><w:rPr>${bold ? '<w:b/>' : ''}<w:sz w:val="${size}"/><w:szCs w:val="${size}"/></w:rPr><w:t xml:space="preserve">${xml(value)}</w:t></w:r>`;
const paragraph = (parts: string[], after = 70) => `<w:p><w:pPr><w:spacing w:after="${after}" w:line="240" w:lineRule="auto"/></w:pPr>${parts.join('')}</w:p>`;
const line = (value: string, after = 70) => paragraph([text(value)], after);
const heading = (value: string) => `<w:p><w:pPr><w:spacing w:before="130" w:after="95"/></w:pPr><w:r><w:rPr><w:b/><w:color w:val="1F2328"/><w:sz w:val="21"/></w:rPr><w:t>${xml(value)}</w:t></w:r></w:p>`;
const cell = (content: string, width: number) => `<w:tc><w:tcPr><w:tcW w:w="${width}" w:type="dxa"/><w:vAlign w:val="top"/><w:tcMar><w:top w:w="90" w:type="dxa"/><w:left w:w="110" w:type="dxa"/><w:bottom w:w="80" w:type="dxa"/><w:right w:w="110" w:type="dxa"/></w:tcMar></w:tcPr>${content}</w:tc>`;
const table = (left: string, right: string, leftWidth = 5450, rightWidth = 5450) => `<w:tbl><w:tblPr><w:tblW w:w="${leftWidth + rightWidth}" w:type="dxa"/><w:tblLayout w:type="fixed"/><w:tblBorders><w:top w:val="single" w:sz="4" w:color="DEE3E9"/><w:left w:val="single" w:sz="4" w:color="DEE3E9"/><w:bottom w:val="single" w:sz="4" w:color="DEE3E9"/><w:right w:val="single" w:sz="4" w:color="DEE3E9"/><w:insideV w:val="single" w:sz="4" w:color="DEE3E9"/></w:tblBorders></w:tblPr><w:tblGrid><w:gridCol w:w="${leftWidth}"/><w:gridCol w:w="${rightWidth}"/></w:tblGrid><w:tr>${cell(left, leftWidth)}${cell(right, rightWidth)}</w:tr></w:tbl>`;

export function offerWordFilename(number: number, company?: OfferCompany): string {
  return `Oferta-${offerCompanyProfile(company).filename}-${number}.docx`;
}

/** Lokalne logo PNG, z zachowaniem proporcji i ciemnym tłem dla białych znaków. */
function logoParagraph(logo: Buffer, name: string): string {
  const width = 128 * 12700;
  const height = Math.round(width * logo.readUInt32BE(20) / logo.readUInt32BE(16));
  return `<w:p><w:pPr><w:spacing w:after="100"/><w:shd w:val="clear" w:fill="1F2328"/></w:pPr><w:r><w:drawing><wp:inline distT="0" distB="0" distL="0" distR="0"><wp:extent cx="${width}" cy="${height}"/><wp:docPr id="1" name="Logo ${xml(name)}" descr="Logo ${xml(name)}"/><a:graphic><a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/picture"><pic:pic><pic:nvPicPr><pic:cNvPr id="0" name="logo.png"/><pic:cNvPicPr/></pic:nvPicPr><pic:blipFill><a:blip r:embed="rIdLogo"/><a:stretch><a:fillRect/></a:stretch></pic:blipFill><pic:spPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="${width}" cy="${height}"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom></pic:spPr></pic:pic></a:graphicData></a:graphic></wp:inline></w:drawing></w:r></w:p>`;
}

/** Edytowalna oferta Word na podstawie tych samych danych i specyfikacji co PDF. */
export function renderOfferWord(d: OfferPdfData): Buffer {
  const company = offerCompanyProfile(d.company, d.input.productType);
  const logo = fs.readFileSync(path.join(process.cwd(), 'src', 'assets', company.logo));
  const rows = offerSummary(d.input, d.priceList, d.effectiveHeight);
  const date = d.createdAt.toLocaleDateString('pl-PL', { day: 'numeric', month: 'long', year: 'numeric' });
  const validDays = d.validDays ?? 2;
  const foreign = d.currency && d.currency.code !== 'PLN' && d.currency.rate > 0 ? d.currency : null;
  const pln = (amount: number) => `${amount.toLocaleString('pl-PL', { maximumFractionDigits: 0 })} zł`;
  const price = foreign ? formatMoney(convertFromPln(d.total, foreign), foreign.code) : pln(d.total);

  const specification = [
    heading('Specyfikacja konstrukcji'),
    ...rows.map((row) => paragraph([text(`${row.label}: `, true), text(row.value)], 55)),
    heading('Łącznie brutto'),
    paragraph([text(price, true, 29)], 55),
    line('Transport i montaż GRATIS', 55),
    ...(foreign ? [line(`${pln(d.total)} wg kursu 1 ${foreign.code} = ${foreign.rate.toLocaleString('pl-PL', { maximumFractionDigits: 2 })} zł${foreign.label ? ` (${foreign.label})` : ''}`, 55)] : []),
    ...(d.input.roofSheet && d.input.roofSheet !== d.input.sheet ? [line('Cena przy innym rodzaju blachy na dachu wymaga potwierdzenia.', 55)] : []),
  ].join('');

  const details = [
    heading('Informacje dotyczące realizacji'),
    line(d.input.extras.anchoring ? 'Kotwiczenie do podłoża jest uwzględnione w cenie.' : 'Kotwiczenie do podłoża nie jest wliczone w cenę.'),
    ...offerCompanyTerms(company).map((value) => line(value)),
    ...(d.note ? [heading('Dopisek do oferty'), line(d.note)] : []),
    line(`Przedstawiona oferta cenowa ma charakter informacyjny i nie stanowi oferty handlowej w rozumieniu art. 66 § 1 Kodeksu cywilnego. Oferta cenowa jest ważna ${validDays} dni.`),
  ].join('');

  const name = `${d.customer.firstName} ${d.customer.lastName}`.trim();
  const customer = [heading('Zamawiający'), line(name || '—', 45), ...(d.customer.phone ? [line(`tel. ${d.customer.phone}`, 45)] : []), ...(d.customer.email ? [line(d.customer.email, 45)] : [])].join('');
  const address = [heading('Miejsce montażu'), line(formatAddress(d.customer) || '—', 45)].join('');
  const body = [
    logoParagraph(logo, company.short),
    paragraph([text(company.name, true)], 20),
    line(`${company.address}${company.nip ? ` · NIP: ${company.nip}` : ''} · tel. ${company.phones.join(', ')} · ${company.email}`, 80),
    heading(`Oferta nr ${d.number} · ${date}`),
    heading(`Garaż ${d.input.width.toLocaleString('pl-PL')} × ${d.input.length.toLocaleString('pl-PL')} m`),
    line('Dzień dobry,', 70),
    line('w odpowiedzi na Państwa zapytanie przedstawiamy ofertę na wykonanie konstrukcji stalowej o poniższej specyfikacji:', 95),
    table(customer, address),
    paragraph([], 30),
    table(specification, details),
    paragraph([], 30),
    line(`${company.name} · ${company.tagline} · ${company.www}`),
  ].join('');

  const document = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing" xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture"><w:body>${body}<w:sectPr><w:pgSz w:w="11906" w:h="16838"/><w:pgMar w:top="570" w:right="500" w:bottom="570" w:left="500" w:header="0" w:footer="0" w:gutter="0"/></w:sectPr></w:body></w:document>`;
  const styles = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:docDefaults><w:rPrDefault><w:rPr><w:rFonts w:ascii="Aptos" w:hAnsi="Aptos" w:eastAsia="Aptos" w:cs="Aptos"/><w:sz w:val="17"/><w:lang w:val="pl-PL"/></w:rPr></w:rPrDefault></w:docDefaults></w:styles>`;
  const contentTypes = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Default Extension="png" ContentType="image/png"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/><Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/></Types>`;
  const rels = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>`;
  const documentRels = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/><Relationship Id="rIdLogo" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="media/logo.png"/></Relationships>`;
  const encoder = new TextEncoder();
  return Buffer.from(zipSync({
    '[Content_Types].xml': encoder.encode(contentTypes),
    '_rels/.rels': encoder.encode(rels),
    'word/document.xml': encoder.encode(document),
    'word/_rels/document.xml.rels': encoder.encode(documentRels),
    'word/styles.xml': encoder.encode(styles),
    'word/media/logo.png': new Uint8Array(logo),
  }, { level: 6 }));
}
