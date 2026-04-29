import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import Icon from "@/components/ui/icon";
import PageBackground from "@/components/PageBackground";
import AiChatPanel from "@/components/AiChatPanel";
import NewsBlock from "@/components/dashboard/NewsBlock";
import { toast } from "sonner";
import funcUrls from "../../backend/func2url.json";
import { LOGO_URL, menuItems, UserData, TabKey } from "./dashboard/DashboardShared";
import { TabMain, TabBalance } from "./dashboard/DashboardTabsTop";
import { TabTariff, TabStats, TabSettings } from "./dashboard/DashboardTabsBottom";

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState<TabKey>("main");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();

  const [userData, setUserData] = useState<UserData | null>(() => {
    try {
      const cached = localStorage.getItem("lk_user");
      return cached ? (JSON.parse(cached) as UserData) : null;
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(() => {
    try {
      return !localStorage.getItem("lk_user");
    } catch {
      return true;
    }
  });
  const [refreshing, setRefreshing] = useState(false);
  const fetchRef = useRef<((initial: boolean) => void) | null>(null);

  useEffect(() => {
    const credsStr = localStorage.getItem("lk_creds");
    if (!credsStr) {
      navigate("/login");
      return;
    }

    let creds: { login: string; password: string };
    try {
      creds = JSON.parse(decodeURIComponent(escape(atob(credsStr))));
    } catch {
      navigate("/login");
      return;
    }

    const url = funcUrls["mikrobill-scraper"];
    let cancelled = false;

    const fetchUserData = (initial: boolean) => {
      const ts = Date.now();
      fetch(`${url}?action=user_info&login=${encodeURIComponent(creds.login)}&password=${encodeURIComponent(creds.password)}&_=${ts}`, { cache: "no-store" })
        .then((r) => r.json())
        .then((data) => {
          if (cancelled) return;
          setUserData(data);
          try {
            localStorage.setItem("lk_user", JSON.stringify(data));
          } catch {
            /* ignore */
          }
          if (initial) setLoading(false);
          setRefreshing(false);
        })
        .catch(() => {
          if (initial && !cancelled) setLoading(false);
          setRefreshing(false);
        });
    };

    fetchRef.current = fetchUserData;
    fetchUserData(true);

    let lastFetch = Date.now();
    const MIN_GAP_MS = 30_000;
    const safeFetch = () => {
      const now = Date.now();
      if (now - lastFetch < MIN_GAP_MS) return;
      lastFetch = now;
      fetchUserData(false);
    };

    const intervalId = window.setInterval(safeFetch, 60_000);
    const onFocus = () => safeFetch();
    const onVisibility = () => {
      if (document.visibilityState === "visible") safeFetch();
    };
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [navigate]);

  const user: UserData = userData || JSON.parse(localStorage.getItem("lk_user") || '{"login":"","name":"","balance":"","tariff":"","speed":"","status":"","account":"","address":"","phone":"","email":"","credit":"","ip":"","mac":"","group":"","work_until":""}');

  const isBlocked = (user.status || "").toLowerCase().includes("блок");

  const handleRefresh = () => {
    if (refreshing) return;
    setRefreshing(true);
    fetchRef.current?.(false);
    toast.info("Обновляю данные с биллинга...");
  };

  const handleLogout = () => {
    localStorage.removeItem("lk_user");
    localStorage.removeItem("lk_creds");
    navigate("/login");
  };

  const handleMenuClick = (key: TabKey | "logout") => {
    if (key === "logout") {
      handleLogout();
      return;
    }
    setActiveTab(key);
    setSidebarOpen(false);
  };

  const handleChangeTab = (tab: TabKey) => {
    setActiveTab(tab);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const tabTitles: Record<TabKey, string> = {
    main: "Главная",
    balance: "Баланс и оплата",
    tariff: "Мой тариф",
    stats: "Статистика",
    assistant: "Чат с сотрудником",
    settings: "Настройки",
  };

  return (
    <div className={`min-h-screen relative ${isBlocked ? "dashboard-blocked" : ""}`} style={{ background: "var(--dark-bg)" }}>
      <PageBackground />

      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        <div
          className="absolute w-[700px] h-[700px] rounded-full blur-[180px]"
          style={{
            background: "var(--neon-blue)",
            top: "10%",
            left: "-10%",
            opacity: 0.15,
            animation: "dashPulse1 8s ease-in-out infinite",
          }}
        />
        <div
          className="absolute w-[600px] h-[600px] rounded-full blur-[160px]"
          style={{
            background: "var(--neon-green)",
            bottom: "0%",
            right: "-10%",
            opacity: 0.12,
            animation: "dashPulse2 10s ease-in-out infinite",
          }}
        />
        <div
          className="absolute w-[500px] h-[500px] rounded-full blur-[140px]"
          style={{
            background: "var(--neon-purple)",
            top: "50%",
            left: "40%",
            transform: "translate(-50%, -50%)",
            opacity: 0.08,
            animation: "dashPulse3 12s ease-in-out infinite",
          }}
        />
      </div>

      <header
        className="fixed top-0 left-0 right-0 z-50 h-16 flex items-center justify-between px-4 md:px-6 backdrop-blur-xl"
        style={{
          background: "rgba(11, 14, 23, 0.85)",
          borderBottom: "1px solid rgba(255, 255, 255, 0.06)",
        }}
      >
        <div className="flex items-center gap-3">
          <button
            className="lg:hidden w-10 h-10 rounded-xl flex items-center justify-center transition-colors"
            style={{ background: "rgba(255,255,255,0.05)" }}
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            <Icon name={sidebarOpen ? "X" : "Menu"} size={20} className="text-white" />
          </button>
          <Link to="/" className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg overflow-hidden shrink-0">
              <img src={LOGO_URL} alt="АртТелеком Юг" className="w-full h-full object-cover" />
            </div>
            <span className="font-montserrat font-black text-lg tracking-tight leading-none hidden sm:block">
              <span style={{ color: "var(--neon-blue)" }}>АртТелеком</span>
              <span className="text-white"> Юг</span>
            </span>
          </Link>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right hidden sm:block">
            <p className="text-white text-sm font-semibold">{user.name || "Абонент"}</p>
            <p className="text-white/40 text-xs">{user.account ? `Договор №${user.account}` : user.login}</p>
          </div>
          <div
            className={`w-9 h-9 rounded-full flex items-center justify-center ${isBlocked ? "pulse-red-card" : ""}`}
            style={{
              background: isBlocked
                ? "linear-gradient(135deg, rgba(239,68,68,0.25), rgba(239,68,68,0.15))"
                : "linear-gradient(135deg, rgba(0,212,255,0.2), rgba(0,245,122,0.2))",
              border: isBlocked ? "1px solid rgba(239,68,68,0.4)" : "1px solid rgba(0,212,255,0.2)",
            }}
          >
            <Icon name="User" size={18} className={isBlocked ? "pulse-red-icon" : ""} style={{ color: isBlocked ? "#ef4444" : "var(--neon-blue)" }} />
          </div>
          <button
            onClick={handleLogout}
            className="hidden sm:flex items-center gap-1.5 text-white/40 hover:text-white/70 text-sm transition-colors"
          >
            <Icon name="LogOut" size={16} />
            <span>Выйти</span>
          </button>
        </div>
      </header>

      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 lg:hidden"
          style={{ background: "rgba(0,0,0,0.6)" }}
          onClick={() => setSidebarOpen(false)}
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
                  onClick={handleLogout}
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
                onClick={() => handleMenuClick(item.key)}
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
                    "repeating-linear-gradient(45deg, #ef4444 0px, #ef4444 12px, transparent 12px, transparent 32px)",
                }}
              />

              <div className="relative flex flex-col sm:flex-row items-start sm:items-center gap-4 p-5 sm:p-6">
                <div
                  className="pulse-red-card shrink-0 w-14 h-14 rounded-2xl flex items-center justify-center"
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
                  onClick={() => handleChangeTab("balance")}
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

          {activeTab === "main" && <TabMain user={user} loading={loading} onChangeTab={handleChangeTab} />}
          {activeTab === "balance" && <TabBalance user={user} payments={userData?.payments} loading={loading} />}
          {activeTab === "tariff" && <TabTariff user={user} loading={loading} />}
          {activeTab === "stats" && <TabStats traffic={userData?.traffic} payments={userData?.payments} loading={loading} login={user.login} />}
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
    </div>
  );
}