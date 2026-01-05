import { Card, CardContent } from "@/components/ui/card";
import { Clock, Mic, RotateCcw, AlertTriangle, CheckCircle } from "lucide-react";

export function FluencyIntroPanel() {
  return (
    <Card className="border-primary/20 bg-primary/5">
      <CardContent className="pt-6">
        <h2 className="text-xl font-bold mb-4">Fluency (Words per Minute)</h2>
        
        <div className="space-y-3 text-sm">
          <div className="flex items-start gap-3">
            <Clock className="h-4 w-4 text-primary mt-0.5 shrink-0" />
            <span>3 questions with timed answers (auto-stops when time is up)</span>
          </div>
          
          <div className="flex items-start gap-3">
            <Mic className="h-4 w-4 text-primary mt-0.5 shrink-0" />
            <span>No transcript will be shown — just speak naturally</span>
          </div>
          
          <div className="flex items-start gap-3">
            <RotateCcw className="h-4 w-4 text-primary mt-0.5 shrink-0" />
            <span>You can redo recordings while you're on this page</span>
          </div>
          
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
            <span className="text-amber-700 dark:text-amber-400">
              Once you continue to the next section, you can't come back to redo
            </span>
          </div>
        </div>
        
        <div className="mt-4 p-3 rounded-lg bg-background/50 border border-border">
          <div className="flex items-start gap-2">
            <CheckCircle className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
            <p className="text-sm text-muted-foreground">
              Don't worry about perfection — this is just a snapshot of where you are today. 
              Your first impression is fine!
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
