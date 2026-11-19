// World news in one image — Wednesday 18 November 2026.
// A Node 22 program (standard library only) that draws the day's front
// page with a 5x7 bitmap font and writes a PNG to /output/entry.png.
// No network at run time: every fact below is embedded in this file.
// Deterministic: the same run always writes the same bytes.
//
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { deflateSync } from "node:zlib";
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const W = 1024;
const H = 768;

// ---------- colours (RGB) ----------
const PAPER: number[] = [245, 241, 230];
const NAVY: number[] = [22, 35, 63];
const RED: number[] = [179, 39, 30];
const INK: number[] = [31, 31, 31];
const GREY: number[] = [90, 90, 90];
const WHITE: number[] = [255, 255, 255];
const AMBER: number[] = [232, 163, 61];
const BORDER: number[] = [210, 205, 190];

// ---------- 5x7 bitmap font ----------
// Each glyph is 7 rows; each row is a 5-bit number, bit 4 = leftmost pixel.
// This is the classic 5x7 set, written out by hand for this program.
const FONT: Record<string, number[]> = {
  A: [0b01110, 0b10001, 0b10001, 0b11111, 0b10001, 0b10001, 0b10001],
  B: [0b11110, 0b10001, 0b10001, 0b11110, 0b10001, 0b10001, 0b11110],
  C: [0b01110, 0b10001, 0b10000, 0b10000, 0b10000, 0b10001, 0b01110],
  D: [0b11110, 0b10001, 0b10001, 0b10001, 0b10001, 0b10001, 0b11110],
  E: [0b11111, 0b10000, 0b10000, 0b11110, 0b10000, 0b10000, 0b11111],
  F: [0b11111, 0b10000, 0b10000, 0b11110, 0b10000, 0b10000, 0b10000],
  G: [0b01110, 0b10001, 0b10000, 0b10111, 0b10001, 0b10001, 0b01111],
  H: [0b10001, 0b10001, 0b10001, 0b11111, 0b10001, 0b10001, 0b10001],
  I: [0b01110, 0b00100, 0b00100, 0b00100, 0b00100, 0b00100, 0b01110],
  J: [0b00111, 0b00010, 0b00010, 0b00010, 0b00010, 0b10010, 0b01100],
  K: [0b10001, 0b10010, 0b10100, 0b11000, 0b10100, 0b10010, 0b10001],
  L: [0b10000, 0b10000, 0b10000, 0b10000, 0b10000, 0b10000, 0b11111],
  M: [0b10001, 0b11011, 0b10101, 0b10101, 0b10001, 0b10001, 0b10001],
  N: [0b10001, 0b11001, 0b10101, 0b10011, 0b10001, 0b10001, 0b10001],
  O: [0b01110, 0b10001, 0b10001, 0b10001, 0b10001, 0b10001, 0b01110],
  P: [0b11110, 0b10001, 0b10001, 0b11110, 0b10000, 0b10000, 0b10000],
  Q: [0b01110, 0b10001, 0b10001, 0b10001, 0b10101, 0b10010, 0b01101],
  R: [0b11110, 0b10001, 0b10001, 0b11110, 0b10100, 0b10010, 0b10001],
  S: [0b01111, 0b10000, 0b10000, 0b01110, 0b00001, 0b00001, 0b11110],
  T: [0b11111, 0b00100, 0b00100, 0b00100, 0b00100, 0b00100, 0b00100],
  U: [0b10001, 0b10001, 0b10001, 0b10001, 0b10001, 0b10001, 0b01110],
  V: [0b10001, 0b10001, 0b10001, 0b10001, 0b10001, 0b01010, 0b00100],
  W: [0b10001, 0b10001, 0b10001, 0b10101, 0b10101, 0b11011, 0b10001],
  X: [0b10001, 0b10001, 0b01010, 0b00100, 0b01010, 0b10001, 0b10001],
  Y: [0b10001, 0b10001, 0b01010, 0b00100, 0b00100, 0b00100, 0b00100],
  Z: [0b11111, 0b00001, 0b00010, 0b00100, 0b01000, 0b10000, 0b11111],
  a: [0b00000, 0b00000, 0b01110, 0b00001, 0b01111, 0b10001, 0b01111],
  b: [0b10000, 0b10000, 0b11110, 0b10001, 0b10001, 0b10001, 0b11110],
  c: [0b00000, 0b00000, 0b01110, 0b10001, 0b10000, 0b10001, 0b01110],
  d: [0b00001, 0b00001, 0b01111, 0b10001, 0b10001, 0b10001, 0b01111],
  e: [0b00000, 0b00000, 0b01110, 0b10001, 0b11111, 0b10000, 0b01110],
  f: [0b00110, 0b01001, 0b01000, 0b11110, 0b01000, 0b01000, 0b01000],
  g: [0b00000, 0b01111, 0b10001, 0b10001, 0b01111, 0b00001, 0b01110],
  h: [0b10000, 0b10000, 0b11110, 0b10001, 0b10001, 0b10001, 0b10001],
  i: [0b00100, 0b00000, 0b01100, 0b00100, 0b00100, 0b00100, 0b01110],
  j: [0b00010, 0b00000, 0b00110, 0b00010, 0b00010, 0b10010, 0b01100],
  k: [0b10000, 0b10000, 0b10010, 0b10100, 0b11000, 0b10100, 0b10010],
  l: [0b01100, 0b00100, 0b00100, 0b00100, 0b00100, 0b00100, 0b01110],
  m: [0b00000, 0b00000, 0b11010, 0b10101, 0b10101, 0b10101, 0b10101],
  n: [0b00000, 0b00000, 0b11110, 0b10001, 0b10001, 0b10001, 0b10001],
  o: [0b00000, 0b00000, 0b01110, 0b10001, 0b10001, 0b10001, 0b01110],
  p: [0b00000, 0b00000, 0b11110, 0b10001, 0b11110, 0b10000, 0b10000],
  q: [0b00000, 0b00000, 0b01111, 0b10001, 0b01111, 0b00001, 0b00001],
  r: [0b00000, 0b00000, 0b10110, 0b11001, 0b10000, 0b10000, 0b10000],
  s: [0b00000, 0b00000, 0b01111, 0b10000, 0b01110, 0b00001, 0b11110],
  t: [0b01000, 0b01000, 0b11100, 0b01000, 0b01000, 0b01001, 0b00110],
  u: [0b00000, 0b00000, 0b10001, 0b10001, 0b10001, 0b10011, 0b01101],
  v: [0b00000, 0b00000, 0b10001, 0b10001, 0b10001, 0b01010, 0b00100],
  w: [0b00000, 0b00000, 0b10001, 0b10101, 0b10101, 0b10101, 0b01010],
  x: [0b00000, 0b00000, 0b10001, 0b01010, 0b00100, 0b01010, 0b10001],
  y: [0b00000, 0b00000, 0b10001, 0b10001, 0b01111, 0b00001, 0b01110],
  z: [0b00000, 0b00000, 0b11111, 0b00010, 0b00100, 0b01000, 0b11111],
  "0": [0b01110, 0b10001, 0b10011, 0b10101, 0b11001, 0b10001, 0b01110],
  "1": [0b00100, 0b01100, 0b00100, 0b00100, 0b00100, 0b00100, 0b01110],
  "2": [0b01110, 0b10001, 0b00001, 0b00110, 0b01000, 0b10000, 0b11111],
  "3": [0b11111, 0b00010, 0b00100, 0b00010, 0b00001, 0b10001, 0b01110],
  "4": [0b00010, 0b00110, 0b01010, 0b10010, 0b11111, 0b00010, 0b00010],
  "5": [0b11111, 0b10000, 0b11110, 0b00001, 0b00001, 0b10001, 0b01110],
  "6": [0b00110, 0b01000, 0b10000, 0b11110, 0b10001, 0b10001, 0b01110],
  "7": [0b11111, 0b00001, 0b00010, 0b00100, 0b01000, 0b01000, 0b01000],
  "8": [0b01110, 0b10001, 0b10001, 0b01110, 0b10001, 0b10001, 0b01110],
  "9": [0b01110, 0b10001, 0b10001, 0b01111, 0b00001, 0b00010, 0b01100],
  " ": [0, 0, 0, 0, 0, 0, 0],
  ".": [0b00000, 0b00000, 0b00000, 0b00000, 0b00000, 0b01100, 0b01100],
  ",": [0b00000, 0b00000, 0b00000, 0b00000, 0b01100, 0b00100, 0b01000],
  ":": [0b00000, 0b01100, 0b01100, 0b00000, 0b01100, 0b01100, 0b00000],
  ";": [0b00000, 0b01100, 0b01100, 0b00000, 0b01100, 0b00100, 0b01000],
  "'": [0b00100, 0b00100, 0b01000, 0b00000, 0b00000, 0b00000, 0b00000],
  "-": [0b00000, 0b00000, 0b00000, 0b01110, 0b00000, 0b00000, 0b00000],
  "/": [0b00001, 0b00010, 0b00010, 0b00100, 0b01000, 0b01000, 0b10000],
  "(": [0b00010, 0b00100, 0b01000, 0b01000, 0b01000, 0b00100, 0b00010],
  ")": [0b01000, 0b00100, 0b00010, 0b00010, 0b00010, 0b00100, 0b01000],
  "%": [0b11001, 0b11010, 0b00010, 0b00100, 0b01000, 0b01011, 0b10011],
  "!": [0b00100, 0b00100, 0b00100, 0b00100, 0b00100, 0b00000, 0b00100],
  "?": [0b01110, 0b10001, 0b00001, 0b00110, 0b00100, 0b00000, 0b00100],
  "+": [0b00000, 0b00100, 0b00100, 0b11111, 0b00100, 0b00100, 0b00000],
  "=": [0b00000, 0b00000, 0b11111, 0b00000, 0b11111, 0b00000, 0b00000],
  "&": [0b01100, 0b10010, 0b10100, 0b01000, 0b10101, 0b10010, 0b01101],
  $: [0b00100, 0b01111, 0b10100, 0b01110, 0b00101, 0b11110, 0b00100],
  '"': [0b01010, 0b01010, 0b00000, 0b00000, 0b00000, 0b00000, 0b00000],
  "*": [0b00000, 0b10101, 0b01110, 0b11111, 0b01110, 0b10101, 0b00000],
};

