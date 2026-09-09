// ============================================================
// THEME COLORS — REVISI Batch 3 (poin 9).
// 100 warna dasar untuk tema aplikasi, dihasilkan lewat rumus
// (bukan diketik manual satu-satu) supaya sebarannya rata di
// seluruh roda warna dan konsisten. Juga berisi fungsi untuk
// menurunkan set warna lengkap (aksen, versi gelap, versi biru,
// versi transparan) dari SATU warna dasar yang dipilih pengguna.
// ============================================================

function hslToHex(h: number, s: number, l: number): string {
  h = ((h % 360) + 360) % 360;
  const sat = Math.max(0, Math.min(100, s)) / 100;
  const light = Math.max(0, Math.min(100, l)) / 100;
  const c = (1 - Math.abs(2 * light - 1)) * sat;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = light - c / 2;
  let r = 0, g = 0, b = 0;
  if (h < 60) { r = c; g = x; b = 0; }
  else if (h < 120) { r = x; g = c; b = 0; }
  else if (h < 180) { r = 0; g = c; b = x; }
  else if (h < 240) { r = 0; g = x; b = c; }
  else if (h < 300) { r = x; g = 0; b = c; }
  else { r = c; g = 0; b = x; }
  const toHex = (v: number) => Math.round((v + m) * 255).toString(16).padStart(2, "0");
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`.toUpperCase();
}

function hexToHsl(hex: string): { h: number; s: number; l: number } {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0;
  const l = (max + min) / 2;
  const d = max - min;
  if (d !== 0) {
    s = d / (1 - Math.abs(2 * l - 1));
    if (max === r) h = 60 * (((g - b) / d) % 6);
    else if (max === g) h = 60 * ((b - r) / d + 2);
    else h = 60 * ((r - g) / d + 4);
  }
  if (h < 0) h += 360;
  return { h, s: s * 100, l: l * 100 };
}

function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

/** REVISI poin 9: 100 warna dasar, sebaran "golden angle" di roda warna. */
export const THEME_BASE_COLORS: string[] = Array.from({ length: 100 }, (_, i) => {
  const hue = (i * 137.508) % 360;
  const sat = 52 + (i % 4) * 9; // berselang-seling 52/61/70/79%
  const light = 46 + (i % 3) * 7; // berselang-seling 46/53/60%
  return hslToHex(hue, sat, light);
});

export interface DerivedTheme {
  primary: string;
  primarySoft: string;
  deep: string;
  blue: string;
}

/**
 * Dari SATU warna dasar yang dipilih pengguna, turunkan set warna lengkap
 * yang dipakai di berbagai tempat di aplikasi (tombol utama, gradasi nama
 * brand, garis aktif menu, dst) supaya tetap serasi satu sama lain.
 */
export function deriveTheme(baseHex: string): DerivedTheme {
  const { h, s, l } = hexToHsl(baseHex);
  const deep = hslToHex(h, Math.min(s + 8, 90), Math.max(l - 20, 14));
  const blue = hslToHex((h + 335) % 360, Math.min(s + 6, 85), Math.min(l + 6, 66));
  return {
    primary: baseHex,
    primarySoft: hexToRgba(baseHex, 0.18),
    deep,
    blue,
  };
}