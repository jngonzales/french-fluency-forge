import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useAdminMode } from "@/hooks/useAdminMode";
import { 
  Navbar, 
  HeroSection, 
  FeaturesSection, 
  HowItWorksSection, 
  PricingSection, 
  CTASection, 
  Footer 
} from "@/components/landing";

const Index = () => {
  const navigate = useNavigate();
  const { user, isLoading } = useAuth();
  const { showDevTools } = useAdminMode();

  // v0 demo: Always redirect logged-in users to Dashboard
  useEffect(() => {
    if (!isLoading && user) {
      navigate('/dashboard', { replace: true });
      return;
    }
  }, [user, isLoading, navigate]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-carbon">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-orange border-t-transparent" />
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-carbon ${showDevTools ? 'pt-10' : ''}`}>
      <Navbar />
      <main id="main-content">
        <HeroSection />
        <FeaturesSection />
        <HowItWorksSection />
        <PricingSection />
        <CTASection />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