// ---------- pixel buffer (RGB, row-major) ----------
const img = new Uint8Array(W * H * 3);

function setPx(x: number, y: number, c: number[]): void {
  if (x < 0 || x >= W || y < 0 || y >= H) return;
  const i = (y * W + x) * 3;
  img[i] = c[0];
  img[i + 1] = c[1];
  img[i + 2] = c[2];
}

function fillRect(x: number, y: number, w: number, h: number, c: number[]): void {
  const x0 = Math.max(0, x);
  const y0 = Math.max(0, y);
  const x1 = Math.min(W, x + w);
  const y1 = Math.min(H, y + h);
  for (let yy = y0; yy < y1; yy++) {
    let i = (yy * W + x0) * 3;
    for (let xx = x0; xx < x1; xx++) {
      img[i] = c[0];
      img[i + 1] = c[1];
      img[i + 2] = c[2];
      i += 3;
    }
  }
}

// Bresenham line.
function line(x0: number, y0: number, x1: number, y1: number, c: number[]): void {
  const dx = Math.abs(x1 - x0);
  const dy = -Math.abs(y1 - y0);
  const sx = x0 < x1 ? 1 : -1;
  const sy = y0 < y1 ? 1 : -1;
  let err = dx + dy;
  for (;;) {
    setPx(x0, y0, c);
    if (x0 === x1 && y0 === y1) break;
    const e2 = 2 * err;
    if (e2 >= dy) {
      err += dy;
      x0 += sx;
    }
    if (e2 <= dx) {
      err += dx;
      y0 += sy;
    }
  }
}

