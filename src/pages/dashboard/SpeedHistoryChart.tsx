import { useEffect, useState } from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import Icon from "@/components/ui/icon";
import { GlassCard } from "./DashboardShared";
import funcUrls from "../../../backend/func2url.json";

interface Point {
  ts: string;
  in_kbps: number;
  out_kbps: number;
}

interface ChartPoint {
  time: string;
  download: number;
  upload: number;
}

function formatKbps(kbps: number): string {
  if (kbps >= 1000) return `${(kbps / 1000).toFixed(1)} Мбит/с`;
  return `${kbps} Кбит/с`;
}

function formatTime(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `${hh}:${mm}`;
}

export default function SpeedHistoryChart({ login }: { login: string }) {
  const [points, setPoints] = useState<ChartPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [hours, setHours] = useState<number>(24);

  useEffect(() => {
    if (!login) return;
    let cancelled = false;
    const url = (funcUrls as Record<string, string>)["mikrobill-scraper"];
    setLoading(true);

    const fetchHistory = () => {
      fetch(`${url}?action=speed_history&login=${encodeURIComponent(login)}&hours=${hours}&_=${Date.now()}`, { cache: "no-store" })
        .then((r) => r.json())
        .then((data: { points?: Point[] }) => {
          if (cancelled) return;
          const list = (data.points || []).map((p) => ({
            time: formatTime(p.ts),
            download: Math.round((p.out_kbps || 0) / 100) / 10,
            upload: Math.round((p.in_kbps || 0) / 100) / 10,
          }));
          setPoints(list);
          setLoading(false);
        })
        .catch(() => {
          if (!cancelled) setLoading(false);
        });
    };

    fetchHistory();
    const id = window.setInterval(fetchHistory, 60_000);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, [login, hours]);

  const hasData = points.length > 0;
  const maxDl = Math.max(...points.map((p) => p.download), 0);
  const maxUl = Math.max(...points.map((p) => p.upload), 0);
  const avgDl = hasData ? points.reduce((s, p) => s + p.download, 0) / points.length : 0;

  return (
    <GlassCard className="p-6">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <h3 className="text-lg font-bold text-white font-montserrat flex items-center gap-2">
          <Icon name="Activity" size={20} style={{ color: "var(--neon-purple)" }} />
          График скорости
        </h3>
        <div className="flex gap-2">
          {[6, 24, 72].map((h) => (
            <button
              key={h}
              onClick={() => setHours(h)}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
              style={{
                background: hours === h ? "rgba(168,85,247,0.18)" : "rgba(255,255,255,0.04)",
                border: hours === h ? "1px solid rgba(168,85,247,0.5)" : "1px solid rgba(255,255,255,0.08)",
                color: hours === h ? "#c084fc" : "rgba(255,255,255,0.55)",
              }}
            >
              {h === 6 ? "6 ч" : h === 24 ? "24 ч" : "3 дня"}
            </button>
          ))}
        </div>
      </div>

      {hasData && (
        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="rounded-xl p-3" style={{ background: "rgba(0,212,255,0.06)", border: "1px solid rgba(0,212,255,0.18)" }}>
            <p className="text-white/45 text-[10px] uppercase tracking-wider mb-1">Макс. загрузка</p>
            <p className="text-base font-bold font-montserrat" style={{ color: "var(--neon-blue)" }}>
              {maxDl.toFixed(1)} Мбит/с
            </p>
          </div>
          <div className="rounded-xl p-3" style={{ background: "rgba(0,245,122,0.06)", border: "1px solid rgba(0,245,122,0.18)" }}>
            <p className="text-white/45 text-[10px] uppercase tracking-wider mb-1">Макс. отдача</p>
            <p className="text-base font-bold font-montserrat" style={{ color: "var(--neon-green)" }}>
              {maxUl.toFixed(1)} Мбит/с
            </p>
          </div>
          <div className="rounded-xl p-3" style={{ background: "rgba(168,85,247,0.06)", border: "1px solid rgba(168,85,247,0.18)" }}>
            <p className="text-white/45 text-[10px] uppercase tracking-wider mb-1">Средняя</p>
            <p className="text-base font-bold font-montserrat" style={{ color: "#c084fc" }}>
              {avgDl.toFixed(1)} Мбит/с
            </p>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Icon name="Loader2" size={28} className="animate-spin text-[#00d4ff]" />
        </div>
      ) : !hasData ? (
        <div className="text-center py-10">
          <Icon name="LineChart" size={36} className="text-white/20 mx-auto mb-2" />
          <p className="text-white/40 text-sm">Данные собираются — график появится после нескольких заходов в кабинет</p>
        </div>
      ) : (
        <div style={{ width: "100%", height: 260 }}>
          <ResponsiveContainer>
            <LineChart data={points} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="time" stroke="rgba(255,255,255,0.35)" fontSize={11} />
              <YAxis stroke="rgba(255,255,255,0.35)" fontSize={11} unit=" Мбит" />
              <Tooltip
                contentStyle={{
                  background: "rgba(17,24,39,0.95)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: 12,
                  color: "#fff",
                }}
                formatter={(value: number, name: string) => [
                  `${value.toFixed(1)} Мбит/с`,
                  name === "download" ? "Загрузка" : "Отдача",
                ]}
              />
              <Line type="monotone" dataKey="download" stroke="var(--neon-blue)" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="upload" stroke="var(--neon-green)" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
          <div className="flex gap-4 justify-center mt-3 text-xs">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-0.5" style={{ background: "var(--neon-blue)" }} />
              <span className="text-white/60">Загрузка</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-0.5" style={{ background: "var(--neon-green)" }} />
              <span className="text-white/60">Отдача</span>
            </div>
          </div>
        </div>
      )}
    </GlassCard>
  );
}
