import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Check, X, Zap } from "lucide-react";

const plans = [
  {
    name: "Free",
    price: "€0",
    period: "forever",
    description: "Get started with basics",
    cta: "Get Started",
    variant: "outline" as const,
    popular: false,
    accent: "border-steel/30",
  },
  {
    name: "Pro",
    price: "€9",
    period: "/month",
    description: "For serious learners",
    cta: "Start 7-Day Free Trial",
    variant: "default" as const,
    popular: true,
    accent: "border-orange",
  },
  {
    name: "Pro+",
    price: "€19",
    period: "/month",
    description: "Maximum acceleration",
    cta: "Start 7-Day Free Trial",
    variant: "default" as const,
    popular: false,
    accent: "border-magenta",
  },
];

// Feature comparison matrix
const featureComparison = [
  {
    feature: "Speaking Placement Test",
    free: false,
    premium: true,
    premiumPlus: true,
  },
  {
    feature: "Reality Reps (Situation Drills)",
    free: "5/day",
    premium: "Unlimited",
    premiumPlus: "Unlimited",
  },
  {
    feature: "Pronunciation Scoring",
    free: false,
    premium: true,
    premiumPlus: true,
  },
  {
    feature: "Diagnostic Dashboard",
    free: "Basic",
    premium: "Full",
    premiumPlus: "Advanced",
  },
  {
    feature: "AI Feedback Loop",
    free: false,
    premium: true,
    premiumPlus: true,
  },
  {
    feature: "Confidence Tracking",
    free: false,
    premium: true,
    premiumPlus: true,
  },
  {
    feature: "Live Coaching Sessions",
    free: false,
    premium: false,
    premiumPlus: "2/month",
  },
  {
    feature: "Priority Support",
    free: false,
    premium: false,
    premiumPlus: true,
  },
];

function FeatureValue({ value }: { value: boolean | string }) {
  if (value === true) {
    return (
      <div className="flex justify-center">
        <div className="w-6 h-6 rounded-full bg-orange/20 flex items-center justify-center">
          <Check className="w-4 h-4 text-orange" />
        </div>
      </div>
    );
  }
  if (value === false) {
    return (
      <div className="flex justify-center">
        <div className="w-6 h-6 rounded-full bg-steel/10 flex items-center justify-center">
          <X className="w-4 h-4 text-steel/50" />
        </div>
      </div>
    );
  }
  return <span className="text-sm text-bone font-medium">{value}</span>;
}

export function PricingSection() {
  return (
    <section
      id="pricing"
      className="py-20 md:py-28 bg-bone relative overflow-hidden"
    >
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-[500px] h-[400px] rounded-full bg-[radial-gradient(50%_50%_at_50%_50%,hsl(12_100%_55%_/_0.5)_0%,transparent_70%)]" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[300px] rounded-full bg-[radial-gradient(50%_50%_at_50%_50%,hsl(335_100%_59%_/_0.5)_0%,transparent_70%)]" />

      <div className="container px-4 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-carbon/5 text-carbon text-xs font-mono uppercase tracking-wider mb-6">
            <span className="w-2 h-2 rounded-full bg-uv" />
            Simple Pricing
          </span>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-serif font-bold text-carbon mb-5 tracking-tight">
            Invest in{" "}
            <span className="bg-gradient-to-r from-orange via-magenta to-uv bg-clip-text text-transparent">speaking confidence.</span>
          </h2>
          <p className="text-lg text-steel max-w-2xl mx-auto leading-relaxed font-medium">
            Start free. Upgrade when you're ready for serious progress.
          </p>
        </motion.div>

        {/* Plan Cards */}
        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto mb-14">
          {plans.map((plan, index) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className={`relative ${plan.popular ? "md:-mt-4 md:mb-4" : ""}`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-orange text-carbon px-5 py-1.5 rounded-full text-sm font-bold flex items-center gap-1.5 z-10 shadow-lg">
                  <Zap className="w-4 h-4" />
                  Most Popular
                </div>
              )}

              <div
                className={`h-full p-6 md:p-8 rounded-2xl bg-white border-2 transition-all duration-300 ${
                  plan.popular
                    ? "border-orange shadow-xl ring-2 ring-orange/20"
                    : `${plan.accent} hover:border-orange/30`
                }`}
              >
                <h3 className="text-xl font-serif font-bold text-carbon mb-2 tracking-tight">
                  {plan.name}
                </h3>
                <p className="text-steel text-sm mb-4 font-medium">
                  {plan.description}
                </p>
                <div className="flex items-baseline gap-1 mb-6">
                  <span className="text-4xl md:text-5xl font-bold text-carbon">
                    {plan.price}
                  </span>
                  <span className="text-steel text-base">
                    {plan.period}
                  </span>
                </div>
                <Link to="/signup">
                  <Button 
                    variant={plan.variant} 
                    className={`w-full rounded-full ${plan.popular ? 'bg-orange hover:bg-orange/90 text-carbon shadow-lg' : ''}`} 
                    size="lg"
                  >
                    {plan.cta}
                  </Button>
                </Link>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Comparison Matrix */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="max-w-5xl mx-auto"
        >
          <div className="bg-carbon rounded-2xl border border-steel/20 overflow-hidden shadow-xl">
            {/* Header row */}
            <div className="grid grid-cols-4 bg-graphite border-b border-steel/20">
              <div className="p-4 md:p-5 font-serif font-bold text-bone">Features</div>
              <div className="p-4 md:p-5 text-center font-serif font-bold text-steel">
                Free
              </div>
              <div className="p-4 md:p-5 text-center font-serif font-bold text-orange bg-orange/10">
                Pro
              </div>
              <div className="p-4 md:p-5 text-center font-serif font-bold text-magenta">
                Pro+
              </div>
            </div>

            {/* Feature rows */}
            {featureComparison.map((row, index) => (
              <div
                key={row.feature}
                className={`grid grid-cols-4 ${
                  index < featureComparison.length - 1
                    ? "border-b border-steel/15"
                    : ""
                }`}
              >
                <div className="p-4 md:p-5 text-sm text-steel font-medium">
                  {row.feature}
                </div>
                <div className="p-4 md:p-5 text-center">
                  <FeatureValue value={row.free} />
                </div>
                <div className="p-4 md:p-5 text-center bg-orange/5">
                  <FeatureValue value={row.premium} />
                </div>
                <div className="p-4 md:p-5 text-center">
                  <FeatureValue value={row.premiumPlus} />
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.5 }}
          className="text-center text-steel text-sm mt-8 font-mono"
        >
          All prices in EUR. Cancel anytime. No hidden fees.
        </motion.p>
      </div>
    </section>
  );
}
