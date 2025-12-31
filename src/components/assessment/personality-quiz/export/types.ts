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
