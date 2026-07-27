import { useState } from "react";
import { Link } from "react-router-dom";
import Icon from "@/components/ui/icon";
import Speedometer from "./Speedometer";
import { Phase, Results, HistoryEntry, SCALE_MAX, UPLOAD_MAX, ST_DOWNLOAD, ST_UPLOAD, SPEED_TEST_CITIES } from "./constants";

interface SpeedTestContentProps {
  phase: Phase;
  results: Results;
  currentValue: number;
  history: HistoryEntry[];
  setHistory: React.Dispatch<React.SetStateAction<HistoryEntry[]>>;
  runTest: () => void;
}

const quality = (dl: number) => {
  if (dl >= 500) return { text: "Отлично", color: "#00f57a", hint: "подходит для любых задач" };
  if (dl >= 100) return { text: "Хорошо", color: "#00d4ff", hint: "комфортная работа и 4K видео" };
  if (dl >= 30) return { text: "Нормально", color: "#a855f7", hint: "стриминг HD без проблем" };
  return { text: "Слабо", color: "#f59e0b", hint: "стоит рассмотреть другой тариф" };
};

export default function SpeedTestContent({
  phase,
  results,
  currentValue,
  history,
  setHistory,
  runTest,
}: SpeedTestContentProps) {
  const isRunning = phase === "ping" || phase === "download" || phase === "upload";
  const gaugeMax = phase === "upload" ? UPLOAD_MAX : SCALE_MAX;

  const [city, setCity] = useState<string>(SPEED_TEST_CITIES[0]);
  const [cityOpen, setCityOpen] = useState(false);

  const fmt = (v: number | null) =>
    v === null ? "—" : v >= 1000 ? (v / 1000).toFixed(2) : String(v);

  const metrics = [
    { label: "ПИНГ", unit: "мс", value: results.ping === null ? "—" : String(results.ping), icon: "Activity", color: "#f5c400", active: phase === "ping" },
    { label: "ЗАГРУЗКА", unit: results.download && results.download >= 1000 ? "Гбит/с" : "Мбит/с", value: fmt(results.download), icon: "ArrowDown", color: ST_DOWNLOAD, active: phase === "download" },
    { label: "ОТДАЧА", unit: "Мбит/с", value: fmt(results.upload), icon: "ArrowUp", color: ST_UPLOAD, active: phase === "upload" },
  ];

  return (
    <div className="max-w-xl mx-auto">

      <div className="text-center mb-6">
        <h1 className="font-montserrat font-black text-3xl md:text-4xl mb-1">
          Тест скорости <span className="gradient-text-blue">интернета</span>
        </h1>
        <p className="text-white/40 text-sm">Реальная скорость вашего подключения</p>
      </div>

      <div className="glass-card rounded-3xl border border-white/5 px-6 pt-6 pb-7 flex flex-col items-center">

        {/* Metrics row — Speedtest style */}
        <div className="grid grid-cols-3 gap-2 w-full mb-2">
          {metrics.map((m) => (
            <div key={m.label} className="flex flex-col items-center py-2 rounded-xl transition-all duration-300"
              style={{ background: m.active ? `${m.color}14` : "transparent" }}>
              <div className="flex items-center gap-1 mb-1">
                <Icon name={m.icon as "Activity"} size={12} style={{ color: m.color }} />
                <span className="text-[10px] font-bold tracking-widest" style={{ color: m.color }}>{m.label}</span>
              </div>
              <div className="font-montserrat font-black text-xl leading-none text-white">
                {m.value}
              </div>
              <div className="text-white/30 text-[10px] mt-0.5">{m.unit}</div>
            </div>
          ))}
        </div>

        {/* Выбор города (сервера) */}
        <div className="relative mb-1">
          <button
            onClick={() => setCityOpen((o) => !o)}
            disabled={isRunning}
            className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold transition-all"
            style={{
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.1)",
              color: "rgba(255,255,255,0.8)",
              cursor: isRunning ? "not-allowed" : "pointer",
              opacity: isRunning ? 0.5 : 1,
            }}
          >
            <Icon name="MapPin" size={14} style={{ color: ST_DOWNLOAD }} />
            {city}
            <Icon name="ChevronDown" size={14} className="text-white/40" />
          </button>

          {cityOpen && !isRunning && (
            <div className="absolute z-20 left-1/2 -translate-x-1/2 mt-2 w-56 max-h-64 overflow-y-auto rounded-2xl p-1"
              style={{ background: "rgba(17,22,36,0.98)", border: "1px solid rgba(255,255,255,0.1)", boxShadow: "0 10px 40px rgba(0,0,0,0.5)" }}>
              {SPEED_TEST_CITIES.map((c) => (
                <button
                  key={c}
                  onClick={() => { setCity(c); setCityOpen(false); }}
                  className="w-full text-left px-3 py-2 rounded-xl text-sm transition-colors flex items-center gap-2 hover:bg-white/5"
                  style={{ color: c === city ? ST_DOWNLOAD : "rgba(255,255,255,0.75)" }}
                >
                  <Icon name="MapPin" size={13} style={{ opacity: c === city ? 1 : 0.4 }} />
                  {c}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Speedometer */}
        <div className="w-full flex items-center justify-center">
          <Speedometer value={currentValue} max={gaugeMax} phase={phase} />
        </div>

        {/* Кнопка Старт — pill под спидометром */}
        <button
          onClick={runTest}
          disabled={isRunning}
          className="mt-1 font-montserrat font-black tracking-wide transition-all duration-300 hover:scale-[1.03]"
          style={{
            padding: "14px 56px",
            borderRadius: 9999,
            fontSize: 18,
            border: `2px solid ${ST_DOWNLOAD}`,
            color: isRunning ? "rgba(255,255,255,0.35)" : "#0b0e17",
            background: isRunning ? "rgba(255,255,255,0.05)" : ST_DOWNLOAD,
            cursor: isRunning ? "not-allowed" : "pointer",
            boxShadow: isRunning ? "none" : `0 0 30px rgba(0,191,255,0.4)`,
          }}
        >
          {phase === "idle" ? "Старт" : phase === "done" ? "Повторить" : "Идёт тест…"}
        </button>

        {/* Quality badge */}
        {phase === "done" && results.download !== null && (
          <div className="mt-4 mb-1 px-5 py-2.5 rounded-full text-sm font-semibold"
            style={{ background: `${quality(results.download).color}18`, border: `1px solid ${quality(results.download).color}44`, color: quality(results.download).color }}>
            {quality(results.download).text} — {quality(results.download).hint}
          </div>
        )}

        {phase === "done" && results.download !== null && results.download < 100 && (
          <Link to="/tariffs" className="mt-2 text-xs text-white/40 hover:text-[#00d4ff] transition-colors underline underline-offset-2">
            Посмотреть тарифы с высокой скоростью →
          </Link>
        )}

        {isRunning && (
          <div className="mt-3 flex items-center gap-2 text-xs text-white/40">
            <div className="w-3 h-3 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: `${ST_DOWNLOAD}`, borderTopColor: "transparent" }} />
            {phase === "ping" ? "измеряю пинг…" : phase === "download" ? "измеряю загрузку…" : "измеряю отдачу…"}
          </div>
        )}
      </div>

      {/* Info row */}
      <div className="grid grid-cols-3 gap-3 mt-5">
        {[
          { icon: "Zap", title: "До 2.5 Гбит/с", desc: "на топовых тарифах", color: "#00d4ff" },
          { icon: "Clock", title: "Безлимит", desc: "без снижения скорости", color: "#00f57a" },
          { icon: "Shield", title: "SLA 99.9%", desc: "гарантированный uptime", color: "#a855f7" },
        ].map((c) => (
          <div key={c.title} className="glass-card rounded-2xl p-4 border border-white/5 text-center">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center mx-auto mb-2" style={{ background: `${c.color}18` }}>
              <Icon name={c.icon as "Zap"} size={15} style={{ color: c.color }} />
            </div>
            <div className="font-bold text-xs mb-0.5">{c.title}</div>
            <div className="text-white/30 text-xs">{c.desc}</div>
          </div>
        ))}
      </div>

      {/* История замеров */}
      {history.length > 0 && (
        <div className="mt-8">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2 text-white/50 text-sm font-semibold">
              <Icon name="History" size={14} />
              История замеров
            </div>
            <button
              onClick={() => {
                setHistory([]);
                try { localStorage.removeItem("speedtest_history"); } catch (_) { /* ignore */ }
              }}
              className="text-xs text-white/25 hover:text-white/50 transition-colors"
            >
              Очистить
            </button>
          </div>

          <div className="glass-card rounded-2xl border border-white/5 overflow-hidden">
            {/* Шапка */}
            <div className="grid grid-cols-4 px-4 py-2 border-b border-white/5">
              {["Время", "↓ Загрузка", "↑ Отдача", "Пинг"].map(h => (
                <div key={h} className="text-white/25 text-xs text-center">{h}</div>
              ))}
            </div>

            {history.map((row, i) => {
              const q = quality(row.download);
              return (
                <div key={i}
                  className="grid grid-cols-4 px-4 py-3 items-center transition-colors hover:bg-white/[0.02]"
                  style={{ borderBottom: i < history.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none" }}>
                  <div className="text-white/35 text-xs text-center">{row.time}</div>
                  <div className="text-center">
                    <span className="font-montserrat font-bold text-sm" style={{ color: q.color }}>
                      {row.download >= 1000 ? (row.download / 1000).toFixed(1) + " Гбит/с" : row.download + " Мбит/с"}
                    </span>
                  </div>
                  <div className="text-center">
                    <span className="font-montserrat font-bold text-sm text-[#00f57a]">
                      {row.upload} Мбит/с
                    </span>
                  </div>
                  <div className="text-center">
                    <span className="text-xs font-semibold" style={{ color: "#a855f7" }}>{row.ping} мс</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

    </div>
  );
}