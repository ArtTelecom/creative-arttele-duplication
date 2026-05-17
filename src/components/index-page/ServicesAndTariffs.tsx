import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Icon from "@/components/ui/icon";
import tariffs from "@/data/tariffs";
import locations from "@/data/locations";

const services = [
  { icon: "Zap", title: "Домашний интернет", desc: "Оптоволокно прямо в квартиру. Скорость до 1 Гбит/с без скачков и обрывов — смотрите, играйте, работайте.", tag: "До 1 Гбит/с", color: "blue" },
  { icon: "Building2", title: "Бизнес-интернет", desc: "Выделенный канал с гарантированной скоростью и SLA 99.9%. Персональный менеджер и приоритетная поддержка.", tag: "SLA 99.9%", color: "green" },
  { icon: "Tv", title: "Цифровое ТВ", desc: "450+ каналов в HD и 4K качестве. Запись эфира, пауза и перемотка прямого эфира на любом устройстве.", tag: "450+ каналов", color: "purple" },
  { icon: "Phone", title: "IP-телефония", desc: "Городской номер, бесплатные звонки внутри сети, конференц-связь и детализация в личном кабинете.", tag: "Безлимит внутри", color: "blue" },
  { icon: "Shield", title: "Антивирус и защита", desc: "Защита от вирусов, фишинга и нежелательной рекламы на уровне сети. Работает на всех устройствах.", tag: "Всегда включён", color: "green" },
  { icon: "Wifi", title: "Wi-Fi роутер", desc: "Современный роутер Wi-Fi 6 в аренду или подарок при подключении к тарифу Максимум.", tag: "Wi-Fi 6", color: "purple" },
];

