const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

// --- Helper PNG Encoder ---
function createPng(width, height, rgbaBuffer) {
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) {
      c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
    }
    table[n] = c >>> 0;
  }

  function chunk(type, data) {
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length, 0);
    const typeBuf = Buffer.from(type, 'ascii');
    const crcBuf = Buffer.alloc(4);
    let c = 0 ^ (-1);
    const combined = Buffer.concat([typeBuf, data]);
    for (let i = 0; i < combined.length; i++) {
      c = (c >>> 8) ^ table[(c ^ combined[i]) & 0xFF];
    }
    c = (c ^ (-1)) >>> 0;
    crcBuf.writeUInt32BE(c, 0);
    return Buffer.concat([len, typeBuf, data, crcBuf]);
  }

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;
  ihdr[9] = 6; // RGBA
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  const lineStride = width * 4;
  const filtered = Buffer.alloc(height * (lineStride + 1));
  for (let y = 0; y < height; y++) {
    filtered[y * (lineStride + 1)] = 0;
    rgbaBuffer.copy(filtered, y * (lineStride + 1) + 1, y * lineStride, (y + 1) * lineStride);
  }

  const compressed = zlib.deflateSync(filtered);

  return Buffer.concat([
    signature,
    chunk('IHDR', ihdr),
    chunk('IDAT', compressed),
    chunk('IEND', Buffer.alloc(0))
  ]);
}

class PixelCanvas {
  constructor(w, h) {
    this.w = w;
    this.h = h;
    this.buf = Buffer.alloc(w * h * 4); // all zeros = transparent
  }

  set(x, y, hex, alpha = 255) {
    if (x < 0 || x >= this.w || y < 0 || y >= this.h) return;
    const r = (hex >> 16) & 0xFF;
    const g = (hex >> 8) & 0xFF;
    const b = hex & 0xFF;
    const idx = (y * this.w + x) * 4;
    this.buf[idx] = r;
    this.buf[idx + 1] = g;
    this.buf[idx + 2] = b;
    this.buf[idx + 3] = alpha;
  }

  rect(x, y, w, h, hex, alpha = 255) {
    for (let cy = y; cy < y + h; cy++) {
      for (let cx = x; cx < x + w; cx++) {
        this.set(cx, cy, hex, alpha);
      }
    }
  }

  circle(cx, cy, r, hex, alpha = 255) {
    for (let y = cy - r; y <= cy + r; y++) {
      for (let x = cx - r; x <= cx + r; x++) {
        if ((x - cx) * (x - cx) + (y - cy) * (y - cy) <= r * r) {
          this.set(x, y, hex, alpha);
        }
      }
    }
  }

  toPng() {
    return createPng(this.w, this.h, this.buf);
  }
}

function save(filepath, canvas) {
  const full = path.join(__dirname, '..', filepath);
  fs.mkdirSync(path.dirname(full), { recursive: true });
  fs.writeFileSync(full, canvas.toPng());
  console.log('Saved:', filepath, `(${canvas.w}x${canvas.h})`);
}

// ==========================================
// 1. TILESETS (Relva, Terra, Madeira, Espinhos)
// ==========================================

// 1.1 tile-ground.png (16x16) - Solo Orgânico Vibrante com Flores Silvestres
{
  const c = new PixelCanvas(16, 16);
  // Terra de base rica e estratificada
  c.rect(0, 4, 16, 12, 0x422412);
  c.rect(0, 10, 16, 6, 0x2e180b);
  // Estratos e xisto no solo
  c.rect(2, 6, 5, 2, 0x542d17);
  c.rect(10, 7, 5, 2, 0x542d17);
  c.rect(1, 12, 4, 2, 0x241208);
  c.rect(9, 13, 5, 2, 0x241208);
  // Seixos e raízes
  c.set(3, 7, 0x733f20);
  c.set(11, 8, 0x733f20);
  c.set(13, 13, 0x733f20);
  c.set(5, 14, 0x5c3219);

  // Raízes orgânicas descendo da relva
  c.set(2, 4, 0x8a532d);
  c.set(3, 5, 0x8a532d);
  c.set(9, 4, 0x8a532d);

  // Relva viçosa multi-tonal com lâminas de grama em profundidade
  c.rect(0, 3, 16, 3, 0x184a1d); // Sombra inferior da grama
  c.rect(0, 1, 16, 3, 0x2f8224); // Verde médio vívido
  c.rect(0, 0, 16, 2, 0x56c433); // Luz solar no topo
  c.rect(0, 0, 16, 1, 0x82e64a); // Brilho de orvalho

  // Lâminas caídas orgânicas sobre o perfil da terra
  c.rect(1, 4, 2, 2, 0x2f8224);
  c.set(2, 6, 0x184a1d);
  c.rect(5, 4, 3, 3, 0x2f8224);
  c.set(6, 5, 0x56c433);
  c.set(6, 7, 0x184a1d);
  c.rect(11, 4, 2, 2, 0x2f8224);
  c.set(12, 6, 0x184a1d);
  c.rect(14, 4, 2, 1, 0x56c433);

  // Flores silvestres minúsculas pontilhando o topo
  c.set(4, 0, 0xfff066);
  c.set(4, 1, 0xf59e0b);
  c.set(13, 0, 0x67e8f9);
  save('src/assets/tilesets/tile-ground.png', c);
}

