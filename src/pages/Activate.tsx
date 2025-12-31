import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Mail, Lock, AlertCircle, ExternalLink } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

const CHECKOUT_URL = "https://systeme.io/checkout"; // Placeholder - configure via env or admin

const Activate = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPaywall, setShowPaywall] = useState(false);
  const [magicLinkSent, setMagicLinkSent] = useState(false);

  // Redirect if already logged in
  if (user) {
    navigate("/dashboard");
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setShowPaywall(false);

    const normalizedEmail = email.toLowerCase().trim();

    try {
      // Check app_accounts for access status
      const { data: account, error } = await supabase
        .from("app_accounts")
        .select("id, access_status")
        .eq("email", normalizedEmail)
        .single();

      if (error && error.code !== "PGRST116") {
        throw error;
      }

      if (!account || account.access_status !== "active") {
        // No active account - show paywall
        setShowPaywall(true);
        setIsLoading(false);
        return;
      }

      // Account is active - send magic link
      const { error: authError } = await supabase.auth.signInWithOtp({
        email: normalizedEmail,
        options: {
          emailRedirectTo: `${window.location.origin}/assessment`,
        },
      });

      if (authError) throw authError;

      setMagicLinkSent(true);
      toast.success("Magic link sent! Check your email.");
    } catch (error: any) {
      console.error("Activation error:", error);
      toast.error(error.message || "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  if (magicLinkSent) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <Mail className="w-8 h-8 text-primary" />
            </div>
            <CardTitle className="text-2xl">Check Your Email</CardTitle>
            <CardDescription>
              We've sent a magic link to <strong>{email}</strong>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground text-center">
              Click the link in the email to sign in. The link will expire in 24 hours.
            </p>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => {
                setMagicLinkSent(false);
                setEmail("");
              }}
            >
              Use a different email
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
            <Lock className="w-8 h-8 text-primary" />
          </div>
          <CardTitle className="text-2xl">Activate Your Account</CardTitle>
          <CardDescription>
            Enter the email you used to purchase access
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email address</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>

            {showPaywall && (
              <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 space-y-3">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-destructive mt-0.5" />
                  <div>
                    <p className="font-medium text-destructive">No Purchase Found</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      We couldn't find an active purchase for this email. Please purchase access first, or check that you're using the same email.
                    </p>
                  </div>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={() => window.open(CHECKOUT_URL, "_blank")}
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Get Access
                </Button>
              </div>
            )}

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Checking..." : "Continue"}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-muted-foreground">
              Already have an account?{" "}
              <Button variant="link" className="p-0 h-auto" onClick={() => navigate("/login")}>
                Sign in
              </Button>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Activate;
