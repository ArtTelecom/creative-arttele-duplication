import { useState } from "react";
import Icon from "@/components/ui/icon";
import {
  TabKey,
  UserData,
  GlassCard,
  NeonButton,
  LoadingSpinner,
  computeBalanceForecast,
  getDaysWord,
} from "./DashboardShared";

export function TabMain({ user, loading, onChangeTab }: { user: UserData; loading: boolean; onChangeTab: (tab: TabKey) => void }) {
  if (loading) return <LoadingSpinner />;

  const balance = user.balance || "0.00";
  const isBlocked = user.status?.toLowerCase().includes("блок");
  const forecast = computeBalanceForecast(user);
  const isUrgent = forecast.daysLeft !== null && forecast.daysLeft <= 5;

  const RED = "#ef4444";
  const quickActions = [
    { icon: "CreditCard", label: "Пополнить", color: isBlocked ? RED : "var(--neon-blue)", action: () => onChangeTab("balance") },
    { icon: "MessageCircle", label: "Чат с сотрудником", color: isBlocked ? RED : "var(--neon-green)", action: () => onChangeTab("assistant") },
    { icon: "ArrowRightLeft", label: "Сменить тариф", color: isBlocked ? RED : "var(--neon-purple)", action: () => onChangeTab("tariff") },
    { icon: "HandCoins", label: "Обещанный платёж", color: isBlocked ? RED : "#f59e0b", action: () => onChangeTab("balance") },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <GlassCard className={`p-5 card-hover ${isBlocked ? "pulse-red-card" : ""}`}>
          <div className="flex items-center gap-3 mb-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{
                background: isBlocked ? "rgba(239, 68, 68, 0.12)" : "rgba(0, 212, 255, 0.12)",
                border: isBlocked ? "1px solid rgba(239, 68, 68, 0.2)" : "1px solid rgba(0, 212, 255, 0.2)",
              }}
            >
              <Icon name="Wallet" size={20} className={isBlocked ? "pulse-red-icon" : ""} style={{ color: isBlocked ? RED : "var(--neon-blue)" }} />
            </div>
            <span className="text-white/50 text-sm">Баланс</span>
          </div>
          <p className="text-3xl font-bold text-white font-montserrat mb-3">{balance} ₽</p>
          {isBlocked ? (
            <button
              onClick={() => onChangeTab("balance")}
              className="pulse-red-card w-full text-xs py-2 px-5 rounded-xl font-bold transition-all duration-300 hover:scale-[1.03] active:scale-[0.97] flex items-center justify-center gap-2"
              style={{
                background: "linear-gradient(135deg, #ef4444, #dc2626)",
                color: "#fff",
              }}
            >
              <Icon name="Plus" size={14} className="pulse-red-icon" />
              Пополнить баланс
            </button>
          ) : (
            <NeonButton variant="blue" className="w-full text-xs py-2" onClick={() => onChangeTab("balance")}>
              <Icon name="Plus" size={14} />
              Пополнить баланс
            </NeonButton>
          )}
        </GlassCard>

        <GlassCard className={`p-5 card-hover ${isBlocked ? "pulse-red-card" : ""}`}>
          <div className="flex items-center gap-3 mb-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{
                background: isBlocked ? "rgba(239, 68, 68, 0.12)" : "rgba(0, 245, 122, 0.12)",
                border: isBlocked ? "1px solid rgba(239, 68, 68, 0.2)" : "1px solid rgba(0, 245, 122, 0.2)",
              }}
            >
              <Icon name="Wifi" size={20} className={isBlocked ? "pulse-red-icon" : ""} style={{ color: isBlocked ? RED : "var(--neon-green)" }} />
            </div>
            <span className="text-white/50 text-sm">Тариф</span>
          </div>
          <p className="text-xl font-bold text-white font-montserrat">{user.tariff || "—"}</p>
          <p className="text-white/40 text-sm mt-1">{user.speed || ""}</p>
          {isBlocked ? (
            <button
              onClick={() => onChangeTab("tariff")}
              className="pulse-red-card w-full text-xs py-2 px-5 mt-3 rounded-xl font-bold transition-all duration-300 hover:scale-[1.03] active:scale-[0.97] flex items-center justify-center gap-2"
              style={{
                background: "transparent",
                color: "#ef4444",
                border: "1px solid rgba(239, 68, 68, 0.4)",
              }}
            >
              <Icon name="ArrowRightLeft" size={14} className="pulse-red-icon" />
              Сменить тариф
            </button>
          ) : (
            <NeonButton variant="outline" className="w-full text-xs py-2 mt-3" onClick={() => onChangeTab("tariff")}>
              <Icon name="ArrowRightLeft" size={14} />
              Сменить тариф
            </NeonButton>
          )}
        </GlassCard>

        <GlassCard className={`p-5 card-hover ${isBlocked ? "pulse-red-card" : ""}`}>
          <div className="flex items-center gap-3 mb-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{
                background: isBlocked ? "rgba(239, 68, 68, 0.12)" : "rgba(0, 245, 122, 0.12)",
                border: isBlocked ? "1px solid rgba(239, 68, 68, 0.2)" : "1px solid rgba(0, 245, 122, 0.2)",
              }}
            >
              <Icon
                name={isBlocked ? "XCircle" : "CheckCircle"}
                size={20}
                className={isBlocked ? "pulse-red-icon" : ""}
                style={{ color: isBlocked ? "#ef4444" : "var(--neon-green)" }}
              />
            </div>
            <span className="text-white/50 text-sm">Статус</span>
          </div>
          <div className="flex items-center gap-2 mb-1">
            <span className={`w-2.5 h-2.5 rounded-full ${isBlocked ? "bg-red-500" : "bg-[#00f57a] animate-pulse"}`} />
            <p className="text-lg font-bold text-white">{user.status || "—"}</p>
          </div>
          {user.ip && (
            <div className="text-white/40 text-sm">
              <span className="text-white/50">IP: </span>
              {user.ip
                .split(/#br#|[;,\n]/)
                .map((s) => s.trim())
                .filter(Boolean)
                .map((v, i, arr) => (
                  <span key={i} className="font-mono">
                    {v}
                    {i < arr.length - 1 ? ", " : ""}
                  </span>
                ))}
            </div>
          )}
          {user.mac && (
            <div className="text-white/40 text-sm mt-0.5">
              <span className="text-white/50">MAC: </span>
              {user.mac
                .split(/#br#|[;,\n]/)
                .map((s) => s.trim())
                .filter(Boolean)
                .map((v, i, arr) => (
                  <span key={i} className="font-mono">
                    {v.toUpperCase()}
                    {i < arr.length - 1 ? ", " : ""}
                  </span>
                ))}
            </div>
          )}
        </GlassCard>

        <GlassCard
          className={`p-5 card-hover ${isBlocked ? "pulse-red-card" : ""}`}
          style={
            (isUrgent || isBlocked)
              ? {
                  background: "linear-gradient(135deg, rgba(239,68,68,0.10), rgba(245,158,11,0.06))",
                  border: isBlocked ? undefined : "1px solid rgba(239, 68, 68, 0.25)",
                  boxShadow: isBlocked ? undefined : "0 0 30px rgba(239, 68, 68, 0.06)",
                }
              : undefined
          }
        >
          <div className="flex items-center gap-3 mb-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{
                background: (isUrgent || isBlocked) ? "rgba(239, 68, 68, 0.15)" : "rgba(168, 85, 247, 0.12)",
                border: (isUrgent || isBlocked) ? "1px solid rgba(239, 68, 68, 0.3)" : "1px solid rgba(168, 85, 247, 0.2)",
              }}
            >
              <Icon
                name="CalendarClock"
                size={20}
                className={isBlocked ? "pulse-red-icon" : ""}
                style={{ color: (isUrgent || isBlocked) ? RED : "var(--neon-purple)" }}
              />
            </div>
            <span className="text-white/50 text-sm">Баланса хватит до</span>
          </div>
          <p
            className="text-xl font-bold font-montserrat"
            style={{ color: (isUrgent || isBlocked) ? RED : "#fff" }}
          >
            {forecast.untilDate || "—"}
          </p>
          {forecast.daysLeft !== null ? (
            <p className="text-sm mt-1" style={{ color: (isUrgent || isBlocked) ? "#fca5a5" : "rgba(255,255,255,0.5)" }}>
              Осталось ≈ {forecast.daysLeft} {getDaysWord(forecast.daysLeft)}
            </p>
          ) : user.credit ? (
            <p className="text-white/40 text-sm mt-1">Обещанный платёж: {user.credit} ₽</p>
          ) : (
            <p className="text-white/40 text-sm mt-1">{user.account ? `Договор: ${user.account}` : "—"}</p>
          )}
        </GlassCard>
      </div>

      <GlassCard className="p-6">
        <h3 className="text-lg font-bold text-white font-montserrat mb-4 flex items-center gap-2">
          <Icon name="Zap" size={20} className={isBlocked ? "pulse-red-icon" : ""} style={{ color: isBlocked ? RED : "var(--neon-blue)" }} />
          Быстрые действия
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {quickActions.map((action) => (
            <button
              key={action.label}
              onClick={action.action}
              className="flex flex-col items-center gap-2 p-4 rounded-xl transition-all duration-300 hover:scale-[1.04] active:scale-[0.96]"
              style={{
                background: "rgba(255, 255, 255, 0.03)",
                border: "1px solid rgba(255, 255, 255, 0.06)",
              }}
            >
              <div
                className="w-11 h-11 rounded-xl flex items-center justify-center"
                style={{
                  background: `${action.color}15`,
                  border: `1px solid ${action.color}30`,
                }}
              >
                <Icon name={action.icon} size={22} className={isBlocked ? "pulse-red-icon" : ""} style={{ color: action.color }} />
              </div>
              <span className="text-white/70 text-xs font-medium">{action.label}</span>
            </button>
          ))}
        </div>
      </GlassCard>

      <GlassCard className="p-6">
        <h3 className="text-lg font-bold text-white font-montserrat mb-4 flex items-center gap-2">
          <Icon name="Megaphone" size={20} style={{ color: "#f59e0b" }} />
          Объявления
        </h3>
        <div
          className="p-4 rounded-xl flex items-start gap-3"
          style={{
            background: "rgba(245, 158, 11, 0.06)",
            border: "1px solid rgba(245, 158, 11, 0.15)",
          }}
        >
          <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 mt-0.5" style={{ background: "rgba(245, 158, 11, 0.15)" }}>
            <Icon name="AlertTriangle" size={18} style={{ color: "#f59e0b" }} />
          </div>
          <div>
            <p className="text-white font-semibold text-sm">Плановые технические работы</p>
            <p className="text-white/50 text-sm mt-1">
              20.04.2026 с 02:00 до 06:00 будут проводиться плановые работы на сети. Возможны кратковременные перерывы в предоставлении услуг.
            </p>
          </div>
        </div>
      </GlassCard>
    </div>
  );
}

