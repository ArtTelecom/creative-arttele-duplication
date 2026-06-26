import { useEffect } from "react";
import Icon from "@/components/ui/icon";

interface Props {
  amount?: string;
  onClose: () => void;
}

export default function PaymentSuccess({ amount, onClose }: Props) {
  useEffect(() => {
    const t = setTimeout(onClose, 8000);
    return () => clearTimeout(t);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-fade-in"
      style={{ background: "rgba(5, 8, 15, 0.85)", backdropFilter: "blur(8px)" }}
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-md rounded-3xl p-8 text-center overflow-hidden"
        style={{
          background: "linear-gradient(160deg, rgba(17,24,39,0.95), rgba(11,14,23,0.95))",
          border: "1px solid rgba(0, 245, 122, 0.25)",
          boxShadow: "0 0 80px rgba(0, 245, 122, 0.15)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-white/30 hover:text-white/60 transition-colors"
        >
          <Icon name="X" size={20} />
        </button>

        <div
          className="absolute -top-24 left-1/2 -translate-x-1/2 w-64 h-64 rounded-full blur-[90px] opacity-30 pointer-events-none"
          style={{ background: "var(--neon-green)" }}
        />

        <div className="relative">
          <div
            className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-5 animate-scale-in"
            style={{
              background: "linear-gradient(135deg, var(--neon-green), var(--neon-blue))",
              boxShadow: "0 0 40px rgba(0, 245, 122, 0.4)",
            }}
          >
            <Icon name="Check" size={44} style={{ color: "#0b0e17" }} strokeWidth={3} />
          </div>

          <h2 className="text-2xl font-bold text-white font-montserrat mb-2">
            Платёж принят!
          </h2>

          {amount && (
            <p className="text-4xl font-black font-montserrat mb-3" style={{ color: "var(--neon-green)" }}>
              +{amount} ₽
            </p>
          )}

          <p className="text-white/60 text-sm leading-relaxed mb-6">
            Спасибо за оплату! Деньги поступят на ваш лицевой счёт в течение пары минут. Баланс обновится автоматически.
          </p>

          <button
            onClick={onClose}
            className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-bold text-sm transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
            style={{
              background: "linear-gradient(135deg, var(--neon-blue), var(--neon-green))",
              color: "#0b0e17",
            }}
          >
            <Icon name="Wallet" size={16} />
            Вернуться в кабинет
          </button>
        </div>
      </div>
    </div>
  );
}
