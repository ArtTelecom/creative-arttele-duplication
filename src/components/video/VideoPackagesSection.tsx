import { useState } from "react";
import { Link } from "react-router-dom";
import Icon from "@/components/ui/icon";

const packages = [
  {
    name: "Старт",
    cameras: "2–4 камеры",
    price: "от 15 000 ₽",
    ideal: "Квартира, небольшой офис",
    features: ["Монтаж и настройка", "Запись на регистратор", "Удалённый доступ", "Инструктаж"],
    color: "var(--neon-blue)",
    popular: false,
  },
  {
    name: "Бизнес",
    cameras: "8–16 камер",
    price: "от 45 000 ₽",
    ideal: "Магазин, склад, производство",
    features: ["Монтаж и настройка", "Облачное резервирование", "Аналитика движения", "Оповещения на телефон", "Договор ТО на 1 год"],
    color: "var(--neon-green)",
    popular: true,
  },
  {
    name: "Объект",
    cameras: "32+ камеры",
    price: "по запросу",
    ideal: "Жилые комплексы, предприятия",
    features: ["Проект под ключ", "IP камеры 4K", "Центральный пульт", "Интеграция с СКУД", "Приоритетная поддержка 24/7", "Договор ТО"],
    color: "var(--neon-purple)",
    popular: false,
  },
];

const faqs = [
  {
    q: "Сколько хранится запись?",
    a: "Зависит от пакета и объёма накопителя. Стандартно — 30 дней, при облачном хранении — от 7 до 90 дней.",
  },
  {
    q: "Можно смотреть камеры с телефона?",
    a: "Да, настраиваем удалённый доступ через приложение для iOS и Android. Смотрите онлайн из любой точки мира.",
  },
  {
    q: "Работают ли камеры ночью?",
    a: "Все камеры оснащены ИК-подсветкой. Видят чёткое изображение в полной темноте на расстоянии до 50 метров.",
  },
  {
    q: "Как долго длится монтаж?",
    a: "Базовую систему из 4 камер устанавливаем за 1 рабочий день. Крупные объекты — по согласованному графику.",
  },
];

