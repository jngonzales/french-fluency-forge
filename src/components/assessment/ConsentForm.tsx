import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Shield, Mic, Clock, Trash2 } from "lucide-react";

interface ConsentFormProps {
  sessionId: string;
  onComplete: () => void;
}

const ConsentForm = ({ sessionId, onComplete }: ConsentFormProps) => {
  const { user } = useAuth();
  
  const [recordingConsent, setRecordingConsent] = useState(false);
  const [dataProcessingConsent, setDataProcessingConsent] = useState(false);
  const [retentionAcknowledged, setRetentionAcknowledged] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const allConsented = recordingConsent && dataProcessingConsent && retentionAcknowledged;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!allConsented) {
      toast.error("Please accept all consent items to continue");
      return;
    }

    if (!user) {
      toast.error("You must be logged in to continue");
      return;
    }

    setIsSubmitting(true);

    try {
      // Save consent record
      const { error: consentError } = await supabase
        .from("consent_records")
        .insert({
          user_id: user.id,
          recording_consent: recordingConsent,
          data_processing_consent: dataProcessingConsent,
          retention_acknowledged: retentionAcknowledged,
          user_agent: navigator.userAgent,
        });

      if (consentError) throw consentError;

      // Update session status
      const { error: sessionError } = await supabase
        .from("assessment_sessions")
        .update({ status: "quiz" })
        .eq("id", sessionId);

      if (sessionError) throw sessionError;

      onComplete();
    } catch (error) {
      console.error("Error saving consent:", error);
      toast.error("Failed to save consent. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <Shield className="h-12 w-12 mx-auto mb-4 text-primary" />
          <h1 className="text-3xl font-bold mb-2">Before We Begin</h1>
          <p className="text-muted-foreground">
            We take your privacy seriously. Please review and accept the following.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Recording Consent */}
          <Card className={`transition-colors ${recordingConsent ? "border-primary" : ""}`}>
            <CardHeader className="pb-3">
              <div className="flex items-start gap-4">
                <Mic className="h-6 w-6 text-primary mt-1 shrink-0" />
                <div>
                  <CardTitle className="text-lg">Audio Recording</CardTitle>
                  <CardDescription className="mt-1">
                    This assessment will record your voice to analyze your French speaking skills. 
                    Your recordings are processed securely and never used for marketing purposes.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="flex items-center space-x-3 pl-10">
                <Checkbox
                  id="recording-consent"
                  checked={recordingConsent}
                  onCheckedChange={(checked) => setRecordingConsent(checked === true)}
                />
                <Label htmlFor="recording-consent" className="cursor-pointer font-medium">
                  I consent to audio recording during this assessment
                </Label>
              </div>
            </CardContent>
          </Card>

          {/* Data Processing Consent */}
          <Card className={`transition-colors ${dataProcessingConsent ? "border-primary" : ""}`}>
            <CardHeader className="pb-3">
              <div className="flex items-start gap-4">
                <Shield className="h-6 w-6 text-primary mt-1 shrink-0" />
                <div>
                  <CardTitle className="text-lg">Data Processing</CardTitle>
                  <CardDescription className="mt-1">
                    Your responses will be processed to generate your personalized diagnostic report. 
                    We analyze pronunciation, fluency, syntax, and conversation skills to give you 
                    actionable insights.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="flex items-center space-x-3 pl-10">
                <Checkbox
                  id="data-processing-consent"
                  checked={dataProcessingConsent}
                  onCheckedChange={(checked) => setDataProcessingConsent(checked === true)}
                />
                <Label htmlFor="data-processing-consent" className="cursor-pointer font-medium">
                  I consent to processing of my assessment data
                </Label>
              </div>
            </CardContent>
          </Card>

          {/* Retention Acknowledgment */}
          <Card className={`transition-colors ${retentionAcknowledged ? "border-primary" : ""}`}>
            <CardHeader className="pb-3">
              <div className="flex items-start gap-4">
                <Clock className="h-6 w-6 text-primary mt-1 shrink-0" />
                <div>
                  <CardTitle className="text-lg">30-Day Retention</CardTitle>
                  <CardDescription className="mt-1">
                    Audio recordings are automatically deleted after 30 days. Your results and 
                    diagnostic report remain accessible. You can request deletion of all your 
                    data at any time.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="flex items-center space-x-3 pl-10">
                <Checkbox
                  id="retention-acknowledged"
                  checked={retentionAcknowledged}
                  onCheckedChange={(checked) => setRetentionAcknowledged(checked === true)}
                />
                <Label htmlFor="retention-acknowledged" className="cursor-pointer font-medium">
                  I understand the 30-day audio retention policy
                </Label>
              </div>
            </CardContent>
          </Card>

          {/* Deletion Rights Notice */}
          <div className="flex items-start gap-3 p-4 rounded-lg bg-muted/50 text-sm">
            <Trash2 className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
            <p className="text-muted-foreground">
              <strong>Your rights:</strong> You can request complete deletion of your data, 
              including audio, transcripts, and assessment results, at any time from your 
              results page or by contacting us.
            </p>
          </div>

          <Button 
            type="submit" 
            size="lg" 
            className="w-full" 
            disabled={!allConsented || isSubmitting}
          >
            {isSubmitting ? "Saving..." : "I Agree — Continue"}
          </Button>

          <p className="text-center text-xs text-muted-foreground">
            By continuing, you agree to our privacy policy and terms of service.
          </p>
        </form>
      </div>
    </div>
  );
};

export default ConsentForm;
