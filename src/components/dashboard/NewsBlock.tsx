import { useEffect, useState } from "react";
import Icon from "@/components/ui/icon";
import funcUrls from "../../../backend/func2url.json";

type NewsItem = { date: string; title: string; text: string };

const API_URL = (funcUrls as Record<string, string>)["mikrobill-scraper"];

export default function NewsBlock() {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch(`${API_URL}?action=news`)
      .then((r) => r.json())
      .then((data) => {
        if (!cancelled) setNews(Array.isArray(data.news) ? data.news : []);
      })
      .catch(() => {
        if (!cancelled) setNews([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const visible = expanded ? news : news.slice(0, 3);

  return (
    <div
      className="rounded-2xl p-6 animate-fade-in"
      style={{
        background: "rgba(17, 24, 39, 0.6)",
        border: "1px solid rgba(255, 255, 255, 0.08)",
      }}
    >
      <h3 className="text-lg font-bold text-white font-montserrat mb-4 flex items-center gap-2">
        <Icon name="Megaphone" size={20} style={{ color: "var(--neon-blue)" }} />
        Объявления
      </h3>

      {loading && <p className="text-white/40 text-sm">Загрузка...</p>}

      {!loading && news.length === 0 && (
        <p className="text-white/40 text-sm">Объявлений пока нет.</p>
      )}

      <div className="space-y-3">
        {visible.map((n, i) => (
          <article
            key={i}
            className="rounded-xl p-4"
            style={{
              background: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(255,255,255,0.06)",
            }}
          >
            <div className="text-xs text-white/40 mb-1">{n.date}</div>
            <h4 className="font-semibold text-white mb-1.5">{n.title}</h4>
            {n.text && (
              <p className="text-sm text-white/70 whitespace-pre-line">
                {n.text}
              </p>
            )}
          </article>
        ))}
      </div>

      {!loading && news.length > 3 && (
        <button
          onClick={() => setExpanded((v) => !v)}
          className="mt-4 text-sm font-semibold flex items-center gap-1.5 transition-colors hover:opacity-80"
          style={{ color: "var(--neon-blue)" }}
        >
          {expanded ? (
            <>
              Свернуть <Icon name="ChevronUp" size={16} />
            </>
          ) : (
            <>
              Показать все ({news.length}) <Icon name="ChevronDown" size={16} />
            </>
          )}
        </button>
      )}
    </div>
  );
}