// 1.2 tile-ground-left.png (16x16) - Canto Esquerdo Orgânico de Penhasco
{
  const c = new PixelCanvas(16, 16);
  c.rect(3, 4, 13, 12, 0x422412);
  c.rect(3, 10, 13, 6, 0x2e180b);
  c.rect(1, 5, 2, 9, 0x2e180b); // Canto arredondado do despenhadeiro
  c.rect(5, 6, 5, 2, 0x542d17);
  c.set(4, 7, 0x733f20);

  // Grama contornando a borda do penhasco com tufos caídos
  c.rect(2, 3, 14, 3, 0x184a1d);
  c.rect(1, 1, 15, 3, 0x2f8224);
  c.rect(2, 0, 14, 2, 0x56c433);
  c.rect(2, 0, 14, 1, 0x82e64a);
  c.rect(0, 2, 2, 4, 0x2f8224);
  c.rect(0, 3, 1, 2, 0x56c433);
  c.set(1, 6, 0x184a1d);

  c.rect(7, 4, 2, 2, 0x2f8224);
  c.set(7, 6, 0x184a1d);
  c.rect(12, 4, 2, 2, 0x2f8224);
  save('src/assets/tilesets/tile-ground-left.png', c);
}

// 1.3 tile-ground-right.png (16x16) - Canto Direito Orgânico de Penhasco
{
  const c = new PixelCanvas(16, 16);
  c.rect(0, 4, 13, 12, 0x422412);
  c.rect(0, 10, 13, 6, 0x2e180b);
  c.rect(13, 5, 2, 9, 0x2e180b);
  c.rect(2, 7, 5, 2, 0x542d17);

  c.rect(0, 3, 14, 3, 0x184a1d);
  c.rect(0, 1, 15, 3, 0x2f8224);
  c.rect(0, 0, 14, 2, 0x56c433);
  c.rect(0, 0, 14, 1, 0x82e64a);
  c.rect(14, 2, 2, 4, 0x2f8224);
  c.rect(15, 3, 1, 2, 0x56c433);
  c.set(14, 6, 0x184a1d);

  c.rect(3, 4, 2, 2, 0x2f8224);
  c.rect(8, 4, 2, 3, 0x2f8224);
  c.set(9, 7, 0x184a1d);
  save('src/assets/tilesets/tile-ground-right.png', c);
}

// 1.4 tile-earth.png (16x16) - Terra Profunda com Fissuras e Rochas
{
  const c = new PixelCanvas(16, 16);
  c.rect(0, 0, 16, 16, 0x361b0c);
  c.rect(0, 8, 16, 8, 0x241107);
  // Veios rochosos
  c.rect(2, 2, 6, 3, 0x4a2613);
  c.rect(9, 5, 5, 2, 0x4a2613);
  c.rect(1, 10, 6, 3, 0x4a2613);
  c.rect(10, 12, 5, 2, 0x4a2613);
  // Seixos
  c.set(3, 3, 0x69371d);
  c.set(10, 5, 0x69371d);
  c.set(3, 11, 0x69371d);
  c.set(12, 13, 0x69371d);
  save('src/assets/tilesets/tile-earth.png', c);
}

// 1.5 tile-wood-plank.png (16x12) - Madeira Rústica Chanfrada com Pregos
{
  const c = new PixelCanvas(16, 12);
  c.rect(0, 0, 16, 12, 0x572f13);
  c.rect(0, 1, 16, 2, 0x874b20); // Chanfro claro
  c.rect(0, 0, 16, 1, 0xb06830); // Brilho de sol no topo
  c.rect(0, 9, 16, 3, 0x361a09); // Sombra profunda
  c.rect(0, 11, 16, 1, 0x1c0d04);
  // Veios da madeira
  c.rect(3, 4, 6, 1, 0x3d1f0b);
  c.rect(11, 6, 4, 1, 0x3d1f0b);
  c.rect(2, 8, 5, 1, 0x3d1f0b);
  // Pregos de ferro forjado
  c.rect(1, 3, 2, 2, 0x1f2937);
  c.set(1, 3, 0x9ca3af);
  c.rect(13, 3, 2, 2, 0x1f2937);
  c.set(13, 3, 0x9ca3af);
  save('src/assets/tilesets/tile-wood-plank.png', c);
}

// 1.6 platform-stilt.png (4x32) - Estacas de Madeira Robustas
{
  const c = new PixelCanvas(4, 32);
  c.rect(0, 0, 4, 32, 0x241105);
  c.rect(1, 0, 2, 32, 0x45240e);
  c.rect(1, 0, 1, 32, 0x693716);
  // Amarrações de corda rústica nas junções
  c.rect(0, 6, 4, 2, 0xd4a359);
  c.set(1, 6, 0xfde047);
  c.rect(0, 18, 4, 2, 0xd4a359);
  c.set(1, 18, 0xfde047);
  save('src/assets/tilesets/platform-stilt.png', c);
}

// 1.7 hazard-spikes.png (16x16) - Estacas de Ferro Forjado com Espinhos e Raízes
{
  const c = new PixelCanvas(16, 16);
  // Fundo do fosso: solo escuro com raízes venenosas
  c.rect(0, 13, 16, 3, 0x1c1917);
  c.rect(0, 14, 16, 2, 0x09090b);

  // Espinho 1 (Esquerda) - Estaca afiada de ferro negro com lâmina brilhante
  for (let r = 0; r < 13; r++) {
    const half = Math.floor(r * 0.32);
    c.rect(4 - half, 13 - r, half * 2 + 1, 1, 0x334155);
    c.set(4 - half, 13 - r, 0x94a3b8); // Fio de corte reluzente
    c.set(4 + half, 13 - r, 0x0f172a); // Sombra de oclusão
  }
  c.set(4, 0, 0xf8fafc); // Ponta afiada incandescente

  // Espinho 2 (Direita)
  for (let r = 0; r < 13; r++) {
    const half = Math.floor(r * 0.32);
    c.rect(11 - half, 13 - r, half * 2 + 1, 1, 0x334155);
    c.set(11 - half, 13 - r, 0x94a3b8);
    c.set(11 + half, 13 - r, 0x0f172a);
  }
  c.set(11, 0, 0xf8fafc);

  // Farpas e galhos espinhosos enrolados na base
  c.set(1, 12, 0x7f1d1d);
  c.set(2, 11, 0xb91c1c);
  c.set(7, 12, 0x7f1d1d);
  c.set(8, 11, 0xb91c1c);
  c.set(14, 12, 0x7f1d1d);
  save('src/assets/tilesets/hazard-spikes.png', c);
}

