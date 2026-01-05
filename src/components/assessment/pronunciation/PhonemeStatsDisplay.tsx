/**
 * Phoneme Stats Display
 * Shows user's phoneme profile with hardest/uncertain/strongest sounds
 */

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Check, X, AlertTriangle, HelpCircle } from 'lucide-react';
import { 
  getPhonemeStatsSummary,
  type UserPhonemestat 
} from '@/lib/pronunciation/phonemeStats';
import { getPhonemeInfo } from '@/lib/pronunciation/phonemeInventory';

interface PhonemeStatsDisplayProps {
  userId: string;
}

export function PhonemeStatsDisplay({ userId }: PhonemeStatsDisplayProps) {
  const [stats, setStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, [userId]);

  const loadStats = async () => {
    try {
      const summary = await getPhonemeStatsSummary(userId);
      setStats(summary);
    } catch (error) {
      console.error('[Phoneme Dashboard] Error loading stats:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6 text-center text-muted-foreground">
          Loading phoneme profile...
        </CardContent>
      </Card>
    );
  }

  if (!stats) {
    return null;
  }

  const { hardest, uncertain, strongest, coverage } = stats;

  return (
    <div className="space-y-6">
      {/* Coverage Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Your Phoneme Profile</span>
            <Badge variant={coverage.percentage === 100 ? 'default' : 'secondary'}>
              {coverage.tested}/{coverage.total} ({coverage.percentage}%)
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Progress value={coverage.percentage} className="h-3" />
          <p className="text-sm text-muted-foreground mt-2">
            {coverage.percentage === 100 
              ? 'All French phonemes tested!'
              : `${coverage.total - coverage.tested} phonemes still need testing`
            }
          </p>
        </CardContent>
      </Card>

      {/* Hardest Phonemes */}
      {hardest && hardest.length > 0 && (
        <Card className="border-red-500/30">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <X className="h-5 w-5 text-red-500" />
              Needs Practice
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {hardest.map((stat: UserPhonemestat) => {
              const info = getPhonemeInfo(stat.phoneme);
              return (
                <PhonemeStatCard
                  key={stat.phoneme}
                  stat={stat}
                  info={info}
                  variant="needs_practice"
                />
              );
            })}
          </CardContent>
        </Card>
      )}

      {/* Uncertain Phonemes */}
      {uncertain && uncertain.length > 0 && (
        <Card className="border-yellow-500/30">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <HelpCircle className="h-5 w-5 text-yellow-500" />
              Uncertain (Need More Data)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {uncertain.slice(0, 5).map((stat: UserPhonemestat) => {
              const info = getPhonemeInfo(stat.phoneme);
              const needed = Math.ceil(12 * -Math.log(1 - 0.7)) - stat.attempts; // For 70% confidence
              return (
                <PhonemeStatCard
                  key={stat.phoneme}
                  stat={stat}
                  info={info}
                  variant="uncertain"
                  additionalInfo={`Need ${needed} more attempts for reliable data`}
                />
              );
            })}
          </CardContent>
        </Card>
      )}

      {/* Strongest Phonemes */}
      {strongest && strongest.length > 0 && (
        <Card className="border-green-500/30">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Check className="h-5 w-5 text-green-500" />
              Strongest Sounds
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {strongest.map((stat: UserPhonemestat) => {
              const info = getPhonemeInfo(stat.phoneme);
              return (
                <PhonemeStatCard
                  key={stat.phoneme}
                  stat={stat}
                  info={info}
                  variant="strong"
                />
              );
            })}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// Phoneme Stat Card Component
interface PhonemeStatCardProps {
  stat: UserPhonemestat;
  info: any; // PhonemeInfo
  variant: 'needs_practice' | 'uncertain' | 'strong';
  additionalInfo?: string;
}

function PhonemeStatCard({ stat, info, variant, additionalInfo }: PhonemeStatCardProps) {
  const bgColor = 
    variant === 'needs_practice' ? 'bg-red-500/10' :
    variant === 'uncertain' ? 'bg-yellow-500/10' :
    'bg-green-500/10';

  const textColor = 
    variant === 'needs_practice' ? 'text-red-600 dark:text-red-400' :
    variant === 'uncertain' ? 'text-yellow-600 dark:text-yellow-400' :
    'text-green-600 dark:text-green-400';

  return (
    <div className={`p-4 rounded-lg ${bgColor}`}>
      <div className="flex items-start justify-between mb-2">
        <div>
          <div className="text-2xl font-bold font-mono">/{stat.phoneme}/</div>
          {info && (
            <div className="text-xs text-muted-foreground">{info.description}</div>
          )}
        </div>
        <div className="text-right">
          <div className={`text-xl font-bold ${textColor}`}>
            {Math.round(stat.mean_accuracy)}%
          </div>
          <div className="text-xs text-muted-foreground">
            {stat.attempts} {stat.attempts === 1 ? 'test' : 'tests'}
          </div>
        </div>
      </div>

      {/* Confidence Indicator */}
      <div className="mb-2">
        <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
          <span>Confidence:</span>
          <span>{Math.round(stat.confidence * 100)}%</span>
        </div>
        <Progress value={stat.confidence * 100} className="h-1" />
      </div>

      {/* Example Words */}
      {info && info.exampleWords && (
        <div className="text-sm">
          <span className="text-muted-foreground">Practice: </span>
          {info.exampleWords.slice(0, 3).map((word: string, idx: number) => (
            <Badge key={idx} variant="outline" className="mr-1 text-xs">
              {word}
            </Badge>
          ))}
        </div>
      )}

      {/* Additional Info */}
      {additionalInfo && (
        <div className="text-xs text-muted-foreground mt-2 italic">
          {additionalInfo}
        </div>
      )}
    </div>
  );
}

