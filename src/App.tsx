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
import Index from "./pages/Index";
import Signup from "./pages/Signup";
import Login from "./pages/Login";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import Assessment from "./pages/Assessment";
import Results from "./pages/Results";
import DevPreview from "./pages/DevPreview";
import DevPronunciationTest from "./pages/DevPronunciationTest";
import NotFound from "./pages/NotFound";
import Activate from "./pages/Activate";
import AdminProducts from "./pages/AdminProducts";
import SalesCopilot from "./pages/admin/SalesCopilot";
import DashboardPage from "./pages/DashboardPage";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AdminToolbar />
          <DevNav />
          <DevSessionViewer />
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
            <Route path="/dev" element={<DevPreview />} />
            <Route path="/dev/pronunciation-test" element={<DevPronunciationTest />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
