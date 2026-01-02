/**
 * Settings Form Component
 * Form for configuring phrase settings
 */

import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import type { PhraseSettings } from '../types';

interface SettingsFormProps {
  settings: PhraseSettings;
  onChange: (updates: Partial<Omit<PhraseSettings, 'member_id'>>) => void;
}

export function SettingsForm({ settings, onChange }: SettingsFormProps) {
  return (
    <div className="space-y-8">
      {/* Daily limits */}
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold mb-1">Daily limits</h3>
          <p className="text-sm text-muted-foreground">
            Control how many phrases you practice each day
          </p>
        </div>

        {/* New per day */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label htmlFor="new-per-day">New phrases per day</Label>
            <span className="text-sm font-medium">{settings.new_per_day}</span>
          </div>
          <Slider
            id="new-per-day"
            value={[settings.new_per_day]}
            onValueChange={(value) => onChange({ new_per_day: value[0] })}
            min={0}
            max={50}
            step={5}
            className="w-full"
          />
          <p className="text-xs text-muted-foreground">
            How many new phrases to introduce each day (0-50)
          </p>
        </div>

        {/* Reviews per day */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label htmlFor="reviews-per-day">Reviews per day</Label>
            <span className="text-sm font-medium">{settings.reviews_per_day}</span>
          </div>
          <Slider
            id="reviews-per-day"
            value={[settings.reviews_per_day]}
            onValueChange={(value) => onChange({ reviews_per_day: value[0] })}
            min={0}
            max={200}
            step={10}
            className="w-full"
          />
          <p className="text-xs text-muted-foreground">
            Maximum reviews due to show per day (0-200)
          </p>
        </div>
      </div>

      {/* Algorithm settings */}
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold mb-1">Algorithm</h3>
          <p className="text-sm text-muted-foreground">
            Control how the spacing algorithm behaves
          </p>
        </div>

        {/* Target retention */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label htmlFor="target-retention">Target retention</Label>
            <span className="text-sm font-medium">
              {(settings.target_retention * 100).toFixed(0)}%
            </span>
          </div>
          <Slider
            id="target-retention"
            value={[settings.target_retention]}
            onValueChange={(value) => onChange({ target_retention: value[0] })}
            min={0.75}
            max={0.95}
            step={0.05}
            className="w-full"
          />
          <p className="text-xs text-muted-foreground">
            How well you want to remember phrases (75-95%). Higher = more reviews but better retention.
          </p>
        </div>
      </div>

      {/* Speech & assessment */}
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold mb-1">Speech & assessment</h3>
          <p className="text-sm text-muted-foreground">
            Experimental features for speech feedback
          </p>
        </div>

        {/* Speech feedback */}
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Label htmlFor="speech-feedback">Speech feedback</Label>
              <Badge variant="secondary" className="text-xs">Beta</Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              Get feedback on your pronunciation (mock for v0)
            </p>
          </div>
          <Switch
            id="speech-feedback"
            checked={settings.speech_feedback_enabled}
            onCheckedChange={(checked) => onChange({ speech_feedback_enabled: checked })}
          />
        </div>

        {/* Auto-assess */}
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Label htmlFor="auto-assess">Auto-assess ratings</Label>
              <Badge variant="secondary" className="text-xs">Beta</Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              Let the system suggest ratings based on your speech
            </p>
          </div>
          <Switch
            id="auto-assess"
            checked={settings.auto_assess_enabled}
            onCheckedChange={(checked) => onChange({ auto_assess_enabled: checked })}
          />
        </div>

        {/* Recognition shadow mode */}
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <Label htmlFor="shadow-mode">Recognition shadow mode default</Label>
            <p className="text-xs text-muted-foreground">
              Repeat recognition phrases out loud before rating
            </p>
          </div>
          <Switch
            id="shadow-mode"
            checked={settings.recognition_shadow_default}
            onCheckedChange={(checked) => onChange({ recognition_shadow_default: checked })}
          />
        </div>
      </div>

      {/* Display preferences */}
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold mb-1">Display</h3>
          <p className="text-sm text-muted-foreground">
            Customize what you see during sessions
          </p>
        </div>

        {/* Show time-to-recall */}
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <Label htmlFor="show-time">Show time-to-recall</Label>
            <p className="text-xs text-muted-foreground">
              Display how long it took you to reveal the answer
            </p>
          </div>
          <Switch
            id="show-time"
            checked={settings.show_time_to_recall}
            onCheckedChange={(checked) => onChange({ show_time_to_recall: checked })}
          />
        </div>
      </div>
    </div>
  );
}

