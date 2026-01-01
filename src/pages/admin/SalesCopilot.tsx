/**
 * Sales Copilot Main Page
 * Entry point for sales call management
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LeadInbox } from '@/components/sales/LeadInbox';
import { LeadDetail } from '@/components/sales/LeadDetail';
import { CallScreen } from '@/components/sales/CallScreen';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  fetchLeads,
  fetchLead,
  createLead,
  fetchCallsForLead,
  createCall,
  fetchCall,
  fetchActivePlaybook,
} from '@/lib/sales/api';
import { seedPlaybook, getActivePlaybook } from '@/lib/sales/playbookSeed';
import { useAuth } from '@/contexts/AuthContext';
import { useAdminMode } from '@/hooks/useAdminMode';
import { AdminPadding } from '@/components/AdminPadding';
import type { Lead, Call, PlaybookData } from '@/lib/sales/types';
import { ArrowLeft, Plus } from 'lucide-react';
import { toast } from 'sonner';

type View = 'inbox' | 'lead-detail' | 'call';

export default function SalesCopilot() {
  const { user } = useAuth();
  const { isAdmin, isLoading: adminLoading } = useAdminMode();
  const navigate = useNavigate();

  const [view, setView] = useState<View>('inbox');
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [activeCall, setActiveCall] = useState<Call | null>(null);
  const [playbook, setPlaybook] = useState<PlaybookData | null>(null);
  const [showCreateLead, setShowCreateLead] = useState(false);
  const [newLeadData, setNewLeadData] = useState<Partial<Lead>>({});

  useEffect(() => {
    if (!adminLoading && !isAdmin) {
      navigate('/');
      return;
    }
    loadPlaybook();
  }, [isAdmin, adminLoading]);

  const loadPlaybook = async () => {
    try {
      let playbookData = await getActivePlaybook();
      if (!playbookData && user) {
        // Seed playbook if none exists
        await seedPlaybook(user.id);
        playbookData = await getActivePlaybook();
      }
      if (playbookData) {
        setPlaybook(playbookData);
      }
    } catch (error) {
      console.error('Error loading playbook:', error);
      toast.error('Failed to load playbook');
    }
  };

  const handleSelectLead = async (lead: Lead) => {
    setSelectedLead(lead);
    setView('lead-detail');
  };

  const handleStartCall = async () => {
    if (!selectedLead || !user || !playbook) return;

    try {
      // Check for existing active call
      const existingCalls = await fetchCallsForLead(selectedLead.id);
      const activeCall = existingCalls.find((c) => !c.outcome);

      if (activeCall) {
        const call = await fetchCall(activeCall.id);
        if (call) {
          setActiveCall(call);
          setView('call');
          return;
        }
      }

      // Create new call
      const newCall = await createCall(
        {
          lead_id: selectedLead.id,
          stage: 'rapport',
          tags: [],
          answers: [],
          qualification_score: 50,
        },
        user.id
      );

      setActiveCall(newCall);
      setView('call');
    } catch (error) {
      console.error('Error starting call:', error);
      toast.error('Failed to start call');
    }
  };

  const handleCreateLead = async () => {
    if (!user) return;

    try {
      const lead = await createLead(newLeadData, user.id);
      setSelectedLead(lead);
      setShowCreateLead(false);
      setNewLeadData({});
      setView('lead-detail');
      toast.success('Lead created');
    } catch (error) {
      console.error('Error creating lead:', error);
      toast.error('Failed to create lead');
    }
  };

  const handleCallUpdate = (updatedCall: Call) => {
    setActiveCall(updatedCall);
  };

  if (adminLoading) {
    return (
      <AdminPadding>
        <div className="flex items-center justify-center min-h-screen">
          <p>Loading...</p>
        </div>
      </AdminPadding>
    );
  }

  if (!isAdmin) {
    return null;
  }

  if (!playbook) {
    return (
      <AdminPadding>
        <div className="flex items-center justify-center min-h-screen">
          <p>Loading playbook...</p>
        </div>
      </AdminPadding>
    );
  }

  return (
    <AdminPadding>
      <div className="container mx-auto p-6 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {view !== 'inbox' && (
              <Button variant="ghost" onClick={() => setView('inbox')}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
            )}
            <h1 className="text-3xl font-bold">Sales Copilot</h1>
          </div>
        </div>

        {/* Main Content */}
        {view === 'inbox' && (
          <LeadInbox
            onSelectLead={handleSelectLead}
            onCreateLead={() => setShowCreateLead(true)}
          />
        )}

        {view === 'lead-detail' && selectedLead && (
          <LeadDetail
            lead={selectedLead}
            onStartCall={handleStartCall}
            onEdit={() => {
              // TODO: Implement edit
              toast.info('Edit feature coming soon');
            }}
          />
        )}

        {view === 'call' && activeCall && selectedLead && playbook && (
          <CallScreen
            call={activeCall}
            lead={selectedLead}
            playbook={playbook}
            onCallUpdate={handleCallUpdate}
          />
        )}

        {/* Create Lead Dialog */}
        <Dialog open={showCreateLead} onOpenChange={setShowCreateLead}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New Lead</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={newLeadData.name || ''}
                  onChange={(e) =>
                    setNewLeadData({ ...newLeadData, name: e.target.value })
                  }
                />
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={newLeadData.email || ''}
                  onChange={(e) =>
                    setNewLeadData({ ...newLeadData, email: e.target.value })
                  }
                />
              </div>
              <div>
                <Label htmlFor="goal">Goal</Label>
                <Textarea
                  id="goal"
                  value={newLeadData.goal || ''}
                  onChange={(e) =>
                    setNewLeadData({ ...newLeadData, goal: e.target.value })
                  }
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="time">Time Available (hrs/week)</Label>
                  <Input
                    id="time"
                    type="number"
                    value={newLeadData.time_available_per_week || ''}
                    onChange={(e) =>
                      setNewLeadData({
                        ...newLeadData,
                        time_available_per_week: parseInt(e.target.value) || undefined,
                      })
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="budget">Budget Comfort (1-5)</Label>
                  <Input
                    id="budget"
                    type="number"
                    min="1"
                    max="5"
                    value={newLeadData.budget_comfort || ''}
                    onChange={(e) =>
                      setNewLeadData({
                        ...newLeadData,
                        budget_comfort: parseInt(e.target.value) || undefined,
                      })
                    }
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowCreateLead(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateLead}>Create Lead</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </AdminPadding>
  );
}

