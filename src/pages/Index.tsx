import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import HeroSection from "@/components/index-page/HeroSection";
import ServicesAndTariffs from "@/components/index-page/ServicesAndTariffs";
import CoverageAndFaq from "@/components/index-page/CoverageAndFaq";
import LkAndFooter from "@/components/index-page/LkAndFooter";

const HERO_IMG = "https://cdn.poehali.dev/projects/5573dd0c-764b-4bc3-951f-74ecfdbb396f/files/9344e7ca-fcbc-4475-8001-83fa179e1412.jpg";
const CITY_IMG = "https://cdn.poehali.dev/projects/5573dd0c-764b-4bc3-951f-74ecfdbb396f/files/8c65a182-986a-4921-8613-7a88e4c04b6f.jpg";
const WORK_IMG = "https://cdn.poehali.dev/projects/5573dd0c-764b-4bc3-951f-74ecfdbb396f/files/16177b32-dfe0-4dd3-bfd5-a6620431a2a3.jpg";

export default function Index() {
  const navigate = useNavigate();

  // Возврат после оплаты Т-Банка приходит на главную (/?paid=...&amount=...),
  // чтобы избежать 404 на прямом заходе в /dashboard.
  // Переводим в личный кабинет клиентской навигацией — там покажется сообщение и обновится баланс.
  useEffect(() => {
    // Прямой заход по «чистому» адресу (без #) на служебные разделы —
    // сервер отдаёт главную, поэтому переводим на нужный хеш-маршрут.
    const path = window.location.pathname.replace(/\/+$/, "");
    const directRoutes = ["/dev/console", "/dev", "/admin/payments", "/admin/stats"];
    const hit = directRoutes.find((r) => path === r || path.endsWith(r));
    if (hit) {
      navigate(hit, { replace: true });
      return;
    }

    const sp = new URLSearchParams(window.location.search);
    if (sp.get("paid")) {
      navigate(`/dashboard${window.location.search}`, { replace: true });
      return;
    }
    // Установленные PWA стартуют с главной (/?app=...), чтобы не было 404 на сервере.
    // Отсюда клиентской навигацией переводим на нужный экран приложения.
    const app = sp.get("app");
    if (app === "speedtest") {
      navigate("/speedtest", { replace: true });
    } else if (app === "lk") {
      navigate("/login", { replace: true });
    }
  }, [navigate]);

  const scrollTo = (href: string) => {
    const el = document.getElementById(href.replace("#", ""));
    el?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="min-h-screen mesh-bg noise font-sans text-white">

      <Navbar />

      <HeroSection heroImg={HERO_IMG} scrollTo={scrollTo} />

      <ServicesAndTariffs />

      <CoverageAndFaq heroImg={HERO_IMG} cityImg={CITY_IMG} workImg={WORK_IMG} />

      <LkAndFooter />
    </div>
  );
}