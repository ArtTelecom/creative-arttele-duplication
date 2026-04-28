import Icon from "@/components/ui/icon";
import NewsBlock from "@/components/dashboard/NewsBlock";
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

      <NewsBlock />
    </>
  );
}