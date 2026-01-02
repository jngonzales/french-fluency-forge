/**
 * Phrase Actions Menu Component
 * Dropdown menu with note/flag/bury/suspend/remove actions
 */

import { useState } from 'react';
import { MoreVertical, StickyNote, Flag, EyeOff, Pause, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface PhraseActionsMenuProps {
  onAddNote: (note: string) => void;
  onFlag: (reason: string) => void;
  onBury: () => void;
  onSuspend: () => void;
  onRemove: () => void;
}

export function PhraseActionsMenu({
  onAddNote,
  onFlag,
  onBury,
  onSuspend,
  onRemove,
}: PhraseActionsMenuProps) {
  const [noteDialogOpen, setNoteDialogOpen] = useState(false);
  const [flagDialogOpen, setFlagDialogOpen] = useState(false);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState<'bury' | 'suspend' | 'remove' | null>(null);
  
  const [noteText, setNoteText] = useState('');
  const [flagReason, setFlagReason] = useState('');
  const [flagDetails, setFlagDetails] = useState('');

  const handleAddNote = () => {
    if (noteText.trim()) {
      onAddNote(noteText);
      setNoteText('');
      setNoteDialogOpen(false);
    }
  };

  const handleFlag = () => {
    if (flagReason) {
      const fullReason = flagDetails ? `${flagReason}: ${flagDetails}` : flagReason;
      onFlag(fullReason);
      setFlagReason('');
      setFlagDetails('');
      setFlagDialogOpen(false);
    }
  };

  const handleConfirm = () => {
    if (confirmAction === 'bury') onBury();
    if (confirmAction === 'suspend') onSuspend();
    if (confirmAction === 'remove') onRemove();
    setConfirmDialogOpen(false);
    setConfirmAction(null);
  };

  const confirmMessages = {
    bury: {
      title: 'Bury this phrase?',
      description: 'This phrase will be hidden until tomorrow. You can reactivate it from the library.',
    },
    suspend: {
      title: 'Suspend this phrase?',
      description: 'This phrase will be hidden indefinitely. You can reactivate it from the library.',
    },
    remove: {
      title: 'Remove this phrase?',
      description: 'This phrase will be removed from your active set. You can reactivate it from the library.',
    },
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon">
            <MoreVertical className="w-5 h-5" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuItem onClick={() => setNoteDialogOpen(true)}>
            <StickyNote className="w-4 h-4 mr-2" />
            Add note
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setFlagDialogOpen(true)}>
            <Flag className="w-4 h-4 mr-2" />
            Flag issue
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => {
              setConfirmAction('bury');
              setConfirmDialogOpen(true);
            }}
          >
            <EyeOff className="w-4 h-4 mr-2" />
            Bury (until tomorrow)
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => {
              setConfirmAction('suspend');
              setConfirmDialogOpen(true);
            }}
          >
            <Pause className="w-4 h-4 mr-2" />
            Suspend
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => {
              setConfirmAction('remove');
              setConfirmDialogOpen(true);
            }}
            className="text-destructive"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Remove from my set
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Note Dialog */}
      <Dialog open={noteDialogOpen} onOpenChange={setNoteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add a note</DialogTitle>
            <DialogDescription>
              Add a personal note or memory aid for this phrase
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="note">Note</Label>
              <Textarea
                id="note"
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                placeholder="e.g., Remember to use 'tu' with friends"
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNoteDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddNote} disabled={!noteText.trim()}>
              Save note
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Flag Dialog */}
      <Dialog open={flagDialogOpen} onOpenChange={setFlagDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Flag an issue</DialogTitle>
            <DialogDescription>
              Report a problem with this phrase
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="flag-reason">Issue type</Label>
              <Select value={flagReason} onValueChange={setFlagReason}>
                <SelectTrigger id="flag-reason">
                  <SelectValue placeholder="Select an issue type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Incorrect translation">Incorrect translation</SelectItem>
                  <SelectItem value="Typo">Typo</SelectItem>
                  <SelectItem value="Audio issue">Audio issue</SelectItem>
                  <SelectItem value="Difficulty mismatch">Difficulty mismatch</SelectItem>
                  <SelectItem value="Too easy">Too easy</SelectItem>
                  <SelectItem value="Too hard">Too hard</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="flag-details">Details (optional)</Label>
              <Textarea
                id="flag-details"
                value={flagDetails}
                onChange={(e) => setFlagDetails(e.target.value)}
                placeholder="Additional details about the issue"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFlagDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleFlag} disabled={!flagReason}>
              Flag issue
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirm Dialog */}
      <Dialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {confirmAction && confirmMessages[confirmAction].title}
            </DialogTitle>
            <DialogDescription>
              {confirmAction && confirmMessages[confirmAction].description}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              variant={confirmAction === 'remove' ? 'destructive' : 'default'}
              onClick={handleConfirm}
            >
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

