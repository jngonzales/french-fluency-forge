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
  const { isLoading } = useAuth();
  const { showDevTools } = useAdminMode();

  // Don't redirect logged-in users - they should be able to view the landing page

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
