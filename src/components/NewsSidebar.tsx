import { useEffect, useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import Icon from "@/components/ui/icon";
import func2url from "../../backend/func2url.json";

export type NewsItem = {
  date: string;
  title: string;
  text: string;
};

const API_URL = (func2url as Record<string, string>)["mikrobill-scraper"];

export default function NewsSidebar() {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      try {
        const r = await fetch(`${API_URL}?action=news`);
        const data = await r.json();
        if (!cancelled) setNews(Array.isArray(data.news) ? data.news : []);
      } catch {
        if (!cancelled) setNews([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <button
          aria-label="Объявления"
          className="fixed right-0 top-1/2 -translate-y-1/2 z-40 bg-primary text-primary-foreground px-3 py-4 rounded-l-2xl shadow-lg hover:px-4 transition-all flex flex-col items-center gap-2"
        >
          <Icon name="Megaphone" size={22} />
          <span
            className="text-xs font-semibold tracking-wider"
            style={{ writingMode: "vertical-rl" }}
          >
            Объявления
          </span>
          {news.length > 0 && (
            <span className="bg-white text-primary text-[10px] font-bold rounded-full min-w-5 h-5 px-1 flex items-center justify-center">
              {news.length}
            </span>
          )}
        </button>
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Icon name="Megaphone" size={20} />
            Все объявления
          </SheetTitle>
        </SheetHeader>

        <div className="mt-6 space-y-4">
          {loading && (
            <p className="text-sm text-muted-foreground">Загрузка...</p>
          )}
          {!loading && news.length === 0 && (
            <p className="text-sm text-muted-foreground">
              Объявлений пока нет.
            </p>
          )}
          {news.map((n, i) => (
            <article
              key={i}
              className="border rounded-lg p-4 bg-card hover:shadow-md transition-shadow"
            >
              <div className="text-xs text-muted-foreground mb-1">{n.date}</div>
              <h3 className="font-semibold mb-2">{n.title}</h3>
              {n.text && (
                <p className="text-sm whitespace-pre-line text-foreground/80">
                  {n.text}
                </p>
              )}
            </article>
          ))}
        </div>
      </SheetContent>
    </Sheet>
  );
}
