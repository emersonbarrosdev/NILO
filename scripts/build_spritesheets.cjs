const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

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

class Canvas {
  constructor(w, h) {
    this.w = w;
    this.h = h;
    this.buf = Buffer.alloc(w * h * 4);
  }

  set(x, y, hex, a = 255) {
    if (x < 0 || x >= this.w || y < 0 || y >= this.h) return;
    const idx = (y * this.w + x) * 4;
    this.buf[idx] = (hex >> 16) & 0xFF;
    this.buf[idx + 1] = (hex >> 8) & 0xFF;
    this.buf[idx + 2] = hex & 0xFF;
    this.buf[idx + 3] = a;
  }

  rect(x, y, w, h, hex, a = 255) {
    for (let cy = y; cy < y + h; cy++) {
      for (let cx = x; cx < x + w; cx++) {
        this.set(cx, cy, hex, a);
      }
    }
  }

  circle(cx, cy, r, hex, a = 255) {
    for (let y = cy - r; y <= cy + r; y++) {
      for (let x = cx - r; x <= cx + r; x++) {
        if ((x - cx) * (x - cx) + (y - cy) * (y - cy) <= r * r) {
          this.set(x, y, hex, a);
        }
      }
    }
  }

  save(filepath) {
    const full = path.join(__dirname, '..', filepath);
    fs.mkdirSync(path.dirname(full), { recursive: true });
    fs.writeFileSync(full, createPng(this.w, this.h, this.buf));
    console.log('Saved:', filepath, `(${this.w}x${this.h})`);
  }
}

// --------------------------------------------------------------------------
// 1. BEETLE SPRITESHEET (Cascuva): 16x16 frames, 5 frames -> 80x16
// Frames 0..3: Walk cycle; Frame 4: Shell tuck / hit
// --------------------------------------------------------------------------
{
  const c = new Canvas(80, 16);
  for (let f = 0; f < 5; f++) {
    const fx = f * 16;
    if (f < 4) {
      // Walk frame
      const bob = (f === 1 || f === 3) ? 1 : 0;
      // Carapace (Dark outline, rich ruby shading, specular shine)
      c.rect(fx + 2, 2 + bob, 11, 8, 0x450a0a);
      c.rect(fx + 3, 3 + bob, 9, 6, 0x991b1b);
      c.rect(fx + 3, 3 + bob, 8, 4, 0xdc2626);
      c.rect(fx + 4, 3 + bob, 6, 2, 0xf87171);
      c.set(fx + 4, 3 + bob, 0xffffff); // Specular dot
      c.set(fx + 5, 3 + bob, 0xffffff);
      // Carapace center seam / wing divide
      c.rect(fx + 7, 3 + bob, 1, 6, 0x450a0a);

      // Head
      c.rect(fx + 12, 4 + bob, 3, 5, 0x1c1917);
      // Expressive eye
      c.rect(fx + 12, 5 + bob, 2, 2, 0xfef08a);
      c.set(fx + 13, 5 + bob, 0x0f172a); // Pupil
      // Antenna wiggling
      const antY = (f % 2 === 0) ? 2 : 3;
      c.set(fx + 13, antY + bob, 0x1c1917);
      c.set(fx + 14, antY - 1 + bob, 0xef4444);

      // 6 Articulated legs walking
      if (f === 0) {
        // Leg 1 (front) forward, Leg 2 (mid) back, Leg 3 (rear) forward
        c.rect(fx + 3, 10 + bob, 2, 4, 0x1c1917);
        c.set(fx + 2, 13 + bob, 0x1c1917);
        c.rect(fx + 7, 10 + bob, 2, 3, 0x1c1917);
        c.rect(fx + 11, 10 + bob, 2, 4, 0x1c1917);
        c.set(fx + 13, 13 + bob, 0x1c1917);
      } else if (f === 1) {
        // Passing stance
        c.rect(fx + 4, 10 + bob, 2, 3, 0x1c1917);
        c.rect(fx + 8, 10 + bob, 2, 4, 0x1c1917);
        c.rect(fx + 11, 10 + bob, 2, 3, 0x1c1917);
      } else if (f === 2) {
        // Inverted stride
        c.rect(fx + 4, 10 + bob, 2, 4, 0x1c1917);
        c.set(fx + 5, 13 + bob, 0x1c1917);
        c.rect(fx + 8, 10 + bob, 2, 3, 0x1c1917);
        c.rect(fx + 10, 10 + bob, 2, 4, 0x1c1917);
        c.set(fx + 10, 13 + bob, 0x1c1917);
      } else {
        // Passing stance 2
        c.rect(fx + 3, 10 + bob, 2, 3, 0x1c1917);
        c.rect(fx + 7, 10 + bob, 2, 4, 0x1c1917);
        c.rect(fx + 12, 10 + bob, 2, 3, 0x1c1917);
      }
    } else {
      // Frame 4: Tucked in shell (hit / stunned)
      c.rect(fx + 2, 4, 12, 9, 0x450a0a);
      c.rect(fx + 3, 5, 10, 7, 0x991b1b);
      c.rect(fx + 4, 5, 8, 5, 0xdc2626);
      c.rect(fx + 5, 5, 6, 2, 0xf87171);
      c.set(fx + 5, 5, 0xffffff);
      c.rect(fx + 8, 5, 1, 7, 0x450a0a);
      // Small trembling eye peek
      c.set(fx + 12, 8, 0xfef08a);
      c.set(fx + 13, 8, 0x0f172a);
      // Dust / sweat drop
      c.set(fx + 1, 3, 0x93c5fd);
      c.set(fx + 14, 4, 0xfffbeb);
    }
  }
  c.save('src/assets/sprites/enemy-beetle-sheet.png');
}

