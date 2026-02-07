import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Target, Mic, Zap, BarChart3, Repeat, Brain, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";

const primaryFeatures = [
  {
    icon: Target,
    title: "Reality Reps",
    description:
      "Train the moments you freeze, not textbook fiction. Real-life scenarios that pressure-test your speaking.",
    color: "bg-orange",
  },
  {
    icon: Mic,
    title: "Performance Coaching",
    description:
      "Constraints, feedback loops, pressure — like sport. Get instant scoring on pronunciation and fluency.",
    color: "bg-magenta",
  },
  {
    icon: Zap,
    title: "Clean Systems",
    description:
      "Minimal UI. High contrast. Fast execution. No fluff, just measurable progress toward speaking confidence.",
    color: "bg-uv",
  },
];

const secondaryFeatures = [
  {
    icon: Brain,
    title: "AI-Powered Adaptation",
    description:
      "Our AI analyzes your performance and adjusts difficulty in real-time to keep you in the challenge zone.",
    color: "bg-orange",
  },
  {
    icon: BarChart3,
    title: "Diagnostic Dashboard",
    description:
      "Track your CEFR level, speed metrics, and weak points with data-driven insights.",
    color: "bg-magenta",
  },
  {
    icon: Repeat,
    title: "The Loop",
    description:
      "Diagnose → drill real situations → feedback → repeat. Less theory. More reps.",
    color: "bg-uv",
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

export function FeaturesSection() {
  const [showMore, setShowMore] = useState(false);

  return (
    <section id="features" className="py-20 md:py-28 bg-bone relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-[500px] h-[400px] rounded-full bg-[radial-gradient(50%_50%_at_50%_50%,hsl(12_100%_55%_/_0.5)_0%,transparent_70%)]" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[300px] rounded-full bg-[radial-gradient(50%_50%_at_50%_50%,hsl(260_100%_58%_/_0.5)_0%,transparent_70%)]" />

      <div className="container relative z-10 px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-14"
        >
          <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-carbon/5 text-carbon text-xs font-mono uppercase tracking-wider mb-6">
            <span className="w-2 h-2 rounded-full bg-orange" />
            The Method
          </span>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-serif font-bold text-carbon mb-5 tracking-tight">
            Stop studying.{" "}
            <span className="bg-gradient-to-r from-orange via-magenta to-uv bg-clip-text text-transparent">Start speaking.</span>
          </h2>
          <p className="text-lg text-steel max-w-2xl mx-auto leading-relaxed font-medium">
            SOLV trains real communication — the moments that matter when you're under pressure.
          </p>
        </motion.div>

        {/* Primary Features - 3 cards */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto"
        >
          {primaryFeatures.map((feature) => (
            <motion.div key={feature.title} variants={itemVariants} className="group relative">
              <div className="h-full p-7 rounded-2xl bg-white border border-steel/15 hover:border-orange/30 transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
                <div
                  className={`w-14 h-14 rounded-xl ${feature.color} flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-300 shadow-lg`}
                >
                  <feature.icon className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-xl font-serif font-bold text-carbon mb-3 tracking-tight">
                  {feature.title}
                </h3>
                <p className="text-steel leading-relaxed text-sm font-medium">
                  {feature.description}
                </p>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* See More / Secondary Features */}
        <div className="mt-10 text-center">
          <Button
            variant="outline"
            size="lg"
            onClick={() => setShowMore(!showMore)}
            className="group rounded-full border-steel/30 text-carbon hover:bg-carbon hover:text-bone hover:border-carbon"
          >
            {showMore ? (
              <>
                Show Less
                <ChevronUp className="w-4 h-4 ml-2 group-hover:-translate-y-0.5 transition-transform" />
              </>
            ) : (
              <>
                See All Features
                <ChevronDown className="w-4 h-4 ml-2 group-hover:translate-y-0.5 transition-transform" />
              </>
            )}
          </Button>
        </div>

        <AnimatePresence>
          {showMore && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.4, ease: "easeInOut" }}
              className="overflow-hidden"
            >
              <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto mt-8"
              >
                {secondaryFeatures.map((feature) => (
                  <motion.div key={feature.title} variants={itemVariants} className="group relative">
                    <div className="h-full p-7 rounded-2xl bg-white border border-steel/15 hover:border-orange/30 transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
                      <div
                        className={`w-14 h-14 rounded-xl ${feature.color} flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-300 shadow-lg`}
                      >
                        <feature.icon className="w-7 h-7 text-white" />
                      </div>
                      <h3 className="text-xl font-serif font-bold text-carbon mb-3 tracking-tight">
                        {feature.title}
                      </h3>
                      <p className="text-steel leading-relaxed text-sm font-medium">
                        {feature.description}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}
