import { Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import PageHero from "@/components/ui/PageHero";
import Icon from "@/components/ui/icon";

const companyName = "ИП Тлехурай Разиет Нуховна";
const email = "art888018@mail.ru";

type Doc = {
  icon: string;
  title: string;
  desc: string;
  meta: string;
  to: string;
  color: string;
};

const documents: Doc[] = [
  {
    icon: "FileText",
    title: "Публичная оферта",
    desc: "Договор на оказание услуг связи для физических лиц: условия подключения, оплаты, ответственность сторон, перерасчёт и правила использования.",
    meta: "Редакция от 28.07.2026",
    to: "/offer",
    color: "var(--neon-blue)",
  },
  {
    icon: "Building2",
    title: "Реквизиты компании",
    desc: "Полные юридические реквизиты, ИНН, ОГРНИП и действующие лицензии Роскомнадзора на оказание услуг связи.",
    meta: "ИП · лицензии Роскомнадзора",
    to: "/requisites",
    color: "var(--neon-green)",
  },
];

export default function DocumentsPage() {
  return (
    <div className="min-h-screen mesh-bg noise font-sans text-white">
      <Navbar />
      <div className="pt-28 pb-20">
        <div className="max-w-4xl mx-auto px-6">
          <PageHero
            badge="Правовая информация"
            badgeIcon="FolderOpen"
            title="Документы и"
            highlight="договоры"
            subtitle="Официальные документы, договоры и правовая информация об услугах связи"
            accent="blue"
          />

          <div className="grid sm:grid-cols-2 gap-6">
            {documents.map((doc) => (
              <Link
                key={doc.to}
                to={doc.to}
                className="group glass-card rounded-3xl p-6 md:p-7 border border-white/5 card-hover flex flex-col"
              >
                <div
                  className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 mb-4"
                  style={{ background: `color-mix(in srgb, ${doc.color} 15%, transparent)` }}
                >
                  <Icon name={doc.icon} size={22} style={{ color: doc.color }} />
                </div>

                <h2 className="font-montserrat font-bold text-lg text-white mb-2">
                  {doc.title}
                </h2>
                <p className="text-white/50 text-sm leading-relaxed flex-1">{doc.desc}</p>

                <div className="flex items-center justify-between mt-5 pt-4 border-t border-white/5">
                  <span className="text-white/30 text-xs">{doc.meta}</span>
                  <span
                    className="inline-flex items-center gap-1 text-sm font-semibold transition-transform group-hover:translate-x-1"
                    style={{ color: doc.color }}
                  >
                    Открыть <Icon name="ArrowRight" size={15} />
                  </span>
                </div>
              </Link>
            ))}
          </div>

          <div className="glass-card rounded-3xl p-6 md:p-8 border border-white/5 mt-8">
            <div className="flex items-start gap-3">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                style={{ background: "rgba(59, 130, 246, 0.15)" }}
              >
                <Icon name="Info" size={20} style={{ color: "var(--neon-blue)" }} />
              </div>
              <div className="flex-1">
                <div className="text-white font-semibold mb-1">Нужен документ, которого нет в списке?</div>
                <p className="text-white/60 text-sm leading-relaxed">
                  Все услуги оказывает {companyName}. Если вам нужен договор для юридического лица,
                  копия документа с печатью или иная справка — напишите нам на{" "}
                  <a href={`mailto:${email}`} className="text-[#00d4ff] hover:underline">
                    {email}
                  </a>
                  , и мы подготовим нужные бумаги.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