export default function VideoPackagesSection() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <>
      <section id="packages" className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-xs font-bold tracking-widest uppercase mb-3" style={{ color: "var(--neon-purple)" }}>
              Пакеты услуг
            </p>
            <h2 className="text-3xl lg:text-5xl font-black text-white">
              Выберите свой пакет
            </h2>
            <p className="text-white/40 mt-4 max-w-lg mx-auto">
              Фиксированные цены, никаких скрытых платежей. Монтаж и настройка уже включены.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {packages.map((pkg) => (
              <div
                key={pkg.name}
                className="relative p-8 rounded-3xl transition-all duration-300 hover:-translate-y-2"
                style={{
                  background: pkg.popular ? `${pkg.color}0d` : "var(--glass-bg)",
                  border: `1px solid ${pkg.popular ? pkg.color + "55" : "var(--glass-border)"}`,
                  boxShadow: pkg.popular ? `0 0 40px ${pkg.color}20` : "none",
                }}
              >
                {pkg.popular && (
                  <div
                    className="absolute -top-4 left-1/2 -translate-x-1/2 px-5 py-1.5 rounded-full text-xs font-black tracking-widest uppercase"
                    style={{ background: pkg.color, color: "#0b0e17" }}
                  >
                    Популярный
                  </div>
                )}

                <div className="mb-6">
                  <h3 className="text-2xl font-black text-white mb-1">{pkg.name}</h3>
                  <p className="text-sm" style={{ color: pkg.color }}>{pkg.cameras}</p>
                  <p className="text-white/40 text-xs mt-1">{pkg.ideal}</p>
                </div>

                <div className="mb-6">
                  <span className="text-3xl font-black text-white">{pkg.price}</span>
                </div>

                <ul className="space-y-3 mb-8">
                  {pkg.features.map((f) => (
                    <li key={f} className="flex items-center gap-3 text-sm text-white/70">
                      <Icon name="CheckCircle" size={16} style={{ color: pkg.color, flexShrink: 0 }} />
                      {f}
                    </li>
                  ))}
                </ul>

                <a
                  href="tel:+78002002024"
                  className="block text-center py-3.5 rounded-2xl font-bold text-sm transition-all hover:opacity-90"
                  style={
                    pkg.popular
                      ? { background: pkg.color, color: "#0b0e17" }
                      : { border: `1px solid ${pkg.color}55`, color: pkg.color }
                  }
                >
                  Заказать
                </a>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-xs font-bold tracking-widest uppercase mb-3" style={{ color: "var(--neon-blue)" }}>
              Процесс работы
            </p>
            <h2 className="text-3xl lg:text-5xl font-black text-white">
              4 шага до безопасности
            </h2>
          </div>

          <div className="grid md:grid-cols-4 gap-6">
            {[
              { step: "01", icon: "Phone", title: "Заявка", desc: "Звоните или оставляйте заявку — специалист свяжется в рабочее время" },
              { step: "02", icon: "MapPin", title: "Выезд", desc: "Бесплатный замер и консультация на объекте" },
              { step: "03", icon: "Wrench", title: "Монтаж", desc: "Устанавливаем аккуратно, без лишнего мусора" },
              { step: "04", icon: "Smartphone", title: "Сдача", desc: "Настраиваем, обучаем, выдаём гарантию" },
            ].map((item, i) => (
              <div key={item.step} className="relative text-center group">
                {i < 3 && (
                  <div
                    className="hidden md:block absolute top-8 left-[60%] w-[80%] h-px"
                    style={{ background: "linear-gradient(90deg, rgba(0,212,255,0.4), transparent)" }}
                  />
                )}
                <div
                  className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 transition-all duration-300 group-hover:scale-110"
                  style={{ background: "rgba(0,212,255,0.1)", border: "1px solid rgba(0,212,255,0.2)" }}
                >
                  <Icon name={item.icon} size={24} style={{ color: "var(--neon-blue)" }} />
                </div>
                <div className="text-xs font-black tracking-widest mb-2" style={{ color: "var(--neon-blue)" }}>
                  {item.step}
                </div>
                <h3 className="text-white font-bold mb-2">{item.title}</h3>
                <p className="text-white/40 text-sm leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 px-6">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-xs font-bold tracking-widest uppercase mb-3" style={{ color: "var(--neon-green)" }}>
              FAQ
            </p>
            <h2 className="text-3xl lg:text-5xl font-black text-white">
              Частые вопросы
            </h2>
          </div>

          <div className="space-y-3">
            {faqs.map((faq, i) => (
              <div
                key={i}
                className="rounded-2xl overflow-hidden transition-all duration-200"
                style={{ background: "var(--glass-bg)", border: "1px solid var(--glass-border)" }}
              >
                <button
                  className="w-full flex items-center justify-between px-6 py-5 text-left"
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                >
                  <span className="text-white font-semibold pr-4">{faq.q}</span>
                  <Icon
                    name={openFaq === i ? "ChevronUp" : "ChevronDown"}
                    size={20}
                    style={{ color: "var(--neon-blue)", flexShrink: 0 }}
                  />
                </button>
                {openFaq === i && (
                  <div className="px-6 pb-5 text-white/60 text-sm leading-relaxed border-t" style={{ borderColor: "var(--glass-border)" }}>
                    <p className="pt-4">{faq.a}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto relative">
          <div
            className="absolute inset-0 rounded-3xl blur-3xl opacity-20"
            style={{ background: "linear-gradient(135deg, var(--neon-blue), var(--neon-purple))" }}
          />
          <div
            className="relative p-12 lg:p-16 rounded-3xl text-center"
            style={{
              background: "linear-gradient(135deg, rgba(0,212,255,0.08), rgba(168,85,247,0.08))",
              border: "1px solid rgba(0,212,255,0.2)",
            }}
          >
            <div className="text-6xl mb-6">📡</div>
            <h2 className="text-3xl lg:text-5xl font-black text-white mb-4">
              Готовы защитить ваш объект?
            </h2>
            <p className="text-white/50 text-lg mb-10 max-w-xl mx-auto">
              Бесплатный выезд специалиста и расчёт стоимости в течение 1 дня.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="tel:+78002002024"
                className="flex items-center justify-center gap-3 px-10 py-4 rounded-2xl font-black text-lg transition-all hover:scale-105"
                style={{
                  background: "linear-gradient(135deg, var(--neon-blue), var(--neon-green))",
                  color: "#0b0e17",
                  boxShadow: "0 0 40px rgba(0,212,255,0.4)",
                }}
              >
                <Icon name="Phone" size={20} />
                Позвонить бесплатно
              </a>
              <Link
                to="/contacts"
                className="flex items-center justify-center gap-3 px-10 py-4 rounded-2xl font-bold text-base transition-all hover:bg-white/10"
                style={{ border: "1px solid rgba(255,255,255,0.15)", color: "white" }}
              >
                <Icon name="MessageSquare" size={18} />
                Написать нам
              </Link>
            </div>
          </div>
        </div>
      </section>

      <div className="pb-12" />
    </>
  );
}