// --------------------------------------------------------------------------
// 2. FLYER SPRITESHEET (Zumbão): 18x16 frames, 4 frames -> 72x16
// 4 flight frames: wings up, sweep, down, snap
// --------------------------------------------------------------------------
{
  const c = new Canvas(72, 16);
  for (let f = 0; f < 4; f++) {
    const fx = f * 18;
    const bodyY = (f === 1 || f === 2) ? 6 : 5;

    // Body: Striped bumble/wasp abdomen with stinger
    // Stinger
    c.rect(fx + 1, bodyY + 4, 3, 2, 0x71717a);
    c.set(fx + 1, bodyY + 4, 0x3f3f46);
    // Abdomen
    c.rect(fx + 4, bodyY + 1, 9, 7, 0x451a03);
    c.rect(fx + 4, bodyY + 2, 8, 5, 0xf59e0b);
    c.rect(fx + 5, bodyY + 2, 6, 2, 0xfde047);
    // Dark stripes
    c.rect(fx + 6, bodyY + 1, 2, 6, 0x18181b);
    c.rect(fx + 10, bodyY + 1, 2, 6, 0x18181b);

    // Head and big glossy goggle eyes
    c.rect(fx + 12, bodyY + 1, 4, 6, 0x1c1917);
    c.rect(fx + 12, bodyY + 2, 3, 4, 0x0284c7);
    c.rect(fx + 13, bodyY + 2, 2, 3, 0x38bdf8);
    c.set(fx + 14, bodyY + 2, 0xffffff); // Eye glint

    // Wings: Translucent membrane with cyan gradient & white sparkle
    if (f === 0) {
      // Wings high up (V shape)
      c.rect(fx + 3, 0, 5, 5, 0xbae6fd, 210);
      c.rect(fx + 4, 1, 3, 4, 0xe0f2fe, 230);
      c.set(fx + 4, 0, 0xffffff);
      c.rect(fx + 9, 0, 5, 5, 0xbae6fd, 210);
      c.rect(fx + 10, 1, 3, 4, 0xe0f2fe, 230);
      c.set(fx + 10, 0, 0xffffff);
    } else if (f === 1) {
      // Wings 45 deg down
      c.rect(fx + 2, 2, 6, 4, 0xbae6fd, 210);
      c.rect(fx + 3, 3, 4, 3, 0xe0f2fe, 230);
      c.set(fx + 3, 2, 0xffffff);
      c.rect(fx + 10, 2, 6, 4, 0xbae6fd, 210);
      c.rect(fx + 11, 3, 4, 3, 0xe0f2fe, 230);
      c.set(fx + 11, 2, 0xffffff);
    } else if (f === 2) {
      // Wings fully down (horizontal blur)
      c.rect(fx + 0, bodyY + 1, 8, 3, 0xbae6fd, 190);
      c.rect(fx + 1, bodyY + 1, 6, 2, 0xffffff, 230);
      c.rect(fx + 10, bodyY + 1, 8, 3, 0xbae6fd, 190);
      c.rect(fx + 11, bodyY + 1, 6, 2, 0xffffff, 230);
    } else {
      // Wings whipping back up
      c.rect(fx + 3, 1, 5, 5, 0xbae6fd, 210);
      c.rect(fx + 4, 2, 3, 4, 0xe0f2fe, 240);
      c.set(fx + 4, 1, 0xffffff);
      c.rect(fx + 9, 1, 5, 5, 0xbae6fd, 210);
      c.rect(fx + 10, 2, 3, 4, 0xe0f2fe, 240);
      c.set(fx + 10, 1, 0xffffff);
    }
  }
  c.save('src/assets/sprites/enemy-flyer-sheet.png');
}

