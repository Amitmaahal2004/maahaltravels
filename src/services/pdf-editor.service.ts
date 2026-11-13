import {
  PDFDocument,
  rgb,
  degrees,
  StandardFonts,
  PageSizes,
} from "pdf-lib";

export interface TextOverlayItem {
  id?: string;
  text: string;
  x: number;
  y: number;
  fontSize?: number;
  fontFamily?: "Helvetica" | "HelveticaBold" | "TimesRoman" | "Courier";
  color?: string; // Hex like "#1E293B"
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
}

export interface WhiteoutBoxItem {
  id?: string;
  x: number;
  y: number;
  width: number;
  height: number;
  color?: string; // Hex like "#FFFFFF"
}

export interface ShapeItem {
  id?: string;
  type: "rectangle" | "circle" | "line" | "banner";
  x: number;
  y: number;
  width: number;
  height: number;
  fillColor?: string;
  borderColor?: string;
  borderWidth?: number;
  opacity?: number;
}

export interface ImageItem {
  id?: string;
  imageBase64: string; // base64 string
  mimeType?: "image/png" | "image/jpeg";
  x: number;
  y: number;
  width: number;
  height: number;
  opacity?: number;
}

export interface AnnotationItem {
  id?: string;
  type: "highlight" | "strike" | "underline" | "note" | "signature";
  x: number;
  y: number;
  width?: number;
  height?: number;
  color?: string;
  text?: string;
  points?: Array<{ x: number; y: number }>;
}

export interface PageModification {
  pageIndex: number;
  rotation?: number; // 0, 90, 180, 270
  whiteoutBoxes?: WhiteoutBoxItem[];
  textOverlays?: TextOverlayItem[];
  shapes?: ShapeItem[];
  images?: ImageItem[];
  annotations?: AnnotationItem[];
}

export interface PdfEditPayload {
  pageOrder?: number[]; // list of original page indices to keep in order
  blankPagesToAdd?: Array<{ insertAfterIndex: number }>;
  modifications?: PageModification[];
  watermark?: {
    text: string;
    opacity?: number;
    color?: string;
  };
  headerText?: string;
  footerText?: string;
}

// Helper: Hex color to pdf-lib rgb
function hexToRgb(hex?: string) {
  if (!hex || !hex.startsWith("#") || hex.length < 7) {
    return rgb(0.1, 0.1, 0.1);
  }
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  return rgb(r, g, b);
}

/**
 * Applies full vector PDF editing modifications to an existing PDF buffer.
 */
