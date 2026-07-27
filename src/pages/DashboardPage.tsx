import { useState, useEffect } from "react";
import { toast } from "sonner";
import PageBackground from "@/components/PageBackground";
import { TabKey } from "./dashboard/DashboardShared";
import useDashboardData from "./dashboard/useDashboardData";
import DashboardBackground from "./dashboard/DashboardBackground";
import DashboardHeader from "./dashboard/DashboardHeader";
import DashboardSidebar from "./dashboard/DashboardSidebar";
import DashboardContent from "./dashboard/DashboardContent";

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState<TabKey>("main");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const { userData, user, loading, isBlocked, handleLogout, refreshNow } = useDashboardData();

  // Возврат со страницы оплаты Т-Банка: ?paid=<order>&amount=<сумма>
  useEffect(() => {
    const sp = new URLSearchParams(window.location.search);
    if (sp.get("paid")) {
      const amount = sp.get("amount");
      toast.success(
        amount
          ? `Оплата на ${amount} ₽ принята! Баланс обновится в течение минуты.`
          : "Оплата принята! Баланс обновится в течение минуты."
      );
      setActiveTab("balance");
      // Биллинг зачисляет с задержкой — обновляем баланс несколько раз
      const delays = [3000, 10000, 20000, 35000, 55000];
      const timers = delays.map((d) => window.setTimeout(() => refreshNow(), d));
      // Чистим адрес от параметров оплаты
      window.history.replaceState({}, "", window.location.pathname);
      return () => timers.forEach((t) => window.clearTimeout(t));
    }
  }, [refreshNow]);

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

  return (
    <div className={`min-h-screen relative ${isBlocked ? "dashboard-blocked" : ""}`} style={{ background: "var(--dark-bg)" }}>
      <PageBackground />
      <DashboardBackground />

      <DashboardHeader
        user={user}
        isBlocked={isBlocked}
        sidebarOpen={sidebarOpen}
        onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
        onLogout={handleLogout}
      />

      <DashboardSidebar
        user={user}
        isBlocked={isBlocked}
        sidebarOpen={sidebarOpen}
        activeTab={activeTab}
        onClose={() => setSidebarOpen(false)}
        onLogout={handleLogout}
        onMenuClick={handleMenuClick}
      />

      <DashboardContent
        activeTab={activeTab}
        user={user}
        userData={userData}
        loading={loading}
        isBlocked={isBlocked}
        onChangeTab={handleChangeTab}
      />
    </div>
  );
}