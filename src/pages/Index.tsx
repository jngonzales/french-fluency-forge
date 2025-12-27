import { useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { LogOut, ArrowRight } from "lucide-react";

const Index = () => {
  const navigate = useNavigate();
  const { user, isLoading, signOut } = useAuth();

  const handleSignOut = async () => {
    await signOut();
    navigate("/login");
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-xl font-bold">French Speaking Diagnostic</h1>
          {user ? (
            <div className="flex items-center gap-4">
              <span className="text-sm text-muted-foreground">{user.email}</span>
              <Button variant="ghost" size="sm" onClick={handleSignOut}>
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </Button>
            </div>
          ) : (
            <Link to="/login">
              <Button variant="outline" size="sm">Sign In</Button>
            </Link>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-16">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-4xl font-bold mb-6">
            Unlock Your French Speaking Potential
          </h2>
          <p className="text-xl text-muted-foreground mb-8">
            A serious, 20-minute diagnostic that reveals exactly where you stand 
            and what to focus on next. No fluff. No CEFR labels. Just actionable insights.
          </p>

          {user ? (
            <div className="space-y-4">
              <Link to="/assessment">
                <Button size="lg" className="px-8">
                  Start Your Assessment
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <p className="text-sm text-muted-foreground">
                Takes about 18-22 minutes
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-muted-foreground mb-4">
                Already purchased? Sign in to access your assessment.
              </p>
              <div className="flex gap-4 justify-center">
                <Link to="/login">
                  <Button size="lg">Sign In</Button>
                </Link>
              </div>
            </div>
          )}

          {/* Feature highlights */}
          <div className="grid md:grid-cols-3 gap-8 mt-16 text-left">
            <div className="p-6 rounded-lg border bg-card">
              <h3 className="font-semibold mb-2">6 Core Skills</h3>
              <p className="text-sm text-muted-foreground">
                Pronunciation, Fluency, Syntax, Comprehension, Confidence, and Conversation Skills
              </p>
            </div>
            <div className="p-6 rounded-lg border bg-card">
              <h3 className="font-semibold mb-2">Personalized Track</h3>
              <p className="text-sm text-muted-foreground">
                Content tailored to your context: work, social, family, or transactions
              </p>
            </div>
            <div className="p-6 rounded-lg border bg-card">
              <h3 className="font-semibold mb-2">Actionable Next Steps</h3>
              <p className="text-sm text-muted-foreground">
                Clear recommendations for each skill area, plus a downloadable PDF report
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Index;
