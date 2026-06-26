import { useState, useEffect } from "react";
import PageBackground from "@/components/PageBackground";
import { TabKey } from "./dashboard/DashboardShared";
import useDashboardData from "./dashboard/useDashboardData";
import DashboardBackground from "./dashboard/DashboardBackground";
import DashboardHeader from "./dashboard/DashboardHeader";
import DashboardSidebar from "./dashboard/DashboardSidebar";
import DashboardContent from "./dashboard/DashboardContent";
import PaymentSuccess from "./dashboard/PaymentSuccess";

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState<TabKey>("main");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [paidAmount, setPaidAmount] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);

  const { userData, user, loading, isBlocked, handleRefresh, handleLogout } = useDashboardData();

  useEffect(() => {
    const hash = window.location.hash;
    const qIndex = hash.indexOf("?");
    if (qIndex === -1) return;
    const params = new URLSearchParams(hash.slice(qIndex + 1));
    if (params.get("paid")) {
      setPaidAmount(params.get("amount"));
      setShowSuccess(true);
      setActiveTab("balance");
      const timers = [3000, 8000, 15000].map((ms) =>
        window.setTimeout(() => handleRefresh(), ms)
      );
      const base = hash.slice(0, qIndex);
      window.history.replaceState(null, "", window.location.pathname + base);
      return () => timers.forEach((t) => window.clearTimeout(t));
    }
  }, []);

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

      {showSuccess && (
        <PaymentSuccess amount={paidAmount || undefined} onClose={() => setShowSuccess(false)} />
      )}
    </div>
  );
}