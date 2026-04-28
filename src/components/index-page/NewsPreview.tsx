import { useEffect, useState } from "react";
import Icon from "@/components/ui/icon";
import funcUrls from "../../../backend/func2url.json";

type NewsItem = { date: string; title: string; text: string };

const API_URL = (funcUrls as Record<string, string>)["mikrobill-scraper"];

export default function NewsPreview() {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetch(`${API_URL}?action=news&limit=3`)
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

  if (!loading && news.length === 0) return null;

  return (
    <section className="container mx-auto px-4 py-12">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl md:text-3xl font-bold flex items-center gap-3">
          <Icon name="Megaphone" size={28} />
          Объявления
        </h2>
        <span className="text-sm text-white/60">Последние новости</span>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {loading &&
          Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="rounded-2xl bg-white/5 border border-white/10 p-5 h-40 animate-pulse"
            />
          ))}
        {!loading &&
          news.map((n, i) => (
            <article
              key={i}
              className="rounded-2xl bg-white/5 border border-white/10 p-5 hover:bg-white/10 transition-colors"
            >
              <div className="text-xs text-white/50 mb-2">{n.date}</div>
              <h3 className="font-semibold mb-2 line-clamp-2">{n.title}</h3>
              {n.text && (
                <p className="text-sm text-white/70 line-clamp-3 whitespace-pre-line">
                  {n.text}
                </p>
              )}
            </article>
          ))}
      </div>
    </section>
  );
}
