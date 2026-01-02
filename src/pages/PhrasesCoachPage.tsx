/**
 * Phrases Coach Page
 * Coach/Admin view for managing member phrases (UI-only for v0)
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AdminPadding } from '@/components/AdminPadding';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, User, Package, TrendingUp } from 'lucide-react';
import { usePhrasesSettings } from '@/features/phrases/hooks/usePhrasesSettings';
import { usePhrasesLibrary } from '@/features/phrases/hooks/usePhrasesLibrary';
import { SettingsForm } from '@/features/phrases/components/SettingsForm';
import { MOCK_PHRASE_PACKS } from '@/features/phrases/data/mockPhrasesData';
import { useToast } from '@/hooks/use-toast';
import type { PhraseSettings, CoachMember } from '@/features/phrases/types';

// Mock members for v0
const MOCK_MEMBERS: CoachMember[] = [
  {
    id: 'member-001',
    name: 'Sophie Martin',
    email: 'sophie@example.com',
    stats: {
      total: 45,
      due: 12,
      new: 5,
      learning: 15,
      review: 25,
      suspended: 0,
      buried: 0,
      known_recall: 18,
      known_recognition: 12,
    },
    settings: {
      member_id: 'member-001',
      new_per_day: 20,
      reviews_per_day: 100,
      target_retention: 0.90,
      speech_feedback_enabled: false,
      auto_assess_enabled: false,
      recognition_shadow_default: false,
      show_time_to_recall: true,
    },
  },
  {
    id: 'member-002',
    name: 'Thomas Dubois',
    email: 'thomas@example.com',
    stats: {
      total: 30,
      due: 8,
      new: 10,
      learning: 12,
      review: 8,
      suspended: 0,
      buried: 0,
      known_recall: 6,
      known_recognition: 4,
    },
    settings: {
      member_id: 'member-002',
      new_per_day: 15,
      reviews_per_day: 80,
      target_retention: 0.85,
      speech_feedback_enabled: true,
      auto_assess_enabled: false,
      recognition_shadow_default: true,
      show_time_to_recall: true,
    },
  },
  {
    id: 'member-003',
    name: 'Emma Laurent',
    email: 'emma@example.com',
    stats: {
      total: 60,
      due: 18,
      new: 0,
      learning: 20,
      review: 40,
      suspended: 0,
      buried: 0,
      known_recall: 28,
      known_recognition: 20,
    },
    settings: {
      member_id: 'member-003',
      new_per_day: 25,
      reviews_per_day: 120,
      target_retention: 0.92,
      speech_feedback_enabled: false,
      auto_assess_enabled: false,
      recognition_shadow_default: false,
      show_time_to_recall: false,
    },
  },
];

export default function PhrasesCoachPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [selectedMemberId, setSelectedMemberId] = useState<string>(MOCK_MEMBERS[0].id);
  
  const selectedMember = MOCK_MEMBERS.find((m) => m.id === selectedMemberId) || MOCK_MEMBERS[0];

  const handleSettingsUpdate = (updates: Partial<Omit<PhraseSettings, 'member_id'>>) => {
    // In v0, this is just UI - settings aren't actually saved for other members
    toast({
      title: 'Settings updated (v0)',
      description: `Changes for ${selectedMember.name} saved locally.`,
    });
  };

  const handleAssignPack = (packId: string) => {
    const pack = MOCK_PHRASE_PACKS.find((p) => p.id === packId);
    toast({
      title: 'Pack assigned (v0)',
      description: `${pack?.name} assigned to ${selectedMember.name} (UI preview only)`,
    });
  };

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
                  <h1 className="text-2xl font-serif font-bold">Coach view</h1>
                  <p className="text-sm text-muted-foreground">Manage member phrase assignments</p>
                </div>
              </div>
              <Badge variant="secondary">Admin only</Badge>
            </div>
          </div>
        </header>

        {/* Main content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* v0 Notice */}
          <Card className="mb-6 border-dashed border-2">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Badge variant="secondary">v0 Preview</Badge>
                UI-only mode
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              This is a UI preview. In v1, you'll be able to view real member data,
              edit their settings, and assign phrase packs. Changes made here won't persist.
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left column - Member selector + stats */}
            <div className="lg:col-span-1 space-y-6">
              {/* Member selector */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Select member</CardTitle>
                </CardHeader>
                <CardContent>
                  <Select value={selectedMemberId} onValueChange={setSelectedMemberId}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {MOCK_MEMBERS.map((member) => (
                        <SelectItem key={member.id} value={member.id}>
                          {member.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <div className="mt-3 text-sm text-muted-foreground">
                    {selectedMember.email}
                  </div>
                </CardContent>
              </Card>

              {/* Member stats */}
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-primary" />
                    <CardTitle className="text-lg">Stats</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="text-2xl font-bold">{selectedMember.stats.due}</div>
                    <div className="text-sm text-muted-foreground">Due today</div>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <div className="font-medium">{selectedMember.stats.new}</div>
                      <div className="text-muted-foreground">New</div>
                    </div>
                    <div>
                      <div className="font-medium">{selectedMember.stats.learning}</div>
                      <div className="text-muted-foreground">Learning</div>
                    </div>
                    <div>
                      <div className="font-medium">{selectedMember.stats.known_recall}</div>
                      <div className="text-muted-foreground">Known recall</div>
                    </div>
                    <div>
                      <div className="font-medium">{selectedMember.stats.known_recognition}</div>
                      <div className="text-muted-foreground">Known recognition</div>
                    </div>
                  </div>
                  <div className="pt-3 border-t">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Total phrases</span>
                      <span className="font-medium">{selectedMember.stats.total}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Assign packs */}
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Package className="w-5 h-5 text-primary" />
                    <CardTitle className="text-lg">Assign packs</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {MOCK_PHRASE_PACKS.map((pack) => (
                    <div key={pack.id} className="flex items-center justify-between p-3 border border-border rounded-lg">
                      <div>
                        <div className="font-medium text-sm">{pack.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {pack.phrase_ids.length} phrases
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleAssignPack(pack.id)}
                      >
                        Assign
                      </Button>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>

            {/* Right column - Member settings */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <User className="w-5 h-5 text-primary" />
                    <div>
                      <CardTitle>{selectedMember.name}'s settings</CardTitle>
                      <CardDescription>
                        Configure this member's phrase practice preferences
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <SettingsForm
                    settings={selectedMember.settings}
                    onChange={handleSettingsUpdate}
                  />
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </AdminPadding>
  );
}

