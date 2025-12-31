import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Instagram, Facebook, MessageCircle, Link, X, MessageSquare } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface FeedbackDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sessionId: string | null;
  archetypeName: string;
  archetypeEmoji: string;
}

type Step = "feedback" | "marketing" | "share";

export function FeedbackDialog({ 
  open, 
  onOpenChange, 
  sessionId,
  archetypeName,
  archetypeEmoji
}: FeedbackDialogProps) {
  const [step, setStep] = useState<Step>("feedback");
  const [feedbackText, setFeedbackText] = useState("");
  const [marketingConsent, setMarketingConsent] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reset state when dialog closes
  useEffect(() => {
    if (!open) {
      // Small delay before resetting to avoid visual flash
      const timer = setTimeout(() => {
        setStep("feedback");
        setFeedbackText("");
        setMarketingConsent(false);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [open]);

  const isValidFeedback = feedbackText.trim().split(/\s+/).length >= 3;

  const handleSubmitFeedback = async () => {
    if (!isValidFeedback) return;
    
    setIsSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Please log in to submit feedback");
        return;
      }

      // First insert the feedback, then update if marketing consent is given
      const { error } = await supabase
        .from("archetype_feedback")
        .insert({
          user_id: user.id,
          session_id: sessionId,
          feedback_text: feedbackText.trim(),
          marketing_consent: false, // Will update after consent step
        });

      if (error) throw error;

      // Move to marketing consent step
      setStep("marketing");
    } catch (error) {
      console.error("Error submitting feedback:", error);
      toast.error("Failed to submit feedback. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleMarketingConsent = async (consent: boolean) => {
    if (consent) {
      setIsSubmitting(true);
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          // Update the most recent feedback with marketing consent
          await supabase
            .from("archetype_feedback")
            .update({ marketing_consent: true })
            .eq("user_id", user.id)
            .eq("session_id", sessionId);
        }
      } catch (error) {
        console.error("Error updating marketing consent:", error);
      } finally {
        setIsSubmitting(false);
      }
    }
    
    setMarketingConsent(consent);
    setStep("share");
    toast.success("Thank you for your feedback!");
  };

  const handleAskLater = () => {
    onOpenChange(false);
  };

  const shareUrl = typeof window !== "undefined" ? window.location.origin + "/assessment" : "";
  const shareText = `I discovered I'm "${archetypeName}" ${archetypeEmoji} in my language learning journey! Find out your learning personality:`;

  const handleShareInstagram = () => {
    navigator.clipboard.writeText(`${shareText}\n\n${shareUrl}`);
    toast.success("Copied! Paste it in your Instagram story.");
  };

  const handleShareFacebook = () => {
    const fbUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}&quote=${encodeURIComponent(shareText)}`;
    window.open(fbUrl, "_blank", "width=600,height=400");
  };

  const handleShareWhatsApp = () => {
    const waUrl = `https://wa.me/?text=${encodeURIComponent(`${shareText} ${shareUrl}`)}`;
    window.open(waUrl, "_blank");
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(`${shareText} ${shareUrl}`);
    toast.success("Link copied to clipboard!");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <AnimatePresence mode="wait">
          {step === "feedback" && (
            <motion.div
              key="feedback"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              <DialogHeader>
                <DialogTitle className="text-xl">What do you think about your results?</DialogTitle>
                <DialogDescription className="text-muted-foreground">
                  Do you think this archetype fits your learning style? Do you believe understanding yourself will help you learn your language? We would love your feedback.
                </DialogDescription>
              </DialogHeader>

              <Textarea
                value={feedbackText}
                onChange={(e) => setFeedbackText(e.target.value)}
                placeholder="Share your thoughts..."
                className="min-h-[120px] resize-none"
              />

              <div className="flex gap-3">
                <Button
                  onClick={handleSubmitFeedback}
                  disabled={!isValidFeedback || isSubmitting}
                  className="flex-1"
                >
                  {isSubmitting ? "Submitting..." : "Validate"}
                </Button>
                <Button
                  variant="outline"
                  onClick={handleAskLater}
                  className="flex-1"
                >
                  Ask me later
                </Button>
              </div>
              
              {feedbackText.length > 0 && !isValidFeedback && (
                <p className="text-xs text-muted-foreground text-center">
                  Please write at least a few words
                </p>
              )}
            </motion.div>
          )}

          {step === "marketing" && (
            <motion.div
              key="marketing"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              <DialogHeader>
                <DialogTitle className="text-xl">One more thing...</DialogTitle>
                <DialogDescription className="text-muted-foreground">
                  Would you allow us to use your feedback in our marketing?
                </DialogDescription>
              </DialogHeader>

              <div className="p-4 rounded-lg bg-muted/50 border border-border space-y-3">
                <div className="flex items-start space-x-3">
                  <Checkbox
                    id="marketing-consent"
                    checked={marketingConsent}
                    onCheckedChange={(checked) => setMarketingConsent(checked === true)}
                  />
                  <label 
                    htmlFor="marketing-consent" 
                    className="text-sm leading-relaxed cursor-pointer"
                  >
                    Yes, you can use my <strong>first name or initials</strong>, <strong>level</strong>, and <strong>language being learned</strong> alongside my feedback in marketing materials.
                  </label>
                </div>
              </div>

              <div className="flex gap-3">
                <Button
                  onClick={() => handleMarketingConsent(marketingConsent)}
                  disabled={isSubmitting}
                  className="flex-1"
                >
                  {isSubmitting ? "Saving..." : "Continue"}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleMarketingConsent(false)}
                  className="flex-1"
                >
                  Skip
                </Button>
              </div>
            </motion.div>
          )}

          {step === "share" && (
            <motion.div
              key="share"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              <DialogHeader>
                <DialogTitle className="text-xl">Share your results! 🎉</DialogTitle>
                <DialogDescription className="text-muted-foreground">
                  Let your friends discover their learning personality too.
                </DialogDescription>
              </DialogHeader>

              {/* Story-ready preview card */}
              <div className="aspect-[9/16] max-h-[280px] mx-auto rounded-xl bg-gradient-to-br from-primary/20 via-primary/10 to-background border border-primary/20 flex flex-col items-center justify-center p-6 text-center">
                <span className="text-5xl mb-4">{archetypeEmoji}</span>
                <p className="text-xs uppercase tracking-wider text-muted-foreground mb-2">
                  My Learning Personality
                </p>
                <h3 className="text-lg font-bold text-foreground">{archetypeName}</h3>
                <p className="text-xs text-muted-foreground mt-4">
                  Find yours at the fluency test →
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Button
                  variant="outline"
                  onClick={handleShareInstagram}
                  className="gap-2"
                >
                  <Instagram className="h-4 w-4" />
                  Instagram
                </Button>
                <Button
                  variant="outline"
                  onClick={handleShareFacebook}
                  className="gap-2"
                >
                  <Facebook className="h-4 w-4" />
                  Facebook
                </Button>
                <Button
                  variant="outline"
                  onClick={handleShareWhatsApp}
                  className="gap-2"
                >
                  <MessageCircle className="h-4 w-4" />
                  WhatsApp
                </Button>
                <Button
                  variant="outline"
                  onClick={handleCopyLink}
                  className="gap-2"
                >
                  <Link className="h-4 w-4" />
                  Copy Link
                </Button>
              </div>

              <Button
                variant="ghost"
                onClick={() => onOpenChange(false)}
                className="w-full"
              >
                Done
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}