// --------------------------------------------------------------------------
// 3. HOPPER SPRITESHEET (Saltador): 18x18 frames, 5 frames -> 90x18
// Frame 0: Idle sit; Frame 1: Breathe/puff; Frame 2: Pre-jump squash;
// Frame 3: Leap stretch; Frame 4: Apex tuck
// --------------------------------------------------------------------------
{
  const c = new Canvas(90, 18);
  for (let f = 0; f < 5; f++) {
    const fx = f * 18;
    if (f === 0 || f === 1) {
      // Idle sitting (Frame 1 has slight throat pouch puff)
      const puff = f === 1 ? 1 : 0;
      // Body
      c.rect(fx + 4, 7, 9, 8, 0x14532d);
      c.rect(fx + 5, 8, 7, 6, 0x22c55e);
      c.rect(fx + 6, 8, 5, 3, 0x4ade80);
      // Cream belly / throat pouch
      c.rect(fx + 5, 11 - puff, 7 + puff, 3 + puff, 0xfde047);
      c.rect(fx + 6, 12 - puff, 5, 2, 0xfef9c3);

      // Eye
      c.circle(fx + 10, 5, 3, 0x14532d);
      c.circle(fx + 10, 5, 2, 0xffffff);
      c.set(fx + 11, 5, 0x0f172a);
      c.set(fx + 10, 4, 0xffffff);

      // Folded hind legs
      c.rect(fx + 1, 10, 4, 6, 0x15803d);
      c.rect(fx + 2, 11, 2, 4, 0x22c55e);
      c.rect(fx + 13, 10, 4, 6, 0x15803d);
      c.rect(fx + 14, 11, 2, 4, 0x22c55e);
    } else if (f === 2) {
      // Pre-jump squash (squatting down)
      c.rect(fx + 3, 9, 12, 7, 0x14532d);
      c.rect(fx + 4, 10, 10, 5, 0x22c55e);
      c.rect(fx + 5, 12, 8, 3, 0xfde047);
      // Eyes narrowed determined
      c.rect(fx + 10, 7, 4, 3, 0xffffff);
      c.rect(fx + 11, 8, 2, 2, 0x0f172a);
      c.set(fx + 11, 7, 0xffffff);
      // Coiled legs
      c.rect(fx + 1, 11, 3, 5, 0x15803d);
      c.rect(fx + 14, 11, 3, 5, 0x15803d);
    } else if (f === 3) {
      // Leap extension (stretched diagonal)
      c.rect(fx + 5, 2, 8, 9, 0x14532d);
      c.rect(fx + 6, 3, 6, 7, 0x22c55e);
      c.rect(fx + 7, 3, 4, 3, 0x4ade80);
      c.rect(fx + 6, 7, 6, 3, 0xfde047);

      // Eye looking ahead
      c.circle(fx + 11, 3, 2, 0xffffff);
      c.set(fx + 12, 3, 0x0f172a);
      c.set(fx + 11, 2, 0xffffff);

      // Extended back legs trailing behind
      c.rect(fx + 3, 10, 3, 7, 0x15803d);
      c.rect(fx + 4, 11, 1, 6, 0x22c55e);
      c.rect(fx + 11, 10, 3, 7, 0x15803d);
      c.rect(fx + 12, 11, 1, 6, 0x22c55e);
    } else {
      // Apex / tuck (curled up in mid-air)
      c.rect(fx + 4, 4, 10, 8, 0x14532d);
      c.rect(fx + 5, 5, 8, 6, 0x22c55e);
      c.rect(fx + 5, 8, 8, 3, 0xfde047);
      c.circle(fx + 11, 4, 2, 0xffffff);
      c.set(fx + 11, 4, 0x0f172a);
      // Tucked feet
      c.rect(fx + 3, 11, 4, 4, 0x15803d);
      c.rect(fx + 11, 11, 4, 4, 0x15803d);
    }
  }
  c.save('src/assets/sprites/enemy-hopper-sheet.png');
}

