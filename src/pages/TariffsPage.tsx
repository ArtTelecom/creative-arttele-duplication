import { useState } from "react";
import { Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Icon from "@/components/ui/icon";
import PageHero from "@/components/ui/PageHero";
import tariffs from "@/data/tariffs";
import businessTariffs from "@/data/business-tariffs";

const SOCIAL_ICONS = [
  { name: "WhatsApp",  src: "https://cdn.jsdelivr.net/gh/simple-icons/simple-icons/icons/whatsapp.svg",  bg: "#25D366" },
  { name: "YouTube",   src: "https://cdn.jsdelivr.net/gh/simple-icons/simple-icons/icons/youtube.svg",   bg: "#FF0000" },
  { name: "Telegram",  src: "https://cdn.jsdelivr.net/gh/simple-icons/simple-icons/icons/telegram.svg",  bg: "#26A5E4" },
  { name: "Viber",     src: "https://cdn.jsdelivr.net/gh/simple-icons/simple-icons/icons/viber.svg",     bg: "#7360F2" },
  { name: "Instagram", src: "https://cdn.jsdelivr.net/gh/simple-icons/simple-icons/icons/instagram.svg", bg: "#E4405F" },
  { name: "Threads",   src: "https://cdn.jsdelivr.net/gh/simple-icons/simple-icons/icons/threads.svg",   bg: "#101010" },
];

type Tab = "home" | "business";

const colorMap = {
  blue:   { border: "rgba(0,212,255,0.3)",  bg: "rgba(0,212,255,0.08)",  text: "var(--neon-blue)",  badge: "rgba(0,212,255,0.15)" },
  green:  { border: "rgba(0,245,122,0.3)",  bg: "rgba(0,245,122,0.08)",  text: "var(--neon-green)", badge: "rgba(0,245,122,0.15)" },
  purple: { border: "rgba(168,85,247,0.3)", bg: "rgba(168,85,247,0.08)", text: "#a855f7",            badge: "rgba(168,85,247,0.15)" },
};

export default function TariffsPage() {
  const [tab, setTab] = useState<Tab>("home");

  return (
    <div className="min-h-screen mesh-bg noise font-sans text-white">
      <Navbar />
      <div className="pt-28 pb-20">
        <div className="max-w-7xl mx-auto px-6">

          <PageHero
            badge="Тарифы"
            badgeIcon="Zap"
            title="Выберите"
            highlight="свой тариф"
            subtitle="Безлимитный трафик, без скрытых платежей"
            accent="blue"
          />



          {/* Tab switcher */}
          <div className="flex justify-center mb-12">
            <div className="flex p-1 rounded-2xl gap-1" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}>
              <button
                onClick={() => setTab("home")}
                className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all duration-200 ${tab === "home" ? "text-[#0b0e17]" : "text-white/50 hover:text-white"}`}
                style={tab === "home" ? { background: "linear-gradient(135deg, var(--neon-blue), var(--neon-green))" } : {}}
              >
                <Icon name="Home" size={15} /> Домашний
              </button>
              <button
                onClick={() => setTab("business")}
                className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all duration-200 ${tab === "business" ? "text-[#0b0e17]" : "text-white/50 hover:text-white"}`}
                style={tab === "business" ? { background: "linear-gradient(135deg, var(--neon-blue), var(--neon-green))" } : {}}
              >
                <Icon name="Building2" size={15} /> Бизнес
              </button>
            </div>
          </div>

          {/* Home tariffs */}
          {tab === "home" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {tariffs.map((t, i) => {
                const c = colorMap[t.color];
                return (
                  <div
                    key={i}
                    className="glass-card rounded-3xl p-6 border flex flex-col relative transition-all duration-300 hover:scale-[1.02]"
                    style={{ borderColor: t.popular ? c.border : "rgba(255,255,255,0.07)", background: t.popular ? c.bg : "" }}
                  >
                    {t.popular && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full text-xs font-bold text-[#0b0e17]" style={{ background: "linear-gradient(135deg, var(--neon-blue), var(--neon-green))" }}>
                        Популярный
                      </div>
                    )}
                    <div className="mb-4">
                      <div className="text-white/50 text-xs uppercase tracking-widest mb-1">{t.name}</div>
                      <div className="font-montserrat font-black text-4xl" style={{ color: c.text }}>
                        {Number(t.speed) >= 2000
                          ? <>{(Number(t.speed) / 1000).toFixed(1)} <span className="text-lg font-semibold text-white/40">Гбит/с</span></>
                          : Number(t.speed) >= 1000
                            ? <>1 <span className="text-lg font-semibold text-white/40">Гбит/с</span></>
                            : <>{t.speed} <span className="text-lg font-semibold text-white/40">Мбит/с</span></>
                        }
                      </div>
                    </div>
                    <div className="mb-6">
                      <span className="font-montserrat font-black text-3xl text-white">{t.price} ₽</span>
                      <span className="text-white/30 text-sm"> / мес</span>
                    </div>
                    <ul className="space-y-2 flex-1 mb-6">
                      {t.features.map((f, fi) =>
                        f === "__social__" ? (
                          <li key={fi} className="pt-1">
                            <div className="text-white/40 text-xs mb-2">Включены без ограничений:</div>
                            <div className="flex items-center gap-2 flex-wrap">
                              {SOCIAL_ICONS.map((s) => (
                                <div key={s.name} title={s.name} className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: s.bg }}>
                                  <img src={s.src} alt={s.name} className="w-4 h-4 invert" />
                                </div>
                              ))}
                            </div>
                          </li>
                        ) : (
                          <li key={fi} className="flex items-center gap-2 text-sm text-white/70">
                            <Icon name="Check" size={14} style={{ color: c.text }} className="shrink-0" />
                            {f}
                          </li>
                        )
                      )}
                    </ul>
                    <Link
                      to="/contacts"
                      className="w-full py-3 rounded-xl font-bold text-sm transition-all text-center block"
                      style={t.popular
                        ? { background: "linear-gradient(135deg, var(--neon-blue), var(--neon-green))", color: "#0b0e17" }
                        : { border: `1px solid ${c.border}`, color: c.text, background: "transparent" }
                      }
                    >
                      Подключить
                    </Link>
                  </div>
                );
              })}
            </div>
          )}

          {/* Business tariffs */}
          {tab === "business" && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-12">
                {businessTariffs.map((t, i) => {
                  const c = colorMap[t.color];
                  const isEnterprise = t.price === "По запросу";
                  return (
                    <div
                      key={i}
                      className="glass-card rounded-3xl p-6 border flex flex-col relative transition-all duration-300 hover:scale-[1.02]"
                      style={{ borderColor: t.popular ? c.border : "rgba(255,255,255,0.07)", background: t.popular ? c.bg : "" }}
                    >
                      {t.popular && (
                        <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full text-xs font-bold text-[#0b0e17]" style={{ background: "linear-gradient(135deg, var(--neon-blue), var(--neon-green))" }}>
                          Популярный
                        </div>
                      )}
                      <div className="mb-1">
                        <div className="text-white/50 text-xs uppercase tracking-widest mb-1">{t.name}</div>
                        <div className="font-montserrat font-black text-3xl" style={{ color: c.text }}>
                          {parseInt(t.speed) >= 1000
                            ? `${parseInt(t.speed) / 1000} Гбит/с`
                            : `${t.speed} Мбит/с`}
                        </div>
                      </div>
                      <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-semibold mb-4 w-fit" style={{ background: c.badge, color: c.text }}>
                        SLA {t.sla}
                      </div>
                      <div className="mb-6">
                        <span className="font-montserrat font-black text-2xl text-white">{t.price}</span>
                        {!isEnterprise && <span className="text-white/30 text-sm"> ₽ / мес</span>}
                      </div>
                      <ul className="space-y-2 flex-1 mb-6">
                        {t.features.map((f, fi) => (
                          <li key={fi} className="flex items-center gap-2 text-sm text-white/70">
                            <Icon name="Check" size={14} style={{ color: c.text }} className="shrink-0" />
                            {f}
                          </li>
                        ))}
                      </ul>
                      <Link
                        to="/contacts"
                        className="w-full py-3 rounded-xl font-bold text-sm transition-all text-center block"
                        style={t.popular
                          ? { background: "linear-gradient(135deg, var(--neon-blue), var(--neon-green))", color: "#0b0e17" }
                          : { border: `1px solid ${c.border}`, color: c.text }
                        }
                      >
                        {isEnterprise ? "Получить предложение" : "Подключить"}
                      </Link>
                    </div>
                  );
                })}
              </div>

              {/* Business CTA */}
              <div className="rounded-3xl p-8 md:p-12 border text-center" style={{ background: "linear-gradient(135deg, rgba(0,212,255,0.08), rgba(0,245,122,0.05))", borderColor: "rgba(0,212,255,0.2)" }}>
                <Icon name="Building2" size={40} style={{ color: "var(--neon-blue)" }} className="mx-auto mb-4" />
                <h2 className="font-montserrat font-black text-3xl md:text-4xl text-white mb-3">Нужно индивидуальное решение?</h2>
                <p className="text-white/50 text-base mb-6 max-w-lg mx-auto">Персональный менеджер подберёт тариф под ваш бизнес, количество точек и бюджет</p>
                <Link
                  to="/business"
                  className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl font-bold text-sm text-[#0b0e17] neon-glow-btn"
                  style={{ background: "linear-gradient(135deg, var(--neon-blue), var(--neon-green))" }}
                >
                  Узнать о бизнес-решениях <Icon name="ArrowRight" size={16} />
                </Link>
              </div>
            </>
          )}

        </div>

      </div>
    </div>
  );
}