// 1.8 moving-platform.png (48x14) - PLATAFORMA MECÂNICA COM ENGRENAGENS E CRISTAL DE ENERGIA
{
  const c = new PixelCanvas(48, 14);
  // Estrutura de madeira nobre polida
  c.rect(0, 0, 48, 14, 0x45230e);
  c.rect(0, 1, 48, 2, 0x783d19);
  c.rect(0, 0, 48, 1, 0xa15322); // Brilho no topo
  c.rect(0, 11, 48, 3, 0x271307);

  // Moldura metálica reforçada de bronze nos cantos
  c.rect(0, 0, 4, 14, 0x78350f);
  c.rect(1, 1, 2, 12, 0xb45309);
  c.rect(44, 0, 4, 14, 0x78350f);
  c.rect(45, 1, 2, 12, 0xb45309);

  // Engrenagem Esquerda (dentes giratórios em bronze)
  c.circle(8, 7, 4, 0x92400e);
  c.circle(8, 7, 3, 0xd97706);
  c.circle(8, 7, 1, 0x1f2937); // Eixo
  c.set(8, 2, 0xf59e0b); // Dentes
  c.set(8, 12, 0xf59e0b);
  c.set(3, 7, 0xf59e0b);
  c.set(13, 7, 0xf59e0b);

  // Engrenagem Direita
  c.circle(39, 7, 4, 0x92400e);
  c.circle(39, 7, 3, 0xd97706);
  c.circle(39, 7, 1, 0x1f2937);
  c.set(39, 2, 0xf59e0b);
  c.set(39, 12, 0xf59e0b);
  c.set(34, 7, 0xf59e0b);
  c.set(44, 7, 0xf59e0b);

  // Cristal de Força Central (Esmeralda/Ciano Brilhante de levitação)
  c.rect(21, 3, 6, 8, 0x064e3b);
  c.rect(22, 4, 4, 6, 0x059669);
  c.rect(23, 5, 2, 4, 0x34d399);
  c.set(23, 5, 0xffffff); // Brilho de energia pura

  // Setas indicativas de movimento no chassi
  c.set(17, 7, 0xfde047);
  c.set(16, 6, 0xfde047);
  c.set(16, 8, 0xfde047);
  c.set(30, 7, 0xfde047);
  c.set(31, 6, 0xfde047);
  c.set(31, 8, 0xfde047);

  save('src/assets/tilesets/moving-platform.png', c);
}

// 1.9 platform-stone.png (28x10) - Laje de Pedra Chiseled com Musgo
{
  const c = new PixelCanvas(28, 10);
  c.rect(0, 0, 28, 10, 0x334155);
  c.rect(0, 1, 28, 2, 0x64748b);
  c.rect(0, 0, 28, 1, 0x94a3b8);
  c.rect(0, 8, 28, 2, 0x1e293b);
  // Fissuras
  c.rect(9, 2, 1, 6, 0x1e293b);
  c.rect(18, 3, 1, 5, 0x1e293b);
  // Musgo viçoso
  c.rect(2, 0, 5, 2, 0x22c55e);
  c.rect(13, 0, 6, 2, 0x22c55e);
  c.set(15, 2, 0x16a34a);
  save('src/assets/tilesets/platform-stone.png', c);
}

// 1.10 platform-bracket.png (6x8) - Mão-Francesa de Madeira
{
  const c = new PixelCanvas(6, 8);
  c.rect(0, 0, 6, 2, 0x361a09);
  c.rect(0, 0, 2, 8, 0x361a09);
  c.set(2, 2, 0x572f13);
  c.set(3, 3, 0x572f13);
  c.set(4, 4, 0x572f13);
  c.set(5, 5, 0x572f13);
  c.set(0, 0, 0x874b20);
  save('src/assets/tilesets/platform-bracket.png', c);
}

// 1.11 decor-vines.png (16x32) - HERAS E CIPÓS PENDURADOS PARA PREENCHER VÃOS/PENHASCOS
{
  const c = new PixelCanvas(16, 32);
  // Ramo principal esquerdo
  for (let y = 0; y < 28; y++) {
    const xOff = Math.floor(Math.sin(y * 0.4) * 2) + 4;
    c.set(xOff, y, 0x14532d);
    c.set(xOff + 1, y, 0x16a34a);
    // Folhas saindo do ramo
    if (y % 4 === 0) {
      c.rect(xOff - 2, y, 2, 2, 0x22c55e);
      c.set(xOff - 1, y, 0x86efac);
    } else if (y % 4 === 2) {
      c.rect(xOff + 2, y, 2, 2, 0x15803d);
    }
    // Pequena flor lilás/vermelha em botão
    if (y === 10 || y === 22) {
      c.set(xOff - 2, y, 0xf43f5e);
    }
  }

  // Ramo secundário direito mais curto
  for (let y = 0; y < 18; y++) {
    const xOff = Math.floor(Math.cos(y * 0.5) * 1.5) + 11;
    c.set(xOff, y, 0x14532d);
    c.set(xOff + 1, y, 0x16a34a);
    if (y % 5 === 0) {
      c.rect(xOff + 2, y, 2, 2, 0x22c55e);
    }
  }

  save('src/assets/sprites/decor-vines.png', c);
}

// 1.12 decor-mist.png (32x12) - NÉVOA ATMOSFÉRICA FLUTUANTE PARA FOSSOS E ESPAÇOS VAZIOS
{
  const c = new PixelCanvas(32, 12);
  // Manchas suaves de névoa translúcida
  c.circle(8, 6, 5, 0xe0f2fe, 120);
  c.circle(16, 5, 6, 0xffffff, 140);
  c.circle(24, 7, 5, 0xe0f2fe, 120);
  c.circle(12, 7, 4, 0xffffff, 160);
  c.circle(20, 6, 4, 0xffffff, 150);
  c.rect(6, 6, 20, 4, 0xe0f2fe, 130);
  save('src/assets/sprites/decor-mist.png', c);
}