// --------------------------------------------------------------------------
// 4. STAMP SPRITESHEET: 16x16 frames, 6 frames -> 96x16
// Full 3D rotating gold postal coin seal with blue sapphire & star gleam
// --------------------------------------------------------------------------
{
  const c = new Canvas(96, 16);
  const widths = [12, 10, 6, 3, 6, 10]; // Horizontal width across rotation
  for (let f = 0; f < 6; f++) {
    const fx = f * 16;
    const w = widths[f];
    const offX = Math.floor((16 - w) / 2);

    // Gold rim
    c.rect(fx + offX, 2, w, 12, 0x92400e);
    c.rect(fx + offX + 1, 2, Math.max(1, w - 2), 12, 0xd97706);
    c.rect(fx + offX + 1, 3, Math.max(1, w - 2), 10, 0xf59e0b);
    c.rect(fx + offX + 1, 3, Math.max(1, w - 2), 2, 0xfef08a); // Top rim highlight

    // Sapphire gem center
    if (w >= 6) {
      const gemW = Math.max(2, w - 4);
      const gemOffX = Math.floor((16 - gemW) / 2);
      c.rect(fx + gemOffX, 5, gemW, 6, 0x0369a1);
      c.rect(fx + gemOffX, 6, gemW, 4, 0x0284c7);
      c.rect(fx + gemOffX, 6, Math.max(1, gemW - 1), 2, 0x38bdf8);
      // Star flare glint on frames 0 and 5
      if (f === 0 || f === 5) {
        c.set(fx + 8, 7, 0xffffff);
        c.set(fx + 7, 7, 0xfffbeb);
        c.set(fx + 9, 7, 0xfffbeb);
        c.set(fx + 8, 6, 0xfffbeb);
        c.set(fx + 8, 8, 0xfffbeb);
      }
    } else {
      // Thin edge shine
      c.rect(fx + offX, 4, w, 8, 0xfffbeb);
    }
  }
  c.save('src/assets/sprites/item-stamp-sheet.png');
}

// --------------------------------------------------------------------------
// 5. HEART SPRITESHEET: 14x14 frames, 4 frames -> 56x14
// Pulsing & gleaming ruby heart
// --------------------------------------------------------------------------
{
  const c = new Canvas(56, 14);
  const pulses = [0, 1, 1, 0];
  for (let f = 0; f < 4; f++) {
    const fx = f * 14;
    const p = pulses[f];

    // Dark contour
    c.rect(fx + 2 - p, 1 - p, 4 + p, 2 + p, 0x450a0a);
    c.rect(fx + 8, 1 - p, 4 + p, 2 + p, 0x450a0a);
    c.rect(fx + 1 - p, 2 - p, 12 + p * 2, 5 + p, 0x450a0a);
    c.rect(fx + 2 - p, 7, 10 + p * 2, 3, 0x450a0a);
    c.rect(fx + 4 - p, 10, 6 + p * 2, 2, 0x450a0a);
    c.rect(fx + 6, 12, 2, 1 + p, 0x450a0a);

    // Heart interior
    c.rect(fx + 2 - p, 2 - p, 4 + p, 3 + p, 0xf87171);
    c.rect(fx + 8, 2 - p, 4 + p, 3 + p, 0xef4444);
    c.rect(fx + 2 - p, 5, 10 + p * 2, 3, 0xdc2626);
    c.rect(fx + 3 - p, 8, 8 + p * 2, 2, 0xb91c1c);
    c.rect(fx + 5, 10, 4, 2, 0x991b1b);

    // Specular glint
    c.set(fx + 3 - p, 2 - p, 0xffffff);
    c.set(fx + 4 - p, 2 - p, 0xffffff);
    c.set(fx + 3 - p, 3 - p, 0xffffff);
    if (f === 1 || f === 2) {
      c.set(fx + 9, 3, 0xffffff);
    }
  }
  c.save('src/assets/sprites/item-heart-sheet.png');
}

