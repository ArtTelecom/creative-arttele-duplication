import { Link } from "react-router-dom";
import Icon from "@/components/ui/icon";
import { LOGO_URL, UserData } from "./DashboardShared";

interface Props {
  user: UserData;
  isBlocked: boolean;
  sidebarOpen: boolean;
  onToggleSidebar: () => void;
  onLogout: () => void;
}

export default function DashboardHeader({
  user,
  isBlocked,
  sidebarOpen,
  onToggleSidebar,
  onLogout,
}: Props) {
  return (
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
          onClick={onToggleSidebar}
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
          onClick={onLogout}
          className="hidden sm:flex items-center gap-1.5 text-white/40 hover:text-white/70 text-sm transition-colors"
        >
          <Icon name="LogOut" size={16} />
          <span>Выйти</span>
        </button>
      </div>
    </header>
  );
}
