import { useState } from "react";
import { Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Icon from "@/components/ui/icon";
import PageHero from "@/components/ui/PageHero";
import useLocations from "@/hooks/useLocations";

export default function LocationsListPage() {
  const [search, setSearch] = useState("");
  const { locations } = useLocations();

  const filtered = locations.filter(l =>
    l.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen mesh-bg noise font-sans text-white">
      <Navbar />
      <div className="pt-28 pb-20">
        <div className="max-w-5xl mx-auto px-6">

          <PageHero
            badge="Зона покрытия"
            badgeIcon="MapPin"
            title="Выберите"
            highlight="ваш район"
            subtitle="Для каждого населённого пункта — свои тарифы и специальные предложения"
            accent="blue"
          />

          {/* Поиск */}
          <div className="max-w-md mx-auto mb-10">
            <div className="relative">
              <Icon name="Search" size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" />
              <input
                type="text"
                placeholder="Найти населённый пункт..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-2xl text-white text-sm placeholder-white/25 focus:outline-none transition-all"
                style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}
              />
            </div>
          </div>

          {/* Счётчик */}
          <div className="text-white/30 text-sm text-center mb-8">
            {filtered.length} {filtered.length === 1 ? "населённый пункт" : filtered.length < 5 ? "населённых пункта" : "населённых пунктов"}
          </div>

          {/* Список */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map(loc => (
              <Link
                key={loc.slug}
                to={`/location/${loc.slug}`}
                className="glass-card rounded-2xl p-6 border border-white/5 card-hover group flex flex-col gap-3"
              >
                <div className="flex items-start justify-between">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: "rgba(0,212,255,0.08)", color: "var(--neon-blue)" }}>
                    <Icon name="MapPin" size={18} />
                  </div>
                  {loc.promos.length > 0 && (
                    <div className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold" style={{ background: "rgba(0,245,122,0.12)", color: "var(--neon-green)" }}>
                      <Icon name="Sparkles" size={10} />
                      {loc.promos.length} {loc.promos.length === 1 ? "акция" : "акции"}
                    </div>
                  )}
                </div>

                <div>
                  <div className="font-montserrat font-black text-xl text-white group-hover:text-[#00d4ff] transition-colors mb-1">
                    {loc.name}
                  </div>
                  <p className="text-white/40 text-xs leading-relaxed line-clamp-2">{loc.description}</p>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-white/5">
                  <div className="text-white/30 text-xs">
                    {loc.tariffs.length} тарифа
                  </div>
                  <div className="flex items-center gap-1 text-xs font-semibold transition-all group-hover:gap-2" style={{ color: "var(--neon-blue)" }}>
                    Смотреть <Icon name="ArrowRight" size={12} />
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {filtered.length === 0 && (
            <div className="text-center py-16">
              <Icon name="SearchX" size={48} className="mx-auto text-white/15 mb-4" />
              <p className="text-white/30">Ничего не найдено</p>
            </div>
          )}

          {/* CTA */}
          <div className="mt-14 rounded-3xl p-8 border text-center" style={{ background: "linear-gradient(135deg, rgba(0,212,255,0.07), rgba(0,245,122,0.04))", borderColor: "rgba(0,212,255,0.2)" }}>
            <h3 className="font-montserrat font-black text-2xl text-white mb-2">Не нашли свой район?</h3>
            <p className="text-white/45 mb-5">Оставьте заявку — уточним наличие подключения по вашему адресу</p>
            <Link
              to="/contacts"
              className="inline-flex items-center gap-2 px-7 py-3 rounded-xl font-bold text-sm text-[#0b0e17] neon-glow-btn"
              style={{ background: "linear-gradient(135deg, var(--neon-blue), var(--neon-green))" }}
            >
              Уточнить адрес <Icon name="ArrowRight" size={15} />
            </Link>
          </div>

        </div>
      </div>
    </div>
  );
}