export default function ServicesAndTariffs() {
  const [activeTariffTab, setActiveTariffTab] = useState<"home" | "business">("home");
  const navigate = useNavigate();

  return (
    <>
      {/* ─── LOCATIONS WIDGET ─── */}
      <section className="py-16 relative">
        <div className="absolute inset-0 grid-lines opacity-10 pointer-events-none" />
        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-semibold mb-3 tracking-wider uppercase" style={{ borderColor: "rgba(0,245,122,0.3)", background: "rgba(0,245,122,0.05)", color: "var(--neon-green)" }}>
                <Icon name="MapPin" size={12} /> Ваш район
              </div>
              <h2 className="font-montserrat font-black text-3xl md:text-4xl">
                Тарифы и акции<br /><span className="gradient-text-green">для вашего посёлка</span>
              </h2>
            </div>
            <Link to="/locations" className="flex items-center gap-2 text-sm font-semibold shrink-0 hover:gap-3 transition-all" style={{ color: "var(--neon-blue)" }}>
              Все населённые пункты <Icon name="ArrowRight" size={15} />
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {locations.map(loc => (
              <button
                key={loc.slug}
                onClick={() => navigate(`/location/${loc.slug}`)}
                className="group glass-card rounded-2xl p-4 border border-white/5 text-left flex flex-col gap-2 transition-all duration-200 hover:scale-[1.03]"
                style={{ cursor: "pointer" }}
                onMouseEnter={e => (e.currentTarget.style.borderColor = "rgba(0,212,255,0.3)")}
                onMouseLeave={e => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.05)")}
              >
                <div className="flex items-center justify-between">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: "rgba(0,212,255,0.08)", color: "var(--neon-blue)" }}>
                    <Icon name="MapPin" size={14} />
                  </div>
                  {loc.promos.length > 0 && (
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full" style={{ background: "rgba(0,245,122,0.15)", color: "var(--neon-green)" }}>
                      акция
                    </span>
                  )}
                </div>
                <div className="font-semibold text-white text-sm leading-tight group-hover:text-[#00d4ff] transition-colors">
                  {loc.name}
                </div>
                <div className="text-white/30 text-xs">
                  {loc.tariffs.length} тарифа
                </div>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ─── SERVICES ─── */}
      <section id="services" className="py-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-14">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-semibold mb-4 tracking-wider uppercase" style={{ borderColor: "rgba(0,245,122,0.3)", background: "rgba(0,245,122,0.05)", color: "var(--neon-green)" }}>
              <Icon name="Layers" size={12} /> Наши услуги
            </div>
            <h2 className="font-montserrat font-black text-4xl md:text-5xl mb-4">
              Всё что нужно —<br /><span className="gradient-text-full">в одном месте</span>
            </h2>
            <p className="text-white/50 text-lg max-w-xl mx-auto">Интернет, ТВ, телефония и защита — управляй всем из одного личного кабинета</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {services.map((svc, i) => {
              const clr = svc.color === "blue" ? "rgba(0,212,255,0.3)" : svc.color === "green" ? "rgba(0,245,122,0.3)" : "rgba(168,85,247,0.3)";
              const bg = svc.color === "blue" ? "rgba(0,212,255,0.08)" : svc.color === "green" ? "rgba(0,245,122,0.08)" : "rgba(168,85,247,0.08)";
              const textClr = svc.color === "blue" ? "var(--neon-blue)" : svc.color === "green" ? "var(--neon-green)" : "rgb(192,132,252)";
              return (
                <div key={i} className="glass-card rounded-2xl p-6 card-hover cursor-pointer group border border-white/5" style={{ transition: "border-color 0.3s" }}
                  onMouseEnter={e => (e.currentTarget.style.borderColor = clr)}
                  onMouseLeave={e => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.05)")}
                >
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4" style={{ background: bg, color: textClr }}>
                    <Icon name={svc.icon} size={22} />
                  </div>
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-semibold text-lg text-white">{svc.title}</h3>
                    <span className="text-xs px-2 py-0.5 rounded-full font-medium ml-2 shrink-0" style={{ background: bg, color: textClr }}>{svc.tag}</span>
                  </div>
                  <p className="text-white/50 text-sm leading-relaxed">{svc.desc}</p>
                  <div className="mt-4 flex items-center gap-1 text-sm font-semibold text-white/30 group-hover:text-[#00d4ff] transition-colors">
                    Подробнее <Icon name="ArrowRight" size={14} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ─── TARIFFS ─── */}
      <section id="tariffs" className="py-20 relative">
        <div className="absolute inset-0 grid-lines opacity-20 pointer-events-none" />
        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="text-center mb-14">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-semibold mb-4 tracking-wider uppercase" style={{ borderColor: "rgba(0,212,255,0.3)", background: "rgba(0,212,255,0.05)", color: "var(--neon-blue)" }}>
              <Icon name="Tag" size={12} /> Тарифы
            </div>
            <h2 className="font-montserrat font-black text-4xl md:text-5xl mb-4">
              Честные цены,<br /><span className="gradient-text-blue">без скрытых платежей</span>
            </h2>
            <div className="inline-flex mt-6 p-1 rounded-xl bg-white/5 border border-white/10">
              {(["home", "business"] as const).map(tab => (
                <button key={tab} onClick={() => setActiveTariffTab(tab)}
                  className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${activeTariffTab === tab ? "tab-active" : "text-white/50 hover:text-white"}`}>
                  {tab === "home" ? "Для дома" : "Для бизнеса"}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
            {tariffs.map((t, i) => {
              const clr = t.color === "blue" ? "var(--neon-blue)" : t.color === "green" ? "var(--neon-green)" : "rgb(192,132,252)";
              return (
                <div key={i} className={`rounded-2xl p-6 relative ${t.popular ? "price-popular" : "glass-card border border-white/5"}`}>
                  {t.popular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full text-[#0b0e17] text-xs font-black tracking-wider" style={{ background: "linear-gradient(135deg, var(--neon-blue), var(--neon-green))" }}>
                      ПОПУЛЯРНЫЙ
                    </div>
                  )}
                  <div className="mb-4">
                    <div className="text-white/50 text-sm mb-1">{t.name}</div>
                    <div className="flex items-baseline gap-1">
                      <span className="font-montserrat font-black text-5xl text-white">{t.price}</span>
                      <span className="text-white/40 text-lg">₽/мес</span>
                    </div>
                    <div className="text-2xl font-montserrat font-bold mt-1" style={{ color: clr }}>
                      {parseInt(t.speed) >= 1000
                        ? `${(parseInt(t.speed) / 1000).toString().replace(/\.0$/, "")} Гбит/с`
                        : `${t.speed} Мбит/с`}
                    </div>
                  </div>
                  <div className="section-divider mb-4" />
                  <ul className="space-y-2.5 mb-6">
                    {t.features.map((f, fi) => (
                      <li key={fi} className="flex items-center gap-2.5 text-sm text-white/70">
                        <Icon name="Check" size={14} style={{ color: clr }} /> {f}
                      </li>
                    ))}
                  </ul>
                  <Link to="/contacts" className={`w-full py-3 rounded-xl font-bold text-sm transition-all text-center block ${t.popular ? "text-[#0b0e17] neon-glow-btn" : "border border-white/15 text-white hover:border-[rgba(0,212,255,0.4)] hover:bg-[rgba(0,212,255,0.05)]"}`}
                    style={t.popular ? { background: "linear-gradient(135deg, var(--neon-blue), var(--neon-green))" } : {}}>
                    Подключить
                  </Link>
                </div>
              );
            })}
          </div>
          <p className="text-center text-white/30 text-xs mt-8">Все тарифы включают безлимитный трафик. Подключение бесплатно при заключении договора.</p>
        </div>
      </section>

      {/* ─── SPEED TEST BANNER ─── */}
      <section className="py-8 px-6">
        <div className="max-w-7xl mx-auto">
          <Link to="/speedtest" className="block group">
            <div className="relative rounded-3xl overflow-hidden px-8 py-8 md:px-14 md:py-10 flex flex-col md:flex-row items-center justify-between gap-6"
              style={{ background: "linear-gradient(120deg, rgba(0,212,255,0.08) 0%, rgba(168,85,247,0.08) 50%, rgba(0,245,122,0.08) 100%)", border: "1px solid rgba(0,212,255,0.15)" }}>
              {/* glow blobs */}
              <div className="absolute left-0 top-0 w-64 h-64 rounded-full pointer-events-none" style={{ background: "rgba(0,212,255,0.07)", filter: "blur(80px)" }} />
              <div className="absolute right-0 bottom-0 w-48 h-48 rounded-full pointer-events-none" style={{ background: "rgba(0,245,122,0.07)", filter: "blur(80px)" }} />

              <div className="relative z-10 flex items-center gap-5">
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0" style={{ background: "linear-gradient(135deg, rgba(0,212,255,0.2), rgba(0,245,122,0.1))", border: "1px solid rgba(0,212,255,0.25)" }}>
                  <Icon name="Gauge" size={28} style={{ color: "var(--neon-blue)" }} />
                </div>
                <div>
                  <div className="font-montserrat font-black text-xl md:text-2xl text-white mb-1">Проверь скорость своего интернета</div>
                  <div className="text-white/45 text-sm">Бесплатный тест — результат за 10 секунд. Пинг, загрузка и отдача.</div>
                </div>
              </div>

              <div className="relative z-10 shrink-0 flex items-center gap-3 px-6 py-3 rounded-2xl font-bold text-sm transition-all duration-300 group-hover:scale-105"
                style={{ background: "linear-gradient(135deg, var(--neon-blue), var(--neon-green))", color: "#0b0e17", boxShadow: "0 0 24px rgba(0,212,255,0.2)" }}>
                <Icon name="Zap" size={16} />
                Начать тест
              </div>
            </div>
          </Link>
        </div>
      </section>
    </>
  );
}