// 1.13 cloud-large.png (48x16) & cloud-small.png (28x12)
{
  const c1 = new PixelCanvas(48, 16);
  c1.circle(14, 10, 6, 0xbfdbfe);
  c1.circle(24, 8, 8, 0xbfdbfe);
  c1.circle(34, 10, 6, 0xbfdbfe);
  c1.rect(10, 11, 28, 5, 0xbfdbfe);
  c1.circle(13, 8, 5, 0xffffff);
  c1.circle(24, 7, 7, 0xffffff);
  c1.circle(35, 8, 5, 0xffffff);
  c1.rect(11, 8, 26, 6, 0xffffff);
  save('src/assets/backgrounds/cloud-large.png', c1);

  const c2 = new PixelCanvas(28, 12);
  c2.circle(8, 7, 4, 0xbfdbfe);
  c2.circle(15, 6, 5, 0xbfdbfe);
  c2.circle(21, 7, 4, 0xbfdbfe);
  c2.rect(6, 8, 17, 4, 0xbfdbfe);
  c2.circle(8, 6, 4, 0xffffff);
  c2.circle(15, 5, 5, 0xffffff);
  c2.circle(21, 6, 4, 0xffffff);
  c2.rect(6, 6, 17, 4, 0xffffff);
  save('src/assets/backgrounds/cloud-small.png', c2);
}

// 1.14 bg-mountain-far.png (96x48) - Cordilheira Distante em Bruma Azulada
{
  const c = new PixelCanvas(96, 48);
  // Silhuetas de montanhas com gradiente de névoa
  for (let x = 0; x < 96; x++) {
    const peak1 = Math.floor(22 - Math.abs(x - 30) * 0.6);
    const peak2 = Math.floor(26 - Math.abs(x - 70) * 0.7);
    const topY = Math.max(0, Math.max(peak1, peak2));
    if (topY > 0) {
      const startY = 48 - topY;
      for (let y = startY; y < 48; y++) {
        const factor = (y - startY) / topY;
        const col = factor < 0.3 ? 0x93c5fd : factor < 0.7 ? 0x60a5fa : 0x3b82f6;
        c.set(x, y, col, 160);
      }
      c.set(x, startY, 0xffffff, 200); // Neve eterna no cume
    }
  }
  save('src/assets/backgrounds/bg-mountain-far.png', c);
}

// 1.15 bg-hills-mid.png (64x36) - Colinas Verdes Intermediárias com Pinheiros
{
  const c = new PixelCanvas(64, 36);
  for (let x = 0; x < 64; x++) {
    const h = Math.floor(18 + Math.sin(x * 0.1) * 8);
    const startY = 36 - h;
    for (let y = startY; y < 36; y++) {
      const col = y < startY + 3 ? 0x22c55e : y < startY + 12 ? 0x16a34a : 0x15803d;
      c.set(x, y, col, 220);
    }
  }
  // Silhuetas de pequenos pinheiros
  [12, 28, 44, 56].forEach(px => {
    const baseY = 20;
    c.rect(px, baseY - 6, 2, 6, 0x14532d);
    c.rect(px - 2, baseY - 5, 6, 2, 0x166534);
    c.rect(px - 1, baseY - 7, 4, 2, 0x166534);
    c.set(px, baseY - 8, 0x166534);
  });
  save('src/assets/backgrounds/bg-hills-mid.png', c);
}

// ==========================================
// 2. INIMIGOS EXPRESSIVOS E DETALHADOS
// ==========================================

// 2.1 enemy-beetle-1.png & enemy-beetle-2.png (16x16) - Cascuva Rubi com Patas Articuladas
{
  const c1 = new PixelCanvas(16, 16);
  // Carapaça blindada
  c1.rect(2, 3, 12, 8, 0x7f1d1d);
  c1.rect(3, 4, 10, 6, 0xdc2626);
  c1.rect(4, 4, 7, 2, 0xf87171); // Brilho no exoesqueleto
  c1.set(4, 4, 0xffffff); // Especular
  c1.rect(7, 3, 2, 8, 0x450a0a); // Sutura central
  // Cabeça e olhos
  c1.rect(12, 5, 3, 4, 0x1c1917);
  c1.set(13, 6, 0xfef08a);
  c1.set(14, 6, 0x000000);
  // Antena
  c1.set(14, 4, 0x1c1917);
  c1.set(15, 3, 0xdc2626);
  // 6 Patas articuladas (Pose 1: passo para frente)
  c1.rect(3, 11, 2, 4, 0x1c1917);
  c1.rect(7, 11, 2, 3, 0x1c1917);
  c1.rect(11, 11, 2, 4, 0x1c1917);
  save('src/assets/sprites/enemy-beetle-1.png', c1);

  const c2 = new PixelCanvas(16, 16);
  c2.rect(2, 3, 12, 8, 0x7f1d1d);
  c2.rect(3, 4, 10, 6, 0xdc2626);
  c2.rect(4, 4, 7, 2, 0xf87171);
  c2.set(4, 4, 0xffffff);
  c2.rect(7, 3, 2, 8, 0x450a0a);
  c2.rect(12, 5, 3, 4, 0x1c1917);
  c2.set(13, 6, 0xfef08a);
  c2.set(14, 6, 0x000000);
  c2.set(14, 4, 0x1c1917);
  c2.set(15, 3, 0xdc2626);
  // 6 Patas articuladas (Pose 2: alternada)
  c2.rect(2, 11, 2, 3, 0x1c1917);
  c2.rect(6, 11, 2, 4, 0x1c1917);
  c2.rect(12, 11, 2, 3, 0x1c1917);
  save('src/assets/sprites/enemy-beetle-2.png', c2);
}