// Circle outline by angle sampling (smooth at this radius).
function circle(cx: number, cy: number, r: number, c: number[]): void {
  for (let a = 0; a < 720; a++) {
    const t = (a / 720) * Math.PI * 2;
    setPx(Math.round(cx + r * Math.cos(t)), Math.round(cy + r * Math.sin(t)), c);
  }
}

function drawGlyph(ch: string, x: number, y: number, s: number, c: number[], bold: boolean): void {
  const g = FONT[ch] ?? FONT[" "];
  for (let row = 0; row < 7; row++) {
    const bits = g[row];
    for (let col = 0; col < 5; col++) {
      if (bits & (1 << (4 - col))) {
        const px0 = x + col * s;
        const py0 = y + row * s;
        fillRect(px0, py0, s, s, c);
        if (bold) fillRect(px0 + s, py0, 1, s, c);
      }
    }
  }
}

// Draw text left-aligned at (x, y). One character advances 6*s pixels.
function text(str: string, x: number, y: number, s: number, c: number[], bold = false): void {
  let cx = x;
  for (const ch of str) {
    drawGlyph(ch, cx, y, s, c, bold);
    cx += 6 * s;
  }
}

function textWidth(str: string, s: number): number {
  return str.length * 6 * s - s;
}

function centerText(str: string, y: number, s: number, c: number[], bold = false): void {
  text(str, Math.round((W - textWidth(str, s)) / 2), y, s, c, bold);
}

