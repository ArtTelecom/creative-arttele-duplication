import { useState } from "react";
import Icon from "@/components/ui/icon";
import { Results, Phase } from "./constants";

interface ScenarioBarsProps {
  results: Results;
  phase: Phase;
}

type IconName = "AppWindow" | "Gamepad2" | "MonitorPlay" | "Video";

interface Scenario {
  key: string;
  icon: IconName;
  title: string;
  color: string;
  /** Скорость (Мбит/с) для «идеально» — 5 палочек */
  needMbps: number;
  /** Макс. комфортный пинг (мс); ниже — лучше. undefined = пинг не важен */
  needPing?: number;
  goodText: string;
  badText: string;
}

const SCENARIOS: Scenario[] = [
  { key: "surf", icon: "AppWindow", title: "Сёрфинг", color: "#00d4ff", needMbps: 15, goodText: "Сайты и соцсети открываются мгновенно", badText: "Страницы могут подгружаться медленно" },
  { key: "games", icon: "Gamepad2", title: "Игры", color: "#00f57a", needMbps: 30, needPing: 40, goodText: "Онлайн-игры без лагов и задержек", badText: "Возможны задержки в онлайн-играх" },
  { key: "stream", icon: "MonitorPlay", title: "Стриминг", color: "#a855f7", needMbps: 50, goodText: "4K-видео без буферизации", badText: "4K может подтормаживать, HD — ок" },
  { key: "calls", icon: "Video", title: "Видеозвонки", color: "#f5c400", needMbps: 25, needPing: 60, goodText: "Чёткая картинка и звук в конференциях", badText: "Возможны артефакты на видеосвязи" },
];

/** 0..5 палочек по скорости и (если задан) пингу */
function scoreFor(s: Scenario, dl: number | null, ping: number | null): number {
  if (dl === null) return 0;
  let score = Math.min(5, Math.max(1, Math.ceil((dl / s.needMbps) * 5)));
  if (s.needPing != null && ping != null) {
    if (ping > s.needPing * 2) score = Math.min(score, 2);
    else if (ping > s.needPing) score = Math.min(score, 3);
  }
  return score;
}

export default function ScenarioBars({ results, phase }: ScenarioBarsProps) {
  const [open, setOpen] = useState<string | null>(null);
  const tested = phase === "done" && results.download !== null;

  return (
    <div className="grid grid-cols-4 gap-2 sm:gap-3 mt-5">
      {SCENARIOS.map((s) => {
        const score = tested ? scoreFor(s, results.download, results.ping) : 0;
        const isOpen = open === s.key;
        const good = score >= 4;
        return (
          <button
            key={s.key}
            type="button"
            onClick={() => setOpen(isOpen ? null : s.key)}
            className="glass-card rounded-2xl p-3 border text-center flex flex-col items-center transition-all duration-300 hover:scale-[1.04] focus:outline-none"
            style={{
              borderColor: isOpen ? `${s.color}66` : "rgba(255,255,255,0.06)",
              background: isOpen ? `${s.color}12` : undefined,
            }}
          >
            <div
              className="w-11 h-11 rounded-2xl flex items-center justify-center mb-2 transition-colors"
              style={{ background: tested ? `${s.color}1f` : "rgba(255,255,255,0.05)" }}
            >
              <Icon
                name={s.icon}
                size={22}
                style={{ color: tested ? s.color : "rgba(255,255,255,0.4)" }}
              />
            </div>

            <div className="text-[11px] font-bold text-white/80 mb-1.5 leading-tight">{s.title}</div>

            {/* Точки-индикаторы */}
            <div className="flex items-center gap-[3px]">
              {[0, 1, 2, 3, 4].map((i) => (
                <span
                  key={i}
                  className="w-1.5 h-1.5 rounded-full transition-all duration-300"
                  style={{
                    background: i < score ? s.color : "rgba(255,255,255,0.15)",
                    boxShadow: i < score ? `0 0 6px ${s.color}` : "none",
                    transitionDelay: `${i * 60}ms`,
                  }}
                />
              ))}
            </div>

            {/* Подсказка при раскрытии */}
            {isOpen && (
              <div className="mt-2 text-[10px] leading-snug text-white/50">
                {!tested
                  ? "Запустите тест, чтобы оценить"
                  : good
                  ? s.goodText
                  : s.badText}
              </div>
            )}
          </button>
        );
      })}
    </div>
  );
}
