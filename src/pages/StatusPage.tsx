import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import Icon from "@/components/ui/icon";
import PageBackground from "@/components/PageBackground";
import funcUrls from "../../backend/func2url.json";

interface Node {
  id: number;
  name: string;
  host: string;
  area: string;
  note: string;
  enabled: boolean;
  online: boolean | null;
  last_online_at: string | null;
  last_check_at: string | null;
  fail_streak: number;
  latency_ms: number | null;
}

interface NodesResponse {
  nodes: Node[];
  total: number;
  online: number;
  offline: number;
  offline_long: number;
}

const PING_INTERVAL_MS = 60 * 60 * 1000; // 1 час

function timeAgo(iso: string | null): string {
  if (!iso) return "—";
  const t = new Date(iso).getTime();
  if (!t) return "—";
  const diff = Math.floor((Date.now() - t) / 1000);
  if (diff < 60) return `${diff} сек назад`;
  if (diff < 3600) return `${Math.floor(diff / 60)} мин назад`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} ч назад`;
  return `${Math.floor(diff / 86400)} дн назад`;
}

export default function StatusPage() {
  const [data, setData] = useState<NodesResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [pinging, setPinging] = useState(false);
  const url = funcUrls["mikrobill-scraper"];
  const lastPingRef = useRef<number>(0);

  const loadStatus = async (doPing: boolean) => {
    try {
      if (doPing) setPinging(true);
      const res = await fetch(`${url}?action=nodes_status&_=${Date.now()}`, {
        method: doPing ? "POST" : "GET",
        cache: "no-store",
        headers: doPing ? { "Content-Type": "application/json" } : undefined,
        body: doPing ? JSON.stringify({ action: "ping_now" }) : undefined,
      });
      const json = (await res.json()) as NodesResponse;
      setData(json);
      if (doPing) lastPingRef.current = Date.now();
    } catch (e) {
      console.warn("status load error", e);
    } finally {
      setLoading(false);
      setPinging(false);
    }
  };

  useEffect(() => {
    // При открытии страницы — если последний пинг был >1 ч назад, пингуем
    const lastChk = data?.nodes?.[0]?.last_check_at;
    const stale =
      !lastChk ||
      Date.now() - new Date(lastChk).getTime() > PING_INTERVAL_MS;
    loadStatus(stale);

    const interval = setInterval(() => {
      loadStatus(true);
    }, PING_INTERVAL_MS);

    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const hasOutage =
    !!data && data.nodes.some((n) => n.online === false && n.fail_streak >= 1);

  const byArea: Record<string, Node[]> = {};
  (data?.nodes || []).forEach((n) => {
    const key = n.area || "Прочее";
    if (!byArea[key]) byArea[key] = [];
    byArea[key].push(n);
  });

  return (
    <div className="min-h-screen relative" style={{ background: "var(--dark-bg)" }}>
      <PageBackground />

      <header
        className="relative z-10 h-16 flex items-center justify-between px-4 md:px-6 backdrop-blur-xl"
        style={{
          background: "rgba(11, 14, 23, 0.85)",
          borderBottom: "1px solid rgba(255,255,255,0.06)",
        }}
      >
        <Link to="/" className="flex items-center gap-2.5 text-white">
          <Icon name="ChevronLeft" size={20} />
          <span className="font-semibold">На главную</span>
        </Link>
        <button
          onClick={() => loadStatus(true)}
          disabled={pinging}
          className="px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 disabled:opacity-50 transition-transform active:scale-95"
          style={{
            background: "linear-gradient(135deg, var(--neon-blue), #0099cc)",
            color: "#0b0e17",
          }}
        >
          <Icon name={pinging ? "Loader" : "RefreshCw"} size={16} className={pinging ? "animate-spin" : ""} />
          {pinging ? "Проверяю..." : "Проверить сейчас"}
        </button>
      </header>

      <main className="relative z-10 max-w-5xl mx-auto px-4 md:px-6 py-8">
        <div className="mb-6">
          <h1 className="text-3xl md:text-4xl font-black text-white font-montserrat tracking-tight">
            Статус сети
          </h1>
          <p className="text-white/50 text-sm mt-2">
            Автоматическая проверка узлов раз в час. Если узел не отвечает — возможно, в этом районе отключили электричество.
          </p>
        </div>

        {loading && !data && (
          <div className="flex items-center gap-3 text-white/50">
            <Icon name="Loader" size={18} className="animate-spin" />
            Загружаю статус...
          </div>
        )}

        {hasOutage && (
          <div
            className="rounded-2xl p-5 mb-6 relative overflow-hidden"
            style={{
              background:
                "linear-gradient(135deg, rgba(239,68,68,0.22), rgba(220,38,38,0.10))",
              border: "1px solid rgba(239,68,68,0.4)",
              boxShadow: "0 0 60px rgba(239,68,68,0.15)",
            }}
          >
            <div className="flex items-start gap-4">
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
                style={{
                  background: "rgba(239,68,68,0.25)",
                  border: "1px solid rgba(239,68,68,0.5)",
                }}
              >
                <Icon name="ZapOff" size={24} style={{ color: "#fecaca" }} />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">
                  Похоже, в части районов нет связи
                </h3>
                <p className="text-white/70 text-sm mt-1">
                  Возможная причина — отключение электричества. Связь восстановится автоматически после возобновления питания.
                </p>
              </div>
            </div>
          </div>
        )}

        {data && (
          <div className="grid grid-cols-3 gap-3 mb-6">
            <div
              className="rounded-xl p-4"
              style={{
                background: "rgba(0,245,122,0.06)",
                border: "1px solid rgba(0,245,122,0.18)",
              }}
            >
              <p className="text-white/50 text-xs uppercase tracking-wider mb-1">Онлайн</p>
              <p className="text-2xl font-bold font-montserrat" style={{ color: "var(--neon-green)" }}>
                {data.online}
              </p>
            </div>
            <div
              className="rounded-xl p-4"
              style={{
                background: "rgba(239,68,68,0.06)",
                border: "1px solid rgba(239,68,68,0.18)",
              }}
            >
              <p className="text-white/50 text-xs uppercase tracking-wider mb-1">Не отвечает</p>
              <p className="text-2xl font-bold font-montserrat text-red-400">
                {data.offline}
              </p>
            </div>
            <div
              className="rounded-xl p-4"
              style={{
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.08)",
              }}
            >
              <p className="text-white/50 text-xs uppercase tracking-wider mb-1">Всего узлов</p>
              <p className="text-2xl font-bold text-white font-montserrat">{data.total}</p>
            </div>
          </div>
        )}

        {Object.keys(byArea).map((area) => (
          <div key={area} className="mb-6">
            <h2 className="text-lg font-bold text-white/80 font-montserrat mb-3">{area}</h2>
            <div className="space-y-2">
              {byArea[area].map((n) => {
                const online = n.online === true;
                const offline = n.online === false;
                const unknown = n.online === null;
                return (
                  <div
                    key={n.id}
                    className="rounded-xl px-4 py-3 flex items-center justify-between"
                    style={{
                      background: offline
                        ? "rgba(239,68,68,0.08)"
                        : online
                        ? "rgba(0,245,122,0.04)"
                        : "rgba(255,255,255,0.03)",
                      border: `1px solid ${
                        offline
                          ? "rgba(239,68,68,0.3)"
                          : online
                          ? "rgba(0,245,122,0.2)"
                          : "rgba(255,255,255,0.08)"
                      }`,
                    }}
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{
                          background: offline
                            ? "#ef4444"
                            : online
                            ? "var(--neon-green)"
                            : "rgba(255,255,255,0.3)",
                          boxShadow: offline
                            ? "0 0 12px rgba(239,68,68,0.6)"
                            : online
                            ? "0 0 10px rgba(0,245,122,0.5)"
                            : "none",
                        }}
                      />
                      <div className="min-w-0">
                        <p className="text-white font-semibold truncate">{n.name}</p>
                        <p className="text-white/40 text-xs truncate">
                          {n.host}
                          {n.note ? ` · ${n.note}` : ""}
                        </p>
                      </div>
                    </div>
                    <div className="text-right shrink-0 ml-3">
                      <p
                        className="text-sm font-bold"
                        style={{
                          color: offline
                            ? "#ef4444"
                            : online
                            ? "var(--neon-green)"
                            : "rgba(255,255,255,0.5)",
                        }}
                      >
                        {unknown ? "не проверялся" : online ? "онлайн" : "нет связи"}
                      </p>
                      <p className="text-white/30 text-xs">
                        {online && n.latency_ms !== null
                          ? `${n.latency_ms} мс · `
                          : ""}
                        {timeAgo(n.last_check_at)}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}

        {data && data.nodes.length === 0 && (
          <p className="text-white/50">
            Список узлов пуст. Добавьте узлы в БД (таблица <code className="text-white/70">nodes</code>).
          </p>
        )}
      </main>
    </div>
  );
}