// --------------------------------------------------------------------------
// 6. BOUNCE FLOWER SPRITESHEET: 24x20 frames, 4 frames -> 96x20
// Frame 0: Idle plush; Frame 1: Squash; Frame 2: Spring burst; Frame 3: Wobble
// --------------------------------------------------------------------------
{
  const c = new Canvas(96, 20);
  for (let f = 0; f < 4; f++) {
    const fx = f * 24;
    if (f === 0) {
      // Idle lush flower
      // Stem & leaves
      c.rect(fx + 11, 10, 2, 9, 0x14532d);
      c.rect(fx + 7, 13, 4, 3, 0x16a34a);
      c.rect(fx + 13, 14, 4, 3, 0x16a34a);
      c.set(fx + 8, 14, 0x4ade80);
      c.set(fx + 14, 15, 0x4ade80);
      // Petal pad
      c.circle(fx + 12, 6, 6, 0x9d174d);
      c.circle(fx + 12, 6, 5, 0xdb2777);
      c.circle(fx + 12, 5, 4, 0xf472b6);
      c.circle(fx + 12, 5, 2, 0xfef08a);
      c.set(fx + 11, 4, 0xffffff);
    } else if (f === 1) {
      // Squashed flat
      c.rect(fx + 10, 14, 4, 5, 0x14532d);
      c.rect(fx + 5, 15, 5, 3, 0x16a34a);
      c.rect(fx + 14, 15, 5, 3, 0x16a34a);
      // Flat wide petal pad
      c.rect(fx + 3, 10, 18, 5, 0x9d174d);
      c.rect(fx + 4, 11, 16, 3, 0xdb2777);
      c.rect(fx + 6, 11, 12, 2, 0xf472b6);
      c.rect(fx + 8, 11, 8, 1, 0xfef08a);
    } else if (f === 2) {
      // Spring upward launch burst
      // Extended stem
      c.rect(fx + 11, 6, 2, 13, 0x16a34a);
      c.set(fx + 11, 8, 0x4ade80);
      c.set(fx + 12, 12, 0x4ade80);
      // High petal pad
      c.circle(fx + 12, 3, 5, 0xdb2777);
      c.circle(fx + 12, 3, 4, 0xf472b6);
      c.circle(fx + 12, 2, 2, 0xfef08a);
      c.set(fx + 12, 1, 0xffffff);
      // Pollen spark particles
      c.set(fx + 6, 2, 0xfef08a);
      c.set(fx + 18, 2, 0xfef08a);
      c.set(fx + 5, 0, 0xffffff);
      c.set(fx + 19, 0, 0xffffff);
    } else {
      // Wobble recovery
      c.rect(fx + 11, 9, 2, 10, 0x14532d);
      c.rect(fx + 7, 12, 4, 3, 0x16a34a);
      c.rect(fx + 13, 13, 4, 3, 0x16a34a);
      c.circle(fx + 12, 5, 5, 0xdb2777);
      c.circle(fx + 12, 5, 4, 0xf472b6);
      c.circle(fx + 12, 4, 2, 0xfef08a);
      c.set(fx + 11, 3, 0xffffff);
    }
  }
  c.save('src/assets/sprites/bounce-flower-sheet.png');
}

// --------------------------------------------------------------------------
// 7. CHECKPOINT TOTEM SPRITESHEET: 16x28 frames, 4 frames -> 64x28
// Frame 0: Dormant; Frames 1..3: Glowing breeze crystal and spiral
// --------------------------------------------------------------------------
{
  const c = new Canvas(64, 28);
  for (let f = 0; f < 4; f++) {
    const fx = f * 16;
    // Stone plinth base
    c.rect(fx + 2, 22, 12, 6, 0x1e293b);
    c.rect(fx + 3, 23, 10, 4, 0x334155);
    c.rect(fx + 4, 24, 8, 2, 0x475569);

    // Carved wood pillar
    c.rect(fx + 4, 6, 8, 16, 0x451a03);
    c.rect(fx + 5, 7, 6, 14, 0x78350f);
    c.rect(fx + 6, 8, 4, 12, 0x92400e);
    // Carved wind runes on wood
    c.set(fx + 7, 11, 0x451a03);
    c.set(fx + 8, 12, 0x451a03);
    c.set(fx + 7, 15, 0x451a03);
    c.set(fx + 8, 16, 0x451a03);

    // Totem head / lantern roof
    c.rect(fx + 2, 3, 12, 3, 0x78350f);
    c.rect(fx + 4, 1, 8, 2, 0xb45309);
    c.set(fx + 7, 0, 0xfde047);
    c.set(fx + 8, 0, 0xfde047);

    if (f === 0) {
      // Dormant crystal
      c.rect(fx + 6, 8, 4, 5, 0x0369a1);
      c.rect(fx + 7, 9, 2, 3, 0x0284c7);
      c.set(fx + 7, 9, 0x38bdf8);
    } else {
      // Active crystal with rotating breeze sparkle
      c.rect(fx + 5, 7, 6, 7, 0x0284c7);
      c.rect(fx + 6, 8, 4, 5, 0x38bdf8);
      c.rect(fx + 7, 9, 2, 3, 0xffffff);

      // Spiraling breeze particles
      const angle = (f - 1) * 2.1;
      const px = Math.round(fx + 8 + Math.cos(angle) * 5);
      const py = Math.round(10 + Math.sin(angle) * 4);
      c.set(px, py, 0x67e8f9);
      c.set(px + 1, py, 0xffffff);
      c.set(fx + 7, 0, 0x67e8f9); // Glowing finial
      c.set(fx + 8, 0, 0xffffff);
    }
  }
  c.save('src/assets/sprites/checkpoint-totem-sheet.png');
}

