import { Suspense, lazy } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HashRouter as BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import ChatWidget from "./components/ChatWidget";

const TariffsPage = lazy(() => import("./pages/TariffsPage"));
const BusinessPage = lazy(() => import("./pages/BusinessPage"));
const LocationsListPage = lazy(() => import("./pages/LocationsListPage"));
const LocationPage = lazy(() => import("./pages/LocationPage"));
const AboutPage = lazy(() => import("./pages/AboutPage"));
const BlogPage = lazy(() => import("./pages/BlogPage"));
const FaqPage = lazy(() => import("./pages/FaqPage"));
const ContactsPage = lazy(() => import("./pages/ContactsPage"));
const SpeedTestPage = lazy(() => import("./pages/SpeedTestPage"));
const VideoSurveillancePage = lazy(() => import("./pages/VideoSurveillancePage"));
const CloudVideoPage = lazy(() => import("./pages/CloudVideoPage"));
const CloudCabinetPage = lazy(() => import("./pages/CloudCabinetPage"));
const CloudLoginPage = lazy(() => import("./pages/CloudLoginPage"));
const LoginPage = lazy(() => import("./pages/LoginPage"));
const DashboardPage = lazy(() => import("./pages/DashboardPage"));
const AdminStatsPage = lazy(() => import("./pages/AdminStatsPage"));
const StatusPage = lazy(() => import("./pages/StatusPage"));
const RequisitesPage = lazy(() => import("./pages/RequisitesPage"));
const OfferPage = lazy(() => import("./pages/OfferPage"));
const DocumentsPage = lazy(() => import("./pages/DocumentsPage"));
const NotFound = lazy(() => import("./pages/NotFound"));

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Suspense fallback={null}>
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
          <Route path="/status" element={<StatusPage />} />
          <Route path="/requisites" element={<RequisitesPage />} />
          <Route path="/offer" element={<OfferPage />} />
          <Route path="/documents" element={<DocumentsPage />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
        </Suspense>
        <ChatWidget />
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;