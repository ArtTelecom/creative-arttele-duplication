import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import Icon from "@/components/ui/icon";
import PageBackground from "@/components/PageBackground";

const navLinks = [
  { label: "Главная",    href: "/" },
  { label: "Тарифы",     href: "/tariffs" },
  { label: "Районы",     href: "/locations" },
  { label: "Бизнес",     href: "/business" },
  { label: "О компании", href: "/about" },
  { label: "Блог",       href: "/blog" },
  { label: "FAQ",        href: "/faq" },
  { label: "Контакты",   href: "/contacts" },
  { label: "Документы",  href: "/documents" },
  { label: "Тест скорости", href: "/speedtest" },
  { label: "Видеонаблюдение", href: "/video" },
  { label: "Облачное видео", href: "/video/cloud" },
];

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userName, setUserName] = useState("");
  const location = useLocation();

  useEffect(() => {
    try {
      const raw = localStorage.getItem("lk_user");
      if (raw) {
        const user = JSON.parse(raw);
        if (user && user.name) {
          setIsLoggedIn(true);
          setUserName(user.name);
        }
      }
    } catch {
      setIsLoggedIn(false);
      setUserName("");
    }
  }, [location.pathname]);

  return (
    <>
    <PageBackground />
    <nav className="fixed top-0 left-0 right-0 z-50 nav-blur">
      <div className="max-w-7xl mx-auto px-6 flex items-center justify-between h-16">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl overflow-hidden shrink-0">
            <img src="https://cdn.poehali.dev/projects/5573dd0c-764b-4bc3-951f-74ecfdbb396f/files/eab6cd5f-932d-4520-b6dc-7b7f9fa0ff47.jpg" alt="АртТелеком Юг" className="w-full h-full object-cover" />
          </div>
          <span className="font-montserrat font-black text-lg tracking-tight leading-none">
            <span style={{ color: "var(--neon-blue)" }}>АртТелеком</span>
            <span className="text-white"> Юг</span>
          </span>
        </Link>

        <div className="hidden lg:flex items-center gap-1">
          {navLinks.map(link => (
            <Link
              key={link.href}
              to={link.href}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                location.pathname === link.href
                  ? "text-[#00d4ff] bg-[rgba(0,212,255,0.1)]"
                  : "text-white/85 hover:text-white hover:bg-white/5"
              }`}
            >
              {link.label}
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-3">
          {isLoggedIn ? (
            <Link
              to="/dashboard"
              className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-sm neon-glow-btn text-[#0b0e17]"
              style={{ background: "linear-gradient(135deg, var(--neon-blue), var(--neon-green))" }}
            >
              <div className="w-5 h-5 rounded-full bg-[#0b0e17]/20 flex items-center justify-center text-[10px] font-black uppercase shrink-0">
                {userName.charAt(0)}
              </div>
              <span className="max-w-[120px] truncate">{userName}</span>
            </Link>
          ) : (
            <Link
              to="/login"
              className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-sm neon-glow-btn text-[#0b0e17]"
              style={{ background: "linear-gradient(135deg, var(--neon-blue), var(--neon-green))" }}
            >
              <Icon name="User" size={15} />
              Личный кабинет
            </Link>
          )}
          <button className="lg:hidden text-white/70 hover:text-white" onClick={() => setMenuOpen(!menuOpen)}>
            <Icon name={menuOpen ? "X" : "Menu"} size={24} />
          </button>
        </div>
      </div>

      {menuOpen && (
        <div className="lg:hidden border-t border-white/5 bg-[#0b0e17]/95 px-6 py-4 flex flex-col gap-2">
          {navLinks.map(link => (
            <Link
              key={link.href}
              to={link.href}
              onClick={() => setMenuOpen(false)}
              className={`px-3 py-2 rounded-lg text-sm transition-all ${
                location.pathname === link.href
                  ? "text-[#00d4ff] bg-[rgba(0,212,255,0.1)]"
                  : "text-white/85 hover:text-white hover:bg-white/5"
              }`}
            >
              {link.label}
            </Link>
          ))}
          {isLoggedIn ? (
            <Link
              to="/dashboard"
              onClick={() => setMenuOpen(false)}
              className="mt-2 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-[#0b0e17] font-bold text-sm"
              style={{ background: "linear-gradient(135deg, var(--neon-blue), var(--neon-green))" }}
            >
              <div className="w-5 h-5 rounded-full bg-[#0b0e17]/20 flex items-center justify-center text-[10px] font-black uppercase shrink-0">
                {userName.charAt(0)}
              </div>
              <span className="max-w-[120px] truncate">{userName}</span>
            </Link>
          ) : (
            <Link
              to="/login"
              onClick={() => setMenuOpen(false)}
              className="mt-2 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-[#0b0e17] font-bold text-sm"
              style={{ background: "linear-gradient(135deg, var(--neon-blue), var(--neon-green))" }}
            >
              <Icon name="User" size={15} /> Личный кабинет
            </Link>
          )}
        </div>
      )}
    </nav>
    </>
  );
}