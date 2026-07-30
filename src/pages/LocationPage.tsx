import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Icon from "@/components/ui/icon";
import useLocations from "@/hooks/useLocations";

const colorMap = {
  blue:   { border: "rgba(0,212,255,0.3)",  bg: "rgba(0,212,255,0.08)",  text: "var(--neon-blue)",  badge: "rgba(0,212,255,0.15)" },
  green:  { border: "rgba(0,245,122,0.3)",  bg: "rgba(0,245,122,0.08)",  text: "var(--neon-green)", badge: "rgba(0,245,122,0.15)" },
  purple: { border: "rgba(168,85,247,0.3)", bg: "rgba(168,85,247,0.08)", text: "#a855f7",            badge: "rgba(168,85,247,0.15)" },
};

const badgeColor: Record<string, string> = {
  "Акция":     "rgba(0,212,255,0.15)",
  "Подарок":   "rgba(0,245,122,0.15)",
  "Выгода":    "rgba(168,85,247,0.15)",
  "Льгота":    "rgba(168,85,247,0.15)",
  "Дачникам":  "rgba(0,245,122,0.15)",
  "Бесплатно": "rgba(0,245,122,0.15)",
  "Реферал":   "rgba(0,212,255,0.15)",
  "Новинка":   "rgba(249,115,22,0.15)",
};

const SOCIAL_ICONS = [
  { name: "WhatsApp",  src: "https://cdn.jsdelivr.net/gh/simple-icons/simple-icons/icons/whatsapp.svg",  bg: "#25D366" },
  { name: "YouTube",   src: "https://cdn.jsdelivr.net/gh/simple-icons/simple-icons/icons/youtube.svg",   bg: "#FF0000" },
  { name: "Telegram",  src: "https://cdn.jsdelivr.net/gh/simple-icons/simple-icons/icons/telegram.svg",  bg: "#26A5E4" },
  { name: "Viber",     src: "https://cdn.jsdelivr.net/gh/simple-icons/simple-icons/icons/viber.svg",     bg: "#7360F2" },
  { name: "Instagram", src: "https://cdn.jsdelivr.net/gh/simple-icons/simple-icons/icons/instagram.svg", bg: "#E4405F" },
  { name: "Threads",   src: "https://cdn.jsdelivr.net/gh/simple-icons/simple-icons/icons/threads.svg",   bg: "#101010" },
];

// Тарифы Интернет+ТВ (цена = интернет + надбавка за ТВ)
const tvTariffs = [
  {
    name: "Старт + ТВ",
    internet: "50",
    price: "1100",
    channels: "120",
    color: "blue" as const,
    popular: false,
    features: ["50 Мбит/с", "120 каналов HD", "Wink — фильмы и сериалы", "Поддержка 24/7"],
    promo: null,
  },
  {
    name: "Оптима + ТВ",
    internet: "100",
    price: "1350",
    channels: "200",
    color: "green" as const,
    popular: false,
    features: ["100 Мбит/с", "200 каналов HD/4K", "Wink — Premium подписка", "ТВ-приставка в аренду", "Поддержка 24/7"],
    promo: "Приставка бесплатно 3 мес",
  },
  {
    name: "Оптима+ + ТВ",
    internet: "150",
    price: "1600",
    channels: "250",
    color: "green" as const,
    popular: true,
    features: ["150 Мбит/с", "250 каналов HD/4K", "Wink — Premium + Детский", "ТВ-приставка в аренду", "Поддержка 24/7", "__social__"],
    promo: "Первый месяц — 1 ₽",
  },
  {
    name: "Комфорт + ТВ",
    internet: "200",
    price: "1750",
    channels: "300",
    color: "purple" as const,
    popular: false,
    features: ["200 Мбит/с", "300 каналов HD/4K", "Wink — Ultra подписка", "ТВ-приставка в подарок", "Запись эфира 7 дней", "Поддержка 24/7"],
    promo: "Приставка в подарок",
  },
  {
    name: "Про + ТВ",
    internet: "300",
    price: "1950",
    channels: "350",
    color: "purple" as const,
    popular: false,
    features: ["300 Мбит/с", "350 каналов HD/4K", "Wink — Ultra + Спорт", "ТВ-приставка 4K в подарок", "Запись эфира 14 дней", "Поддержка 24/7"],
    promo: null,
  },
  {
    name: "Максимум + ТВ",
    internet: "500",
    price: "2200",
    channels: "450",
    color: "purple" as const,
    popular: false,
    features: ["500 Мбит/с", "450+ каналов HD/4K", "Wink — Весь контент", "ТВ-приставка 4K в подарок", "Запись эфира 30 дней", "Мультирум — 2 ТВ", "Поддержка 24/7"],
    promo: "Скидка 20% первые 3 мес",
  },
];