// --------------------------------------------------------------------------
// 8. CAMPFIRE SPRITESHEET (Continue Screen Vignette): 16x16 frames, 4 frames -> 64x16
// Cozy animated campsite fire
// --------------------------------------------------------------------------
{
  const c = new Canvas(64, 16);
  for (let f = 0; f < 4; f++) {
    const fx = f * 16;
    // Charred logs
    c.rect(fx + 2, 13, 12, 3, 0x27170b);
    c.rect(fx + 3, 12, 10, 2, 0x451a03);
    c.set(fx + 4, 12, 0x78350f);
    c.set(fx + 10, 12, 0x78350f);

    // Glowing embers
    c.rect(fx + 5, 11, 6, 2, 0xb91c1c);
    c.rect(fx + 6, 11, 4, 1, 0xf97316);

    // Dancing flame tongue
    const flameH = (f === 1 || f === 3) ? 9 : 8;
    c.circle(fx + 8, 12 - flameH / 2, Math.floor(flameH / 2), 0xea580c);
    c.circle(fx + 8, 12 - flameH / 2, Math.floor(flameH / 3) + 1, 0xfacc15);
    c.circle(fx + 8, 11 - Math.floor(flameH / 2), 2, 0xfef08a);
    c.set(fx + 8, 12 - flameH, 0xffffff);

    // Embers rising
    if (f === 0) c.set(fx + 6, 3, 0xf97316);
    if (f === 1) c.set(fx + 9, 2, 0xfde047);
    if (f === 2) c.set(fx + 7, 1, 0xf97316);
    if (f === 3) c.set(fx + 10, 3, 0xfde047);
  }
  c.save('src/assets/sprites/decor-campfire.png');
}

// --------------------------------------------------------------------------
// 9. DKC-STYLE WOODEN SIGNBOARD / PLAQUE: 200x120 px
// Hand-carved wooden board with bevels, grain, and brass corner rivets
// --------------------------------------------------------------------------
{
  const c = new Canvas(200, 120);
  // Outer drop shadow
  c.rect(2, 2, 196, 116, 0x050810, 160);

  // Outer carved border
  c.rect(0, 0, 198, 118, 0x271408);
  c.rect(2, 2, 194, 114, 0x45230e);
  c.rect(3, 3, 192, 112, 0x783d19);

  // Wood grain fill
  c.rect(5, 5, 188, 108, 0x5a2d13);
  for (let y = 6; y < 112; y += 4) {
    c.rect(6, y, 186, 1, 0x4d260f);
    c.rect(6, y + 1, 186, 1, 0x6e3717);
  }

  // Inner carved recessed parchment/panel
  c.rect(10, 10, 178, 98, 0x271408);
  c.rect(11, 11, 176, 96, 0x3d1d0c);
  c.rect(12, 12, 174, 94, 0x1f140d);

  // Brass corner rivets
  const corners = [
    [6, 6], [188, 6], [6, 108], [188, 108],
    [10, 10], [184, 10], [10, 104], [184, 104]
  ];
  corners.forEach(([cx, cy]) => {
    c.rect(cx, cy, 3, 3, 0xd97706);
    c.set(cx + 1, cy + 1, 0xfef08a);
    c.set(cx + 2, cy + 2, 0x78350f);
  });

  c.save('src/assets/ui/ui-continue-plaque.png');
}

console.log('--- ALL MULTI-FRAME SPRITESHEETS CREATED SUCCESSFULLY! ---');

