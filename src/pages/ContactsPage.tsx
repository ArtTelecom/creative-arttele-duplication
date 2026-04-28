import { useState } from "react";
import Navbar from "@/components/Navbar";
import Icon from "@/components/ui/icon";
import PageHero from "@/components/ui/PageHero";
import { contacts, formTopics } from "@/data/contacts";
import { toast } from "sonner";
import funcUrls from "../../backend/func2url.json";

export default function ContactsPage() {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [topic, setTopic] = useState(formTopics[0] || "Подключение интернета");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);

  const submit = async () => {
    if (!name.trim() || !phone.trim()) {
      toast.error("Укажите имя и телефон");
      return;
    }
    setSending(true);
    try {
      const url = (funcUrls as Record<string, string>)["send-contact"];
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "ticket",
          name: name.trim(),
          phone: phone.trim(),
          city: "",
          address: "",
          topic,
          message: message.trim(),
        }),
      });
      const data = await res.json();
      if (data.ok) {
        toast.success("Заявка отправлена! Свяжемся в течение 15 минут");
        setName("");
        setPhone("");
        setMessage("");
        setTopic(formTopics[0] || "Подключение интернета");
      } else {
        toast.error(data.error || "Не удалось отправить заявку");
      }
    } catch {
      toast.error("Ошибка сети. Попробуйте ещё раз");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="min-h-screen mesh-bg noise font-sans text-white">
      <Navbar />
      <div className="pt-28 pb-20">
        <div className="max-w-5xl mx-auto px-6">

          <PageHero
            badge="Контакты"
            badgeIcon="MessageSquare"
            title="Свяжитесь"
            highlight="с нами"
            accent="blue"
          />



          <div className="grid lg:grid-cols-2 gap-10">
            <div className="space-y-4">
              {contacts.map((c, i) => {
                const inner = (
                  <>
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0" style={{ background: c.link ? "rgba(0,212,255,0.15)" : "rgba(0,212,255,0.1)", color: "var(--neon-blue)" }}>
                      <Icon name={c.icon} size={20} />
                    </div>
                    <div className="flex-1">
                      <div className="text-white/40 text-xs mb-0.5">{c.label}</div>
                      <div className="text-white font-semibold">{c.value}</div>
                      <div className="text-white/30 text-xs">{c.sub}</div>
                    </div>
                    {c.link && (
                      <div className="shrink-0 px-3 py-1.5 rounded-lg text-xs font-bold" style={{ background: "linear-gradient(135deg, var(--neon-blue), var(--neon-green))", color: "#0b0e17" }}>
                        Написать →
                      </div>
                    )}
                  </>
                );
                return c.link ? (
                  <a key={i} href={c.link} target="_blank" rel="noopener noreferrer" className="flex items-center gap-4 glass-card rounded-2xl p-5 border border-white/10 card-hover cursor-pointer no-underline">
                    {inner}
                  </a>
                ) : (
                  <div key={i} className="flex items-center gap-4 glass-card rounded-2xl p-5 border border-white/5 card-hover">
                    {inner}
                  </div>
                );
              })}
            </div>

            <div className="glass-card rounded-3xl p-8 border border-white/5">
              <h2 className="font-montserrat font-bold text-xl mb-6 text-white">Оставить заявку</h2>
              <div className="space-y-4">
                <div>
                  <label className="text-xs text-white/40 mb-1.5 block">Ваше имя</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Алексей Смирнов"
                    className="w-full px-4 py-3 rounded-xl text-white text-sm placeholder-white/20 focus:outline-none transition-colors"
                    style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}
                  />
                </div>
                <div>
                  <label className="text-xs text-white/40 mb-1.5 block">Телефон</label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+7 (999) 000-00-00"
                    className="w-full px-4 py-3 rounded-xl text-white text-sm placeholder-white/20 focus:outline-none transition-colors"
                    style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}
                  />
                </div>
                <div>
                  <label className="text-xs text-white/40 mb-1.5 block">Тема</label>
                  <select
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl text-white text-sm focus:outline-none transition-colors"
                    style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}
                  >
                    {formTopics.map(t => (
                      <option key={t} value={t} style={{ background: "#111827" }}>{t}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-white/40 mb-1.5 block">Сообщение</label>
                  <textarea
                    rows={4}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Опишите ваш вопрос..."
                    className="w-full px-4 py-3 rounded-xl text-white text-sm placeholder-white/20 focus:outline-none transition-colors resize-none"
                    style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}
                  />
                </div>
                <button
                  onClick={submit}
                  disabled={sending}
                  className="w-full py-3.5 rounded-xl text-[#0b0e17] font-bold text-sm neon-glow-btn disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  style={{ background: "linear-gradient(135deg, var(--neon-blue), var(--neon-green))" }}
                >
                  {sending ? (
                    <>
                      <Icon name="Loader2" size={16} className="animate-spin" />
                      Отправка...
                    </>
                  ) : (
                    "Отправить заявку"
                  )}
                </button>
              </div>
            </div>
          </div>



        </div>
      </div>
    </div>
  );
}
