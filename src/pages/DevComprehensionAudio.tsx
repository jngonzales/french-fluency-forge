import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, CheckCircle, XCircle, Volume2 } from 'lucide-react';
import { toast } from 'sonner';
import { generateAllComprehensionAudio } from '@/components/assessment/comprehension/scripts/generateComprehensionAudio';
import { comprehensionItems } from '@/components/assessment/comprehension/comprehensionItems';

export default function DevComprehensionAudio() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState<Array<{ itemId: string; success: boolean; audioUrl?: string; error?: string }>>([]);

  const handleGenerateAll = async () => {
    setIsGenerating(true);
    setProgress(0);
    setResults([]);

    try {
      // Override console.log to track progress
      const originalLog = console.log;
      let processed = 0;
      
      console.log = (...args) => {
        originalLog(...args);
        if (args[0]?.includes('Processing item') || args[0]?.includes('✓ Generated')) {
          processed++;
          setProgress((processed / comprehensionItems.length) * 100);
        }
      };

      const genResults = await generateAllComprehensionAudio();
      
      console.log = originalLog;
      setResults(genResults);
      
      const successful = genResults.filter(r => r.success).length;
      toast.success(`Generated audio for ${successful}/${comprehensionItems.length} items`);
    } catch (error) {
      console.error('Generation failed:', error);
      toast.error('Failed to generate audio');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle>Generate Comprehension Audio</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Generate TTS audio for all {comprehensionItems.length} comprehension exercises and upload to storage.
          </p>

          <Button 
            onClick={handleGenerateAll}
            disabled={isGenerating}
            size="lg"
            className="w-full"
          >
            {isGenerating ? (
              <>
                <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                Generating... ({Math.round(progress)}%)
              </>
            ) : (
              <>
                <Volume2 className="h-5 w-5 mr-2" />
                Generate All Audio
              </>
            )}
          </Button>

          {isGenerating && (
            <div className="space-y-2">
              <div className="text-sm text-muted-foreground">
                Progress: {Math.round(progress)}%
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div 
                  className="bg-primary h-2 rounded-full transition-all"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}

          {results.length > 0 && (
            <div className="space-y-2">
              <div className="text-sm font-medium">Results:</div>
              <div className="grid grid-cols-2 gap-2 max-h-60 overflow-y-auto">
                {results.map(result => (
                  <Badge 
                    key={result.itemId} 
                    variant={result.success ? "default" : "destructive"}
                    className="justify-start"
                  >
                    {result.success ? <CheckCircle className="h-3 w-3 mr-1" /> : <XCircle className="h-3 w-3 mr-1" />}
                    {result.itemId}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {results.length === 0 && (
            <div className="space-y-2">
              <div className="text-sm font-medium">Items to generate:</div>
              <div className="grid grid-cols-2 gap-2">
                {comprehensionItems.map(item => (
                  <Badge key={item.id} variant="outline" className="justify-start">
                    {item.id}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

