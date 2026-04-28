import { useState } from "react";
import { Link } from "react-router-dom";
import Icon from "@/components/ui/icon";
import { toast } from "sonner";
import funcUrls from "../../../backend/func2url.json";

export default function LkAndFooter() {
  const [lkTab, setLkTab] = useState<"dashboard" | "bills" | "support">("dashboard");
  const [lkOpen, setLkOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loginForm, setLoginForm] = useState({ login: "", pass: "" });

  const [ticket, setTicket] = useState({
    name: "",
    phone: "",
    city: "",
    address: "",
    topic: "Подключение интернета",
    message: "",
  });
  const [sending, setSending] = useState(false);

  const submitTicket = async () => {
    if (!ticket.name.trim() || !ticket.phone.trim()) {
      toast.error("Укажите имя и телефон");
      return;
    }
    if (!ticket.city.trim() || !ticket.address.trim()) {
      toast.error("Укажите населённый пункт и адрес");
      return;
    }
    setSending(true);
    try {
      const res = await fetch(funcUrls["send-contact"], {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: "ticket", ...ticket }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Не удалось отправить заявку");
        return;
      }
      toast.success("Заявка принята! Специалист свяжется с вами в рабочее время");
      setTicket({ name: "", phone: "", city: "", address: "", topic: "Подключение интернета", message: "" });
    } catch {
      toast.error("Ошибка сети, попробуйте ещё раз");
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      {/* ─── CONTACTS ─── */}
      <section id="contacts" className="py-20 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none" style={{ background: "linear-gradient(135deg, rgba(0,212,255,0.05), transparent, rgba(0,245,122,0.05))" }} />
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-14">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-semibold mb-4 tracking-wider uppercase" style={{ borderColor: "rgba(0,212,255,0.3)", background: "rgba(0,212,255,0.05)", color: "var(--neon-blue)" }}>
              <Icon name="MessageSquare" size={12} /> Контакты
            </div>
            <h2 className="font-montserrat font-black text-4xl md:text-5xl">Свяжитесь<br /><span className="gradient-text-blue">с нами</span></h2>
          </div>
          <div className="grid lg:grid-cols-2 gap-10">
            <div className="space-y-4">
              {[
                { icon: "Phone", label: "Единый номер", val: "+7 902 404-88-50", sub: "Бесплатно по России" },
                { icon: "Mail", label: "Email", val: "art888018@mail.ru", sub: "Ответим в течение 2 часов" },
                { icon: "MapPin", label: "Головной офис", val: "Москва, ул. Цифровая, 1", sub: "Пн–Пт 9:00–18:00" },
                { icon: "MessageCircle", label: "Онлайн-чат", val: "В личном кабинете", sub: "24/7 без ожидания" },
              ].map((c, i) => (
                <div key={i} className="flex items-center gap-4 glass-card rounded-2xl p-4 border border-white/5 card-hover">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0" style={{ background: "rgba(0,212,255,0.1)", color: "var(--neon-blue)" }}>
                    <Icon name={c.icon} size={20} />
                  </div>
                  <div>
                    <div className="text-white/40 text-xs mb-0.5">{c.label}</div>
                    <div className="text-white font-semibold text-sm">{c.val}</div>
                    <div className="text-white/30 text-xs">{c.sub}</div>
                  </div>
                </div>
              ))}
            </div>

            <div className="glass-card rounded-3xl p-8 border border-white/5">
              <h3 className="font-montserrat font-bold text-xl mb-6 text-white">Оставить заявку</h3>
              <div className="space-y-4">
                <div>
                  <label className="text-xs text-white/40 mb-1.5 block">Ваше имя</label>
                  <input type="text" value={ticket.name} onChange={(e) => setTicket({ ...ticket, name: e.target.value })} placeholder="Алексей Смирнов" className="w-full px-4 py-3 rounded-xl text-white text-sm placeholder-white/20 focus:outline-none transition-colors" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }} />
                </div>
                <div>
                  <label className="text-xs text-white/40 mb-1.5 block">Телефон</label>
                  <input type="tel" value={ticket.phone} onChange={(e) => setTicket({ ...ticket, phone: e.target.value })} placeholder="+7 (999) 000-00-00" className="w-full px-4 py-3 rounded-xl text-white text-sm placeholder-white/20 focus:outline-none transition-colors" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }} />
                </div>
                <div>
                  <label className="text-xs text-white/40 mb-1.5 block">Населённый пункт</label>
                  <input type="text" value={ticket.city} onChange={(e) => setTicket({ ...ticket, city: e.target.value })} placeholder="Напр. Оазис, Натухай, Энем" className="w-full px-4 py-3 rounded-xl text-white text-sm placeholder-white/20 focus:outline-none transition-colors" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }} />
                </div>
                <div>
                  <label className="text-xs text-white/40 mb-1.5 block">Адрес установки</label>
                  <input type="text" value={ticket.address} onChange={(e) => setTicket({ ...ticket, address: e.target.value })} placeholder="Улица, дом, квартира" className="w-full px-4 py-3 rounded-xl text-white text-sm placeholder-white/20 focus:outline-none transition-colors" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }} />
                </div>
                <div>
                  <label className="text-xs text-white/40 mb-1.5 block">Тема</label>
                  <select value={ticket.topic} onChange={(e) => setTicket({ ...ticket, topic: e.target.value })} className="w-full px-4 py-3 rounded-xl text-white text-sm focus:outline-none transition-colors" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}>
                    <option value="Подключение интернета" style={{ background: "#111827" }}>Подключение интернета</option>
                    <option value="Техническая поддержка" style={{ background: "#111827" }}>Техническая поддержка</option>
                    <option value="Вопрос по счёту" style={{ background: "#111827" }}>Вопрос по счёту</option>
                    <option value="Другое" style={{ background: "#111827" }}>Другое</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-white/40 mb-1.5 block">Комментарий</label>
                  <textarea rows={3} value={ticket.message} onChange={(e) => setTicket({ ...ticket, message: e.target.value })} placeholder="Удобное время для звонка, пожелания, детали..." className="w-full px-4 py-3 rounded-xl text-white text-sm placeholder-white/20 focus:outline-none transition-colors resize-none" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }} />
                </div>
                <button onClick={submitTicket} disabled={sending} className="w-full py-3.5 rounded-xl text-[#0b0e17] font-bold text-sm neon-glow-btn disabled:opacity-60 disabled:cursor-not-allowed" style={{ background: "linear-gradient(135deg, var(--neon-blue), var(--neon-green))" }}>
                  {sending ? "Отправка..." : "Отправить заявку"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── FOOTER ─── */}
      <footer className="border-t border-white/5 py-12">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-10">
            <div className="col-span-2 md:col-span-1">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "linear-gradient(135deg, var(--neon-blue), var(--neon-green))" }}>
                  <Icon name="Wifi" size={16} className="text-[#0b0e17]" />
                </div>
                <span className="font-montserrat font-black text-xl">
                  <span style={{ color: "var(--neon-blue)" }}>АртТелеком</span><span className="text-white"> Юг</span>
                </span>
              </div>
              <p className="text-white/30 text-sm leading-relaxed mb-4">Быстрый интернет и надёжная связь для дома и бизнеса с 2012 года.</p>
              <div className="flex gap-3">
                {["VK", "TG", "YT"].map(s => (
                  <a key={s} href="#" className="w-8 h-8 rounded-lg border border-white/10 flex items-center justify-center text-white/40 hover:text-[#00d4ff] hover:border-[rgba(0,212,255,0.3)] transition-all text-xs font-bold" style={{ background: "rgba(255,255,255,0.05)" }}>{s}</a>
                ))}
              </div>
            </div>
            {[
              { title: "Услуги", links: [
                { label: "Домашний интернет", href: "/tariffs" },
                { label: "Бизнес-интернет", href: "/business" },
                { label: "Видеонаблюдение", href: "/video" },
                { label: "Проверка скорости", href: "/speedtest" },
                { label: "Зоны покрытия", href: "/locations" },
              ] },
              { title: "Компания", links: [
                { label: "О нас", href: "/about" },
                { label: "Блог", href: "/blog" },
                { label: "Контакты", href: "/contacts" },
                { label: "Публичная оферта", href: "/offer" },
              ] },
              { title: "Поддержка", links: [
                { label: "Личный кабинет", href: "/login" },
                { label: "FAQ", href: "/faq" },
                { label: "Тех. поддержка", href: "/contacts" },
              ] },
            ].map((col, i) => (
              <div key={i}>
                <div className="text-white/70 font-semibold text-sm mb-4">{col.title}</div>
                <ul className="space-y-2">
                  {col.links.map(link => (
                    <li key={link.label}><Link to={link.href} className="text-white/30 text-sm hover:text-[#00d4ff] transition-colors">{link.label}</Link></li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="section-divider mb-6" />
          <div className="flex flex-col md:flex-row items-center justify-between gap-3 text-xs text-white/20">
            <span>© 2026 АртТелеком Юг. Все права защищены.</span>
            <div className="flex gap-6 flex-wrap justify-center">
              {[
                { label: "Публичная оферта", href: "/offer" },
              ].map(t => (
                <Link key={t.label} to={t.href} className="hover:text-white/50 transition-colors">{t.label}</Link>
              ))}
            </div>
          </div>
        </div>
      </footer>

      {/* ─── ЛИЧНЫЙ КАБИНЕТ MODAL ─── */}
      {lkOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 backdrop-blur-sm" style={{ background: "rgba(0,0,0,0.7)" }} onClick={() => setLkOpen(false)} />
          <div className="relative w-full max-w-2xl glass-card rounded-3xl border overflow-hidden animate-scale-in" style={{ borderColor: "rgba(0,212,255,0.2)" }}>
            <div className="flex items-center justify-between p-6 border-b border-white/5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "linear-gradient(135deg, var(--neon-blue), var(--neon-green))" }}>
                  <Icon name="User" size={18} className="text-[#0b0e17]" />
                </div>
                <div>
                  <div className="font-bold text-white">Личный кабинет</div>
                  <div className="text-xs text-white/30">АртТелеком Юг</div>
                </div>
              </div>
              <button onClick={() => setLkOpen(false)} className="text-white/30 hover:text-white transition-colors">
                <Icon name="X" size={20} />
              </button>
            </div>

            {!isLoggedIn ? (
              <div className="p-8">
                <h3 className="font-montserrat font-black text-2xl mb-2 text-white">Войдите в аккаунт</h3>
                <p className="text-white/40 text-sm mb-6">Управляйте подпиской, счетами и поддержкой</p>
                <div className="space-y-4">
                  <div>
                    <label className="text-xs text-white/40 mb-1.5 block">Логин или телефон</label>
                    <input type="text" placeholder="+7 (999) 000-00-00" value={loginForm.login} onChange={e => setLoginForm(f => ({ ...f, login: e.target.value }))} className="w-full px-4 py-3 rounded-xl text-white text-sm placeholder-white/20 focus:outline-none transition-colors" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }} />
                  </div>
                  <div>
                    <label className="text-xs text-white/40 mb-1.5 block">Пароль</label>
                    <input type="password" placeholder="••••••••" value={loginForm.pass} onChange={e => setLoginForm(f => ({ ...f, pass: e.target.value }))} className="w-full px-4 py-3 rounded-xl text-white text-sm placeholder-white/20 focus:outline-none transition-colors" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }} />
                  </div>
                  <button onClick={() => setIsLoggedIn(true)} className="w-full py-3.5 rounded-xl text-[#0b0e17] font-bold text-sm neon-glow-btn" style={{ background: "linear-gradient(135deg, var(--neon-blue), var(--neon-green))" }}>
                    Войти
                  </button>
                  <div className="flex items-center justify-between text-xs text-white/30">
                    <a href="#" className="hover:text-[#00d4ff] transition-colors">Забыл пароль</a>
                    <a href="#" className="hover:text-[#00f57a] transition-colors">Зарегистрироваться</a>
                  </div>
                </div>
              </div>
            ) : (
              <div>
                <div className="flex border-b border-white/5">
                  {(["dashboard", "bills", "support"] as const).map(tab => (
                    <button key={tab} onClick={() => setLkTab(tab)} className={`flex-1 py-3 text-sm font-semibold transition-all ${lkTab === tab ? "border-b-2 border-[#00d4ff] bg-[rgba(0,212,255,0.05)]" : "text-white/40 hover:text-white"}`} style={lkTab === tab ? { color: "var(--neon-blue)" } : {}}>
                      {tab === "dashboard" ? "Главная" : tab === "bills" ? "Счета" : "Поддержка"}
                    </button>
                  ))}
                </div>

                <div className="p-6">
                  {lkTab === "dashboard" && (
                    <div className="space-y-4">
                      <div className="flex items-center gap-4 p-4 rounded-2xl border" style={{ background: "rgba(0,212,255,0.05)", borderColor: "rgba(0,212,255,0.2)" }}>
                        <div className="w-12 h-12 rounded-xl flex items-center justify-center font-montserrat font-black text-[#0b0e17]" style={{ background: "linear-gradient(135deg, var(--neon-blue), var(--neon-green))" }}>АС</div>
                        <div>
                          <div className="font-bold text-white">Алексей Смирнов</div>
                          <div className="text-xs text-white/40">Лицевой счёт: 1234567</div>
                        </div>
                        <div className="ml-auto text-right">
                          <div className="text-xs text-white/40">Баланс</div>
                          <div className="font-montserrat font-black text-xl gradient-text-green">+486 ₽</div>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="p-4 rounded-2xl border border-white/5" style={{ background: "rgba(255,255,255,0.03)" }}>
                          <div className="text-xs text-white/40 mb-1">Тариф</div>
                          <div className="font-semibold text-white">Оптима</div>
                          <div className="text-sm" style={{ color: "var(--neon-blue)" }}>300 Мбит/с</div>
                        </div>
                        <div className="p-4 rounded-2xl border border-white/5" style={{ background: "rgba(255,255,255,0.03)" }}>
                          <div className="text-xs text-white/40 mb-1">Статус</div>
                          <div className="flex items-center gap-1.5">
                            <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: "var(--neon-green)" }} />
                            <span className="font-semibold" style={{ color: "var(--neon-green)" }}>Активен</span>
                          </div>
                          <div className="text-white/30 text-xs">до 11 мая 2026</div>
                        </div>
                      </div>
                      <button className="w-full py-3 rounded-xl font-semibold text-sm hover:bg-[rgba(0,212,255,0.05)] transition-all" style={{ border: "1px solid rgba(0,212,255,0.3)", color: "var(--neon-blue)" }}>
                        Сменить тариф
                      </button>
                    </div>
                  )}

                  {lkTab === "bills" && (
                    <div className="space-y-3">
                      {[{ month: "Апрель 2026", paid: true }, { month: "Март 2026", paid: true }].map((b, i) => (
                        <div key={i} className="flex items-center justify-between p-3 rounded-xl border border-white/5" style={{ background: "rgba(255,255,255,0.03)" }}>
                          <div>
                            <div className="text-sm font-semibold text-white">{b.month}</div>
                            <div className="text-xs text-white/30">Тариф Оптима</div>
                          </div>
                          <span className="text-sm font-bold" style={{ color: "var(--neon-green)" }}>Оплачен</span>
                        </div>
                      ))}
                      <div className="flex items-center justify-between p-3 rounded-xl border" style={{ background: "rgba(249,115,22,0.1)", borderColor: "rgba(249,115,22,0.2)" }}>
                        <div>
                          <div className="text-sm font-semibold text-white">Май 2026</div>
                          <div className="text-xs text-white/30">649 ₽</div>
                        </div>
                        <button className="px-3 py-1 rounded-lg text-[#0b0e17] font-bold text-xs" style={{ background: "linear-gradient(135deg, var(--neon-blue), var(--neon-green))" }}>Оплатить</button>
                      </div>
                    </div>
                  )}

                  {lkTab === "support" && (
                    <div className="space-y-4">
                      <div className="p-4 rounded-2xl flex items-center gap-3 border" style={{ background: "rgba(0,245,122,0.05)", borderColor: "rgba(0,245,122,0.2)" }}>
                        <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: "var(--neon-green)" }} />
                        <span className="text-sm text-white/70">Нет активных заявок</span>
                      </div>
                      <div className="space-y-2">
                        {[{ icon: "MessageCircle", label: "Онлайн-чат", desc: "Ответим за 2 минуты" }, { icon: "Phone", label: "+7 902 404-88-50", desc: "Бесплатно" }, { icon: "Mail", label: "art888018@mail.ru", desc: "Ответим за 2 часа" }].map((c, i) => (
                          <button key={i} className="w-full flex items-center gap-3 p-3 rounded-xl border border-white/5 hover:border-[rgba(0,212,255,0.3)] transition-all text-left" style={{ background: "rgba(255,255,255,0.03)" }}>
                            <Icon name={c.icon} size={16} style={{ color: "var(--neon-blue)" }} className="shrink-0" />
                            <div>
                              <div className="text-sm font-semibold text-white">{c.label}</div>
                              <div className="text-xs text-white/30">{c.desc}</div>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="mt-4 pt-4 border-t border-white/5 flex justify-end">
                    <button onClick={() => { setIsLoggedIn(false); setLoginForm({ login: "", pass: "" }); }} className="text-xs text-white/30 hover:text-white/60 transition-colors flex items-center gap-1">
                      <Icon name="LogOut" size={12} /> Выйти
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}