// 2.2 enemy-hopper-idle.png & enemy-hopper-jump.png (16x16) - Saltador Florestal
{
  const c1 = new PixelCanvas(16, 16);
  // Corpo agachado pronto pro salto
  c1.rect(3, 6, 10, 6, 0x14532d);
  c1.rect(4, 7, 8, 4, 0x22c55e);
  c1.rect(4, 10, 8, 2, 0xfde047); // Papo amarelo
  // Olhão expressivo
  c1.rect(8, 3, 5, 4, 0xffffff);
  c1.rect(9, 4, 3, 3, 0x0f172a);
  c1.set(10, 4, 0xffffff); // Pupila com brilho
  // Coxas traseiras espiraladas
  c1.rect(1, 9, 3, 5, 0x15803d);
  c1.rect(11, 9, 3, 5, 0x15803d);
  save('src/assets/sprites/enemy-hopper-idle.png', c1);

  const c2 = new PixelCanvas(16, 16);
  // Salto estendido dinâmico
  c2.rect(4, 3, 8, 7, 0x14532d);
  c2.rect(5, 4, 6, 5, 0x22c55e);
  c2.rect(5, 7, 6, 2, 0xfde047);
  c2.rect(8, 1, 5, 4, 0xffffff);
  c2.rect(9, 2, 3, 3, 0x0f172a);
  c2.set(10, 2, 0xffffff);
  // Pernas esticadas para baixo
  c2.rect(3, 10, 2, 6, 0x15803d);
  c2.rect(10, 10, 2, 6, 0x15803d);
  save('src/assets/sprites/enemy-hopper-jump.png', c2);
}

// 2.3 enemy-flyer-1.png & enemy-flyer-2.png (16x16) - Zumbão Drone com Asas Rápidas
{
  const c1 = new PixelCanvas(16, 16);
  // Asas batendo para cima (translúcidas com brilho ciano)
  c1.rect(2, 0, 4, 5, 0xbae6fd, 220);
  c1.rect(9, 0, 4, 5, 0xbae6fd, 220);
  c1.set(3, 1, 0xffffff);
  c1.set(10, 1, 0xffffff);
  // Abdômen listrado em âmbar e obsidiana
  c1.rect(4, 5, 8, 7, 0xf59e0b);
  c1.rect(6, 5, 2, 7, 0x18181b);
  c1.rect(10, 5, 2, 7, 0x18181b);
  // Ferrão
  c1.rect(2, 8, 2, 2, 0x71717a);
  // Viseira/Olho cibernético ciano
  c1.rect(10, 6, 3, 3, 0x38bdf8);
  c1.set(11, 7, 0xffffff);
  save('src/assets/sprites/enemy-flyer-1.png', c1);

  const c2 = new PixelCanvas(16, 16);
  // Asas batendo para baixo
  c2.rect(1, 4, 4, 5, 0xbae6fd, 220);
  c2.rect(11, 4, 4, 5, 0xbae6fd, 220);
  c2.set(2, 5, 0xffffff);
  c2.set(12, 5, 0xffffff);
  c2.rect(4, 5, 8, 7, 0xf59e0b);
  c2.rect(6, 5, 2, 7, 0x18181b);
  c2.rect(10, 5, 2, 7, 0x18181b);
  c2.rect(2, 8, 2, 2, 0x71717a);
  c2.rect(10, 6, 3, 3, 0x38bdf8);
  c2.set(11, 7, 0xffffff);
  save('src/assets/sprites/enemy-flyer-2.png', c2);
}

// ==========================================
// 3. COLETÁVEIS E ITENS COM FORTE IDENTIDADE
// ==========================================

// 3.1 item-stamp.png (14x14) - Selo Postal Dourado com Safira Real
{
  const c = new PixelCanvas(14, 14);
  c.circle(7, 7, 6, 0xb45309);
  c.circle(7, 7, 5, 0xf59e0b);
  c.circle(7, 7, 4, 0xfde047);
  // Centro safira reluzente
  c.circle(7, 7, 3, 0x0284c7);
  c.circle(7, 7, 2, 0x38bdf8);
  // Estrela dourada no miolo
  c.rect(6, 4, 2, 6, 0xfffbeb);
  c.rect(4, 6, 6, 2, 0xfffbeb);
  c.set(4, 4, 0xffffff);
  save('src/assets/sprites/item-stamp.png', c);
}

// 3.2 item-postcard.png (16x12) - Cartão-Postal Secreto Aéreo
{
  const c = new PixelCanvas(16, 12);
  c.rect(0, 0, 16, 12, 0x3f220f);
  c.rect(1, 1, 14, 10, 0xfef9c3);
  // Faixas aéreas diagonais nos 4 cantos
  c.rect(1, 1, 3, 2, 0xdc2626);
  c.rect(4, 1, 3, 2, 0x2563eb);
  c.rect(12, 9, 3, 2, 0xdc2626);
  c.rect(9, 9, 3, 2, 0x2563eb);
  // Selo postal em miniatura
  c.rect(11, 2, 3, 3, 0xb91c1c);
  c.set(12, 3, 0xffffff);
  // Dobra em 'V' do envelope
  c.set(3, 4, 0xb45309);
  c.set(5, 5, 0xb45309);
  c.set(7, 6, 0xb45309);
  c.set(8, 6, 0xb45309);
  c.set(10, 5, 0xb45309);
  c.set(12, 4, 0xb45309);
  // Sinete de cera dourada
  c.circle(7, 6, 2, 0xf59e0b);
  c.set(7, 6, 0xfffbeb);
  save('src/assets/sprites/item-postcard.png', c);
}

