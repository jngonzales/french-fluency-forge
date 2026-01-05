/**
 * Comprehensive Pronunciation Debug Panel
 * Shows every step of the pronunciation assessment process
 */

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  ChevronDown, 
  ChevronRight, 
  Check, 
  X, 
  AlertTriangle,
  Copy,
  Mic,
  Upload,
  Globe,
  Search,
  BarChart3,
} from 'lucide-react';
import { toast } from 'sonner';

interface PronunciationDebugPanelProps {
  result: any; // UnifiedPronunciationResult
  isOpen?: boolean;
}

export function PronunciationDebugPanel({ result, isOpen: initialIsOpen = false }: PronunciationDebugPanelProps) {
  const [isOpen, setIsOpen] = useState(initialIsOpen);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['recording']));

  if (!result || !result.debug) {
    return null;
  }

  const { debug } = result;

  const toggleSection = (section: string) => {
    setExpandedSections(prev => {
      const next = new Set(prev);
      if (next.has(section)) {
        next.delete(section);
      } else {
        next.add(section);
      }
      return next;
    });
  };

  const copyToClipboard = () => {
    const debugText = JSON.stringify(result, null, 2);
    navigator.clipboard.writeText(debugText);
    toast.success('Debug info copied to clipboard');
  };

  const StatusIcon = ({ status }: { status: 'success' | 'failed' | 'skipped' }) => {
    if (status === 'success') return <Check className="h-4 w-4 text-green-500" />;
    if (status === 'failed') return <X className="h-4 w-4 text-red-500" />;
    return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
  };

  if (!isOpen) {
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsOpen(true)}
        className="w-full"
      >
        🐛 Show Debug Information
      </Button>
    );
  }

  return (
    <Card className="border-2 border-primary/20 bg-muted/30">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            🐛 Debug Information
            <Badge variant="secondary" className="text-xs">
              {result.provider === 'speechsuper' ? 'SpeechSuper' : 'Azure Speech'}
            </Badge>
          </CardTitle>
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={copyToClipboard}>
              <Copy className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setIsOpen(false)}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 font-mono text-sm">
        
        {/* 1. Recording Stage */}
        <DebugSection
          title="🎤 Audio Recording"
          icon={<Mic className="h-4 w-4" />}
          status={debug.recordingStatus}
          isExpanded={expandedSections.has('recording')}
          onToggle={() => toggleSection('recording')}
        >
          <div className="space-y-1 text-xs">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Status:</span>
              <span className="font-semibold">{debug.recordingStatus}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Size:</span>
              <span>{debug.audioSize.toLocaleString()} bytes</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Format:</span>
              <span>{debug.audioFormat}</span>
            </div>
            {debug.audioDuration && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Duration:</span>
                <span>{debug.audioDuration.toFixed(2)}s</span>
              </div>
            )}
          </div>
        </DebugSection>

        {/* 2. Upload Stage */}
        <DebugSection
          title="📤 Upload to Server"
          icon={<Upload className="h-4 w-4" />}
          status={debug.uploadStatus}
          isExpanded={expandedSections.has('upload')}
          onToggle={() => toggleSection('upload')}
        >
          <div className="space-y-1 text-xs">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Status:</span>
              <span className="font-semibold">{debug.uploadStatus}</span>
            </div>
            {debug.uploadSize && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Payload size:</span>
                <span>{debug.uploadSize.toLocaleString()} bytes</span>
              </div>
            )}
          </div>
        </DebugSection>

        {/* 3. API Call Stage */}
        <DebugSection
          title={`🌐 API Call (${result.provider === 'speechsuper' ? 'SpeechSuper' : 'Azure'})`}
          icon={<Globe className="h-4 w-4" />}
          status={debug.apiCallStatus}
          isExpanded={expandedSections.has('api')}
          onToggle={() => toggleSection('api')}
        >
          <div className="space-y-1 text-xs">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Provider:</span>
              <span className="font-semibold capitalize">{result.provider}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Status:</span>
              <span className="font-semibold">{debug.apiCallStatus}</span>
            </div>
            {debug.apiResponseStatus && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">HTTP Status:</span>
                <span>{debug.apiResponseStatus} {debug.apiResponseStatus === 200 ? 'OK' : ''}</span>
              </div>
            )}
            {debug.apiResponseTime && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Response time:</span>
                <span>{debug.apiResponseTime}ms</span>
              </div>
            )}
            {debug.apiErrorMessage && (
              <div className="mt-2 p-2 bg-red-500/10 rounded text-red-600">
                ❌ {debug.apiErrorMessage}
              </div>
            )}
          </div>
        </DebugSection>

        {/* 4. Recognition Stage */}
        <DebugSection
          title="📝 Speech Recognition"
          icon={<Search className="h-4 w-4" />}
          status={debug.recognitionStatus}
          isExpanded={expandedSections.has('recognition')}
          onToggle={() => toggleSection('recognition')}
        >
          <div className="space-y-2 text-xs">
            <div>
              <div className="text-muted-foreground mb-1">What API Understood:</div>
              <div className="p-2 bg-background rounded font-semibold">
                "{result.recognizedText}"
              </div>
            </div>
            <div>
              <div className="text-muted-foreground mb-1">Expected Text:</div>
              <div className="p-2 bg-background rounded">
                "{result.expectedText}"
              </div>
            </div>
            <div className="flex justify-between pt-2">
              <span className="text-muted-foreground">Text Match:</span>
              <span className="font-semibold">{result.textMatch}%</span>
            </div>
            {debug.languageDetected && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Language:</span>
                <span>{debug.languageDetected}</span>
              </div>
            )}
            {debug.recognitionConfidence && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Confidence:</span>
                <span>{(debug.recognitionConfidence * 100).toFixed(1)}%</span>
              </div>
            )}
          </div>
        </DebugSection>

        {/* 5. Score Breakdown */}
        <DebugSection
          title="📊 Score Calculation"
          icon={<BarChart3 className="h-4 w-4" />}
          status="success"
          isExpanded={expandedSections.has('scores')}
          onToggle={() => toggleSection('scores')}
        >
          <div className="space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Accuracy:</span>
              <span className="font-semibold">{result.scores.accuracy}/100</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Fluency:</span>
              <span className="font-semibold">{result.scores.fluency}/100</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Completeness:</span>
              <span className="font-semibold">{result.scores.completeness}/100</span>
            </div>
            <div className="mt-2 pt-2 border-t">
              <div className="text-muted-foreground mb-1">Formula:</div>
              <div className="p-2 bg-background rounded text-[10px]">
                {result.scores.formula}
              </div>
            </div>
            <div className="mt-2 pt-2 border-t">
              <div className="flex justify-between font-bold text-primary">
                <span>Overall Score:</span>
                <span className="text-lg">{result.scores.overall}/100</span>
              </div>
            </div>
          </div>
        </DebugSection>

        {/* 6. Phoneme Details */}
        <DebugSection
          title={`🔤 Phonemes (${result.allPhonemes?.length || 0} detected)`}
          icon={null}
          status="success"
          isExpanded={expandedSections.has('phonemes')}
          onToggle={() => toggleSection('phonemes')}
        >
          <div className="space-y-2 text-xs max-h-60 overflow-y-auto">
            {result.allPhonemes?.map((phoneme: any, idx: number) => (
              <div key={idx} className="p-2 bg-background rounded flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <StatusIcon status={phoneme.status === 'correct' ? 'success' : 'failed'} />
                  <span className="font-semibold">{phoneme.phoneme}</span>
                  {phoneme.expected !== phoneme.actual && (
                    <span className="text-muted-foreground text-[10px]">
                      (you said: {phoneme.actual})
                    </span>
                  )}
                </div>
                <Badge variant={phoneme.score >= 75 ? 'default' : 'destructive'}>
                  {phoneme.score}
                </Badge>
              </div>
            )) || <div className="text-muted-foreground">No phoneme data available</div>}
          </div>
        </DebugSection>

        {/* 7. Processing Steps */}
        <DebugSection
          title="⏱️ Processing Timeline"
          icon={null}
          status="success"
          isExpanded={expandedSections.has('timeline')}
          onToggle={() => toggleSection('timeline')}
        >
          <div className="space-y-2 text-xs">
            {debug.processingSteps?.map((step: any, idx: number) => (
              <div key={idx} className="flex items-start gap-2 p-2 bg-background rounded">
                <StatusIcon status={step.status} />
                <div className="flex-1">
                  <div className="font-semibold">{step.step.replace(/_/g, ' ')}</div>
                  {step.message && (
                    <div className="text-muted-foreground text-[10px]">{step.message}</div>
                  )}
                  {step.duration && (
                    <div className="text-muted-foreground text-[10px]">{step.duration}ms</div>
                  )}
                </div>
              </div>
            )) || <div className="text-muted-foreground">No processing steps recorded</div>}
          </div>
        </DebugSection>

        {/* 8. Raw Response */}
        <DebugSection
          title="📦 Raw API Response"
          icon={null}
          status="success"
          isExpanded={expandedSections.has('raw')}
          onToggle={() => toggleSection('raw')}
        >
          <div className="max-h-60 overflow-auto">
            <pre className="text-[9px] whitespace-pre-wrap break-all p-2 bg-background rounded">
              {JSON.stringify(debug.rawResponse, null, 2)}
            </pre>
          </div>
        </DebugSection>

        {/* Timestamp */}
        <div className="text-[10px] text-muted-foreground text-center pt-2 border-t">
          Debug captured at: {debug.timestamp}
        </div>
      </CardContent>
    </Card>
  );
}

interface DebugSectionProps {
  title: string;
  icon: React.ReactNode | null;
  status: string;
  isExpanded: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}

function DebugSection({ title, icon, status, isExpanded, onToggle, children }: DebugSectionProps) {
  const statusColor = 
    status === 'success' ? 'text-green-500' :
    status === 'failed' ? 'text-red-500' :
    'text-yellow-500';

  return (
    <div className="border rounded-lg overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full p-3 flex items-center justify-between hover:bg-muted/50 transition-colors"
      >
        <div className="flex items-center gap-2">
          {icon}
          <span className="font-semibold text-sm">{title}</span>
        </div>
        <div className="flex items-center gap-2">
          {status === 'success' && <Check className={`h-4 w-4 ${statusColor}`} />}
          {status === 'failed' && <X className={`h-4 w-4 ${statusColor}`} />}
          {isExpanded ? (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          )}
        </div>
      </button>
      {isExpanded && (
        <div className="p-3 pt-0 border-t">
          {children}
        </div>
      )}
    </div>
  );
}

