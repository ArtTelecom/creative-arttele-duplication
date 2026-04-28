import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HashRouter as BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import TariffsPage from "./pages/TariffsPage";
import BusinessPage from "./pages/BusinessPage";
import LocationsListPage from "./pages/LocationsListPage";
import LocationPage from "./pages/LocationPage";
import AboutPage from "./pages/AboutPage";
import BlogPage from "./pages/BlogPage";
import FaqPage from "./pages/FaqPage";
import ContactsPage from "./pages/ContactsPage";
import SpeedTestPage from "./pages/SpeedTestPage";
import VideoSurveillancePage from "./pages/VideoSurveillancePage";
import CloudVideoPage from "./pages/CloudVideoPage";
import CloudCabinetPage from "./pages/CloudCabinetPage";
import CloudLoginPage from "./pages/CloudLoginPage";
import LoginPage from "./pages/LoginPage";
import DashboardPage from "./pages/DashboardPage";
import AdminStatsPage from "./pages/AdminStatsPage";
import RequisitesPage from "./pages/RequisitesPage";
import OfferPage from "./pages/OfferPage";
import NotFound from "./pages/NotFound";
import ChatWidget from "./components/ChatWidget";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/tariffs" element={<TariffsPage />} />
          <Route path="/business" element={<BusinessPage />} />
          <Route path="/locations" element={<LocationsListPage />} />
          <Route path="/location/:slug" element={<LocationPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/blog" element={<BlogPage />} />
          <Route path="/faq" element={<FaqPage />} />
          <Route path="/contacts" element={<ContactsPage />} />
          <Route path="/speedtest" element={<SpeedTestPage />} />
          <Route path="/video" element={<VideoSurveillancePage />} />
          <Route path="/video/cloud" element={<CloudVideoPage />} />
          <Route path="/video/cabinet" element={<CloudCabinetPage />} />
          <Route path="/video/login" element={<CloudLoginPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/admin/stats" element={<AdminStatsPage />} />
          <Route path="/requisites" element={<RequisitesPage />} />
          <Route path="/offer" element={<OfferPage />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
        <ChatWidget />
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;