// 3.3 item-heart.png (12x12) - Rubi Lapidado de Saúde
{
  const c = new PixelCanvas(12, 12);
  c.rect(2, 0, 3, 1, 0x450a0a);
  c.rect(7, 0, 3, 1, 0x450a0a);
  c.rect(1, 1, 10, 5, 0x450a0a);
  c.rect(2, 6, 8, 3, 0x450a0a);
  c.rect(3, 9, 6, 2, 0x450a0a);
  c.rect(5, 11, 2, 1, 0x450a0a);

  c.rect(2, 1, 3, 3, 0xf87171);
  c.rect(7, 1, 3, 3, 0xef4444);
  c.rect(2, 4, 8, 3, 0xdc2626);
  c.rect(3, 7, 6, 2, 0xb91c1c);
  c.rect(4, 9, 4, 2, 0x991b1b);
  c.set(3, 2, 0xffffff);
  c.set(4, 2, 0xffffff);
  c.set(3, 3, 0xffffff);
  c.set(8, 2, 0xfca5a5);
  save('src/assets/sprites/item-heart.png', c);
}

// 3.4 item-life.png (14x12) - Boné 1-UP do Nilo
{
  const c = new PixelCanvas(14, 12);
  c.rect(2, 2, 9, 6, 0x1e3a8a);
  c.rect(3, 1, 7, 6, 0x2563eb);
  c.rect(4, 1, 5, 2, 0x60a5fa);
  c.rect(0, 7, 14, 3, 0x1d4ed8);
  c.rect(1, 7, 12, 1, 0x93c5fd);
  c.rect(0, 9, 14, 1, 0x1e3a8a);
  c.circle(6, 4, 1, 0xfde047);
  c.set(6, 4, 0xffffff);
  save('src/assets/sprites/item-life.png', c);
}

// 3.5 map-fortress.png (24x24) - CASTELO / FORTALEZA DO GUARDIÃO PARA O MAPA
{
  const c = new PixelCanvas(24, 24);
  // Base de rocha
  c.rect(1, 19, 22, 5, 0x1e293b);
  c.rect(2, 20, 20, 3, 0x334155);

  // Paredes de pedra chiseled
  c.rect(3, 6, 18, 13, 0x475569);
  c.rect(4, 7, 16, 12, 0x64748b);

  // Torres laterais
  c.rect(2, 3, 5, 16, 0x334155);
  c.rect(3, 4, 3, 14, 0x64748b);
  c.rect(17, 3, 5, 16, 0x334155);
  c.rect(18, 4, 3, 14, 0x64748b);

  // Ameias / Castelações no topo
  c.rect(2, 1, 2, 2, 0x475569);
  c.rect(5, 1, 2, 2, 0x475569);
  c.rect(9, 4, 2, 2, 0x475569);
  c.rect(13, 4, 2, 2, 0x475569);
  c.rect(17, 1, 2, 2, 0x475569);
  c.rect(20, 1, 2, 2, 0x475569);

  // Portão de ferro com arco ogival
  c.rect(9, 11, 6, 8, 0x0f172a);
  c.rect(10, 10, 4, 2, 0x0f172a);
  c.rect(10, 12, 4, 7, 0x78350f); // Grade de madeira/ferro
  c.set(11, 14, 0xf59e0b); // Tocha acesa
  c.set(12, 14, 0xf59e0b);

  // Bandeiras vermelhas esvoaçantes nos mastros
  c.set(3, 0, 0xdc2626);
  c.set(4, 0, 0xdc2626);
  c.set(18, 0, 0xdc2626);
  c.set(19, 0, 0xdc2626);

  save('src/assets/sprites/map-fortress.png', c);
}

// 3.6 decor-waterfall.png (16x32)
{
  const c = new PixelCanvas(16, 32);
  c.rect(2, 0, 12, 32, 0x0284c7);
  c.rect(4, 0, 8, 32, 0x38bdf8);
  c.rect(6, 0, 4, 32, 0xbae6fd);
  for (let y = 0; y < 32; y += 4) {
    c.set(7, y, 0xffffff);
    c.set(8, (y + 2) % 32, 0xffffff);
    c.set(5, (y + 1) % 32, 0xe0f2fe);
    c.set(10, (y + 3) % 32, 0xe0f2fe);
  }
  save('src/assets/backgrounds/decor-waterfall.png', c);
}

// 3.7 decor-bunting.png (32x8)
{
  const c = new PixelCanvas(32, 8);
  c.rect(0, 1, 32, 1, 0xd4d4d8);
  const cols = [0xef4444, 0xf59e0b, 0x10b981, 0x38bdf8, 0xec4899];
  cols.forEach((col, i) => {
    const bx = 1 + i * 6;
    c.rect(bx, 2, 5, 2, col);
    c.rect(bx + 1, 4, 3, 2, col);
    c.set(bx + 2, 6, col);
    c.set(bx + 1, 2, 0xffffff);
  });
  save('src/assets/sprites/decor-bunting.png', c);
}

// 3.8 bounce-flower.png & bounce-flower-down.png
{
  const c1 = new PixelCanvas(16, 16);
  c1.rect(7, 9, 2, 7, 0x166534);
  c1.rect(5, 11, 2, 2, 0x15803d);
  c1.rect(9, 13, 2, 2, 0x15803d);
  c1.rect(3, 14, 3, 2, 0x22c55e);
  c1.rect(10, 14, 3, 2, 0x22c55e);
  c1.circle(8, 5, 5, 0xbe185d);
  c1.circle(8, 4, 4, 0xf43f5e);
  c1.circle(8, 4, 3, 0xfb7185);
  c1.circle(8, 3, 2, 0xfef08a);
  c1.set(8, 3, 0xffffff);
  save('src/assets/sprites/bounce-flower.png', c1);

  const c2 = new PixelCanvas(16, 16);
  c2.rect(6, 11, 4, 5, 0x166534);
  c2.rect(3, 14, 3, 2, 0x22c55e);
  c2.rect(10, 14, 3, 2, 0x22c55e);
  c2.circle(8, 8, 6, 0xbe185d);
  c2.circle(8, 7, 5, 0xf43f5e);
  c2.circle(8, 7, 4, 0xfb7185);
  c2.circle(8, 6, 3, 0xfef08a);
  save('src/assets/sprites/bounce-flower-down.png', c2);
}

