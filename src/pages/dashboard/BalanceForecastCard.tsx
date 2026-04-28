import Icon from "@/components/ui/icon";
import {
  UserData,
  computeBalanceForecast,
  getDaysWord,
} from "./DashboardShared";

export default function BalanceForecastCard({ user }: { user: UserData }) {
  const forecast = computeBalanceForecast(user);
  const isUrgent = forecast.daysLeft !== null && forecast.daysLeft <= 5;
  const accent = isUrgent ? "#ef4444" : "var(--neon-blue)";

  return (
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
  );
}
