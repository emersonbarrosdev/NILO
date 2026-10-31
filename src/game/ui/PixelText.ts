import Phaser from 'phaser';

type PixelTextAlign = 'left' | 'center' | 'right';

export interface PixelTextOptions {
  scale?: number;
  color?: number;
  align?: PixelTextAlign;
  originX?: number;
  originY?: number;
  letterSpacing?: number;
  lineSpacing?: number;
  paddingX?: number;
  paddingY?: number;
  backgroundColor?: number;
  backgroundAlpha?: number;
  scrollFactor?: number;
  depth?: number;
}

const GLYPHS: Record<string, string[]> = {
  ' ': ['00000','00000','00000','00000','00000','00000','00000'],
  A: ['01110','10001','10001','11111','10001','10001','10001'],
  B: ['11110','10001','10001','11110','10001','10001','11110'],
  C: ['01111','10000','10000','10000','10000','10000','01111'],
  D: ['11110','10001','10001','10001','10001','10001','11110'],
  E: ['11111','10000','10000','11110','10000','10000','11111'],
  F: ['11111','10000','10000','11110','10000','10000','10000'],
  G: ['01111','10000','10000','10111','10001','10001','01111'],
  H: ['10001','10001','10001','11111','10001','10001','10001'],
  I: ['11111','00100','00100','00100','00100','00100','11111'],
  J: ['00111','00010','00010','00010','10010','10010','01100'],
  K: ['10001','10010','10100','11000','10100','10010','10001'],
  L: ['10000','10000','10000','10000','10000','10000','11111'],
  M: ['10001','11011','10101','10101','10001','10001','10001'],
  N: ['10001','11001','10101','10011','10001','10001','10001'],
  O: ['01110','10001','10001','10001','10001','10001','01110'],
  P: ['11110','10001','10001','11110','10000','10000','10000'],
  Q: ['01110','10001','10001','10001','10101','10010','01101'],
  R: ['11110','10001','10001','11110','10100','10010','10001'],
  S: ['01111','10000','10000','01110','00001','00001','11110'],
  T: ['11111','00100','00100','00100','00100','00100','00100'],
  U: ['10001','10001','10001','10001','10001','10001','01110'],
  V: ['10001','10001','10001','10001','10001','01010','00100'],
  W: ['10001','10001','10001','10101','10101','10101','01010'],
  X: ['10001','10001','01010','00100','01010','10001','10001'],
  Y: ['10001','10001','01010','00100','00100','00100','00100'],
  Z: ['11111','00001','00010','00100','01000','10000','11111'],
  '0': ['01110','10001','10011','10101','11001','10001','01110'],
  '1': ['00100','01100','00100','00100','00100','00100','01110'],
  '2': ['01110','10001','00001','00010','00100','01000','11111'],
  '3': ['11110','00001','00001','01110','00001','00001','11110'],
  '4': ['00010','00110','01010','10010','11111','00010','00010'],
  '5': ['11111','10000','10000','11110','00001','00001','11110'],
  '6': ['01110','10000','10000','11110','10001','10001','01110'],
  '7': ['11111','00001','00010','00100','01000','01000','01000'],
  '8': ['01110','10001','10001','01110','10001','10001','01110'],
  '9': ['01110','10001','10001','01111','00001','00001','01110'],
  ':': ['00000','00100','00100','00000','00100','00100','00000'],
  '.': ['00000','00000','00000','00000','00000','00110','00110'],
  ',': ['00000','00000','00000','00000','00110','00100','01000'],
  '-': ['00000','00000','00000','11111','00000','00000','00000'],
  '/': ['00001','00010','00100','01000','10000','00000','00000'],
  '?': ['01110','10001','00001','00010','00100','00000','00100'],
  '!': ['00100','00100','00100','00100','00100','00000','00100'],
  '(': ['00010','00100','01000','01000','01000','00100','00010'],
  ')': ['01000','00100','00010','00010','00010','00100','01000'],
};

const REPLACEMENTS: Record<string, string> = {
  Á: 'A', À: 'A', Â: 'A', Ã: 'A', Ä: 'A',
  É: 'E', È: 'E', Ê: 'E', Ë: 'E',
  Í: 'I', Ì: 'I', Î: 'I', Ï: 'I',
  Ó: 'O', Ò: 'O', Ô: 'O', Õ: 'O', Ö: 'O',
  Ú: 'U', Ù: 'U', Û: 'U', Ü: 'U',
  Ç: 'C',
};

function normalize(value: string): string {
  return value.toUpperCase().split('').map((char) => REPLACEMENTS[char] ?? char).join('');
}

function lineWidth(line: string, scale: number, letterSpacing: number): number {
  if (!line.length) return 0;
  return line.length * 5 * scale + (line.length - 1) * letterSpacing * scale;
}

export function addPixelText(
  scene: Phaser.Scene,
  x: number,
  y: number,
  value: string,
  options: PixelTextOptions = {},
): Phaser.GameObjects.Container {
  const scale = Math.max(1, Math.floor(options.scale ?? 1));
  const letterSpacing = options.letterSpacing ?? 1;
  const lineSpacing = options.lineSpacing ?? 2;
  const paddingX = options.paddingX ?? 0;
  const paddingY = options.paddingY ?? 0;
  const originX = options.originX ?? 0;
  const originY = options.originY ?? 0;
  const align = options.align ?? 'left';
  const lines = value.split('\n').map(normalize);
  const widths = lines.map((line) => lineWidth(line, scale, letterSpacing));
  const contentWidth = Math.max(0, ...widths);
  const glyphHeight = 7 * scale;
  const contentHeight = lines.length * glyphHeight + Math.max(0, lines.length - 1) * lineSpacing * scale;
  const totalWidth = contentWidth + paddingX * 2;
  const totalHeight = contentHeight + paddingY * 2;
  const offsetX = -Math.round(totalWidth * originX);
  const offsetY = -Math.round(totalHeight * originY);

  const container = scene.add.container(Math.round(x), Math.round(y));

  if (options.backgroundColor !== undefined) {
    const background = scene.add.rectangle(
      offsetX + Math.round(totalWidth / 2),
      offsetY + Math.round(totalHeight / 2),
      totalWidth,
      totalHeight,
      options.backgroundColor,
      options.backgroundAlpha ?? 1,
    ).setOrigin(0.5);
    container.add(background);
  }

  const graphics = scene.add.graphics();
  graphics.fillStyle(options.color ?? 0xffffff, 1);

  lines.forEach((line, lineIndex) => {
    let startX = offsetX + paddingX;
    if (align === 'center') startX += Math.floor((contentWidth - widths[lineIndex]) / 2);
    if (align === 'right') startX += contentWidth - widths[lineIndex];
    const startY = offsetY + paddingY + lineIndex * (glyphHeight + lineSpacing * scale);

    let cursorX = startX;
    for (const char of line) {
      const glyph = GLYPHS[char] ?? GLYPHS['?'];
      glyph.forEach((row, rowIndex) => {
        [...row].forEach((pixel, columnIndex) => {
          if (pixel === '1') {
            graphics.fillRect(
              cursorX + columnIndex * scale,
              startY + rowIndex * scale,
              scale,
              scale,
            );
          }
        });
      });
      cursorX += 5 * scale + letterSpacing * scale;
    }
  });

  container.add(graphics);
  container.setScrollFactor(options.scrollFactor ?? 1);
  container.setDepth(options.depth ?? 0);
  return container;
}