// 3.9 checkpoint-pole-inactive.png & checkpoint-pole-active.png
{
  const c1 = new PixelCanvas(16, 28);
  c1.rect(2, 22, 12, 6, 0x334155);
  c1.rect(3, 23, 10, 4, 0x475569);
  c1.rect(4, 6, 8, 16, 0x45230e);
  c1.rect(5, 7, 6, 14, 0x783d19);
  c1.rect(6, 10, 4, 8, 0x321607);
  c1.rect(7, 12, 2, 4, 0x475569);
  c1.rect(2, 3, 12, 3, 0x783d19);
  c1.rect(4, 1, 8, 2, 0xd97706);
  c1.set(7, 0, 0xfef08a);
  save('src/assets/sprites/checkpoint-pole-inactive.png', c1);

  const c2 = new PixelCanvas(16, 28);
  c2.rect(2, 22, 12, 6, 0x334155);
  c2.rect(3, 23, 10, 4, 0x475569);
  c2.rect(4, 6, 8, 16, 0x45230e);
  c2.rect(5, 7, 6, 14, 0x783d19);
  c2.rect(6, 10, 4, 8, 0x321607);
  c2.rect(7, 12, 2, 4, 0x38bdf8);
  c2.set(7, 13, 0xffffff);
  c2.set(8, 13, 0xffffff);
  c2.set(6, 13, 0x0284c7);
  c2.set(9, 13, 0x0284c7);
  c2.rect(2, 3, 12, 3, 0x783d19);
  c2.rect(4, 1, 8, 2, 0xf59e0b);
  c2.set(7, 0, 0xfff066);
  c2.set(8, 0, 0xfff066);
  save('src/assets/sprites/checkpoint-pole-active.png', c2);
}

// 3.10 puzzle-target-idle.png & puzzle-target-hit.png
{
  const c1 = new PixelCanvas(16, 16);
  c1.rect(7, 0, 2, 4, 0x78350f);
  c1.rect(5, 4, 6, 3, 0xd97706);
  c1.rect(4, 7, 8, 4, 0xf59e0b);
  c1.rect(3, 11, 10, 3, 0xfbbf24);
  c1.rect(2, 13, 12, 2, 0xd97706);
  c1.rect(5, 5, 2, 7, 0xfef08a);
  c1.rect(7, 14, 2, 2, 0x92400e);
  save('src/assets/sprites/puzzle-target-idle.png', c1);

  const c2 = new PixelCanvas(16, 16);
  c2.rect(7, 0, 2, 4, 0x78350f);
  c2.rect(4, 3, 8, 4, 0xfbbf24);
  c2.rect(3, 7, 10, 5, 0xfef08a);
  c2.rect(2, 12, 12, 3, 0xfffbeb);
  c2.rect(6, 14, 4, 2, 0xd97706);
  save('src/assets/sprites/puzzle-target-hit.png', c2);
}

// 3.11 goal-gate.png (32x40)
{
  const c = new PixelCanvas(32, 40);
  c.rect(2, 6, 5, 34, 0x3d1d0a);
  c.rect(3, 7, 3, 33, 0x6e3b18);
  c.rect(25, 6, 5, 34, 0x3d1d0a);
  c.rect(26, 7, 3, 33, 0x6e3b18);
  c.rect(0, 4, 32, 6, 0x3d1d0a);
  c.rect(1, 5, 30, 3, 0x8f4f22);
  c.rect(1, 5, 30, 1, 0xc2783d);
  const colors = [0xef4444, 0xf59e0b, 0x38bdf8, 0x10b981, 0xec4899];
  colors.forEach((col, idx) => {
    c.rect(3 + idx * 5, 10, 4, 5, col);
    c.set(4 + idx * 5, 10, 0xffffff);
  });
  c.circle(16, 14, 4, 0xd97706);
  c.circle(16, 14, 3, 0xfbbf24);
  c.set(15, 13, 0xffffff);
  save('src/assets/sprites/goal-gate.png', c);
}

// 3.12 decor-tree-large.png (48x56)
{
  const c = new PixelCanvas(48, 56);
  c.rect(20, 26, 8, 30, 0x3d1d0a);
  c.rect(22, 28, 4, 28, 0x613415);
  c.rect(17, 48, 4, 8, 0x3d1d0a);
  c.rect(27, 48, 4, 8, 0x3d1d0a);
  c.circle(24, 20, 19, 0x124018);
  c.circle(14, 22, 13, 0x124018);
  c.circle(34, 22, 13, 0x124018);
  c.circle(24, 18, 17, 0x1e6628);
  c.circle(14, 20, 11, 0x1e6628);
  c.circle(34, 20, 11, 0x1e6628);
  c.circle(24, 10, 10, 0x1e6628);
  c.circle(23, 15, 13, 0x2ea03f);
  c.circle(14, 18, 8, 0x2ea03f);
  c.circle(33, 18, 8, 0x2ea03f);
  c.circle(24, 8, 7, 0x2ea03f);
  c.circle(22, 12, 8, 0x56d669);
  c.circle(13, 16, 5, 0x56d669);
  c.circle(32, 16, 5, 0x56d669);
  c.circle(23, 6, 4, 0x7df08e);
  save('src/assets/sprites/decor-tree-large.png', c);
}

// 3.13 decor-bush.png (24x14)
{
  const c = new PixelCanvas(24, 14);
  c.circle(7, 8, 6, 0x164e20);
  c.circle(16, 8, 6, 0x164e20);
  c.circle(12, 6, 6, 0x227832);
  c.circle(6, 6, 4, 0x2da845);
  c.circle(17, 6, 4, 0x2da845);
  c.circle(12, 4, 4, 0x4ade80);
  c.circle(5, 7, 1, 0xef4444);
  c.circle(11, 8, 1, 0xef4444);
  c.circle(18, 6, 1, 0xef4444);
  c.circle(14, 4, 1, 0xef4444);
  save('src/assets/sprites/decor-bush.png', c);
}

