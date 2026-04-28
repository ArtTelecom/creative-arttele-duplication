import Icon from "@/components/ui/icon";
import {
  TabKey,
  UserData,
  GlassCard,
  NeonButton,
  computeBalanceForecast,
  getDaysWord,
} from "./DashboardShared";

export default function MainStatsCards({
  user,
  onChangeTab,
}: {
  user: UserData;
  onChangeTab: (tab: TabKey) => void;
}) {
  const balance = user.balance || "0.00";
  const isBlocked = user.status?.toLowerCase().includes("блок");
  const forecast = computeBalanceForecast(user);
  const isUrgent = forecast.daysLeft !== null && forecast.daysLeft <= 5;
  const RED = "#ef4444";

  return (
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
  );
}
