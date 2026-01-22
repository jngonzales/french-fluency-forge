import { Suspense, lazy } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import { DevNav } from "@/components/DevNav";
import { DevSessionViewer } from "@/components/DevSessionViewer";
import { AdminToolbar } from "@/components/AdminToolbar";
import { SpeedInsights } from "@vercel/speed-insights/react";
import { Analytics } from "@vercel/analytics/react";

// Lazy load all pages for code-splitting
const Index = lazy(() => import("./pages/Index"));
const Signup = lazy(() => import("./pages/Signup"));
const Login = lazy(() => import("./pages/Login"));
const ForgotPassword = lazy(() => import("./pages/ForgotPassword"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const Assessment = lazy(() => import("./pages/Assessment"));
const Results = lazy(() => import("./pages/Results"));
const DevPreview = lazy(() => import("./pages/DevPreview"));
const DevPronunciationTest = lazy(() => import("./pages/DevPronunciationTest"));
const DevComprehensionAudio = lazy(() => import("./pages/DevComprehensionAudio"));
const NotFound = lazy(() => import("./pages/NotFound"));
const Activate = lazy(() => import("./pages/Activate"));
const AdminProducts = lazy(() => import("./pages/AdminProducts"));
const SalesCopilot = lazy(() => import("./pages/admin/SalesCopilot"));
const DashboardPage = lazy(() => import("./pages/DashboardPage"));
const PhrasesLandingPage = lazy(() => import("./pages/PhrasesLandingPage"));
const PhrasesSessionPage = lazy(() => import("./pages/PhrasesSessionPage"));
const PhrasesLibraryPage = lazy(() => import("./pages/PhrasesLibraryPage"));
const PhrasesSettingsPage = lazy(() => import("./pages/PhrasesSettingsPage"));
const PhrasesCoachPage = lazy(() => import("./pages/PhrasesCoachPage"));
const PhrasesReviewLogsPage = lazy(() => import("./pages/phrases/PhrasesReviewLogsPage"));
const SRSLabPage = lazy(() => import("./pages/admin/SRSLabPage"));
const SpeakingAssessmentLandingPage = lazy(() => import("./pages/SpeakingAssessmentLandingPage"));
// Landing page footer pages
const TermsPage = lazy(() => import("./pages/TermsPage"));
const PrivacyPage = lazy(() => import("./pages/PrivacyPage"));
const AboutPage = lazy(() => import("./pages/AboutPage"));
const ContactPage = lazy(() => import("./pages/ContactPage"));
const HelpPage = lazy(() => import("./pages/HelpPage"));
const BlogPage = lazy(() => import("./pages/BlogPage"));
const CareersPage = lazy(() => import("./pages/CareersPage"));

// Loading spinner for Suspense fallback
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
  </div>
);

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <AdminToolbar />
          <DevNav />
          <DevSessionViewer />
          <SpeedInsights />
          <Analytics />
          <Suspense fallback={<PageLoader />}>
            <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/login" element={<Login />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route 
              path="/assessment" 
              element={
                <ProtectedRoute>
                  <Assessment />
                </ProtectedRoute>
              } 
            />
            <Route path="/results" element={<Results />} />
            <Route path="/activate" element={<Activate />} />
            <Route 
              path="/dashboard" 
              element={
                <ProtectedRoute>
                  <DashboardPage />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin/systemeio-products" 
              element={
                <ProtectedRoute>
                  <AdminProducts />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin/sales-copilot" 
              element={
                <ProtectedRoute>
                  <SalesCopilot />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/phrases" 
              element={
                <ProtectedRoute>
                  <PhrasesLandingPage />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/phrases/session" 
              element={
                <ProtectedRoute>
                  <PhrasesSessionPage />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/phrases/library" 
              element={
                <ProtectedRoute>
                  <PhrasesLibraryPage />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/phrases/settings" 
              element={
                <ProtectedRoute>
                  <PhrasesSettingsPage />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/phrases/coach" 
              element={
                <ProtectedRoute>
                  <PhrasesCoachPage />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/phrases/logs" 
              element={
                <ProtectedRoute>
                  <PhrasesReviewLogsPage />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin/srs-lab" 
              element={
                <ProtectedRoute>
                  <SRSLabPage />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/speaking-assessment" 
              element={
                <ProtectedRoute>
                  <SpeakingAssessmentLandingPage />
                </ProtectedRoute>
              } 
            />
            <Route path="/dev" element={<DevPreview />} />
            <Route path="/dev/pronunciation-test" element={<DevPronunciationTest />} />
            <Route path="/dev/comprehension-audio" element={<DevComprehensionAudio />} />
            {/* Public footer pages */}
            <Route path="/terms" element={<TermsPage />} />
            <Route path="/privacy" element={<PrivacyPage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/contact" element={<ContactPage />} />
            <Route path="/help" element={<HelpPage />} />
            <Route path="/blog" element={<BlogPage />} />
            <Route path="/careers" element={<CareersPage />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
          </Suspense>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
