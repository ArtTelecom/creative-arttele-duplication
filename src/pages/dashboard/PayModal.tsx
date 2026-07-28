import { useState } from "react";
import Icon from "@/components/ui/icon";
import { UserData, NeonButton } from "./DashboardShared";
import funcUrls from "../../../backend/func2url.json";

const QUICK_AMOUNTS = [300, 500, 800, 1000, 1500, 2000];

export default function PayModal({ user, onClose }: { user: UserData; onClose: () => void }) {
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const login = (user.login || user.account || "").trim();

  const pay = async () => {
    const sum = parseFloat(amount.replace(",", "."));
    if (!login) {
      setError("Не удалось определить лицевой счёт. Войдите заново.");
      return;
    }
    if (!sum || sum < 1) {
      setError("Введите сумму от 1 ₽");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const res = await fetch(`${funcUrls["tbank-pay"]}?action=create`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          login,
          amount: sum,
          email: user.email || "",
          phone: user.phone || "",
          return_url: `${window.location.origin}/`,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.pay_url) {
        setError(data.error || "Не удалось создать платёж. Попробуйте позже.");
        return;
      }
      window.location.href = data.pay_url;
    } catch {
      setError("Ошибка соединения. Попробуйте ещё раз.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in"
      style={{ background: "rgba(4, 6, 12, 0.75)", backdropFilter: "blur(6px)" }}
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-md rounded-2xl p-6 sm:p-8"
        style={{
          background: "linear-gradient(135deg, rgba(17,22,36,0.98), rgba(11,14,23,0.98))",
          border: "1px solid rgba(0, 212, 255, 0.2)",
          boxShadow: "0 0 60px rgba(0, 212, 255, 0.12)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-white/30 hover:text-white/60 transition-colors"
        >
          <Icon name="X" size={20} />
        </button>

        <div className="flex items-center gap-3 mb-5">
          <div
            className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: "rgba(0,212,255,0.1)", border: "1px solid rgba(0,212,255,0.2)" }}
          >
            <Icon name="CreditCard" size={22} style={{ color: "var(--neon-blue)" }} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white font-montserrat">Пополнение баланса</h3>
            <p className="text-white/40 text-xs">Лицевой счёт {login || "—"}</p>
          </div>
        </div>

        <label className="block text-white/50 text-sm mb-2">Сумма пополнения, ₽</label>
        <input
          type="number"
          inputMode="decimal"
          min={1}
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="Например, 800"
          className="w-full px-4 py-3 rounded-xl text-white text-lg font-semibold outline-none mb-3"
          style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)" }}
          autoFocus
        />

        <div className="grid grid-cols-3 gap-2 mb-5">
          {QUICK_AMOUNTS.map((a) => (
            <button
              key={a}
              onClick={() => setAmount(String(a))}
              className="py-2 rounded-lg text-sm font-semibold text-white/70 transition-all hover:text-white"
              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
            >
              {a} ₽
            </button>
          ))}
        </div>

        {error && (
          <p className="text-sm mb-4 flex items-center gap-2" style={{ color: "#ef4444" }}>
            <Icon name="TriangleAlert" size={15} />
            {error}
          </p>
        )}

        <NeonButton variant="blue" onClick={pay} className="w-full">
          {loading ? (
            <>
              <Icon name="LoaderCircle" size={16} className="animate-spin" />
              Создаём платёж…
            </>
          ) : (
            <>
              <Icon name="CreditCard" size={16} />
              Перейти к оплате
            </>
          )}
        </NeonButton>

        <p className="text-white/30 text-xs text-center mt-4">
          Оплата картой через Т-Банк. Баланс пополнится автоматически.
        </p>
      </div>
    </div>
  );
}