import { Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Icon from "@/components/ui/icon";
import useTariffs from "@/hooks/useTariffs";

const solutions = [
  {
    icon: "Building2",
    title: "Офисный интернет",
    desc: "Выделенный симметричный канал с гарантированной полосой. Подходит для офисов от 5 до 500 рабочих мест.",
    tags: ["До 10 Гбит/с", "SLA 99.99%"],
    color: "blue",
  },
  {
    icon: "Store",
    title: "Торговля и ритейл",
    desc: "Надёжное подключение для касс, терминалов оплаты и систем видеонаблюдения. Резервный канал в комплекте.",
    tags: ["Резервирование", "Видеонаблюдение"],
    color: "green",
  },
  {
    icon: "Server",
    title: "ЦОД и серверные",
    desc: "Colocation, аренда стоек и высокоскоростные каналы для дата-центров. Прямые пиринги с крупнейшими операторами.",
    tags: ["Colocation", "BGP/AS"],
    color: "purple",
  },
  {
    icon: "Wifi",
    title: "Гостиницы и HoReCa",
    desc: "Wi-Fi для гостей и корпоративная сеть персонала на одной инфраструктуре. Управление через единую панель.",
    tags: ["Guest Wi-Fi", "Управление"],
    color: "blue",
  },
  {
    icon: "MapPin",
    title: "Мультисайт и филиалы",
    desc: "Объединение офисов в единую сеть через MPLS или SD-WAN. Централизованное управление и мониторинг.",
    tags: ["MPLS", "SD-WAN"],
    color: "green",
  },
  {
    icon: "Shield",
    title: "Безопасность сети",
    desc: "DDOS-защита, межсетевой экран нового поколения, фильтрация трафика и VPN для удалённых сотрудников.",
    tags: ["DDoS-защита", "Firewall"],
    color: "purple",
  },
];

const advantages = [
  { icon: "Clock",          title: "SLA до 99.99%",          desc: "Гарантированный uptime с компенсацией при нарушении" },
  { icon: "UserCheck",      title: "Персональный менеджер",   desc: "Один контакт для всех вопросов по договору и сервису" },
  { icon: "Zap",            title: "Выезд за 4 часа",         desc: "Приоритетный выезд инженера в рабочее время" },
  { icon: "BarChart2",      title: "Мониторинг 24/7",         desc: "Круглосуточный NOC и проактивное устранение проблем" },
  { icon: "FileText",       title: "Единый договор",          desc: "Все услуги в одном договоре, единый счёт" },
  { icon: "Headphones",     title: "Поддержка 24/7/365",      desc: "Выделенная линия для бизнес-клиентов" },
];

const colorMap: Record<string, { border: string; bg: string; text: string }> = {
  blue:   { border: "rgba(0,212,255,0.25)",  bg: "rgba(0,212,255,0.06)",  text: "var(--neon-blue)" },
  green:  { border: "rgba(0,245,122,0.25)",  bg: "rgba(0,245,122,0.06)",  text: "var(--neon-green)" },
  purple: { border: "rgba(168,85,247,0.25)", bg: "rgba(168,85,247,0.06)", text: "#a855f7" },
};

export default function BusinessPage() {
  const { business: businessTariffs } = useTariffs();
  return (
    <div className="min-h-screen mesh-bg noise font-sans text-white">
      <Navbar />

      {/* Hero */}
      <section className="pt-36 pb-20 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(ellipse 80% 50% at 50% 0%, rgba(0,212,255,0.08), transparent)" }} />
        <div className="max-w-5xl mx-auto px-6 text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-semibold mb-6 tracking-wider uppercase" style={{ borderColor: "rgba(0,212,255,0.3)", background: "rgba(0,212,255,0.05)", color: "var(--neon-blue)" }}>
            <Icon name="Building2" size={12} /> Для бизнеса
          </div>
          <h1 className="font-montserrat font-black text-5xl md:text-7xl leading-none mb-6">
            Интернет<br />для <span className="gradient-text-blue">вашего бизнеса</span>
          </h1>
          <p className="text-white/50 text-lg max-w-2xl mx-auto mb-10 leading-relaxed">
            Гарантированная скорость, SLA до 99.99%, персональный менеджер и техподдержка 24/7 — всё включено в бизнес-пакет
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/tariffs"
              className="flex items-center gap-2 px-8 py-3.5 rounded-xl font-bold text-sm text-[#0b0e17] neon-glow-btn"
              style={{ background: "linear-gradient(135deg, var(--neon-blue), var(--neon-green))" }}
            >
              <Icon name="Zap" size={16} /> Смотреть тарифы
            </Link>
            <Link
              to="/contacts"
              className="flex items-center gap-2 px-8 py-3.5 rounded-xl font-bold text-sm transition-all"
              style={{ border: "1px solid rgba(0,212,255,0.3)", color: "var(--neon-blue)" }}
            >
              Получить консультацию
            </Link>
          </div>
        </div>


      </section>

      {/* Solutions */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="font-montserrat font-black text-4xl md:text-5xl mb-3">
              Решения для <span className="gradient-text-green">любого бизнеса</span>
            </h2>
            <p className="text-white/40 text-base max-w-xl mx-auto">От малого офиса до федеральной сети — найдём оптимальное решение</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {solutions.map((s, i) => {
              const c = colorMap[s.color];
              return (
                <div key={i} className="glass-card rounded-2xl p-6 border card-hover" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4" style={{ background: c.bg, color: c.text }}>
                    <Icon name={s.icon} size={22} />
                  </div>
                  <h3 className="font-semibold text-white text-lg mb-2">{s.title}</h3>
                  <p className="text-white/45 text-sm leading-relaxed mb-4">{s.desc}</p>
                  <div className="flex flex-wrap gap-2">
                    {s.tags.map(tag => (
                      <span key={tag} className="px-2 py-0.5 rounded-lg text-xs font-semibold" style={{ background: c.bg, color: c.text, border: `1px solid ${c.border}` }}>
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Popular tariffs preview */}
      <section className="py-16 relative">
        <div className="absolute inset-0 grid-lines opacity-10 pointer-events-none" />
        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="flex items-end justify-between mb-10">
            <div>
              <h2 className="font-montserrat font-black text-4xl mb-2">Популярные<br /><span className="gradient-text-blue">бизнес-тарифы</span></h2>
              <p className="text-white/40 text-sm">Без скрытых платежей, гарантия SLA</p>
            </div>
            <Link to="/tariffs" className="hidden md:flex items-center gap-2 text-sm font-semibold hover:gap-3 transition-all" style={{ color: "var(--neon-blue)" }}>
              Все тарифы <Icon name="ArrowRight" size={16} />
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {businessTariffs.slice(0, 3).map((t, i) => {
              const c = colorMap[t.color];
              return (
                <div key={i} className="glass-card rounded-2xl p-6 border flex flex-col" style={{ borderColor: t.popular ? c.border : "rgba(255,255,255,0.07)", background: t.popular ? c.bg : "" }}>
                  {t.popular && (
                    <div className="text-xs font-bold px-3 py-1 rounded-full w-fit mb-3 text-[#0b0e17]" style={{ background: "linear-gradient(135deg, var(--neon-blue), var(--neon-green))" }}>
                      Популярный
                    </div>
                  )}
                  <div className="font-montserrat font-black text-2xl mb-1" style={{ color: c.text }}>
                    {parseInt(t.speed) >= 1000 ? `${parseInt(t.speed) / 1000} Гбит/с` : `${t.speed} Мбит/с`}
                  </div>
                  <div className="text-white/40 text-xs mb-3">SLA {t.sla}</div>
                  <div className="font-montserrat font-black text-xl text-white mb-4">
                    {t.price} {t.price !== "По запросу" && "₽/мес"}
                  </div>
                  <ul className="space-y-1.5 flex-1 mb-5">
                    {t.features.slice(0, 4).map((f, fi) => (
                      <li key={fi} className="flex items-center gap-2 text-xs text-white/60">
                        <Icon name="Check" size={12} style={{ color: c.text }} className="shrink-0" /> {f}
                      </li>
                    ))}
                  </ul>
                  <Link
                    to="/contacts"
                    className="text-center py-2.5 rounded-xl text-sm font-bold transition-all"
                    style={t.popular
                      ? { background: "linear-gradient(135deg, var(--neon-blue), var(--neon-green))", color: "#0b0e17" }
                      : { border: `1px solid ${c.border}`, color: c.text }
                    }
                  >
                    Подключить
                  </Link>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Advantages */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="font-montserrat font-black text-4xl mb-10 text-center">
            Почему выбирают <span className="gradient-text-green">нас</span>
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {advantages.map((a, i) => (
              <div key={i} className="glass-card rounded-2xl p-6 border border-white/5 flex gap-4 card-hover">
                <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0" style={{ background: "rgba(0,212,255,0.08)", color: "var(--neon-blue)" }}>
                  <Icon name={a.icon} size={20} />
                </div>
                <div>
                  <div className="font-semibold text-white mb-1">{a.title}</div>
                  <div className="text-white/45 text-sm leading-relaxed">{a.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Big chameleon banner */}
      <section className="px-6 pb-6">
        <div className="max-w-7xl mx-auto">
          <div className="relative rounded-3xl overflow-hidden" style={{ height: 360 }}>
            <img
              src="https://cdn.poehali.dev/projects/5573dd0c-764b-4bc3-951f-74ecfdbb396f/files/1537dc24-a045-470e-9cdc-a91c1847bda9.jpg"
              alt=""
              className="w-full h-full object-cover object-center"
            />
            <div className="absolute inset-0" style={{ background: "linear-gradient(to right, rgba(11,14,23,0.88) 0%, rgba(11,14,23,0.4) 55%, rgba(168,85,247,0.1) 100%)" }} />
            <div className="absolute inset-0 flex items-center px-10 md:px-16">
              <div>
                <div className="text-xs font-semibold tracking-widest uppercase mb-3" style={{ color: "var(--neon-purple, #a855f7)" }}>Бизнес нового уровня</div>
                <div className="font-montserrat font-black text-3xl md:text-5xl text-white leading-tight mb-4">Ваша сеть —<br />ваши правила</div>
                <p className="text-white/45 text-base max-w-sm">Индивидуальные решения для бизнеса любого масштаба</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Выделенный IP */}
      <section className="py-8 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="rounded-3xl p-8 border flex flex-col md:flex-row gap-8 items-center" style={{ background: "linear-gradient(120deg, rgba(168,85,247,0.08), rgba(0,212,255,0.05))", borderColor: "rgba(168,85,247,0.25)" }}>
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center shrink-0" style={{ background: "rgba(168,85,247,0.15)", border: "1px solid rgba(168,85,247,0.3)" }}>
              <Icon name="Globe" size={32} style={{ color: "#a855f7" }} />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2 flex-wrap">
                <span className="font-montserrat font-black text-xl text-white">Выделенный IP-адрес</span>
                <span className="text-xs font-bold px-3 py-1 rounded-full" style={{ background: "rgba(168,85,247,0.2)", color: "#a855f7" }}>Доп. услуга</span>
              </div>
              <p className="text-white/50 text-sm leading-relaxed max-w-xl">
                Статический IP-адрес для вашего бизнеса — незаменим для удалённого доступа к серверам, видеонаблюдения, работы корпоративных сервисов и безопасного VPN. Подключается к любому тарифу.
              </p>
              <ul className="mt-3 flex flex-wrap gap-x-6 gap-y-1">
                {["Постоянный IP-адрес", "Удалённый доступ к офису", "Видеонаблюдение онлайн", "Хостинг корпоративных сервисов"].map(f => (
                  <li key={f} className="flex items-center gap-1.5 text-xs text-white/60">
                    <Icon name="Check" size={12} style={{ color: "#a855f7" }} className="shrink-0" /> {f}
                  </li>
                ))}
              </ul>
            </div>
            <div className="shrink-0 text-center">
              <div className="text-white/40 text-xs mb-1">Стоимость</div>
              <div className="font-montserrat font-black text-3xl text-white mb-1">1 000 ₽</div>
              <div className="text-white/30 text-xs mb-4">/ месяц</div>
              <Link to="/contacts" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm text-[#0b0e17] neon-glow-btn" style={{ background: "linear-gradient(135deg, #a855f7, var(--neon-blue))" }}>
                Подключить <Icon name="ArrowRight" size={14} />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 px-6">
        <div className="max-w-3xl mx-auto text-center rounded-3xl p-10 border" style={{ background: "linear-gradient(135deg, rgba(0,212,255,0.08), rgba(0,245,122,0.05))", borderColor: "rgba(0,212,255,0.2)" }}>
          <h2 className="font-montserrat font-black text-3xl md:text-4xl text-white mb-3">Оставьте заявку</h2>
          <p className="text-white/50 mb-8 max-w-md mx-auto">Менеджер свяжется в течение 30 минут и подберёт оптимальное решение</p>
          <Link
            to="/contacts"
            className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl font-bold text-sm text-[#0b0e17] neon-glow-btn"
            style={{ background: "linear-gradient(135deg, var(--neon-blue), var(--neon-green))" }}
          >
            Получить предложение <Icon name="ArrowRight" size={16} />
          </Link>
        </div>
      </section>

    </div>
  );
}