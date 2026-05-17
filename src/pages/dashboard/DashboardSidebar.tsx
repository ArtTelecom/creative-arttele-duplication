import Icon from "@/components/ui/icon";
import { menuItems, UserData, TabKey } from "./DashboardShared";

interface Props {
  user: UserData;
  isBlocked: boolean;
  sidebarOpen: boolean;
  activeTab: TabKey;
  onClose: () => void;
  onLogout: () => void;
  onMenuClick: (key: TabKey | "logout") => void;
}

export default function DashboardSidebar({
  user,
  isBlocked,
  sidebarOpen,
  activeTab,
  onClose,
  onLogout,
  onMenuClick,
}: Props) {
  return (
    <>
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 lg:hidden"
          style={{ background: "rgba(0,0,0,0.6)" }}
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed top-16 left-0 bottom-0 z-40 w-64 flex flex-col transition-transform duration-300 backdrop-blur-xl ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
        style={{
          background: "rgba(11, 14, 23, 0.9)",
          borderRight: "1px solid rgba(255, 255, 255, 0.06)",
        }}
      >
        <div className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
          {menuItems.map((item) => {
            if (item.key === "logout") {
              return (
                <button
                  key={item.key}
                  onClick={onLogout}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm transition-all duration-200 mt-4 border-t pt-5 ${
                    isBlocked
                      ? "pulse-red-card"
                      : "text-white/40 hover:text-white/70 hover:bg-white/[0.03]"
                  }`}
                  style={
                    isBlocked
                      ? {
                          borderColor: "rgba(239, 68, 68, 0.3)",
                          background: "rgba(239, 68, 68, 0.08)",
                          color: "#ef4444",
                        }
                      : { borderColor: "rgba(255,255,255,0.06)" }
                  }
                >
                  <Icon
                    name={item.icon}
                    size={20}
                    className={isBlocked ? "pulse-red-icon" : ""}
                    style={isBlocked ? { color: "#ef4444" } : undefined}
                  />
                  <span>{item.label}</span>
                </button>
              );
            }

            const isActive = activeTab === item.key;
            return (
              <button
                key={item.key}
                onClick={() => onMenuClick(item.key)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm transition-all duration-200 ${
                  isActive || isBlocked
                    ? "font-semibold"
                    : "text-white/50 hover:text-white/80 hover:bg-white/[0.03]"
                } ${isBlocked ? "pulse-red-card" : ""}`}
                style={
                  isBlocked
                    ? {
                        background: isActive ? "rgba(239, 68, 68, 0.18)" : "rgba(239, 68, 68, 0.08)",
                        color: "#ef4444",
                        border: `1px solid ${isActive ? "rgba(239, 68, 68, 0.45)" : "rgba(239, 68, 68, 0.25)"}`,
                      }
                    : isActive
                    ? {
                        background: "rgba(0, 212, 255, 0.1)",
                        color: "var(--neon-blue)",
                        border: "1px solid rgba(0, 212, 255, 0.15)",
                        boxShadow: "0 0 20px rgba(0, 212, 255, 0.05)",
                      }
                    : undefined
                }
              >
                <Icon
                  name={item.icon}
                  size={20}
                  className={isBlocked ? "pulse-red-icon" : ""}
                  style={isBlocked ? { color: "#ef4444" } : isActive ? { color: "var(--neon-blue)" } : undefined}
                />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>

        <div className="p-4 border-t" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
          <div className="flex items-center gap-3 sm:hidden">
            <div
              className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${isBlocked ? "pulse-red-card" : ""}`}
              style={{
                background: isBlocked
                  ? "linear-gradient(135deg, rgba(239,68,68,0.25), rgba(239,68,68,0.15))"
                  : "linear-gradient(135deg, rgba(0,212,255,0.2), rgba(0,245,122,0.2))",
              }}
            >
              <Icon name="User" size={16} className={isBlocked ? "pulse-red-icon" : ""} style={{ color: isBlocked ? "#ef4444" : "var(--neon-blue)" }} />
            </div>
            <div className="min-w-0">
              <p className="text-white text-sm font-semibold truncate">{user.name || "Абонент"}</p>
              <p className="text-white/40 text-xs truncate">{user.account ? `Договор №${user.account}` : user.login}</p>
            </div>
          </div>
          <div className="hidden sm:flex items-center gap-2 text-white/30 text-xs">
            <Icon name="Shield" size={14} className={isBlocked ? "pulse-red-icon" : ""} style={isBlocked ? { color: "#ef4444" } : undefined} />
            <span>Личный кабинет v2.0</span>
          </div>
        </div>
      </aside>
    </>
  );
}
