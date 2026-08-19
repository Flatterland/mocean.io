import { TextProperties } from '../types/layer';

export interface GlyphLayout {
  char: string;
  charIndex: number;
  wordIndex: number;
  lineIndex: number;
  x: number; // Offset relative to layer center/origin
  y: number; // Offset relative to layer center/origin
  width: number;
  height: number;
}

export interface TextLayoutResult {
  glyphs: GlyphLayout[];
  totalWidth: number;
  totalHeight: number;
  lines: string[];
}

export function layoutText(
  ctx: CanvasRenderingContext2D,
  textProps: TextProperties,
  maxWidth?: number
): TextLayoutResult {
  const {
    text,
    fontFamily,
    fontSize,
    fontWeight,
    fontStyle,
    textAlign,
    letterSpacing,
    lineHeight,
    textTransform,
  } = textProps;

  let processedText = text;
  if (textTransform === 'uppercase') processedText = text.toUpperCase();
  else if (textTransform === 'lowercase') processedText = text.toLowerCase();
  else if (textTransform === 'capitalize') {
    processedText = text.replace(/\b\w/g, (c) => c.toUpperCase());
  }

  ctx.save();
  ctx.font = `${fontStyle} ${fontWeight} ${fontSize}px "${fontFamily}", sans-serif`;
  ctx.textBaseline = 'middle';

  const rawLines = processedText.split('\n');
  const lineSpacing = fontSize * lineHeight;
  const glyphs: GlyphLayout[] = [];

  // Calculate lines and dimensions
  const lineMetrics: { text: string; width: number; charCount: number }[] = [];
  let maxLineWidth = 0;

  for (const line of rawLines) {
    let lineWidth = 0;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      const charWidth = ctx.measureText(ch).width;
      lineWidth += charWidth + (i < line.length - 1 ? letterSpacing : 0);
    }
    lineMetrics.push({ text: line, width: lineWidth, charCount: line.length });
    if (lineWidth > maxLineWidth) maxLineWidth = lineWidth;
  }

  const totalHeight = (rawLines.length - 1) * lineSpacing + fontSize;
  const totalWidth = maxLineWidth;

  let globalCharIndex = 0;
  let globalWordIndex = 0;

  rawLines.forEach((line, lineIndex) => {
    const currentLineWidth = lineMetrics[lineIndex].width;
    
    // Determine line starting X based on alignment
    let lineStartX = -totalWidth / 2;
    if (textAlign === 'center') {
      lineStartX = -currentLineWidth / 2;
    } else if (textAlign === 'right') {
      lineStartX = totalWidth / 2 - currentLineWidth;
    }

    const lineY = -totalHeight / 2 + fontSize / 2 + lineIndex * lineSpacing;
    let cursorX = lineStartX;

    let inWord = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      const charWidth = ctx.measureText(ch).width;

      if (ch === ' ' || ch === '\t') {
        if (inWord) {
          globalWordIndex++;
          inWord = false;
        }
      } else {
        inWord = true;
      }

      glyphs.push({
        char: ch,
        charIndex: globalCharIndex,
        wordIndex: globalWordIndex,
        lineIndex,
        x: cursorX + charWidth / 2,
        y: lineY,
        width: charWidth,
        height: fontSize,
      });

      cursorX += charWidth + letterSpacing;
      globalCharIndex++;
    }

    if (inWord) {
      globalWordIndex++;
    }
  });

  ctx.restore();

  return {
    glyphs,
    totalWidth,
    totalHeight,
    lines: rawLines,
  };
}
