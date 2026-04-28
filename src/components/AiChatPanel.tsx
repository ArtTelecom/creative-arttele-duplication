import { useState, useRef, useEffect } from "react";
import Icon from "@/components/ui/icon";
import { toast } from "sonner";
import funcUrls from "../../backend/func2url.json";

export type ChatMessage = { role: "user" | "assistant"; content: string };

interface UserCtx {
  name?: string;
  login?: string;
  phone?: string;
  tariff?: string;
  speed?: string;
  balance?: string;
  status?: string;
  address?: string;
  work_until?: string;
  [k: string]: unknown;
}

interface AiChatPanelProps {
  mode: "site" | "dashboard";
  context?: UserCtx;
  greeting: string;
  placeholder?: string;
  accentColor?: string;
  className?: string;
  inputClassName?: string;
  showTicketButton?: boolean;
}

const TICKET_TOPICS_SITE = [
  "Заявка на подключение",
  "Вопрос по тарифам",
  "Видеонаблюдение",
  "Бизнес-подключение",
  "Другое",
];

const TICKET_TOPICS_DASHBOARD = [
  "Ремонт / нет интернета",
  "Низкая скорость",
  "Настройка оборудования",
  "Смена тарифа",
  "Финансовый вопрос",
  "Другое",
];

export default function AiChatPanel({
  mode,
  context,
  greeting,
  placeholder = "Задайте вопрос...",
  accentColor = "var(--neon-blue)",
  className = "",
  inputClassName = "",
  showTicketButton = false,
}: AiChatPanelProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: "assistant", content: greeting },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [sending, setSending] = useState(false);
  const topicList = mode === "dashboard" ? TICKET_TOPICS_DASHBOARD : TICKET_TOPICS_SITE;
  const [formTopic, setFormTopic] = useState(topicList[0]);
  const [formName, setFormName] = useState(context?.name || "");
  const [formPhone, setFormPhone] = useState(context?.phone || "");
  const [formCity, setFormCity] = useState("");
  const [formAddress, setFormAddress] = useState(context?.address || "");
  const [formMessage, setFormMessage] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading, showForm]);

  const send = async () => {
    const text = input.trim();
    if (!text || loading) return;
    const next: ChatMessage[] = [...messages, { role: "user", content: text }];
    setMessages(next);
    setInput("");
    setLoading(true);

    try {
      const url = (funcUrls as Record<string, string>)["send-contact"];
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode,
          context,
          history: next.map(m => ({ role: m.role, content: m.content })),
        }),
      });
      const data = await res.json();
      const reply = data.reply || data.error || "Не удалось получить ответ. Попробуйте позже.";
      setMessages(prev => [...prev, { role: "assistant", content: reply }]);
    } catch {
      setMessages(prev => [...prev, { role: "assistant", content: "Ошибка сети. Проверьте соединение." }]);
    } finally {
      setLoading(false);
    }
  };

  const submitTicket = async () => {
    if (!formName.trim() || !formPhone.trim()) {
      toast.error("Укажите имя и телефон");
      return;
    }
    if (mode === "dashboard") {
      if (!formAddress.trim()) {
        toast.error("Укажите адрес");
        return;
      }
    } else if (!formCity.trim() || !formAddress.trim()) {
      toast.error("Укажите населённый пункт и адрес");
      return;
    }
    setSending(true);
    try {
      const url = (funcUrls as Record<string, string>)["send-contact"];
      const ctxLines = context
        ? [
            context.login ? `Логин: ${context.login}` : "",
            context.tariff ? `Тариф: ${context.tariff}` : "",
            context.balance ? `Баланс: ${context.balance} ₽` : "",
            context.status ? `Статус: ${context.status}` : "",
          ].filter(Boolean).join("\n")
        : "";
      const fullMessage = ctxLines
        ? `${formMessage}\n\n— Данные абонента —\n${ctxLines}`
        : formMessage;

      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "ticket",
          name: formName.trim(),
          phone: formPhone.trim(),
          city: formCity.trim(),
          address: formAddress.trim(),
          topic: formTopic,
          message: fullMessage,
        }),
      });
      const data = await res.json();
      if (data.ok) {
        toast.success("Заявка принята! Специалист скоро вас наберёт");
        const confirmText = data.reply
          ? data.reply
          : `Спасибо, ${formName}! Заявка по теме «${formTopic}» принята. Специалист свяжется с вами в рабочее время (пн–пт 9:00–20:00, сб–вс 10:00–18:00) по номеру ${formPhone}. Если оставили заявку вечером — позвоним утром в первую очередь.`;
        setMessages(prev => [
          ...prev,
          { role: "user", content: `📝 Оформил заявку: ${formTopic}${formCity ? `\nНас. пункт: ${formCity}` : ""}\nАдрес: ${formAddress}${formMessage ? `\n${formMessage}` : ""}` },
          { role: "assistant", content: confirmText },
        ]);
        setShowForm(false);
        setFormMessage("");
        setFormCity("");
      } else {
        toast.error(data.error || "Не удалось отправить заявку");
      }
    } catch {
      toast.error("Ошибка сети. Попробуйте ещё раз");
    } finally {
      setSending(false);
    }
  };

  const onKey = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  return (
    <div className={`flex flex-col h-full ${className}`}>
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            <div
              className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap ${
                m.role === "user" ? "text-[#0b0e17] font-medium" : "text-white/90"
              }`}
              style={
                m.role === "user"
                  ? { background: accentColor }
                  : { background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)" }
              }
            >
              {m.content}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div
              className="rounded-2xl px-4 py-2.5 text-sm text-white/60"
              style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)" }}
            >
              <span className="inline-flex gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-white/60 animate-bounce" style={{ animationDelay: "0ms" }} />
                <span className="w-1.5 h-1.5 rounded-full bg-white/60 animate-bounce" style={{ animationDelay: "150ms" }} />
                <span className="w-1.5 h-1.5 rounded-full bg-white/60 animate-bounce" style={{ animationDelay: "300ms" }} />
              </span>
            </div>
          </div>
        )}

        {showForm && (
          <div
            className="rounded-2xl p-4 space-y-3 animate-fade-in"
            style={{
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.1)",
            }}
          >
            <div className="flex items-center justify-between">
              <div className="font-semibold text-white text-sm flex items-center gap-2">
                <Icon name="FileText" size={16} style={{ color: accentColor }} />
                Новая заявка
              </div>
              <button
                onClick={() => setShowForm(false)}
                className="w-7 h-7 rounded-lg hover:bg-white/5 flex items-center justify-center text-white/50"
              >
                <Icon name="X" size={14} />
              </button>
            </div>

            <div>
              <label className="block text-xs text-white/50 mb-1.5">Тема</label>
              <select
                value={formTopic}
                onChange={e => setFormTopic(e.target.value)}
                className="w-full rounded-lg px-3 py-2 bg-white/5 border border-white/10 text-sm text-white focus:outline-none focus:border-white/30"
              >
                {topicList.map(t => (
                  <option key={t} value={t} style={{ background: "#1a1f2e" }}>{t}</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs text-white/50 mb-1.5">Имя</label>
                <input
                  value={formName}
                  onChange={e => setFormName(e.target.value)}
                  placeholder="Ваше имя"
                  className="w-full rounded-lg px-3 py-2 bg-white/5 border border-white/10 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-white/30"
                />
              </div>
              <div>
                <label className="block text-xs text-white/50 mb-1.5">Телефон</label>
                <input
                  value={formPhone}
                  onChange={e => setFormPhone(e.target.value)}
                  placeholder="+7 ___ ___ __ __"
                  className="w-full rounded-lg px-3 py-2 bg-white/5 border border-white/10 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-white/30"
                />
              </div>
            </div>

            {mode !== "dashboard" && (
              <div>
                <label className="block text-xs text-white/50 mb-1.5">Населённый пункт</label>
                <input
                  value={formCity}
                  onChange={e => setFormCity(e.target.value)}
                  placeholder="Напр. Оазис, Натухай, Энем"
                  className="w-full rounded-lg px-3 py-2 bg-white/5 border border-white/10 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-white/30"
                />
              </div>
            )}

            <div>
              <label className="block text-xs text-white/50 mb-1.5">Адрес установки</label>
              <input
                value={formAddress}
                onChange={e => setFormAddress(e.target.value)}
                placeholder="Улица, дом, квартира"
                className="w-full rounded-lg px-3 py-2 bg-white/5 border border-white/10 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-white/30"
              />
            </div>

            <div>
              <label className="block text-xs text-white/50 mb-1.5">Комментарий</label>
              <textarea
                value={formMessage}
                onChange={e => setFormMessage(e.target.value)}
                placeholder="Удобное время для звонка, пожелания, детали..."
                rows={3}
                className="w-full rounded-lg px-3 py-2 bg-white/5 border border-white/10 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-white/30 resize-none"
              />
            </div>

            <button
              onClick={submitTicket}
              disabled={sending}
              className="w-full py-2.5 rounded-xl text-sm font-semibold text-[#0b0e17] disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
              style={{ background: accentColor }}
            >
              {sending ? (
                <>
                  <Icon name="Loader2" size={14} className="animate-spin" />
                  Отправка...
                </>
              ) : (
                <>
                  <Icon name="Send" size={14} />
                  Отправить заявку
                </>
              )}
            </button>
          </div>
        )}
      </div>

      {showTicketButton && !showForm && (
        <div className="px-3 pt-2 pb-1 flex gap-2 flex-wrap">
          <button
            onClick={() => setShowForm(true)}
            className="text-xs px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 transition-all hover:scale-105"
            style={{
              background: "rgba(0,245,122,0.1)",
              border: "1px solid rgba(0,245,122,0.3)",
              color: "var(--neon-green)",
            }}
          >
            <Icon name="Wrench" size={12} />
            Оформить заявку
          </button>
        </div>
      )}

      <div className="p-3 border-t border-white/10 flex gap-2 items-end">
        <textarea
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={onKey}
          placeholder={placeholder}
          rows={1}
          className={`flex-1 resize-none rounded-xl px-3 py-2 bg-white/5 border border-white/10 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-white/30 ${inputClassName}`}
          style={{ maxHeight: "100px" }}
        />
        <button
          onClick={send}
          disabled={loading || !input.trim()}
          className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 text-[#0b0e17] disabled:opacity-40 disabled:cursor-not-allowed transition-all"
          style={{ background: accentColor }}
          aria-label="Отправить"
        >
          <Icon name="Send" size={16} />
        </button>
      </div>
    </div>
  );
}