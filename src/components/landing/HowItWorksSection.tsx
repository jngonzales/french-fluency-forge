import { motion } from "framer-motion";
import { Target, Zap, BarChart3, Repeat } from "lucide-react";

const steps = [
  {
    icon: Target,
    number: "01",
    title: "Diagnose",
    description:
      "Take the Speaking Placement Test. Know exactly where you freeze under pressure.",
  },
  {
    icon: Repeat,
    number: "02",
    title: "Drill",
    description:
      "Real-life situation reps. Train the moments that matter — not textbook fiction.",
  },
  {
    icon: Zap,
    number: "03",
    title: "Feedback",
    description:
      "Instant scoring on pronunciation, fluency, and confidence. Data-driven improvement.",
  },
  {
    icon: BarChart3,
    number: "04",
    title: "Repeat",
    description:
      "The loop continues. Less theory, more reps. Measurable progress every session.",
  },
];

export function HowItWorksSection() {
  return (
    <section
      id="how-it-works"
      className="py-20 md:py-28 bg-graphite relative overflow-hidden"
    >
      {/* Gradient orbs */}
      <div className="absolute top-0 left-[20%] w-[400px] h-[300px] bg-uv/10 rounded-full blur-[100px]" />
      <div className="absolute bottom-0 right-[20%] w-[350px] h-[250px] bg-magenta/10 rounded-full blur-[80px]" />

      <div className="container px-4 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-14"
        >
          <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-carbon/50 border border-steel/20 text-steel text-xs font-mono uppercase tracking-wider mb-6">
            <span className="w-2 h-2 rounded-full bg-magenta" />
            The Loop
          </span>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-serif font-bold text-bone mb-5 tracking-tight">
            Diagnose. Drill.{" "}
            <span className="bg-gradient-to-r from-orange via-magenta to-uv bg-clip-text text-transparent">Repeat.</span>
          </h2>
          <p className="text-lg text-steel max-w-2xl mx-auto leading-relaxed font-medium">
            Less theory. More reps. Systems beat motivation.
          </p>
        </motion.div>

        <div className="relative max-w-5xl mx-auto">
          {/* Connection line - desktop only */}
          <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-gradient-to-r from-orange via-magenta to-uv hidden lg:block opacity-30" />

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {steps.map((step, index) => (
              <motion.div
                key={step.number}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="relative"
              >
                <div className="bg-carbon rounded-2xl p-6 border border-steel/15 hover:border-orange/30 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 h-full">
                  {/* Number badge */}
                  <div className="absolute -top-4 left-6 bg-orange text-carbon px-3 py-1 rounded-full text-sm font-bold shadow-lg">
                    {step.number}
                  </div>

                  <div className="w-12 h-12 rounded-xl bg-graphite border border-steel/20 flex items-center justify-center mb-4 mt-2">
                    <step.icon className="w-6 h-6 text-orange" />
                  </div>

                  <h3 className="text-lg font-serif font-bold text-bone mb-2 tracking-tight">
                    {step.title}
                  </h3>
                  <p className="text-steel text-sm leading-relaxed font-medium">
                    {step.description}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Diagnostic box */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.4 }}
          className="mt-12 max-w-3xl mx-auto p-4 rounded-xl border border-steel/20 bg-carbon/50 font-mono text-xs text-steel/80 overflow-x-auto"
        >
          DIAGNOSTIC → LEVEL=B2 • SPEED=FAST • FOCUS=REAL-LIFE REPS • NEXT=3 SITUATION DRILLS
        </motion.div>
      </div>
    </section>
  );
}