const tvPromos = [
  { title: "Wink — бесплатно 3 месяца", desc: "При подключении любого пакета Интернет+ТВ — подписка Wink в подарок на 3 месяца.", badge: "Подарок", color: "green" as const },
  { title: "ТВ-приставка в рассрочку 500 ₽/мес", desc: "При подключении тарифа «Оптима+ + ТВ» и выше — приставка в рассрочку на 12 месяцев без переплат.", badge: "Акция", color: "blue" as const },
  { title: "Скидка 15% при оплате на год", desc: "Оплатите пакет на 12 месяцев вперёд и получите скидку 15% на весь период.", badge: "Выгода", color: "purple" as const },
  { title: "Мультирум бесплатно", desc: "При тарифе «Максимум + ТВ» подключите второй телевизор без доплаты.", badge: "Подарок", color: "green" as const },
];

export default function LocationPage() {
  const { slug } = useParams<{ slug: string }>();
  const { locations } = useLocations();
  const loc = locations.find(l => l.slug === slug);
  const [tab, setTab] = useState<"internet" | "tv">("internet");

  if (!loc) {
    return (
      <div className="min-h-screen mesh-bg noise font-sans text-white flex flex-col items-center justify-center gap-4">
        <Navbar />
        <Icon name="MapPin" size={48} className="text-white/20" />
        <p className="text-white/40 text-lg">Населённый пункт не найден</p>
        <Link to="/locations" className="text-sm font-semibold" style={{ color: "var(--neon-blue)" }}>
          ← Все населённые пункты
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen mesh-bg noise font-sans text-white">
      <Navbar />
      <div className="pt-28 pb-20">
        <div className="max-w-6xl mx-auto px-6">

          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-sm text-white/30 mb-8">
            <Link to="/locations" className="hover:text-white/60 transition-colors">Населённые пункты</Link>
            <Icon name="ChevronRight" size={14} />
            <span className="text-white/60">{loc.name}</span>
          </div>

          {/* Header */}
          <div className="mb-10">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-semibold mb-4 tracking-wider uppercase" style={{ borderColor: "rgba(0,212,255,0.3)", background: "rgba(0,212,255,0.05)", color: "var(--neon-blue)" }}>
              <Icon name="MapPin" size={12} /> Тарифы для вашего района
            </div>
            <h1 className="font-montserrat font-black text-5xl md:text-6xl mb-3">{loc.name}</h1>
            <p className="text-white/50 text-lg max-w-2xl">{loc.description}</p>
          </div>

          {/* Tabs */}
          <div className="inline-flex p-1 rounded-2xl bg-white/5 border border-white/10 mb-10">
            <button
              onClick={() => setTab("internet")}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${tab === "internet" ? "tab-active" : "text-white/50 hover:text-white"}`}
            >
              <Icon name="Wifi" size={15} /> Интернет
            </button>
            <button
              onClick={() => setTab("tv")}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${tab === "tv" ? "tab-active" : "text-white/50 hover:text-white"}`}
            >
              <Icon name="Tv" size={15} /> Интернет + ТВ
            </button>
          </div>

          {/* ── ИНТЕРНЕТ ── */}
          {tab === "internet" && (
            <>
              {/* Акции */}
              {loc.promos.length > 0 && (
                <div className="mb-14">
                  <h2 className="font-montserrat font-bold text-2xl mb-5 flex items-center gap-2">
                    <Icon name="Sparkles" size={20} style={{ color: "var(--neon-green)" }} />
                    Акции и спецпредложения
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {loc.promos.map((promo, i) => {
                      const c = colorMap[promo.color];
                      return (
                        <div key={i} className="rounded-2xl p-6 border flex gap-4" style={{ background: c.bg, borderColor: c.border }}>
                          <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: c.badge, color: c.text }}>
                            <Icon name="Gift" size={18} />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                              <span className="font-bold text-white text-base">{promo.title}</span>
                              {promo.badge && (
                                <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ background: badgeColor[promo.badge] ?? "rgba(255,255,255,0.1)", color: c.text }}>
                                  {promo.badge}
                                </span>
                              )}
                            </div>
                            <p className="text-white/55 text-sm leading-relaxed">{promo.desc}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Тарифы интернет */}
              <div>
                <h2 className="font-montserrat font-bold text-2xl mb-5 flex items-center gap-2">
                  <Icon name="Zap" size={20} style={{ color: "var(--neon-blue)" }} />
                  Тарифы
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-12">
                  {loc.tariffs.map((t, i) => {
                    const c = colorMap[t.color];
                    return (
                      <div key={i} className="glass-card rounded-3xl p-6 border flex flex-col relative transition-all duration-300 hover:scale-[1.02]"
                        style={{ borderColor: t.popular ? c.border : "rgba(255,255,255,0.07)", background: t.popular ? c.bg : "" }}>
                        {t.popular && (
                          <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full text-xs font-bold text-[#0b0e17]" style={{ background: "linear-gradient(135deg, var(--neon-blue), var(--neon-green))" }}>
                            Популярный
                          </div>
                        )}
                        <div className="mb-3">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <div className="text-white/50 text-xs uppercase tracking-widest">{t.name}</div>
                            {t.badge && (
                              <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ background: "rgba(249,115,22,0.2)", color: "#fb923c" }}>
                                {t.badge}
                              </span>
                            )}
                          </div>
                          <div className="font-montserrat font-black text-4xl" style={{ color: c.text }}>
                            {t.speed} <span className="text-lg font-semibold text-white/40">Мбит/с</span>
                          </div>
                        </div>
                        <div className="mb-6 flex items-end gap-2">
                          <span className="font-montserrat font-black text-3xl text-white">{t.price} ₽</span>
                          <span className="text-white/30 text-sm mb-0.5">/ мес</span>
                          {t.oldPrice && <span className="text-white/25 text-sm line-through mb-0.5">{t.oldPrice} ₽</span>}
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
                        <Link to="/contacts" className="w-full py-3 rounded-xl font-bold text-sm transition-all text-center block"
                          style={t.popular
                            ? { background: "linear-gradient(135deg, var(--neon-blue), var(--neon-green))", color: "#0b0e17" }
                            : { border: `1px solid ${c.border}`, color: c.text }}>
                          Подключить
                        </Link>
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          )}

          {/* ── ИНТЕРНЕТ + ТВ ── */}
          {tab === "tv" && (
            <>
              {/* Wink баннер */}
              <div className="rounded-3xl p-6 border mb-10 flex flex-col md:flex-row items-center gap-6"
                style={{ background: "linear-gradient(120deg, rgba(168,85,247,0.1), rgba(0,212,255,0.06))", borderColor: "rgba(168,85,247,0.25)" }}>
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center shrink-0" style={{ background: "rgba(168,85,247,0.15)", border: "1px solid rgba(168,85,247,0.3)" }}>
                  <Icon name="Tv2" size={32} style={{ color: "#a855f7" }} />
                </div>
                <div className="flex-1 text-center md:text-left">
                  <div className="font-montserrat font-black text-xl text-white mb-1">Wink — стриминг от АртТелекома</div>
                  <div className="text-white/50 text-sm">Фильмы, сериалы, мультфильмы, спорт и live-каналы в одном приложении. Доступно на ТВ, смартфоне и планшете.</div>
                </div>
                <div className="shrink-0 px-5 py-2 rounded-xl text-xs font-bold" style={{ background: "rgba(168,85,247,0.15)", border: "1px solid rgba(168,85,247,0.3)", color: "#a855f7" }}>
                  Включён в пакет
                </div>
              </div>

              {/* ТВ-приставка баннер */}
              <div className="rounded-3xl overflow-hidden border mb-10 flex flex-col md:flex-row" style={{ borderColor: "rgba(0,212,255,0.2)" }}>
                <div className="md:w-2/5 shrink-0 relative" style={{ minHeight: 220 }}>
                  <img
                    src="https://cdn.poehali.dev/projects/5573dd0c-764b-4bc3-951f-74ecfdbb396f/files/8f97c06a-6144-491e-8485-b4cd5c8ae0c1.jpg"
                    alt="ТВ-приставка"
                    className="w-full h-full object-cover"
                    style={{ minHeight: 220 }}
                  />
                  <div className="absolute inset-0" style={{ background: "linear-gradient(to right, transparent 60%, rgba(11,14,23,0.9))" }} />
                </div>
                <div className="flex-1 p-7 flex flex-col justify-center" style={{ background: "linear-gradient(120deg, rgba(0,212,255,0.06), rgba(11,14,23,0.95))" }}>
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold mb-3 self-start" style={{ background: "rgba(0,212,255,0.15)", color: "var(--neon-blue)" }}>
                    <Icon name="Tv" size={12} /> ТВ-приставка
                  </div>
                  <h3 className="font-montserrat font-black text-2xl text-white mb-2">Приставка 4K для вашего ТВ</h3>
                  <p className="text-white/50 text-sm mb-5 leading-relaxed">Подключи любой телевизор к цифровому ТВ. Поддержка 4K, Wi-Fi, голосового управления и всех стриминговых сервисов.</p>
                  <div className="flex flex-wrap gap-4 items-center">
                    <div>
                      <div className="text-white/40 text-xs mb-0.5">Купить сразу</div>
                      <div className="font-montserrat font-black text-2xl text-white">6 000 ₽</div>
                    </div>
                    <div className="w-px h-10 bg-white/10" />
                    <div>
                      <div className="text-white/40 text-xs mb-0.5">Рассрочка на 12 мес</div>
                      <div className="font-montserrat font-black text-2xl" style={{ color: "var(--neon-blue)" }}>500 ₽<span className="text-sm font-semibold text-white/40"> / мес</span></div>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-3 mt-5 items-center">
                    <Link to="/contacts" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm text-[#0b0e17] neon-glow-btn" style={{ background: "linear-gradient(135deg, var(--neon-blue), var(--neon-green))" }}>
                      Заказать приставку <Icon name="ArrowRight" size={15} />
                    </Link>
                    <div className="text-xs text-white/30">При тарифе Оптима+ + ТВ и выше</div>
                  </div>
                </div>
              </div>

              {/* Стриминг-сервисы */}
              <div className="mb-10">
                <h2 className="font-montserrat font-bold text-2xl mb-5 flex items-center gap-2">
                  <Icon name="Play" size={20} style={{ color: "var(--neon-blue)" }} />
                  Подключи любимые сервисы
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {/* иви */}
                  <div className="rounded-2xl p-5 border flex flex-col gap-3" style={{ background: "rgba(231,29,54,0.08)", borderColor: "rgba(231,29,54,0.25)" }}>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center font-black text-white text-sm shrink-0" style={{ background: "#E71D36" }}>
                        иви
                      </div>
                      <span className="font-bold text-white text-base">иви</span>
                    </div>
                    <p className="text-white/50 text-sm">80 000+ фильмов, сериалов и мультфильмов. Первый месяц — бесплатно при подключении пакета ТВ.</p>
                    <span className="text-xs font-bold px-2 py-0.5 rounded-full self-start" style={{ background: "rgba(231,29,54,0.2)", color: "#f87171" }}>Попробовать бесплатно</span>
                  </div>
                  {/* Кинопоиск */}
                  <div className="rounded-2xl p-5 border flex flex-col gap-3" style={{ background: "rgba(255,204,0,0.07)", borderColor: "rgba(255,204,0,0.25)" }}>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center font-black text-[#1a1a1a] text-xs shrink-0" style={{ background: "#FFCC00" }}>
                        КП
                      </div>
                      <span className="font-bold text-white text-base">Кинопоиск</span>
                    </div>
                    <p className="text-white/50 text-sm">Фильмы, сериалы, оригинальные шоу. Эксклюзивный контент и лучшие новинки без рекламы.</p>
                    <span className="text-xs font-bold px-2 py-0.5 rounded-full self-start" style={{ background: "rgba(255,204,0,0.2)", color: "#fbbf24" }}>Скидка 20% для абонентов</span>
                  </div>
                  {/* Яндекс */}
                  <div className="rounded-2xl p-5 border flex flex-col gap-3" style={{ background: "rgba(255,90,0,0.07)", borderColor: "rgba(255,90,0,0.25)" }}>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center font-black text-white text-sm shrink-0" style={{ background: "#FF5A00" }}>
                        Я
                      </div>
                      <span className="font-bold text-white text-base">Яндекс Плюс</span>
                    </div>
                    <p className="text-white/50 text-sm">Музыка, кино, кешбэк на покупки и доставку. Единая подписка на все сервисы Яндекса.</p>
                    <span className="text-xs font-bold px-2 py-0.5 rounded-full self-start" style={{ background: "rgba(255,90,0,0.2)", color: "#fb923c" }}>В подарок на 3 месяца</span>
                  </div>
                </div>
              </div>

              {/* Акции ТВ */}
              <div className="mb-10">
                <h2 className="font-montserrat font-bold text-2xl mb-5 flex items-center gap-2">
                  <Icon name="Sparkles" size={20} style={{ color: "var(--neon-green)" }} />
                  Акции на пакеты Интернет + ТВ
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {tvPromos.map((promo, i) => {
                    const c = colorMap[promo.color];
                    return (
                      <div key={i} className="rounded-2xl p-5 border flex gap-4" style={{ background: c.bg, borderColor: c.border }}>
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: c.badge, color: c.text }}>
                          <Icon name="Gift" size={18} />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <span className="font-bold text-white text-sm">{promo.title}</span>
                            {promo.badge && (
                              <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ background: badgeColor[promo.badge] ?? "rgba(255,255,255,0.1)", color: c.text }}>
                                {promo.badge}
                              </span>
                            )}
                          </div>
                          <p className="text-white/50 text-xs leading-relaxed">{promo.desc}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Тарифы ТВ */}
              <div>
                <h2 className="font-montserrat font-bold text-2xl mb-5 flex items-center gap-2">
                  <Icon name="Tv" size={20} style={{ color: "#a855f7" }} />
                  Пакеты Интернет + ТВ
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-12">
                  {tvTariffs.map((t, i) => {
                    const c = colorMap[t.color];
                    return (
                      <div key={i} className="glass-card rounded-3xl p-6 border flex flex-col relative transition-all duration-300 hover:scale-[1.02]"
                        style={{ borderColor: t.popular ? c.border : "rgba(255,255,255,0.07)", background: t.popular ? c.bg : "" }}>
                        {t.popular && (
                          <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full text-xs font-bold text-[#0b0e17]" style={{ background: "linear-gradient(135deg, var(--neon-blue), var(--neon-green))" }}>
                            Популярный
                          </div>
                        )}
                        {t.promo && (
                          <div className="absolute -top-3 right-4 px-3 py-1 rounded-full text-xs font-bold" style={{ background: "rgba(249,115,22,0.9)", color: "#fff" }}>
                            {t.promo}
                          </div>
                        )}
                        <div className="mb-3">
                          <div className="text-white/50 text-xs uppercase tracking-widest mb-1">{t.name}</div>
                          <div className="flex items-baseline gap-3">
                            <div className="font-montserrat font-black text-3xl" style={{ color: c.text }}>
                              {t.internet} <span className="text-base font-semibold text-white/40">Мбит/с</span>
                            </div>
                            <div className="flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-bold" style={{ background: "rgba(168,85,247,0.15)", color: "#a855f7" }}>
                              <Icon name="Tv" size={11} /> {t.channels} кан.
                            </div>
                          </div>
                        </div>
                        <div className="mb-6">
                          <span className="font-montserrat font-black text-3xl text-white">{t.price} ₽</span>
                          <span className="text-white/30 text-sm ml-1">/ мес</span>
                        </div>
                        <ul className="space-y-2 flex-1 mb-6">
                          {t.features.map((f, fi) =>
                            f === "__social__" ? (
                              <li key={fi} className="pt-1">
                                <div className="text-white/40 text-xs mb-2">Соцсети без ограничений:</div>
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
                        <Link to="/contacts" className="w-full py-3 rounded-xl font-bold text-sm transition-all text-center block"
                          style={t.popular
                            ? { background: "linear-gradient(135deg, var(--neon-blue), var(--neon-green))", color: "#0b0e17" }
                            : { border: `1px solid ${c.border}`, color: c.text }}>
                          Подключить пакет
                        </Link>
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          )}

          {/* CTA */}
          <div className="rounded-3xl p-8 border text-center" style={{ background: "linear-gradient(135deg, rgba(0,212,255,0.07), rgba(0,245,122,0.04))", borderColor: "rgba(0,212,255,0.2)" }}>
            <h3 className="font-montserrat font-black text-2xl text-white mb-2">Остались вопросы?</h3>
            <p className="text-white/45 mb-5">Оставьте заявку — перезвоним в течение 30 минут</p>
            <Link to="/contacts" className="inline-flex items-center gap-2 px-7 py-3 rounded-xl font-bold text-sm text-[#0b0e17] neon-glow-btn"
              style={{ background: "linear-gradient(135deg, var(--neon-blue), var(--neon-green))" }}>
              Оставить заявку <Icon name="ArrowRight" size={15} />
            </Link>
          </div>

        </div>
      </div>
    </div>
  );
}