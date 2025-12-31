import { Archetype, Badge } from "../quizConfig";

export interface AxisResult {
  raw: number;
  normalized: number;
  label: string;
}

export interface ExportData {
  archetype: Archetype;
  axes: {
    control_flow: AxisResult;
    accuracy_expressiveness: AxisResult;
    security_risk: AxisResult;
  };
  badges: Badge[];
  shareUrl: string;
}

export type ExportFormat = 'story' | 'post' | 'square';

export const FORMAT_DIMENSIONS: Record<ExportFormat, { width: number; height: number; label: string }> = {
  story: { width: 1080, height: 1920, label: 'Story (9:16)' },
  post: { width: 1080, height: 1350, label: 'Post (4:5)' },
  square: { width: 1080, height: 1080, label: 'Square (1:1)' },
};
