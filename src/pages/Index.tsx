import Navbar from "@/components/Navbar";
import HeroSection from "@/components/index-page/HeroSection";
import ServicesAndTariffs from "@/components/index-page/ServicesAndTariffs";
import CoverageAndFaq from "@/components/index-page/CoverageAndFaq";
import NewsPreview from "@/components/index-page/NewsPreview";
import LkAndFooter from "@/components/index-page/LkAndFooter";

const HERO_IMG = "https://cdn.poehali.dev/projects/5573dd0c-764b-4bc3-951f-74ecfdbb396f/files/9344e7ca-fcbc-4475-8001-83fa179e1412.jpg";
const CITY_IMG = "https://cdn.poehali.dev/projects/5573dd0c-764b-4bc3-951f-74ecfdbb396f/files/8c65a182-986a-4921-8613-7a88e4c04b6f.jpg";
const WORK_IMG = "https://cdn.poehali.dev/projects/5573dd0c-764b-4bc3-951f-74ecfdbb396f/files/16177b32-dfe0-4dd3-bfd5-a6620431a2a3.jpg";

const navLinks = [
  { label: "Услуги", href: "#services" },
  { label: "Тарифы", href: "#tariffs" },
  { label: "Покрытие", href: "#coverage" },
];

export default function Index() {
  const scrollTo = (href: string) => {
    const el = document.getElementById(href.replace("#", ""));
    el?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="min-h-screen mesh-bg noise font-sans text-white">

      <Navbar />

      <HeroSection heroImg={HERO_IMG} scrollTo={scrollTo} />

      <ServicesAndTariffs />

      <NewsPreview />

      <CoverageAndFaq heroImg={HERO_IMG} cityImg={CITY_IMG} workImg={WORK_IMG} />

      <LkAndFooter />
    </div>
  );
}