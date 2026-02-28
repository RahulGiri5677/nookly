import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { ThemeProvider } from "@/hooks/useTheme";
import { ScrollToTop } from "@/components/ScrollToTop";
import { GenderGate } from "@/components/nook/GenderGate";
import { useGenderGate } from "@/hooks/useGenderGate";
import { NookToastContainer } from "@/components/nook/NookToast";


// Pages
import Splash from "./pages/Splash";
import Auth from "./pages/Auth";
import Home from "./pages/Home";
import RaiseNook from "./pages/RaiseNook";
import ExploreNooks from "./pages/ExploreNooks";
import NookDetail from "./pages/NookDetail";
import EditNook from "./pages/EditNook";
import MyNooks from "./pages/MyNooks";
import Notifications from "./pages/Notifications";
import NotFound from "./pages/NotFound";
import MarkAttendance from "./pages/MarkAttendance";
import FeedbackPage from "./pages/Feedback";
import Profile from "./pages/Profile";
import EditProfile from "./pages/EditProfile";
import PrivacySettings from "./pages/PrivacySettings";
import NotificationSettings from "./pages/NotificationSettings";
import ReportSafety from "./pages/ReportSafety";
import AdminPanel from "./pages/AdminPanel";
import FounderDashboard from "./pages/FounderDashboard";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsOfService from "./pages/TermsOfService";
import CreateAccount from "./pages/CreateAccount";
import AuthCallback from "./pages/AuthCallback";
import HostAnchorMode from "./pages/HostAnchorMode";

const queryClient = new QueryClient();

function AppContent() {
  const { needsGender, dismiss } = useGenderGate();
  return (
    <>
      {needsGender && <GenderGate onComplete={dismiss} />}
      <BrowserRouter>
        <ScrollToTop />
        <Routes>
          <Route path="/" element={<Splash />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/auth/callback" element={<AuthCallback />} />
          <Route path="/auth/create" element={<CreateAccount />} />
          <Route path="/home" element={<Home />} />
          <Route path="/raise" element={<RaiseNook />} />
          <Route path="/explore" element={<ExploreNooks />} />
          <Route path="/nook/:id" element={<NookDetail />} />
          <Route path="/nook/:id/edit" element={<EditNook />} />
          <Route path="/nook/:id/attendance" element={<MarkAttendance />} />
          <Route path="/nook/:id/feedback" element={<FeedbackPage />} />
          <Route path="/nook/:id/host-mode" element={<HostAnchorMode />} />
          <Route path="/my-nooks" element={<MyNooks />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/profile/edit" element={<EditProfile />} />
          <Route path="/settings/privacy" element={<PrivacySettings />} />
          <Route path="/settings/notifications" element={<NotificationSettings />} />
          <Route path="/report" element={<ReportSafety />} />
          <Route path="/notifications" element={<Notifications />} />
          <Route path="/founder" element={<FounderDashboard />} />
          <Route path="/founder/legacy" element={<AdminPanel />} />
          <Route path="/privacy" element={<PrivacyPolicy />} />
          <Route path="/terms" element={<TermsOfService />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <NookToastContainer />
          <AppContent />
        </TooltipProvider>
      </AuthProvider>
    </ThemeProvider>
  </QueryClientProvider>
);


export default App;