// 3.14 decor-flowers.png (16x10)
{
  const c = new PixelCanvas(16, 10);
  c.rect(3, 4, 1, 6, 0x166534);
  c.rect(8, 3, 1, 7, 0x166534);
  c.rect(13, 5, 1, 5, 0x166534);
  c.set(2, 7, 0x22c55e);
  c.set(9, 6, 0x22c55e);
  c.circle(3, 3, 2, 0xf43f5e);
  c.set(3, 3, 0xfef08a);
  c.circle(8, 2, 2, 0xfbbf24);
  c.set(8, 2, 0xffffff);
  c.circle(13, 4, 2, 0x38bdf8);
  c.set(13, 4, 0xfef08a);
  save('src/assets/sprites/decor-flowers.png', c);
}

// 3.15 decor-rock.png (16x10)
{
  const c = new PixelCanvas(16, 10);
  c.circle(8, 6, 5, 0x334155);
  c.circle(5, 7, 4, 0x334155);
  c.circle(11, 7, 4, 0x334155);
  c.circle(8, 5, 4, 0x475569);
  c.circle(6, 4, 3, 0x64748b);
  c.rect(4, 2, 6, 2, 0x22c55e);
  c.set(3, 3, 0x16a34a);
  c.set(10, 3, 0x16a34a);
  save('src/assets/sprites/decor-rock.png', c);
}

// 3.16 decor-signpost.png (14x18)
{
  const c = new PixelCanvas(14, 18);
  c.rect(6, 6, 3, 12, 0x3d1d0a);
  c.rect(7, 7, 1, 11, 0x5e3315);
  c.rect(1, 1, 12, 7, 0x783d19);
  c.rect(2, 2, 10, 2, 0x995325);
  c.rect(0, 1, 14, 1, 0x3d1d0a);
  c.rect(0, 8, 14, 1, 0x3d1d0a);
  c.rect(5, 4, 3, 1, 0xfef08a);
  c.set(8, 3, 0xfef08a);
  c.set(8, 5, 0xfef08a);
  save('src/assets/sprites/decor-signpost.png', c);
}

// 3.17 decor-fence.png (24x12)
{
  const c = new PixelCanvas(24, 12);
  c.rect(3, 1, 4, 11, 0x45230e);
  c.rect(4, 2, 2, 10, 0x6e3b18);
  c.rect(17, 1, 4, 11, 0x45230e);
  c.rect(18, 2, 2, 10, 0x6e3b18);
  c.rect(0, 4, 24, 2, 0x542d13);
  c.rect(0, 4, 24, 1, 0x8a4e23);
  c.rect(0, 8, 24, 2, 0x542d13);
  c.rect(0, 8, 24, 1, 0x8a4e23);
  save('src/assets/sprites/decor-fence.png', c);
}

// ==========================================
// 4. UI / HUD
// ==========================================

{
  const c = new PixelCanvas(9, 10);
  c.rect(1, 0, 3, 3, 0xef233c);
  c.rect(5, 0, 3, 3, 0xef233c);
  c.rect(0, 2, 9, 3, 0xef233c);
  c.rect(1, 5, 7, 2, 0xd90429);
  c.rect(2, 7, 5, 1, 0xd90429);
  c.rect(3, 8, 3, 1, 0xd90429);
  c.rect(4, 9, 1, 1, 0xd90429);
  c.set(2, 1, 0xffffff);
  c.set(2, 2, 0xffffff);
  save('src/assets/ui/ui-heart-full.png', c);
}

{
  const c = new PixelCanvas(9, 10);
  c.rect(1, 0, 3, 3, 0x1e293b);
  c.rect(5, 0, 3, 3, 0x1e293b);
  c.rect(0, 2, 9, 3, 0x1e293b);
  c.rect(1, 5, 7, 2, 0xd90429);
  c.rect(2, 7, 5, 1, 0x1e293b);
  c.rect(3, 8, 3, 1, 0x1e293b);
  c.rect(4, 9, 1, 1, 0x1e293b);
  c.rect(2, 2, 5, 4, 0x0f172a);
  save('src/assets/ui/ui-heart-empty.png', c);
}

{
  const c = new PixelCanvas(9, 9);
  c.rect(1, 1, 6, 3, 0x2563eb);
  c.rect(6, 3, 2, 1, 0x2563eb);
  c.rect(2, 4, 5, 4, 0xfcd34d);
  c.set(5, 5, 0x000000);
  c.rect(1, 4, 1, 3, 0x451a03);
  save('src/assets/ui/ui-nilo-mini.png', c);
}

{
  const c = new PixelCanvas(7, 7);
  c.circle(3, 3, 3, 0xb45309);
  c.circle(3, 3, 2, 0xfbbf24);
  c.set(3, 3, 0xffffff);
  c.set(2, 2, 0xfef08a);
  save('src/assets/ui/ui-stamp-mini.png', c);
}

{
  const c = new PixelCanvas(7, 7);
  c.rect(0, 0, 7, 7, 0xfbbf24);
  c.rect(1, 1, 5, 5, 0xfef08a);
  c.rect(2, 2, 3, 3, 0xd97706);
  c.set(3, 3, 0xffffff);
  save('src/assets/ui/ui-postcard-lit.png', c);
}

{
  const c = new PixelCanvas(7, 7);
  c.rect(0, 0, 7, 7, 0x334155);
  c.rect(1, 1, 5, 5, 0x1e293b);
  c.rect(2, 2, 3, 3, 0x0f172a);
  save('src/assets/ui/ui-postcard-empty.png', c);
}

require('./build_spritesheets.cjs');
console.log('--- ALL PIXEL ART SPRITES CREATED SUCCESSFULLY! ---');
