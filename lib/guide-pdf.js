import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { getClientGuidePlainText } from "./resend-mail";

const A4_W = 595;
const A4_H = 842;
const MARGIN = 48;
const FONT_SIZE = 10.5;
const LINE_GAP = 1.38;

function wrapLines(text, font, fontSize, maxW) {
  const out = [];
  for (const para of text.split(/\r?\n/)) {
    if (para.length === 0) {
      out.push("");
      continue;
    }
    let line = "";
    for (const word of para.split(/\s+/).filter(Boolean)) {
      const candidate = line ? `${line} ${word}` : word;
      if (font.widthOfTextAtSize(candidate, fontSize) <= maxW) {
        line = candidate;
      } else {
        if (line) out.push(line);
        if (font.widthOfTextAtSize(word, fontSize) <= maxW) {
          line = word;
        } else {
          let acc = "";
          for (const ch of word) {
            const t = acc + ch;
            if (font.widthOfTextAtSize(t, fontSize) <= maxW) acc = t;
            else {
              if (acc) out.push(acc);
              acc = ch;
            }
          }
          line = acc;
        }
      }
    }
    if (line) out.push(line);
  }
  return out;
}

/**
 * @returns {Promise<Uint8Array>}
 */
export async function buildGuidePdfBytes() {
  const body = getClientGuidePlainText();
  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const maxW = A4_W - 2 * MARGIN;
  const lines = wrapLines(body, font, FONT_SIZE, maxW);

  let page = pdfDoc.addPage([A4_W, A4_H]);
  let { height } = page.getSize();
  const lineStep = FONT_SIZE * LINE_GAP;
  let y = height - MARGIN - FONT_SIZE;

  for (const line of lines) {
    if (y < MARGIN + FONT_SIZE) {
      page = pdfDoc.addPage([A4_W, A4_H]);
      height = page.getSize().height;
      y = height - MARGIN - FONT_SIZE;
    }
    page.drawText(line, {
      x: MARGIN,
      y,
      size: FONT_SIZE,
      font,
      color: rgb(0.12, 0.16, 0.22),
    });
    y -= lineStep;
  }

  return pdfDoc.save();
}
