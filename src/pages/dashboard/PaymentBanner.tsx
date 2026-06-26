import Icon from "@/components/ui/icon";

export default function PaymentBanner({ onClose }: { onClose: () => void }) {
  return (
    <div
      className="relative rounded-2xl p-6 sm:p-8 overflow-hidden animate-fade-in"
      style={{
        background: "linear-gradient(135deg, rgba(239, 68, 68, 0.08), rgba(245, 158, 11, 0.06))",
        border: "1px solid rgba(239, 68, 68, 0.2)",
        boxShadow: "0 0 60px rgba(239, 68, 68, 0.06)",
      }}
    >
      <button
        onClick={onClose}
        className="absolute top-4 right-4 text-white/30 hover:text-white/60 transition-colors"
      >
        <Icon name="X" size={20} />
      </button>

      <div className="absolute top-0 right-0 w-64 h-64 rounded-full opacity-10 blur-[80px]" style={{ background: "#ef4444" }} />

      <div className="relative flex flex-col sm:flex-row items-start gap-5">
        <div
          className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0"
          style={{
            background: "linear-gradient(135deg, rgba(239, 68, 68, 0.2), rgba(245, 158, 11, 0.15))",
            border: "1px solid rgba(239, 68, 68, 0.25)",
            boxShadow: "0 0 30px rgba(239, 68, 68, 0.1)",
          }}
        >
          <Icon name="ShieldAlert" size={28} style={{ color: "#ef4444" }} />
        </div>
        <div className="flex-1">
          <h3 className="text-xl font-bold text-white font-montserrat mb-2">
            Онлайн-оплата временно недоступна
          </h3>
          <p className="text-white/60 text-sm leading-relaxed mb-5">
            В связи с блокировками платёжных систем онлайн-платежи временно не проходят.
            Для пополнения баланса свяжитесь с нами — мы поможем выбрать удобный способ оплаты.
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <a
              href="/contacts"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-bold text-sm transition-all duration-300 hover:scale-[1.03] active:scale-[0.97]"
              style={{
                background: "linear-gradient(135deg, var(--neon-blue), var(--neon-green))",
                color: "#0b0e17",
                boxShadow: "0 0 25px rgba(0, 212, 255, 0.25)",
              }}
            >
              <Icon name="Phone" size={16} />
              Связаться с нами
            </a>
            <a
              href="tel:+79024048850"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-bold text-sm transition-all duration-300 hover:scale-[1.03] active:scale-[0.97]"
              style={{
                background: "transparent",
                border: "1px solid rgba(0, 212, 255, 0.3)",
                color: "var(--neon-blue)",
              }}
            >
              <Icon name="PhoneCall" size={16} />
              +7 (902) 404-88-50
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
