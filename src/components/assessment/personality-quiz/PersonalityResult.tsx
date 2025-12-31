import { motion } from "framer-motion";
import { Archetype, normalizeScore, getAxisLabel, AxisKey } from "./quizConfig";

interface AxisResult {
  raw: number;
  normalized: number;
  label: string;
}

interface Props {
  archetype: Archetype;
  axes: {
    control_flow: AxisResult;
    accuracy_expressiveness: AxisResult;
    security_risk: AxisResult;
  };
  consistencyGap?: number;
  onContinue: () => void;
}

const axisLabels: Record<AxisKey, [string, string]> = {
  control_flow: ['Control', 'Flow'],
  accuracy_expressiveness: ['Accuracy', 'Expressiveness'],
  security_risk: ['Security', 'Risk'],
};

function AxisBar({ axisKey, result }: { axisKey: AxisKey; result: AxisResult }) {
  const [leftLabel, rightLabel] = axisLabels[axisKey];
  
  return (
    <div className="space-y-2">
      <div className="flex justify-between text-sm font-medium">
        <span className={result.normalized < 50 ? "text-primary" : "text-muted-foreground"}>
          {leftLabel}
        </span>
        <span className={result.normalized >= 50 ? "text-primary" : "text-muted-foreground"}>
          {rightLabel}
        </span>
      </div>
      <div className="relative h-3 bg-muted rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${result.normalized}%` }}
          transition={{ duration: 1, ease: "easeOut" }}
          className="absolute h-full bg-gradient-to-r from-primary/60 to-primary rounded-full"
        />
        <motion.div
          initial={{ left: '50%' }}
          animate={{ left: `${result.normalized}%` }}
          transition={{ duration: 1, ease: "easeOut" }}
          className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-4 h-4 bg-primary rounded-full border-2 border-background shadow-lg"
        />
      </div>
      <p className="text-center text-xs text-muted-foreground">{result.label}</p>
    </div>
  );
}

export function PersonalityResult({ archetype, axes, consistencyGap, onContinue }: Props) {
  const showEncouragement = archetype.encouragement && 
    (axes.control_flow.normalized < 40 || axes.accuracy_expressiveness.normalized < 40 || axes.security_risk.normalized < 40);
  
  const showConsistencyNote = consistencyGap && consistencyGap > 0.3;

  return (
    <div className="min-h-screen bg-background py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Header */}
          <div className="text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", delay: 0.2 }}
              className="text-6xl mb-4"
            >
              {archetype.emoji}
            </motion.div>
            <h1 className="text-2xl font-bold mb-2">Your Learning Personality</h1>
            <h2 className="text-xl text-primary font-semibold">{archetype.name}</h2>
          </div>

          {/* Axis Bars */}
          <div className="p-6 rounded-2xl border border-border bg-card space-y-6">
            <h3 className="font-semibold text-center mb-4">Your 3-Axis Profile</h3>
            <AxisBar axisKey="control_flow" result={axes.control_flow} />
            <AxisBar axisKey="accuracy_expressiveness" result={axes.accuracy_expressiveness} />
            <AxisBar axisKey="security_risk" result={axes.security_risk} />
          </div>

          {/* Archetype Card */}
          <div className="grid gap-4 sm:grid-cols-2">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="p-4 rounded-xl bg-green-500/10 border border-green-500/20"
            >
              <h4 className="font-semibold text-green-600 dark:text-green-400 mb-2">✨ Your Strengths</h4>
              <p className="text-sm">{archetype.strengths}</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
              className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20"
            >
              <h4 className="font-semibold text-amber-600 dark:text-amber-400 mb-2">🔍 Hidden Bottleneck</h4>
              <p className="text-sm">{archetype.bottleneck}</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 }}
              className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20"
            >
              <h4 className="font-semibold text-blue-600 dark:text-blue-400 mb-2">🚀 Fastest Path</h4>
              <p className="text-sm">{archetype.fastestPath}</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.6 }}
              className="p-4 rounded-xl bg-red-500/10 border border-red-500/20"
            >
              <h4 className="font-semibold text-red-600 dark:text-red-400 mb-2">⚠️ Danger Path</h4>
              <p className="text-sm">{archetype.dangerPath}</p>
            </motion.div>
          </div>

          {/* Encouragement Note */}
          {showEncouragement && archetype.encouragement && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
              className="p-4 rounded-xl bg-primary/10 border border-primary/20 text-center"
            >
              <p className="text-sm font-medium">{archetype.encouragement}</p>
            </motion.div>
          )}

          {/* Consistency Note */}
          {showConsistencyNote && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
              className="p-4 rounded-xl bg-muted text-center"
            >
              <p className="text-sm text-muted-foreground">
                💡 You <em>want</em> to be more spontaneous, but under pressure you default to control. 
                That's normal — we'll train the bridge.
              </p>
            </motion.div>
          )}

          {/* CTA */}
          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9 }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onContinue}
            className="w-full py-4 px-6 rounded-xl bg-primary text-primary-foreground font-semibold text-lg shadow-lg shadow-primary/30 hover:shadow-xl transition-shadow"
          >
            Continue to Mic Check →
          </motion.button>
        </motion.div>
      </div>
    </div>
  );
}
