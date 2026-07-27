import { Link } from "react-router-dom";
import Icon from "@/components/ui/icon";
import Speedometer from "./Speedometer";
import { Phase, Results, HistoryEntry, SCALE_MAX, UPLOAD_MAX, ST_DOWNLOAD, ST_UPLOAD } from "./constants";

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

  const fmt = (v: number | null) =>
    v === null ? "—" : v >= 1000 ? (v / 1000).toFixed(2) : String(v);

  const metrics = [
    { label: "PING", unit: "ms", value: results.ping === null ? "—" : String(results.ping), icon: "Activity", color: "#f5c400", active: phase === "ping" },
    { label: "DOWNLOAD", unit: results.download && results.download >= 1000 ? "Gbps" : "Mbps", value: fmt(results.download), icon: "ArrowDown", color: ST_DOWNLOAD, active: phase === "download" },
    { label: "UPLOAD", unit: "Mbps", value: fmt(results.upload), icon: "ArrowUp", color: ST_UPLOAD, active: phase === "upload" },
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

        {/* Speedometer with centered GO button */}
        <div className="relative w-full flex items-center justify-center">
          <Speedometer value={currentValue} max={gaugeMax} phase={phase} />

          {(phase === "idle" || phase === "done") && (
            <button
              onClick={runTest}
              className="absolute rounded-full font-montserrat font-black flex items-center justify-center transition-all duration-300 hover:scale-105"
              style={{
                width: 104, height: 104,
                border: `2px solid ${ST_DOWNLOAD}`,
                color: ST_DOWNLOAD,
                background: "rgba(0,191,255,0.06)",
                fontSize: phase === "done" ? 20 : 30,
                letterSpacing: 1,
                boxShadow: `0 0 30px rgba(0,191,255,0.35)`,
              }}
            >
              {phase === "done" ? "↻" : "GO"}
            </button>
          )}
        </div>

        {/* Quality badge */}
        {phase === "done" && results.download !== null && (
          <div className="mt-3 mb-1 px-5 py-2.5 rounded-full text-sm font-semibold"
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