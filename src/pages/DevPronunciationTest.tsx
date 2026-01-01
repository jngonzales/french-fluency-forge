import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { 
  Play, 
  CheckCircle, 
  XCircle, 
  Loader2, 
  RefreshCw,
  Volume2,
  AlertTriangle,
  Info
} from "lucide-react";
import { 
  allTestCases, 
  testCasesByCategory, 
  type PronunciationTestCase, 
  type TestResult 
} from "@/lib/pronunciationTestCases";

type TestStatus = 'idle' | 'generating-audio' | 'analyzing' | 'complete' | 'error';

interface TestRun {
  testCase: PronunciationTestCase;
  status: TestStatus;
  result?: TestResult;
  audioBlob?: Blob;
}

export default function DevPronunciationTest() {
  const [testRuns, setTestRuns] = useState<Map<string, TestRun>>(new Map());
  const [isRunningAll, setIsRunningAll] = useState(false);
  const [currentTest, setCurrentTest] = useState<string | null>(null);

  // Generate TTS audio in WAV format for Azure compatibility
  const generateTTSAudio = async (text: string): Promise<Blob> => {
    // Use raw fetch instead of supabase.functions.invoke for binary data
    const response = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/french-tts`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ 
          text, 
          speed: 1.0, 
          stability: 0.5,
          outputFormat: 'pcm_16000'  // WAV format for Azure pronunciation assessment
        })
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`TTS error: ${response.status} - ${errorText}`);
    }

    return await response.blob();
  };

  // Analyze pronunciation
  const analyzePronunciation = async (audioBlob: Blob, referenceText: string) => {
    // Convert blob to base64
    const arrayBuffer = await audioBlob.arrayBuffer();
    const base64Audio = btoa(
      new Uint8Array(arrayBuffer).reduce((data, byte) => data + String.fromCharCode(byte), '')
    );

    const response = await supabase.functions.invoke('analyze-pronunciation', {
      body: {
        audio: base64Audio,
        referenceText,
        audioFormat: 'audio/wav',  // WAV format for Azure
        itemId: 'qa-test'
      }
    });

    if (response.error) {
      throw new Error(`Pronunciation analysis error: ${response.error.message}`);
    }

    return response.data;
  };

  // Run a single test
  const runTest = async (testCase: PronunciationTestCase): Promise<TestResult> => {
    setCurrentTest(testCase.id);
    
    // Update status: generating audio
    setTestRuns(prev => new Map(prev).set(testCase.id, {
      testCase,
      status: 'generating-audio'
    }));

    try {
      // Step 1: Generate TTS audio with the ttsText (which may differ from targetText)
      const audioBlob = await generateTTSAudio(testCase.ttsText);

      // Update status: analyzing
      setTestRuns(prev => new Map(prev).set(testCase.id, {
        testCase,
        status: 'analyzing',
        audioBlob
      }));

      // Step 2: Analyze pronunciation against the targetText (expected text)
      const analysis = await analyzePronunciation(audioBlob, testCase.targetText);

      // Step 3: Determine pass/fail
      const actualScore = analysis.pronScore ?? analysis.pronunciationScore ?? 0;
      const passed = actualScore >= testCase.expectedScoreRange.min && 
                    actualScore <= testCase.expectedScoreRange.max;

      const result: TestResult = {
        testId: testCase.id,
        passed,
        actualScore,
        expectedRange: testCase.expectedScoreRange,
        details: {
          accuracyScore: analysis.accuracyScore ?? 0,
          fluencyScore: analysis.fluencyScore ?? 0,
          completenessScore: analysis.completenessScore ?? 0,
          pronScore: actualScore,
        },
        timestamp: new Date()
      };

      // Update status: complete
      setTestRuns(prev => new Map(prev).set(testCase.id, {
        testCase,
        status: 'complete',
        audioBlob,
        result
      }));

      return result;

    } catch (error) {
      const errorResult: TestResult = {
        testId: testCase.id,
        passed: false,
        actualScore: 0,
        expectedRange: testCase.expectedScoreRange,
        details: {
          accuracyScore: 0,
          fluencyScore: 0,
          completenessScore: 0,
          pronScore: 0,
        },
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date()
      };

      setTestRuns(prev => new Map(prev).set(testCase.id, {
        testCase,
        status: 'error',
        result: errorResult
      }));

      return errorResult;
    } finally {
      setCurrentTest(null);
    }
  };

  // Run all tests in a category
  const runCategoryTests = async (tests: PronunciationTestCase[]) => {
    setIsRunningAll(true);
    for (const test of tests) {
      await runTest(test);
      // Small delay between tests to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    setIsRunningAll(false);
    toast.success(`Completed ${tests.length} tests`);
  };

  // Run all tests
  const runAllTests = async () => {
    await runCategoryTests(allTestCases);
  };

  // Play audio from a test run
  const playAudio = (testId: string) => {
    const run = testRuns.get(testId);
    if (run?.audioBlob) {
      const url = URL.createObjectURL(run.audioBlob);
      const audio = new Audio(url);
      audio.play();
      audio.onended = () => URL.revokeObjectURL(url);
    }
  };

  // Calculate summary stats
  const getSummary = () => {
    const completed = Array.from(testRuns.values()).filter(r => r.status === 'complete');
    const passed = completed.filter(r => r.result?.passed);
    const failed = completed.filter(r => !r.result?.passed);
    const errors = Array.from(testRuns.values()).filter(r => r.status === 'error');

    return { total: allTestCases.length, completed: completed.length, passed: passed.length, failed: failed.length, errors: errors.length };
  };

  const summary = getSummary();

  // Render a single test card
  const TestCard = ({ testCase }: { testCase: PronunciationTestCase }) => {
    const run = testRuns.get(testCase.id);
    const isRunning = run?.status === 'generating-audio' || run?.status === 'analyzing';

    return (
      <Card className={`transition-colors ${
        run?.result?.passed ? 'border-green-500/50 bg-green-500/5' : 
        run?.result && !run.result.passed ? 'border-red-500/50 bg-red-500/5' :
        run?.status === 'error' ? 'border-yellow-500/50 bg-yellow-500/5' : ''
      }`}>
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Badge variant={
                  testCase.testType === 'positive' ? 'default' :
                  testCase.testType === 'negative' ? 'destructive' : 'secondary'
                }>
                  {testCase.testType}
                </Badge>
                <Badge variant="outline">{testCase.category}</Badge>
                {testCase.phonemeFocus && (
                  <Badge variant="outline" className="text-xs">
                    {testCase.phonemeFocus}
                  </Badge>
                )}
              </div>
              <CardTitle className="text-sm font-medium">{testCase.id}</CardTitle>
              <CardDescription className="text-xs">{testCase.description}</CardDescription>
            </div>
            <div className="flex items-center gap-1">
              {run?.audioBlob && (
                <Button variant="ghost" size="icon" onClick={() => playAudio(testCase.id)}>
                  <Volume2 className="h-4 w-4" />
                </Button>
              )}
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => runTest(testCase)}
                disabled={isRunning || isRunningAll}
              >
                {isRunning ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Play className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="text-xs space-y-1">
            <div className="flex gap-2">
              <span className="text-muted-foreground">Target:</span>
              <span className="font-mono text-[10px]">{testCase.targetText.slice(0, 50)}...</span>
            </div>
            {testCase.ttsText !== testCase.targetText && (
              <div className="flex gap-2">
                <span className="text-muted-foreground">TTS:</span>
                <span className="font-mono text-[10px] text-orange-500">{testCase.ttsText.slice(0, 50)}...</span>
              </div>
            )}
            <div className="flex gap-2">
              <span className="text-muted-foreground">Expected:</span>
              <span>{testCase.expectedScoreRange.min}-{testCase.expectedScoreRange.max}</span>
            </div>
          </div>

          {/* Results */}
          {run?.result && (
            <div className="mt-3 pt-3 border-t space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {run.result.passed ? (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  ) : (
                    <XCircle className="h-4 w-4 text-red-500" />
                  )}
                  <span className="font-medium">{run.result.passed ? 'PASS' : 'FAIL'}</span>
                </div>
                <span className={`text-lg font-bold ${
                  run.result.passed ? 'text-green-500' : 'text-red-500'
                }`}>
                  {run.result.actualScore.toFixed(1)}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>Accuracy: {run.result.details.accuracyScore.toFixed(1)}</div>
                <div>Fluency: {run.result.details.fluencyScore.toFixed(1)}</div>
                <div>Completeness: {run.result.details.completenessScore.toFixed(1)}</div>
                <div>Pron: {run.result.details.pronScore.toFixed(1)}</div>
              </div>
              {run.result.errorMessage && (
                <div className="text-xs text-yellow-600 flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3" />
                  {run.result.errorMessage}
                </div>
              )}
            </div>
          )}

          {/* Loading state */}
          {isRunning && (
            <div className="mt-3 pt-3 border-t">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                {run?.status === 'generating-audio' ? 'Generating TTS audio...' : 'Analyzing pronunciation...'}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Pronunciation Module QA</h1>
            <p className="text-muted-foreground">
              Test Azure Speech Pronunciation Assessment with synthetic mispronunciations
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => setTestRuns(new Map())}
              disabled={isRunningAll}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Reset
            </Button>
            <Button onClick={runAllTests} disabled={isRunningAll}>
              {isRunningAll ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Running...
                </>
              ) : (
                <>
                  <Play className="h-4 w-4 mr-2" />
                  Run All Tests
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Summary Stats */}
        <Card>
          <CardContent className="pt-6">
            <div className="grid grid-cols-5 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold">{summary.total}</div>
                <div className="text-xs text-muted-foreground">Total Tests</div>
              </div>
              <div>
                <div className="text-2xl font-bold">{summary.completed}</div>
                <div className="text-xs text-muted-foreground">Completed</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-500">{summary.passed}</div>
                <div className="text-xs text-muted-foreground">Passed</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-red-500">{summary.failed}</div>
                <div className="text-xs text-muted-foreground">Failed</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-yellow-500">{summary.errors}</div>
                <div className="text-xs text-muted-foreground">Errors</div>
              </div>
            </div>
            {summary.completed > 0 && (
              <Progress 
                value={(summary.passed / summary.completed) * 100} 
                className="mt-4"
              />
            )}
          </CardContent>
        </Card>

        {/* Info Box */}
        <Card className="bg-muted/50">
          <CardContent className="pt-4">
            <div className="flex gap-3">
              <Info className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" />
              <div className="text-sm space-y-1">
                <p><strong>How it works:</strong></p>
                <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
                  <li>TTS generates audio using <code className="bg-background px-1 rounded">ttsText</code> (may contain intentional errors)</li>
                  <li>Audio is sent to Azure with <code className="bg-background px-1 rounded">targetText</code> as reference</li>
                  <li>Azure scores how well the audio matches the target</li>
                  <li>Score is compared against expected range to determine PASS/FAIL</li>
                </ol>
                <p className="text-muted-foreground mt-2">
                  <strong>Positive tests:</strong> TTS = Target (should score high)<br/>
                  <strong>Negative tests:</strong> TTS ≠ Target (should score low)
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Test Categories */}
        <Tabs defaultValue="all" className="space-y-4">
          <TabsList>
            <TabsTrigger value="all">All ({allTestCases.length})</TabsTrigger>
            <TabsTrigger value="positive">Positive ({testCasesByCategory.positive.length})</TabsTrigger>
            <TabsTrigger value="negative">Negative ({testCasesByCategory.negative.length})</TabsTrigger>
            <TabsTrigger value="edge">Edge Cases ({testCasesByCategory.edge.length})</TabsTrigger>
            <TabsTrigger value="minimal">Minimal Pairs ({testCasesByCategory.minimalPair.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="all">
            <div className="flex justify-end mb-4">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => runCategoryTests(allTestCases)}
                disabled={isRunningAll}
              >
                Run All
              </Button>
            </div>
            <ScrollArea className="h-[600px]">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {allTestCases.map(tc => <TestCard key={tc.id} testCase={tc} />)}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="positive">
            <div className="flex justify-end mb-4">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => runCategoryTests(testCasesByCategory.positive)}
                disabled={isRunningAll}
              >
                Run Positive Tests
              </Button>
            </div>
            <ScrollArea className="h-[600px]">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {testCasesByCategory.positive.map(tc => <TestCard key={tc.id} testCase={tc} />)}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="negative">
            <div className="flex justify-end mb-4">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => runCategoryTests(testCasesByCategory.negative)}
                disabled={isRunningAll}
              >
                Run Negative Tests
              </Button>
            </div>
            <ScrollArea className="h-[600px]">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {testCasesByCategory.negative.map(tc => <TestCard key={tc.id} testCase={tc} />)}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="edge">
            <div className="flex justify-end mb-4">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => runCategoryTests(testCasesByCategory.edge)}
                disabled={isRunningAll}
              >
                Run Edge Case Tests
              </Button>
            </div>
            <ScrollArea className="h-[600px]">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {testCasesByCategory.edge.map(tc => <TestCard key={tc.id} testCase={tc} />)}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="minimal">
            <div className="flex justify-end mb-4">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => runCategoryTests(testCasesByCategory.minimalPair)}
                disabled={isRunningAll}
              >
                Run Minimal Pair Tests
              </Button>
            </div>
            <ScrollArea className="h-[600px]">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {testCasesByCategory.minimalPair.map(tc => <TestCard key={tc.id} testCase={tc} />)}
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