// ---------- the day's news (researched 19 Nov 2026) ----------
// Sources: Reuters, AFP, AP, NASA JPL, India Meteorological Department,
// as reported by Algenom, Open Chronicle, Zark News, Horizon, Anadolu.
interface Story {
  tag: string;
  head: string;
  body: string[];
  color: number[];
}

const STORIES: Story[] = [
  {
    tag: "APEC - CHINA",
    head: "XI GREETS TRUMP IN SHENZHEN AS APEC OPENS",
    body: [
      "Xi met Trump on the tarmac as APEC opened in Shenzhen.",
      "Xi and Putin also met ahead of three-way talks Thursday.",
    ],
    color: [179, 39, 30],
  },
  {
    tag: "MIDDLE EAST",
    head: "US STRIKES IRAN SITE; IRAN HITS BACK IN GULF",
    body: [
      "US jets hit a Guard missile site on Qeshm Island.",
      "Iran said it sent drones at US forces in Kuwait.",
    ],
    color: [138, 90, 0],
  },
  {
    tag: "UKRAINE WAR",
    head: "UKRAINE HITS KERCH BRIDGE FOR SECOND DAY",
    body: [
      "Part of the road span collapsed after Ukrainian strikes.",
      "Kyiv said the strikes on the bridge were unprecedented.",
    ],
    color: [43, 95, 138],
  },
  {
    tag: "US POLITICS",
    head: "PELTOLA WINS ALASKA; DEMOCRATS TAKE SENATE",
    body: [
      "Democrat Mary Peltola beat Republican Dan Sullivan.",
      "Democrats now hold a projected 56-44 Senate majority.",
    ],
    color: [31, 111, 74],
  },
  {
    tag: "HEALTH - AFRICA",
    head: "EBOLA IN CONGO PASSES 11,000 CASES",
    body: [
      "Cases in DR Congo passed 11,000, the second-largest ever.",
      "Three in four infected children under five do not survive.",
    ],
    color: [107, 58, 138],
  },
  {
    tag: "SPACE",
    head: "VOYAGER 1 REACHES ONE LIGHT-DAY FROM EARTH",
    body: [
      "NASA said the probe crossed 16 billion miles from Earth.",
      "Light itself needs a full day to cover that distance.",
    ],
    color: [14, 124, 123],
  },
];

// ---------- layout ----------
fillRect(0, 0, W, H, PAPER);

