import Icon from "@/components/ui/icon";
import InstallAppButton from "@/components/InstallAppButton";

const stats = [
  { num: "14", suffix: "лет", label: "на рынке" },
  { num: "280", suffix: "К+", label: "клиентов" },
  { num: "99.9", suffix: "%", label: "uptime" },
  { num: "42", suffix: "", label: "города" },
];

interface HeroSectionProps {
  heroImg: string;
  scrollTo: (href: string) => void;
}

export default function HeroSection({ heroImg, scrollTo }: HeroSectionProps) {
  return (
    <>
      {/* ─── HERO ─── */}
      <section id="hero" className="relative min-h-screen flex items-center overflow-hidden pt-16">
        <div className="absolute inset-0 z-0">
          <img src={heroImg} alt="" className="w-full h-full object-cover opacity-20" />
          <div className="absolute inset-0" style={{ background: "linear-gradient(to right, #0b0e17, rgba(11,14,23,0.8), transparent)" }} />
          <div className="absolute inset-0 grid-lines opacity-50" />
        </div>
        <div className="absolute top-1/4 right-1/4 w-[500px] h-[500px] rounded-full pointer-events-none" style={{ background: "rgba(0,212,255,0.05)", filter: "blur(120px)" }} />
        <div className="absolute bottom-1/4 right-1/3 w-[300px] h-[300px] rounded-full pointer-events-none" style={{ background: "rgba(0,245,122,0.05)", filter: "blur(100px)" }} />

        <div className="relative z-10 max-w-7xl mx-auto px-6 py-20 grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <div className="slide-up inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-semibold mb-6 tracking-wider uppercase" style={{ borderColor: "rgba(0,212,255,0.3)", background: "rgba(0,212,255,0.05)", color: "var(--neon-blue)" }}>
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--neon-green)] animate-pulse" />
              Сеть работает в 42 городах России
            </div>
            <h1 className="slide-up-delay-1 font-montserrat font-black text-5xl md:text-6xl lg:text-7xl leading-[1.05] mb-6">
              Интернет<br />
              <span className="gradient-text-blue">нового</span><br />
              поколения
            </h1>
            <p className="slide-up-delay-2 text-lg text-white/60 mb-8 max-w-lg leading-relaxed">
              Гигабитное подключение по технологии TurboPon, ТВ 450+ каналов и защита от угроз — всё в одном пакете. Подключайтесь за 24 часа.
            </p>
            <div className="slide-up-delay-3 flex flex-col sm:flex-row gap-3 mb-10">
              <button onClick={() => scrollTo("#tariffs")} className="px-6 py-3.5 rounded-xl text-[#0b0e17] font-bold text-base neon-glow-btn" style={{ background: "linear-gradient(135deg, var(--neon-blue), var(--neon-green))" }}>
                Выбрать тариф →
              </button>
              <button onClick={() => scrollTo("#coverage")} className="px-6 py-3.5 rounded-xl border border-white/15 text-white font-semibold text-base hover:border-[rgba(0,212,255,0.4)] hover:bg-[rgba(0,212,255,0.05)] transition-all">
                Проверить покрытие
              </button>
              <InstallAppButton
                className="px-6 py-3.5 rounded-xl border border-white/15 text-white font-semibold text-base hover:border-[rgba(0,212,255,0.4)] hover:bg-[rgba(0,212,255,0.05)] transition-all"
                style={{ background: "transparent" }}
                label="Установить приложение"
              />
            </div>
            <div className="slide-up-delay-4 flex gap-8 flex-wrap">
              {[{ val: "2.5 Гбит/с", label: "макс. скорость" }, { val: "24 ч", label: "подключение" }, { val: "0 ₽", label: "подключение" }].map((s, i) => (
                <div key={i}>
                  <div className="font-montserrat font-black text-2xl gradient-text-blue">{s.val}</div>
                  <div className="text-xs text-white/40 mt-0.5">{s.label}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="hidden lg:flex justify-center items-center">
            <div className="float-anim relative">
              <div className="w-72 h-72 rounded-full flex items-center justify-center relative animated-border" style={{ border: "1px solid rgba(0,212,255,0.2)" }}>
                {/* Smoke particles */}
                {Array.from({ length: 18 }, (_, i) => (
                  <div key={i} className={`smoke-particle smoke-${i + 1}`} />
                ))}

                <div className="w-52 h-52 rounded-full flex items-center justify-center" style={{ border: "1px solid rgba(0,245,122,0.2)" }}>
                  <div className="w-36 h-36 rounded-full glass-card neon-border-blue flex flex-col items-center justify-center" style={{ background: "linear-gradient(135deg, rgba(0,212,255,0.2), rgba(0,245,122,0.1))" }}>
                    <span className="font-montserrat font-black text-5xl gradient-text-blue">2.5G</span>
                    <span className="text-white/50 text-xs mt-1">Гбит/с</span>
                  </div>
                </div>
                {[0, 60, 120, 180, 240, 300].map((deg, i) => (
                  <div key={i} className="absolute w-2 h-2 rounded-full" style={{ top: "50%", left: "50%", transform: `rotate(${deg}deg) translateX(132px) translateY(-50%)`, background: "var(--neon-blue)", opacity: 0.4 + i * 0.1 }} />
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-white/30">
          <span className="text-xs tracking-widest uppercase">Листай</span>
          <Icon name="ChevronDown" size={16} className="animate-bounce" />
        </div>
      </section>

      {/* ─── STATS ─── */}
      <section className="py-12 relative">
        <div className="section-divider" />
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {stats.map((s, i) => (
              <div key={i} className="text-center">
                <div className="stat-number gradient-text-blue">{s.num}<span className="gradient-text-green">{s.suffix}</span></div>
                <div className="text-white/40 text-sm mt-1">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
        <div className="section-divider" />
      </section>
    </>
  );
}