import Icon from "@/components/ui/icon";
import AiChatPanel from "@/components/AiChatPanel";
import NewsBlock from "@/components/dashboard/NewsBlock";
import { UserData, TabKey } from "./DashboardShared";
import { TabMain, TabBalance } from "./DashboardTabsTop";
import { TabTariff, TabStats, TabSettings } from "./DashboardTabsBottom";

interface Props {
  activeTab: TabKey;
  user: UserData;
  userData: UserData | null;
  loading: boolean;
  isBlocked: boolean;
  onChangeTab: (tab: TabKey) => void;
}

const tabTitles: Record<TabKey, string> = {
  main: "Главная",
  balance: "Баланс и оплата",
  tariff: "Мой тариф",
  stats: "Статистика",
  assistant: "Чат с сотрудником",
  settings: "Настройки",
};

export default function DashboardContent({
  activeTab,
  user,
  userData,
  loading,
  isBlocked,
  onChangeTab,
}: Props) {
  return (
    <main className="pt-16 lg:pl-64 min-h-screen">
      <div className="p-4 md:p-6 lg:p-8 max-w-6xl">
        <div className="mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-white font-montserrat">
            {tabTitles[activeTab]}
          </h1>
          <p className="text-white/40 text-sm mt-1">
            {activeTab === "main" && "Обзор вашего подключения"}
            {activeTab === "balance" && "Управление балансом и история платежей"}
            {activeTab === "tariff" && "Управление тарифным планом"}
            {activeTab === "stats" && "Статистика использования интернета"}
            {activeTab === "assistant" && "Задайте вопрос или оформите заявку на ремонт — сотрудник примет её в работу"}
            {activeTab === "settings" && "Настройки учётной записи"}
          </p>
        </div>

        {isBlocked && (
          <div
            className="relative mb-6 overflow-hidden rounded-3xl animate-fade-in"
            style={{
              background:
                "linear-gradient(135deg, rgba(239,68,68,0.22) 0%, rgba(220,38,38,0.12) 50%, rgba(153,27,27,0.08) 100%)",
              border: "1px solid rgba(239,68,68,0.4)",
              boxShadow:
                "0 0 60px rgba(239,68,68,0.15), inset 0 0 40px rgba(239,68,68,0.05)",
            }}
          >
            {/* Декоративные размытые круги */}
            <div
              className="absolute -top-20 -right-20 w-64 h-64 rounded-full blur-[80px] opacity-40 pointer-events-none"
              style={{ background: "#ef4444" }}
            />
            <div
              className="absolute -bottom-16 -left-16 w-48 h-48 rounded-full blur-[60px] opacity-30 pointer-events-none"
              style={{ background: "#dc2626" }}
            />

            {/* Диагональные полосы */}
            <div
              className="absolute inset-0 opacity-[0.07] pointer-events-none"
              style={{
                background:
                  "repeating-linear-gradient(45deg, transparent, transparent 12px, #fff 12px, #fff 13px)",
              }}
            />

            <div className="relative p-5 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <div
                className="pulse-red-card w-14 h-14 rounded-2xl flex items-center justify-center shrink-0"
                style={{
                  background:
                    "linear-gradient(135deg, rgba(239,68,68,0.3), rgba(220,38,38,0.2))",
                  border: "1px solid rgba(239,68,68,0.5)",
                  boxShadow: "0 0 25px rgba(239,68,68,0.3)",
                }}
              >
                <Icon
                  name="ShieldAlert"
                  size={28}
                  className="pulse-red-icon"
                  style={{ color: "#fecaca" }}
                />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1.5">
                  <span
                    className="text-[10px] font-black tracking-[0.2em] uppercase px-2 py-0.5 rounded-md"
                    style={{
                      background: "rgba(239,68,68,0.2)",
                      color: "#fca5a5",
                      border: "1px solid rgba(239,68,68,0.3)",
                    }}
                  >
                    Внимание
                  </span>
                  <span className="flex items-center gap-1.5 text-xs text-red-300/80">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
                    активно сейчас
                  </span>
                </div>
                <h3
                  className="text-xl sm:text-2xl font-black font-montserrat tracking-tight"
                  style={{
                    background:
                      "linear-gradient(135deg, #fff 0%, #fecaca 100%)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    backgroundClip: "text",
                  }}
                >
                  Услуга заблокирована
                </h3>
                <p className="text-white/60 text-sm mt-1">
                  Пополните баланс, чтобы восстановить доступ к интернету.
                </p>
              </div>

              <button
                onClick={() => onChangeTab("balance")}
                className="pulse-red-card shrink-0 w-full sm:w-auto px-5 py-2.5 rounded-xl font-bold text-sm transition-all hover:scale-[1.04] active:scale-[0.97] flex items-center justify-center gap-2"
                style={{
                  background:
                    "linear-gradient(135deg, #ef4444, #dc2626)",
                  color: "#fff",
                  boxShadow: "0 8px 24px rgba(239,68,68,0.4)",
                }}
              >
                <Icon name="Plus" size={16} />
                Пополнить
              </button>
            </div>
          </div>
        )}

        {activeTab === "main" && <TabMain user={user} loading={loading} onChangeTab={onChangeTab} />}
        {activeTab === "balance" && <TabBalance user={user} payments={userData?.payments} loading={loading} />}
        {activeTab === "tariff" && <TabTariff user={user} loading={loading} />}
        {activeTab === "stats" && <TabStats traffic={userData?.traffic} payments={userData?.payments} trafficSummary={userData?.traffic_summary} loading={loading} login={user.login} />}
        {activeTab === "assistant" && (
          <div className="space-y-6">
            <div
              className="rounded-2xl overflow-hidden animate-fade-in"
              style={{
                background: "rgba(17, 24, 39, 0.6)",
                border: "1px solid rgba(255, 255, 255, 0.08)",
                height: "calc(100vh - 220px)",
                minHeight: "480px",
              }}
            >
              <AiChatPanel
                mode="dashboard"
                context={{
                  name: user.name,
                  login: user.login,
                  phone: user.phone,
                  tariff: user.tariff,
                  speed: user.speed,
                  balance: user.balance,
                  status: user.status,
                  address: user.address,
                  work_until: user.work_until,
                }}
                greeting={`Здравствуйте, ${user.name || "абонент"}! На связи сотрудник АртТелеком Юг. Вижу ваш тариф «${user.tariff || "—"}», баланс ${user.balance || "—"} ₽. Задайте вопрос или нажмите «Оформить заявку», если нужен ремонт или другая помощь.`}
                placeholder="Задайте вопрос сотруднику..."
                accentColor="var(--neon-green)"
                showTicketButton
              />
            </div>
            <NewsBlock />
          </div>
        )}
        {activeTab === "settings" && <TabSettings user={user} />}
      </div>
    </main>
  );
}
