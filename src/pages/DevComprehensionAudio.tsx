import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, CheckCircle, XCircle, Volume2 } from 'lucide-react';
import { toast } from 'sonner';
import { generateAllComprehensionAudio } from '@/components/assessment/comprehension/scripts/generateComprehensionAudio';
import { getComprehensionItems, type ComprehensionItem } from '@/components/assessment/comprehension/comprehensionItems';
import { supabase } from '@/integrations/supabase/client';

export default function DevComprehensionAudio() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState<Array<{ itemId: string; success: boolean; audioUrl?: string; error?: string }>>([]);
  const [items, setItems] = useState<ComprehensionItem[]>([]);
  const [isLoadingItems, setIsLoadingItems] = useState(true);

  // Load items from database
  useEffect(() => {
    async function loadItems() {
      try {
        // Fetch all items (including those without audio)
        const { data, error } = await supabase
          .from('comprehension_items' as any)
          .select('*')
          .order('cefr_level', { ascending: true })
          .order('id', { ascending: true });
        
        if (error) throw error;
        setItems((data || []) as ComprehensionItem[]);
      } catch (error) {
        console.error('Failed to load items:', error);
        toast.error('Failed to load comprehension items');
      } finally {
        setIsLoadingItems(false);
      }
    }
    loadItems();
  }, []);

  const handleGenerateAll = async () => {
    setIsGenerating(true);
    setProgress(0);
    setResults([]);

    try {
      // Override console.log to track progress
      const originalLog = console.log;
      let processed = 0;
      const itemsNeedingAudio = items.filter(item => !item.audio_url);
      
      console.log = (...args) => {
        originalLog(...args);
        if (args[0]?.includes('Processing item') || args[0]?.includes('✓ Generated')) {
          processed++;
          setProgress((processed / itemsNeedingAudio.length) * 100);
        }
      };

      const genResults = await generateAllComprehensionAudio();
      
      console.log = originalLog;
      setResults(genResults);
      
      // Reload items to get updated audio_url
      const { data } = await supabase
        .from('comprehension_items' as any)
        .select('*')
        .order('cefr_level', { ascending: true })
        .order('id', { ascending: true });
      if (data) setItems(data as ComprehensionItem[]);
      
      const successful = genResults.filter(r => r.success).length;
      toast.success(`Generated audio for ${successful}/${itemsNeedingAudio.length} items`);
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
          {isLoadingItems ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="h-5 w-5 animate-spin mr-2" />
              <span>Loading items...</span>
            </div>
          ) : (
            <>
              <p className="text-sm text-muted-foreground">
                Generate WAV audio for comprehension exercises missing audio files. 
                {items.filter(i => !i.audio_url).length > 0 && (
                  <span className="font-medium"> {items.filter(i => !i.audio_url).length} items need audio generation.</span>
                )}
                {items.filter(i => i.audio_url).length > 0 && (
                  <span className="text-green-600"> {items.filter(i => i.audio_url).length} items already have audio.</span>
                )}
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

              {items.length > 0 && (
                <div className="space-y-2">
                  <div className="text-sm font-medium">All items ({items.length} total):</div>
                  <div className="grid grid-cols-2 gap-2 max-h-60 overflow-y-auto">
                    {items.map(item => (
                      <Badge 
                        key={item.id} 
                        variant={item.audio_url ? "default" : "outline"}
                        className="justify-start"
                      >
                        {item.audio_url ? <CheckCircle className="h-3 w-3 mr-1" /> : <XCircle className="h-3 w-3 mr-1" />}
                        {item.id} ({item.cefr_level})
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

