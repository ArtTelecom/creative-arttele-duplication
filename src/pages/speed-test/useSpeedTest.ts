import { useState, useEffect, useRef, useCallback } from "react";
import { SPEED_TEST_ORIGIN, SPEED_TEST_API, SPEED_TEST_FILE, SPEED_TEST_FILE_BYTES, Phase, Results, HistoryEntry } from "./constants";

export function useSpeedTest() {
  const [phase, setPhase] = useState<Phase>("idle");
  const [results, setResults] = useState<Results>({ ping: null, download: null, upload: null });
  const [currentValue, setCurrentValue] = useState(0);
  const [history, setHistory] = useState<HistoryEntry[]>(() => {
    try { return JSON.parse(localStorage.getItem("speedtest_history") || "[]"); } catch { return []; }
  });
  const animRef = useRef<number | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const currentValueRef = useRef(0);

  function animateTo(target: number, duration: number, onDone: () => void) {
    if (animRef.current) cancelAnimationFrame(animRef.current);
    const start = performance.now();
    const from = currentValueRef.current;
    function tick(now: number) {
      const elapsed = now - start;
      const t = Math.min(elapsed / duration, 1);
      const ease = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
      const noise = Math.sin(elapsed / 180) * target * 0.03 + Math.sin(elapsed / 70) * target * 0.015;
      const val = Math.max(0, from + (target - from) * ease + (t < 1 ? noise : 0));
      currentValueRef.current = val;
      setCurrentValue(val);
      if (t < 1) {
        animRef.current = requestAnimationFrame(tick);
      } else {
        currentValueRef.current = target;
        setCurrentValue(target);
        onDone();
      }
    }
    animRef.current = requestAnimationFrame(tick);
  }

  async function measurePing(): Promise<number> {
    const times: number[] = [];
    // Пингуем локальный сервер (тот же, что раздаёт сайт) по маленькому Range-запросу к файлу
    const url = `${SPEED_TEST_ORIGIN}${SPEED_TEST_FILE}`;
    // прогрев соединения
    try { await fetch(`${url}?_=warm`, { cache: "no-store", headers: { Range: "bytes=0-0" } }); } catch { /* ignore */ }
    for (let i = 0; i < 6; i++) {
      const t0 = performance.now();
      try {
        await fetch(`${url}?_=${Date.now()}_${i}`, { cache: "no-store", headers: { Range: "bytes=0-0" } });
      } catch { /* ignore */ }
      times.push(performance.now() - t0);
    }
    times.sort((a, b) => a - b);
    // берём медианные значения (без крайних выбросов)
    const mid = times.slice(1, 4);
    return Math.round(mid.reduce((s, v) => s + v, 0) / mid.length);
  }

  // Скачивает часть файла speedtest.bin с локального сервера. Range-запрос со случайным
  // смещением, чтобы обойти кэш и не всегда качать одно и то же начало.
  async function fetchRange(chunkBytes: number): Promise<number> {
    const maxStart = Math.max(0, SPEED_TEST_FILE_BYTES - chunkBytes);
    const start = Math.floor(Math.random() * maxStart);
    const end = start + chunkBytes - 1;
    const res = await fetch(`${SPEED_TEST_ORIGIN}${SPEED_TEST_FILE}?_=${Date.now()}_${Math.random()}`, {
      cache: "no-store",
      headers: { Range: `bytes=${start}-${end}` },
      signal: abortRef.current?.signal,
    });
    const buf = await res.arrayBuffer();
    return buf.byteLength;
  }

  async function measureDownload(onProgress: (mbps: number) => void): Promise<number> {
    const PARALLEL = 6;                    // параллельные потоки
    const CHUNK = 2 * 1024 * 1024;         // 2 МБ на Range-запрос
    const MAX_SECONDS = 8;                 // длительность замера
    const WARMUP_MS = 1000;                // прогрев (TCP slow start) — не учитываем

    let totalBytes = 0;
    let counted = false;
    let countStart = 0;
    let countBytes = 0;
    const t0 = performance.now();
    let stop = false;

    const worker = async () => {
      while (!stop) {
        if ((performance.now() - t0) >= MAX_SECONDS * 1000) break;
        let bytes = 0;
        try {
          bytes = await fetchRange(CHUNK);
        } catch { break; }
        if (!bytes) break;
        const elapsedMs = performance.now() - t0;
        totalBytes += bytes;
        // Начинаем считать только после прогрева
        if (!counted && elapsedMs >= WARMUP_MS) {
          counted = true;
          countStart = performance.now();
          countBytes = 0;
        } else if (counted) {
          countBytes += bytes;
        }
        // Реалтайм-скорость для стрелки
        const measSec = (performance.now() - (counted ? countStart : t0)) / 1000;
        const measBytes = counted ? countBytes : totalBytes;
        if (measSec > 0.2) {
          onProgress((measBytes * 8) / measSec / 1_000_000);
        }
      }
    };

    const workers = Array.from({ length: PARALLEL }, () => worker());
    const timer = setTimeout(() => { stop = true; }, MAX_SECONDS * 1000);
    await Promise.all(workers);
    clearTimeout(timer);

    const measSec = (performance.now() - (counted ? countStart : t0)) / 1000;
    const measBytes = counted ? countBytes : totalBytes;
    const mbps = (measBytes * 8) / measSec / 1_000_000;
    return parseFloat(mbps.toFixed(1));
  }

  async function measureUpload(onProgress: (mbps: number) => void): Promise<number> {
    const PARALLEL = 4;
    const CHUNK = 2 * 1024 * 1024; // 2 МБ полезной нагрузки на запрос
    const MAX_SECONDS = 8;
    const WARMUP_MS = 800;

    const payload = new Uint8Array(CHUNK);
    crypto.getRandomValues(payload.slice(0, Math.min(65536, CHUNK)));

    let counted = false;
    let countStart = 0;
    let countBytes = 0;
    let totalBytes = 0;
    const t0 = performance.now();
    let stop = false;
    let seq = 0;

    const worker = async () => {
      while (!stop) {
        if ((performance.now() - t0) >= MAX_SECONDS * 1000) break;
        try {
          await fetch(`${SPEED_TEST_API}?action=upload&_=${Date.now()}_${seq++}`, {
            method: "POST",
            body: payload,
            cache: "no-store",
            signal: abortRef.current?.signal,
          });
        } catch { break; }
        const elapsedMs = performance.now() - t0;
        totalBytes += CHUNK;
        if (!counted && elapsedMs >= WARMUP_MS) {
          counted = true;
          countStart = performance.now();
          countBytes = 0;
        } else if (counted) {
          countBytes += CHUNK;
        }
        const measSec = (performance.now() - (counted ? countStart : t0)) / 1000;
        const measBytes = counted ? countBytes : totalBytes;
        if (measSec > 0.2) {
          onProgress((measBytes * 8) / measSec / 1_000_000);
        }
      }
    };

    const workers = Array.from({ length: PARALLEL }, () => worker());
    const timer = setTimeout(() => { stop = true; }, MAX_SECONDS * 1000);
    await Promise.all(workers);
    clearTimeout(timer);

    const measSec = (performance.now() - (counted ? countStart : t0)) / 1000;
    const measBytes = counted ? countBytes : totalBytes;
    const mbps = (measBytes * 8) / measSec / 1_000_000;
    return parseFloat(mbps.toFixed(1));
  }

  const runTest = useCallback(async () => {
    if (abortRef.current) abortRef.current.abort();
    abortRef.current = new AbortController();
    if (animRef.current) cancelAnimationFrame(animRef.current);

    setResults({ ping: null, download: null, upload: null });
    currentValueRef.current = 0;
    setCurrentValue(0);
    setPhase("ping");

    try {
      // 1. Ping
      const pingVal = await measurePing();
      setResults(r => ({ ...r, ping: pingVal }));

      // 2. Download — реальная скорость выводится на стрелку в реальном времени (smoothed)
      setPhase("download");
      currentValueRef.current = 0;
      setCurrentValue(0);

      const smooth = (next: number) => {
        // экспоненциальное сглаживание, чтобы стрелка не дёргалась
        const prev = currentValueRef.current;
        const val = prev + (next - prev) * 0.35;
        currentValueRef.current = val;
        setCurrentValue(val);
      };

      const dlVal = await measureDownload(smooth);
      await new Promise<void>(resolve => animateTo(dlVal, 500, resolve));
      setResults(r => ({ ...r, download: dlVal }));

      // 3. Upload
      setPhase("upload");
      currentValueRef.current = 0;
      setCurrentValue(0);

      const ulVal = await measureUpload(smooth);
      await new Promise<void>(resolve => animateTo(ulVal, 500, resolve));
      setResults(r => ({ ...r, upload: ulVal }));

      // Сохраняем в историю
      const entry: HistoryEntry = {
        ping: pingVal,
        download: dlVal,
        upload: ulVal,
        time: new Date().toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit", day: "2-digit", month: "2-digit" }),
      };
      setHistory(prev => {
        const next = [entry, ...prev].slice(0, 10);
        try { localStorage.setItem("speedtest_history", JSON.stringify(next)); } catch (_) { /* ignore */ }
        return next;
      });

      setPhase("done");
    } catch {
      setPhase("done");
    }
  }, []);

  useEffect(() => () => {
    if (animRef.current) cancelAnimationFrame(animRef.current);
    if (abortRef.current) abortRef.current.abort();
  }, []);

  return { phase, results, currentValue, history, setHistory, runTest };
}