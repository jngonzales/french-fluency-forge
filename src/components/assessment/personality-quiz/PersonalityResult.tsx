import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Archetype, AxisKey } from "./quizConfig";
import { Share2, Download, Instagram, Facebook, MessageCircle, Link, Mic, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { FeedbackDialog } from "./FeedbackDialog";

interface AxisResult {
  raw: number;
  normalized: number;
  label: string;
}

interface Props {
  archetype: Archetype;
  axes: {
    control_flow: AxisResult;
    accuracy_expressiveness: AxisResult;
    security_risk: AxisResult;
  };
  consistencyGap?: number;
  sessionId?: string | null;
  onContinue: () => void;
}

const axisLabels: Record<AxisKey, [string, string]> = {
  control_flow: ['Control', 'Flow'],
  accuracy_expressiveness: ['Accuracy', 'Expressiveness'],
  security_risk: ['Security', 'Risk'],
};

function AxisBar({ axisKey, result }: { axisKey: AxisKey; result: AxisResult }) {
  const [leftLabel, rightLabel] = axisLabels[axisKey];
  
  return (
    <div className="space-y-2">
      <div className="flex justify-between text-sm font-medium">
        <span className={result.normalized < 50 ? "text-primary" : "text-muted-foreground"}>
          {leftLabel}
        </span>
        <span className={result.normalized >= 50 ? "text-primary" : "text-muted-foreground"}>
          {rightLabel}
        </span>
      </div>
      <div className="relative h-3 bg-muted rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${result.normalized}%` }}
          transition={{ duration: 1, ease: "easeOut" }}
          className="absolute h-full bg-gradient-to-r from-primary/60 to-primary rounded-full"
        />
        <motion.div
          initial={{ left: '50%' }}
          animate={{ left: `${result.normalized}%` }}
          transition={{ duration: 1, ease: "easeOut" }}
          className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-4 h-4 bg-primary rounded-full border-2 border-background shadow-lg"
        />
      </div>
      <p className="text-center text-xs text-muted-foreground">{result.label}</p>
    </div>
  );
}

export function PersonalityResult({ archetype, axes, consistencyGap, sessionId, onContinue }: Props) {
  const [feedbackDialogOpen, setFeedbackDialogOpen] = useState(false);
  const [hasShownAutoPopup, setHasShownAutoPopup] = useState(false);

  // Auto-show feedback popup after 20 seconds
  useEffect(() => {
    if (hasShownAutoPopup) return;
    
    const timer = setTimeout(() => {
      setFeedbackDialogOpen(true);
      setHasShownAutoPopup(true);
    }, 20000);

    return () => clearTimeout(timer);
  }, [hasShownAutoPopup]);

  const showEncouragement = archetype.encouragement && 
    (axes.control_flow.normalized < 40 || axes.accuracy_expressiveness.normalized < 40 || axes.security_risk.normalized < 40);
  
  const showConsistencyNote = consistencyGap && consistencyGap > 0.3;

  const shareText = `I just discovered I'm "${archetype.name}" ${archetype.emoji} in my French learning journey! Take the personality test to find yours:`;
  const shareUrl = typeof window !== 'undefined' ? window.location.origin + '/assessment' : '';

  const handleCopyLink = () => {
    navigator.clipboard.writeText(`${shareText} ${shareUrl}`);
    toast.success("Link copied to clipboard!");
  };

  const handleShareInstagram = () => {
    // Instagram doesn't have a direct share URL, so we copy the text
    navigator.clipboard.writeText(`${shareText}\n\n${shareUrl}`);
    toast.success("Text copied! Paste it in your Instagram story or post.");
  };

  const handleShareFacebook = () => {
    const fbUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}&quote=${encodeURIComponent(shareText)}`;
    window.open(fbUrl, '_blank', 'width=600,height=400');
  };

  const handleShareWhatsApp = () => {
    const waUrl = `https://wa.me/?text=${encodeURIComponent(`${shareText} ${shareUrl}`)}`;
    window.open(waUrl, '_blank');
  };

  const handleExportPDF = () => {
    // Create a simple text-based "export" that could be printed/saved
    const content = `
My French Learning Personality
==============================

${archetype.emoji} ${archetype.name}

YOUR 3-AXIS PROFILE
-------------------
• Control ↔ Flow: ${axes.control_flow.label} (${Math.round(axes.control_flow.normalized)}%)
• Accuracy ↔ Expressiveness: ${axes.accuracy_expressiveness.label} (${Math.round(axes.accuracy_expressiveness.normalized)}%)
• Security ↔ Risk: ${axes.security_risk.label} (${Math.round(axes.security_risk.normalized)}%)

✨ YOUR STRENGTHS
${archetype.strengths}

🔍 HIDDEN BOTTLENECK
${archetype.bottleneck}

🚀 FASTEST PATH
${archetype.fastestPath}

⚠️ DANGER PATH
${archetype.dangerPath}

${archetype.encouragement ? `💡 ${archetype.encouragement}` : ''}

---
Take the test: ${shareUrl}
    `.trim();

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${archetype.name.replace(/\s+/g, '-').toLowerCase()}-personality.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success("Your results have been downloaded!");
  };

  return (
    <div className="min-h-screen bg-background py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Header */}
          <div className="text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", delay: 0.2 }}
              className="text-6xl mb-4"
            >
              {archetype.emoji}
            </motion.div>
            <h1 className="text-2xl font-bold mb-2">Your Learning Personality</h1>
            <h2 className="text-xl text-primary font-semibold">{archetype.name}</h2>
          </div>

          {/* Axis Bars */}
          <div className="p-6 rounded-2xl border border-border bg-card space-y-6">
            <h3 className="font-semibold text-center mb-4">Your 3-Axis Profile</h3>
            <AxisBar axisKey="control_flow" result={axes.control_flow} />
            <AxisBar axisKey="accuracy_expressiveness" result={axes.accuracy_expressiveness} />
            <AxisBar axisKey="security_risk" result={axes.security_risk} />
          </div>

          {/* Archetype Card */}
          <div className="grid gap-4 sm:grid-cols-2">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="p-4 rounded-xl bg-green-500/10 border border-green-500/20"
            >
              <h4 className="font-semibold text-green-600 dark:text-green-400 mb-2">✨ Your Strengths</h4>
              <p className="text-sm">{archetype.strengths}</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
              className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20"
            >
              <h4 className="font-semibold text-amber-600 dark:text-amber-400 mb-2">🔍 Hidden Bottleneck</h4>
              <p className="text-sm">{archetype.bottleneck}</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 }}
              className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20"
            >
              <h4 className="font-semibold text-blue-600 dark:text-blue-400 mb-2">🚀 Fastest Path</h4>
              <p className="text-sm">{archetype.fastestPath}</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.6 }}
              className="p-4 rounded-xl bg-red-500/10 border border-red-500/20"
            >
              <h4 className="font-semibold text-red-600 dark:text-red-400 mb-2">⚠️ Danger Path</h4>
              <p className="text-sm">{archetype.dangerPath}</p>
            </motion.div>
          </div>

          {/* Encouragement Note */}
          {showEncouragement && archetype.encouragement && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
              className="p-4 rounded-xl bg-primary/10 border border-primary/20 text-center"
            >
              <p className="text-sm font-medium">{archetype.encouragement}</p>
            </motion.div>
          )}

          {/* Consistency Note */}
          {showConsistencyNote && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
              className="p-4 rounded-xl bg-muted text-center"
            >
              <p className="text-sm text-muted-foreground">
                You <em>want</em> to be more spontaneous, but under pressure you default to control. 
                That's normal — we'll train the bridge.
              </p>
            </motion.div>
          )}

          {/* Share & Export Actions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.85 }}
            className="flex flex-wrap justify-center gap-3"
          >
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="lg" className="gap-2">
                  <Share2 className="h-4 w-4" />
                  Share Result
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="center" className="w-48 bg-popover">
                <DropdownMenuItem onClick={handleShareInstagram} className="gap-2 cursor-pointer">
                  <Instagram className="h-4 w-4" />
                  Instagram
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleShareFacebook} className="gap-2 cursor-pointer">
                  <Facebook className="h-4 w-4" />
                  Facebook
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleShareWhatsApp} className="gap-2 cursor-pointer">
                  <MessageCircle className="h-4 w-4" />
                  WhatsApp
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleCopyLink} className="gap-2 cursor-pointer">
                  <Link className="h-4 w-4" />
                  Copy Link
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Button variant="outline" size="lg" className="gap-2" onClick={handleExportPDF}>
              <Download className="h-4 w-4" />
              Export Results
            </Button>

            <Button 
              variant="outline" 
              size="lg" 
              className="gap-2" 
              onClick={() => setFeedbackDialogOpen(true)}
            >
              <MessageSquare className="h-4 w-4" />
              Share my feedback
            </Button>
          </motion.div>

          {/* Feedback Dialog */}
          <FeedbackDialog
            open={feedbackDialogOpen}
            onOpenChange={setFeedbackDialogOpen}
            sessionId={sessionId ?? null}
            archetypeName={archetype.name}
            archetypeEmoji={archetype.emoji}
          />

          {/* CTA */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9 }}
            className="space-y-2"
          >
            <button
              onClick={onContinue}
              className="w-full py-4 px-6 rounded-xl bg-primary text-primary-foreground font-semibold text-lg shadow-lg shadow-primary/30 hover:shadow-xl transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-3"
            >
              <Mic className="h-5 w-5" />
              Continue to Fluency Assessment
            </button>
            <p className="text-center text-sm text-muted-foreground">
              Takes ~10 minutes • Microphone needed
            </p>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}