export async function applyPdfEdits(
  originalPdfBuffer: Buffer,
  payload: PdfEditPayload
): Promise<Buffer> {
  // Load original PDF document
  const srcDoc = await PDFDocument.load(originalPdfBuffer);
  const outDoc = await PDFDocument.create();

  // Pre-embed standard fonts
  const fonts = {
    Helvetica: await outDoc.embedFont(StandardFonts.Helvetica),
    HelveticaBold: await outDoc.embedFont(StandardFonts.HelveticaBold),
    TimesRoman: await outDoc.embedFont(StandardFonts.TimesRoman),
    Courier: await outDoc.embedFont(StandardFonts.Courier),
  };

  const srcPageCount = srcDoc.getPageCount();

  // 1. Resolve page order (reorder, duplicate, extract)
  let pagesToCopyIndices: number[] = [];
  if (payload.pageOrder && payload.pageOrder.length > 0) {
    pagesToCopyIndices = payload.pageOrder.filter(
      (idx) => idx >= 0 && idx < srcPageCount
    );
  } else {
    for (let i = 0; i < srcPageCount; i++) {
      pagesToCopyIndices.push(i);
    }
  }

  // Copy selected pages from srcDoc into outDoc
  const copiedPages = await outDoc.copyPages(srcDoc, pagesToCopyIndices);
  for (let i = 0; i < copiedPages.length; i++) {
    outDoc.addPage(copiedPages[i]);
  }

  // 2. Add blank pages if requested
  if (payload.blankPagesToAdd && payload.blankPagesToAdd.length > 0) {
    for (const blank of payload.blankPagesToAdd) {
      const idx = Math.min(Math.max(blank.insertAfterIndex + 1, 0), outDoc.getPageCount());
      outDoc.insertPage(idx, PageSizes.A4);
    }
  }

  const finalPageCount = outDoc.getPageCount();
  const outPages = outDoc.getPages();

  // 3. Apply per-page modifications
  if (payload.modifications && payload.modifications.length > 0) {
    for (const mod of payload.modifications) {
      if (mod.pageIndex < 0 || mod.pageIndex >= finalPageCount) continue;
      const page = outPages[mod.pageIndex];
      const { width: pW, height: pH } = page.getSize();

      // A. Rotation
      if (mod.rotation) {
        page.setRotation(degrees(mod.rotation));
      }

      // B. Whiteout Boxes (Cover existing flattened text)
      if (mod.whiteoutBoxes && mod.whiteoutBoxes.length > 0) {
        for (const box of mod.whiteoutBoxes) {
          page.drawRectangle({
            x: box.x,
            y: box.y,
            width: box.width,
            height: box.height,
            color: hexToRgb(box.color || "#FFFFFF"),
          });
        }
      }

      // C. Shapes (Rectangles, Circles, Banners, Lines)
      if (mod.shapes && mod.shapes.length > 0) {
        for (const shape of mod.shapes) {
          const fillColor = shape.fillColor ? hexToRgb(shape.fillColor) : undefined;
          const borderColor = shape.borderColor ? hexToRgb(shape.borderColor) : undefined;

          if (shape.type === "rectangle" || shape.type === "banner") {
            page.drawRectangle({
              x: shape.x,
              y: shape.y,
              width: shape.width,
              height: shape.height,
              color: fillColor,
              borderColor,
              borderWidth: shape.borderWidth || (borderColor ? 1 : 0),
              opacity: shape.opacity ?? 1,
            });
          } else if (shape.type === "circle") {
            const radius = Math.min(shape.width, shape.height) / 2;
            page.drawCircle({
              x: shape.x + radius,
              y: shape.y + radius,
              size: radius,
              color: fillColor,
              borderColor,
              borderWidth: shape.borderWidth || (borderColor ? 1 : 0),
              opacity: shape.opacity ?? 1,
            });
          } else if (shape.type === "line") {
            page.drawLine({
              start: { x: shape.x, y: shape.y },
              end: { x: shape.x + shape.width, y: shape.y + shape.height },
              color: borderColor || fillColor || rgb(0.2, 0.4, 0.8),
              thickness: shape.borderWidth || 2,
              opacity: shape.opacity ?? 1,
            });
          }
        }
      }

      // D. Images (Logos, Destination Photos)
      if (mod.images && mod.images.length > 0) {
        for (const img of mod.images) {
          try {
            const cleanBase64 = img.imageBase64.replace(/^data:image\/[a-z]+;base64,/, "");
            const imgBuffer = Buffer.from(cleanBase64, "base64");

            let embeddedImg;
            if (img.mimeType === "image/jpeg" || cleanBase64.startsWith("/9j/")) {
              embeddedImg = await outDoc.embedJpg(imgBuffer);
            } else {
              embeddedImg = await outDoc.embedPng(imgBuffer);
            }

            page.drawImage(embeddedImg, {
              x: img.x,
              y: img.y,
              width: img.width,
              height: img.height,
              opacity: img.opacity ?? 1,
            });
          } catch (imgErr) {
            console.warn("[PDF Editor] Image embed warning:", imgErr);
          }
        }
      }

      // E. Text Overlays (Headings, Descriptions, Prices, Itinerary)
      if (mod.textOverlays && mod.textOverlays.length > 0) {
        for (const item of mod.textOverlays) {
          if (!item.text) continue;
          let fontKey = item.fontFamily || "Helvetica";
          if (item.bold && fontKey === "Helvetica") {
            fontKey = "HelveticaBold";
          }
          const chosenFont = fonts[fontKey] || fonts.Helvetica;
          const fontSize = item.fontSize || 12;
          const color = hexToRgb(item.color || "#0F172A");

          page.drawText(item.text, {
            x: item.x,
            y: item.y,
            size: fontSize,
            font: chosenFont,
            color,
          });

          // Underline if requested
          if (item.underline) {
            const textWidth = chosenFont.widthOfTextAtSize(item.text, fontSize);
            page.drawLine({
              start: { x: item.x, y: item.y - 2 },
              end: { x: item.x + textWidth, y: item.y - 2 },
              color,
              thickness: 1,
            });
          }
        }
      }

      // F. Annotations (Highlight, Strikethrough, Notes)
      if (mod.annotations && mod.annotations.length > 0) {
        for (const ann of mod.annotations) {
          if (ann.type === "highlight") {
            page.drawRectangle({
              x: ann.x,
              y: ann.y,
              width: ann.width || 80,
              height: ann.height || 16,
              color: hexToRgb(ann.color || "#FEF08A"), // Yellow
              opacity: 0.45,
            });
          } else if (ann.type === "strike") {
            page.drawLine({
              start: { x: ann.x, y: ann.y },
              end: { x: ann.x + (ann.width || 60), y: ann.y },
              color: hexToRgb(ann.color || "#EF4444"),
              thickness: 1.5,
            });
          } else if (ann.type === "underline") {
            page.drawLine({
              start: { x: ann.x, y: ann.y },
              end: { x: ann.x + (ann.width || 60), y: ann.y },
              color: hexToRgb(ann.color || "#3B82F6"),
              thickness: 1.5,
            });
          } else if (ann.type === "note") {
            // Sticky Note badge
            page.drawRectangle({
              x: ann.x,
              y: ann.y,
              width: ann.width || 120,
              height: ann.height || 40,
              color: rgb(1, 0.98, 0.8),
              borderColor: rgb(0.9, 0.8, 0.4),
              borderWidth: 1,
            });
            if (ann.text) {
              page.drawText(ann.text.slice(0, 45), {
                x: ann.x + 6,
                y: ann.y + (ann.height || 40) - 16,
                size: 8,
                font: fonts.Helvetica,
                color: rgb(0.3, 0.25, 0.1),
              });
            }
          }
        }
      }
    }
  }

  // 4. Global Watermark & Headers/Footers
  if (payload.watermark?.text) {
    const wmText = payload.watermark.text.toUpperCase();
    const wmColor = hexToRgb(payload.watermark.color || "#64748B");
    const wmOpacity = payload.watermark.opacity || 0.12;

    for (const page of outPages) {
      const { width: pW, height: pH } = page.getSize();
      page.drawText(wmText, {
        x: pW * 0.15,
        y: pH * 0.45,
        size: 42,
        font: fonts.HelveticaBold,
        color: wmColor,
        opacity: wmOpacity,
        rotate: degrees(35),
      });
    }
  }

  if (payload.headerText) {
    for (const page of outPages) {
      const { width: pW, height: pH } = page.getSize();
      page.drawText(payload.headerText, {
        x: 40,
        y: pH - 25,
        size: 8,
        font: fonts.Helvetica,
        color: rgb(0.5, 0.55, 0.6),
      });
    }
  }

  if (payload.footerText) {
    let pIdx = 1;
    for (const page of outPages) {
      const { width: pW } = page.getSize();
      page.drawText(`${payload.footerText} • Page ${pIdx} of ${finalPageCount}`, {
        x: 40,
        y: 20,
        size: 8,
        font: fonts.Helvetica,
        color: rgb(0.5, 0.55, 0.6),
      });
      pIdx++;
    }
  }

  const modifiedPdfBytes = await outDoc.save();
  return Buffer.from(modifiedPdfBytes);
}