// Masthead.
fillRect(0, 0, W, 96, NAVY);
// Globe icon: circle, equator, meridian, two latitude chords.
const gx = 58;
const gy = 48;
const gr = 30;
circle(gx, gy, gr, WHITE);
circle(gx, gy, gr - 1, WHITE);
line(gx - gr, gy, gx + gr, gy, WHITE);
line(gx, gy - gr, gx, gy + gr, WHITE);
for (const dy of [-15, 15]) {
  const dx = Math.round(Math.sqrt(gr * gr - dy * dy));
  line(gx - dx, gy + dy, gx + dx, gy + dy, WHITE);
}
text("WORLD NEWS", 110, 27, 6, WHITE, true);
// Amber rule under the masthead title, the title's own width.
fillRect(110, 74, textWidth("WORLD NEWS", 6), 3, AMBER);
const mastDate = "18 NOV 2026";
text(mastDate, 1000 - textWidth(mastDate, 4), 34, 4, AMBER, true);
fillRect(0, 96, W, 4, RED);

// Date line.
centerText("WEDNESDAY 18 NOVEMBER 2026", 112, 3, NAVY, true);
centerText("SIX STORIES THAT SHAPED THE DAY", 138, 2, GREY);

// Story cards.
let top = 160;
for (let i = 0; i < STORIES.length; i++) {
  const st = STORIES[i];
  fillRect(24, top, 976, 88, WHITE);
  fillRect(24, top, 976, 1, BORDER);
  fillRect(24, top + 87, 976, 1, BORDER);
  fillRect(24, top, 1, 88, BORDER);
  fillRect(999, top, 1, 88, BORDER);
  fillRect(24, top, 8, 88, st.color);
  fillRect(40, top + 12, 36, 36, st.color);
  text(String(i + 1), 49, top + 19, 3, WHITE, true);
  text(st.tag, 88, top + 8, 2, st.color, true);
  text(st.head, 88, top + 28, 3, NAVY, true);
  text(st.body[0], 88, top + 54, 2, INK);
  text(st.body[1], 88, top + 70, 2, INK);
  top += 96;
}

// Footer.
centerText("Sources: Reuters, AFP, AP, NASA, India Meteorological Department", 740, 2, GREY);

// ---------- PNG encoder (RGB, filter 0, zlib level 9) ----------
const CRC_TABLE: number[] = [];
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  CRC_TABLE[n] = c >>> 0;
}

function crc32(buf: Uint8Array): number {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type: string, data: Uint8Array): Uint8Array {
  const out = new Uint8Array(12 + data.length);
  const dv = new DataView(out.buffer);
  dv.setUint32(0, data.length);
  for (let i = 0; i < 4; i++) out[4 + i] = type.charCodeAt(i);
  out.set(data, 8);
  const crcIn = new Uint8Array(4 + data.length);
  crcIn.set(out.subarray(4, 8), 0);
  crcIn.set(data, 4);
  dv.setUint32(8 + data.length, crc32(crcIn));
  return out;
}

function encodePng(): Uint8Array {
  const ihdr = new Uint8Array(13);
  const dv = new DataView(ihdr.buffer);
  dv.setUint32(0, W);
  dv.setUint32(4, H);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 2; // colour type 2 = RGB
  ihdr[10] = 0; // compression
  ihdr[11] = 0; // filter
  ihdr[12] = 0; // interlace
  const raw = new Uint8Array(H * (1 + W * 3));
  for (let y = 0; y < H; y++) {
    raw[y * (1 + W * 3)] = 0;
    raw.set(img.subarray(y * W * 3, (y + 1) * W * 3), y * (1 + W * 3) + 1);
  }
  const idat = deflateSync(raw, { level: 9 });
  const sig = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  const parts = [sig, chunk("IHDR", ihdr), chunk("IDAT", idat), chunk("IEND", new Uint8Array(0))];
  const total = parts.reduce((s, p) => s + p.length, 0);
  const out = new Uint8Array(total);
  let off = 0;
  for (const p of parts) {
    out.set(p, off);
    off += p.length;
  }
  return out;
}

// ---------- main ----------
const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? "/output";
mkdirSync(outDir, { recursive: true });
writeFileSync(join(outDir, "entry.png"), encodePng());
