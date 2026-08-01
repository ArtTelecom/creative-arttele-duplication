// Замер всегда идёт на тот сервер, с которого открыт сайт (origin текущей
// страницы). У абонента в сети провайдера сайт открыт на arttele.ru, который
// на MikroTik резолвится в локальный 10.0.1.7 — значит замер идёт по внутренней
// сети и не выходит в интернет. Файлы speedtest.bin и upload.php раздаёт тот же
// сервер, поэтому CORS-проблем нет (запрос к своему же origin).
export const SPEED_TEST_ORIGIN =
  typeof window !== "undefined" ? window.location.origin : "";
export const SPEED_TEST_API = "https://functions.poehali.dev/d0fffefe-ed43-400a-a5b8-d5b58e48fc2d";
// Статичный файл в сборке, раздаётся локальным сервером провайдера — по нему меряем download.
export const SPEED_TEST_FILE = "/speedtest.bin";
export const SPEED_TEST_FILE_BYTES = 25 * 1024 * 1024;
// PHP-приёмник отдачи на том же локальном сервере — по нему меряем upload.
export const SPEED_TEST_UPLOAD = "/upload.php";

// Города для выбора сервера замера
export const SPEED_TEST_CITIES = [
  "Краснодар", "Энем", "Яблоновский", "Майкоп", "Анапа", "Новороссийск",
  "Санкт-Петербург", "Москва", "Новосибирск", "Геленджик", "Сочи", "Волгоград",
];

export type Phase = "idle" | "ping" | "download" | "upload" | "done";
export interface Results { ping: number | null; download: number | null; upload: number | null; }
export interface HistoryEntry { ping: number; download: number; upload: number; time: string; }

export const CX = 160, CY = 160, R = 130;
export const START_ANGLE = 135; // Speedtest-style 270° gauge (bottom-left)
export const SWEEP = 270;       // full 270° sweep, clockwise to bottom-right

export function degToRad(d: number) { return (d * Math.PI) / 180; }

export function polarToXY(angleDeg: number, r: number) {
  const a = degToRad(angleDeg);
  return { x: CX + r * Math.cos(a), y: CY + r * Math.sin(a) };
}

export function arcPath(startDeg: number, endDeg: number, r: number) {
  const s = polarToXY(startDeg, r);
  const e = polarToXY(endDeg, r);
  const large = Math.abs(endDeg - startDeg) > 180 ? 1 : 0;
  return `M ${s.x} ${s.y} A ${r} ${r} 0 ${large} 1 ${e.x} ${e.y}`;
}

export const SCALE_MAX = 1000;
export const UPLOAD_MAX = 400;

// Speedtest.net-style palette
export const ST_DOWNLOAD = "#00bfff"; // bright blue (download)
export const ST_UPLOAD = "#8a2be2";   // violet (upload)
export const ST_TRACK = "rgba(255,255,255,0.06)";

// Speedtest uses a single accent color per phase (не green→red).
// Keep signature for backward compat but return the phase accent.
export function progressColor(_p: number): string {
  return ST_DOWNLOAD;
}

export const DL_LABELS = [0, 100, 250, 500, 750, 1000];
export const UL_LABELS = [0, 50, 100, 200, 300, 400];