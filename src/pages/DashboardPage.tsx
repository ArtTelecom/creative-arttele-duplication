import { useState } from "react";
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

  const { userData, user, loading, isBlocked, handleLogout } = useDashboardData();

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
