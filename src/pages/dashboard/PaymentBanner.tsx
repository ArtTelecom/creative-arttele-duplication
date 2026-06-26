import { useState } from "react";
import Icon from "@/components/ui/icon";
import { toast } from "sonner";
import funcUrls from "../../../backend/func2url.json";

interface Props {
  onClose: () => void;
  login: string;
  email?: string;
  phone?: string;
}

const QUICK_SUMS = [100, 300, 500, 1000];

export default function PaymentBanner({ onClose, login, email, phone }: Props) {
  const [amount, setAmount] = useState("500");
  const [loading, setLoading] = useState(false);

  const numAmount = parseFloat(amount) || 0;

  const handlePay = async () => {
    if (numAmount < 1) {
      toast.error("Введите сумму от 1 ₽");
      return;
    }
    if (!login) {
      toast.error("Не удалось определить логин абонента");
      return;
    }
    setLoading(true);
    try {
      const returnUrl = `${window.location.origin}${window.location.pathname}#/dashboard`;
      const res = await fetch(`${funcUrls["tbank-pay"]}?action=create`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ login, amount: numAmount, email, phone, return_url: returnUrl }),
      });
      const data = await res.json();
      if (data.pay_url) {
        window.location.href = data.pay_url;
      } else {
        toast.error(data.error || "Не удалось создать платёж");
        setLoading(false);
      }
    } catch {
      toast.error("Ошибка соединения с банком");
      setLoading(false);
    }
  };

  return (
    <div
      className="relative rounded-2xl p-6 sm:p-8 overflow-hidden animate-fade-in"
      style={{
        background: "linear-gradient(135deg, rgba(255, 221, 45, 0.06), rgba(0, 212, 255, 0.05))",
        border: "1px solid rgba(255, 221, 45, 0.2)",
        boxShadow: "0 0 60px rgba(255, 221, 45, 0.05)",
      }}
    >
      <button
        onClick={onClose}
        className="absolute top-4 right-4 text-white/30 hover:text-white/60 transition-colors"
      >
        <Icon name="X" size={20} />
      </button>

      <div className="absolute top-0 right-0 w-64 h-64 rounded-full opacity-10 blur-[80px]" style={{ background: "#FFDD2D" }} />

      <div className="relative flex flex-col sm:flex-row items-start gap-5">
        <div
          className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0"
          style={{
            background: "linear-gradient(135deg, #FFDD2D, #ffc800)",
            boxShadow: "0 0 30px rgba(255, 221, 45, 0.25)",
          }}
        >
          <Icon name="CreditCard" size={28} style={{ color: "#0b0e17" }} />
        </div>

        <div className="flex-1 w-full">
          <h3 className="text-xl font-bold text-white font-montserrat mb-1">
            Оплата картой через Т-Банк
          </h3>
          <p className="text-white/50 text-sm leading-relaxed mb-5">
            Деньги зачислятся на ваш лицевой счёт автоматически. Принимаем карты Visa, Mastercard, МИР и СБП.
          </p>

          <div className="flex flex-wrap gap-2 mb-4">
            {QUICK_SUMS.map((s) => (
              <button
                key={s}
                onClick={() => setAmount(String(s))}
                className="px-4 py-2 rounded-xl text-sm font-semibold transition-all"
                style={
                  numAmount === s
                    ? { background: "linear-gradient(135deg, #FFDD2D, #ffc800)", color: "#0b0e17" }
                    : { background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.7)", border: "1px solid rgba(255,255,255,0.08)" }
                }
              >
                {s} ₽
              </button>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <input
                type="number"
                inputMode="decimal"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                min={1}
                placeholder="Сумма"
                className="w-full px-4 py-3 rounded-xl text-white bg-transparent outline-none transition-all"
                style={{ border: "1px solid rgba(255,255,255,0.12)" }}
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 text-sm pointer-events-none">₽</span>
            </div>
            <button
              onClick={handlePay}
              disabled={loading}
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-bold text-sm transition-all duration-300 hover:scale-[1.03] active:scale-[0.97] disabled:opacity-60 disabled:hover:scale-100"
              style={{
                background: "linear-gradient(135deg, #FFDD2D, #ffc800)",
                color: "#0b0e17",
                boxShadow: "0 0 25px rgba(255, 221, 45, 0.25)",
              }}
            >
              {loading ? (
                <Icon name="Loader2" size={16} className="animate-spin" />
              ) : (
                <Icon name="ArrowRight" size={16} />
              )}
              {loading ? "Создаём платёж..." : "Оплатить"}
            </button>
          </div>

          <div className="flex items-center gap-2 mt-4 text-white/30 text-xs">
            <Icon name="ShieldCheck" size={14} />
            Безопасная оплата через Т-Банк. Платёж защищён.
          </div>
        </div>
      </div>
    </div>
  );
}