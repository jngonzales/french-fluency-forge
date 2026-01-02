/**
 * Phrases Review Logs Page
 * View all review history for debugging and understanding SRS behavior
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AdminPadding } from '@/components/AdminPadding';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Download, Filter } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import type { PhraseReviewLog } from '@/features/phrases/types';
import { getPhraseById } from '@/features/phrases/data/mockPhrasesData';
import { formatIntervalFSRS } from '@/features/phrases/data/fsrsScheduler';

export default function PhrasesReviewLogsPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const memberId = user?.id || 'guest';
  
  const [logs, setLogs] = useState<PhraseReviewLog[]>([]);
  const [filteredLogs, setFilteredLogs] = useState<PhraseReviewLog[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCardId, setFilterCardId] = useState<string>('all');
  const [filterRating, setFilterRating] = useState<string>('all');

  useEffect(() => {
    const logsKey = `solv_phrases_logs_${memberId}`;
    const storedLogs = localStorage.getItem(logsKey);
    
    if (storedLogs) {
      try {
        const parsed = JSON.parse(storedLogs);
        // Sort by most recent first
        const sorted = parsed.sort((a: PhraseReviewLog, b: PhraseReviewLog) => 
          new Date(b.rated_at).getTime() - new Date(a.rated_at).getTime()
        );
        setLogs(sorted);
        setFilteredLogs(sorted);
      } catch (err) {
        console.error('Failed to load logs:', err);
      }
    }
  }, [memberId]);

  // Get unique card IDs for filter
  const cardIds = Array.from(new Set(logs.map(log => log.card_id)));

  useEffect(() => {
    let filtered = [...logs];

    // Filter by card ID
    if (filterCardId !== 'all') {
      filtered = filtered.filter(log => log.card_id === filterCardId);
    }

    // Filter by rating
    if (filterRating !== 'all') {
      filtered = filtered.filter(log => log.rating === filterRating);
    }

    // Search
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(log => {
        const phrase = getPhraseById(log.phrase_id);
        return (
          log.card_id.toLowerCase().includes(term) ||
          phrase?.prompt_en?.toLowerCase().includes(term) ||
          phrase?.canonical_fr?.toLowerCase().includes(term)
        );
      });
    }

    setFilteredLogs(filtered);
  }, [logs, filterCardId, filterRating, searchTerm]);

  const exportLogs = () => {
    const dataStr = JSON.stringify(filteredLogs, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `phrases-review-logs-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
  };

  // Group logs by card for easier viewing
  const logsByCard = filteredLogs.reduce((acc, log) => {
    if (!acc[log.card_id]) {
      acc[log.card_id] = [];
    }
    acc[log.card_id].push(log);
    return acc;
  }, {} as Record<string, PhraseReviewLog[]>);

  return (
    <AdminPadding>
      <div className="min-h-screen bg-background">
        {/* Header */}
        <header className="border-b border-border bg-card sticky top-0 z-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate('/phrases')}
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back
                </Button>
                <div>
                  <h1 className="text-2xl font-serif font-bold">Review Logs</h1>
                  <p className="text-sm text-muted-foreground">
                    Complete history of all phrase reviews with FSRS scheduling data
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="secondary">{filteredLogs.length} reviews</Badge>
                <Button variant="outline" size="sm" onClick={exportLogs}>
                  <Download className="w-4 h-4 mr-2" />
                  Export
                </Button>
              </div>
            </div>
          </div>
        </header>

        {/* Filters */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Filter className="w-4 h-4" />
                Filters
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Search</label>
                  <Input
                    placeholder="Search by phrase..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Card</label>
                  <Select value={filterCardId} onValueChange={setFilterCardId}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Cards</SelectItem>
                      {cardIds.map(cardId => (
                        <SelectItem key={cardId} value={cardId}>
                          {cardId.substring(0, 20)}...
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Rating</label>
                  <Select value={filterRating} onValueChange={setFilterRating}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Ratings</SelectItem>
                      <SelectItem value="again">Again</SelectItem>
                      <SelectItem value="hard">Hard</SelectItem>
                      <SelectItem value="good">Good</SelectItem>
                      <SelectItem value="easy">Easy</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Logs by Card */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
          {Object.entries(logsByCard).map(([cardId, cardLogs]) => {
            const phrase = getPhraseById(cardLogs[0]?.phrase_id);
            const sortedLogs = cardLogs.sort((a, b) => 
              new Date(a.rated_at).getTime() - new Date(b.rated_at).getTime()
            );

            return (
              <Card key={cardId}>
                <CardHeader>
                  <CardTitle className="text-lg">
                    {phrase?.prompt_en || phrase?.canonical_fr || 'Unknown Phrase'}
                  </CardTitle>
                  <CardDescription>
                    Card ID: {cardId} • {sortedLogs.length} reviews
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left p-2">#</th>
                          <th className="text-left p-2">Time</th>
                          <th className="text-left p-2">Rating</th>
                          <th className="text-left p-2">State</th>
                          <th className="text-left p-2">Stability</th>
                          <th className="text-left p-2">Difficulty</th>
                          <th className="text-left p-2">Interval</th>
                          <th className="text-left p-2">Due At</th>
                          <th className="text-left p-2">Overdue</th>
                        </tr>
                      </thead>
                      <tbody>
                        {sortedLogs.map((log, index) => (
                          <tr key={log.id} className="border-b hover:bg-muted/50">
                            <td className="p-2 font-mono text-xs">{index + 1}</td>
                            <td className="p-2">
                              {new Date(log.rated_at).toLocaleString()}
                            </td>
                            <td className="p-2">
                              <Badge 
                                variant={
                                  log.rating === 'again' ? 'destructive' : 
                                  log.rating === 'hard' ? 'outline' : 
                                  log.rating === 'easy' ? 'secondary' : 'default'
                                }
                              >
                                {log.rating}
                              </Badge>
                            </td>
                            <td className="p-2">
                              <span className="text-xs">
                                {log.state_before} → {log.state_after}
                              </span>
                            </td>
                            <td className="p-2">
                              <span className="font-mono text-xs">
                                {log.stability_before?.toFixed(2) || '0'} → {log.stability_after?.toFixed(2) || '0'}
                              </span>
                            </td>
                            <td className="p-2">
                              <span className="font-mono text-xs">
                                {log.difficulty_before?.toFixed(2) || '0'} → {log.difficulty_after?.toFixed(2) || '0'}
                              </span>
                            </td>
                            <td className="p-2">
                              <span className="font-mono text-xs">
                                {formatIntervalFSRS(log.interval_after_ms)}
                              </span>
                            </td>
                            <td className="p-2">
                              <span className="text-xs">
                                {new Date(log.due_after).toLocaleString()}
                              </span>
                            </td>
                            <td className="p-2">
                              {log.was_overdue && log.overdue_ms ? (
                                <Badge variant="destructive" className="text-xs">
                                  {Math.round(log.overdue_ms / (1000 * 60 * 60))}h late
                                </Badge>
                              ) : (
                                <span className="text-xs text-muted-foreground">On time</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            );
          })}

          {filteredLogs.length === 0 && (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground">
                  No review logs found. Start reviewing phrases to see history here.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </AdminPadding>
  );
}

