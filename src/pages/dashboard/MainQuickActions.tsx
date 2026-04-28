import Icon from "@/components/ui/icon";
import {
  TabKey,
  UserData,
  GlassCard,
} from "./DashboardShared";

export default function MainQuickActions({
  user,
  onChangeTab,
}: {
  user: UserData;
  onChangeTab: (tab: TabKey) => void;
}) {
  const isBlocked = user.status?.toLowerCase().includes("блок");
  const RED = "#ef4444";
  const quickActions = [
    { icon: "CreditCard", label: "Пополнить", color: isBlocked ? RED : "var(--neon-blue)", action: () => onChangeTab("balance") },
    { icon: "MessageCircle", label: "Чат с сотрудником", color: isBlocked ? RED : "var(--neon-green)", action: () => onChangeTab("assistant") },
    { icon: "ArrowRightLeft", label: "Сменить тариф", color: isBlocked ? RED : "var(--neon-purple)", action: () => onChangeTab("tariff") },
    { icon: "HandCoins", label: "Обещанный платёж", color: isBlocked ? RED : "#f59e0b", action: () => onChangeTab("balance") },
  ];

  return (
    <>
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
    </>
  );
}