export function TabBalance({ user, payments, loading }: { user: UserData; payments: UserData["payments"]; loading: boolean }) {
  const [showPayBanner, setShowPayBanner] = useState(false);

  if (loading) return <LoadingSpinner />;

  const balance = user.balance || "0.00";
  const payList = payments || [];
  const forecast = computeBalanceForecast(user);
  const isUrgent = forecast.daysLeft !== null && forecast.daysLeft <= 5;
  const accent = isUrgent ? "#ef4444" : "var(--neon-blue)";

  return (
    <div className="space-y-6 animate-fade-in">
      <GlassCard className="p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <p className="text-white/50 text-sm mb-1">Текущий баланс</p>
            <p className="text-5xl font-bold font-montserrat" style={{ color: "var(--neon-blue)" }}>
              {balance} ₽
            </p>
          </div>
          <div className="flex gap-3">
            <NeonButton variant="blue" onClick={() => setShowPayBanner(true)}>
              <Icon name="Plus" size={16} />
              Пополнить баланс
            </NeonButton>
            <NeonButton variant="outline" onClick={() => setShowPayBanner(true)}>
              <Icon name="HandCoins" size={16} />
              Обещанный платёж
            </NeonButton>
          </div>
        </div>
      </GlassCard>

      <div
        className="relative rounded-2xl p-6 sm:p-7 overflow-hidden"
        style={{
          background: isUrgent
            ? "linear-gradient(135deg, rgba(239,68,68,0.10), rgba(245,158,11,0.05))"
            : "linear-gradient(135deg, rgba(0,212,255,0.08), rgba(168,85,247,0.05))",
          border: `1px solid ${isUrgent ? "rgba(239,68,68,0.25)" : "rgba(0,212,255,0.22)"}`,
          boxShadow: isUrgent ? "0 0 50px rgba(239,68,68,0.08)" : "0 0 50px rgba(0,212,255,0.06)",
        }}
      >
        <div
          className="absolute top-0 right-0 w-72 h-72 rounded-full opacity-10 blur-[80px]"
          style={{ background: isUrgent ? "#ef4444" : "var(--neon-blue)" }}
        />

        <div className="relative flex flex-col lg:flex-row gap-6 lg:items-center lg:justify-between">
          <div className="flex items-start gap-4">
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0"
              style={{
                background: isUrgent ? "rgba(239,68,68,0.18)" : "rgba(0,212,255,0.15)",
                border: `1px solid ${isUrgent ? "rgba(239,68,68,0.3)" : "rgba(0,212,255,0.3)"}`,
                boxShadow: `0 0 25px ${isUrgent ? "rgba(239,68,68,0.15)" : "rgba(0,212,255,0.15)"}`,
              }}
            >
              <Icon
                name={isUrgent ? "AlertTriangle" : "CalendarClock"}
                size={28}
                style={{ color: accent }}
              />
            </div>
            <div>
              <p className="text-white/50 text-sm mb-1">
                {forecast.source === "real"
                  ? "Услуга действует до"
                  : "Баланса хватит до"}
              </p>
              <p
                className="text-3xl sm:text-4xl font-bold font-montserrat"
                style={{ color: accent }}
              >
                {forecast.untilDate || "—"}
              </p>
              {forecast.daysLeft !== null && (
                <p className="text-white/60 text-sm mt-1.5">
                  Осталось ≈{" "}
                  <span className="font-semibold text-white">
                    {forecast.daysLeft > 0
                      ? `${forecast.daysLeft} ${getDaysWord(forecast.daysLeft)}`
                      : forecast.hoursLeft && forecast.hoursLeft > 0
                      ? `${forecast.hoursLeft} ч`
                      : "менее часа"}
                  </span>
                  {forecast.source === "calculated" && (
                    <span className="text-white/35"> · расчёт по балансу</span>
                  )}
                </p>
              )}
              {forecast.topUpNeeded !== null && forecast.topUpNeeded > 0 && (
                <p className="text-white/60 text-xs mt-1.5">
                  До полного месяца нужно ещё{" "}
                  <span className="font-semibold" style={{ color: "#ef4444" }}>
                    {forecast.topUpNeeded} ₽
                  </span>
                </p>
              )}
              {forecast.source === "unknown" && (
                <p className="text-white/50 text-sm mt-1.5">
                  Недостаточно данных для расчёта
                </p>
              )}
            </div>
          </div>

          <div
            className="grid grid-cols-2 gap-4 sm:gap-6 lg:border-l lg:pl-6"
            style={{ borderColor: "rgba(255,255,255,0.08)" }}
          >
            <div>
              <p className="text-white/45 text-xs uppercase tracking-wider mb-1.5">Оплата по тарифу</p>
              <p className="text-xl font-bold text-white font-montserrat">
                {forecast.monthlyFee !== null ? `${forecast.monthlyFee} ₽` : "—"}
              </p>
              <p className="text-white/40 text-xs mt-0.5">в месяц</p>
            </div>
            <div>
              <p className="text-white/45 text-xs uppercase tracking-wider mb-1.5">В день</p>
              <p className="text-xl font-bold text-white font-montserrat">
                {forecast.dailyFee !== null ? `${forecast.dailyFee} ₽` : "—"}
              </p>
              <p className="text-white/40 text-xs mt-0.5">списание</p>
            </div>
          </div>
        </div>

        {isUrgent && (
          <div
            className="relative mt-5 p-3 rounded-xl flex items-start gap-2.5"
            style={{
              background: "rgba(239,68,68,0.08)",
              border: "1px solid rgba(239,68,68,0.18)",
            }}
          >
            <Icon name="Info" size={16} style={{ color: "#ef4444" }} className="shrink-0 mt-0.5" />
            <p className="text-sm text-white/70">
              Скоро потребуется пополнение. Пополните баланс, чтобы избежать отключения услуги.
            </p>
          </div>
        )}
      </div>

      {showPayBanner && (
        <div
          className="relative rounded-2xl p-6 sm:p-8 overflow-hidden animate-fade-in"
          style={{
            background: "linear-gradient(135deg, rgba(239, 68, 68, 0.08), rgba(245, 158, 11, 0.06))",
            border: "1px solid rgba(239, 68, 68, 0.2)",
            boxShadow: "0 0 60px rgba(239, 68, 68, 0.06)",
          }}
        >
          <button
            onClick={() => setShowPayBanner(false)}
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
      )}

      <GlassCard className="p-6">
        <h3 className="text-lg font-bold text-white font-montserrat mb-4">Последние платежи</h3>
        {payList.length === 0 ? (
          <p className="text-white/40 text-sm">Нет данных о платежах</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
                  <th className="text-left text-white/40 font-medium pb-3 pr-4">Дата</th>
                  <th className="text-left text-white/40 font-medium pb-3 pr-4">Сумма</th>
                  <th className="text-left text-white/40 font-medium pb-3 hidden sm:table-cell">Комментарий</th>
                </tr>
              </thead>
              <tbody>
                {payList.map((p, i) => (
                  <tr
                    key={i}
                    className="border-b last:border-b-0"
                    style={{ borderColor: "rgba(255,255,255,0.04)" }}
                  >
                    <td className="py-3 pr-4 text-white/70">{p.date || "—"}</td>
                    <td className="py-3 pr-4 font-semibold" style={{ color: "var(--neon-green)" }}>
                      {p.amount ? `${p.amount} ₽` : "—"}
                    </td>
                    <td className="py-3 text-white/50 hidden sm:table-cell">{p.comment || ""}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </GlassCard>
    </div>
  );
}
