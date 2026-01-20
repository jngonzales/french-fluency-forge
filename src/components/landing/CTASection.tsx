import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowRight, Zap, Target, TrendingUp, PartyPopper, CheckCircle } from "lucide-react";

export function CTASection() {
  const [email, setEmail] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleWaitlistSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    
    setIsLoading(true);
    // Simulate API call - replace with actual Supabase integration
    await new Promise(resolve => setTimeout(resolve, 1000));
    setIsSubmitted(true);
    setIsLoading(false);
  };

  return (
    <section className="py-20 md:py-28 relative overflow-hidden">
      {/* SOLV Dark background */}
      <div className="absolute inset-0 bg-carbon" />
      
      {/* Gradient orbs */}
      <motion.div
        className="absolute top-10 left-[10%] w-[500px] h-[350px] bg-orange/15 rounded-full blur-[100px]"
        animate={{ scale: [1, 1.2, 1], opacity: [0.15, 0.25, 0.15] }}
        transition={{ duration: 8, repeat: Infinity }}
      />
      <motion.div
        className="absolute bottom-10 right-[10%] w-[600px] h-[400px] bg-magenta/12 rounded-full blur-[120px]"
        animate={{ scale: [1.2, 1, 1.2], opacity: [0.12, 0.2, 0.12] }}
        transition={{ duration: 10, repeat: Infinity }}
      />
      <motion.div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[300px] bg-uv/10 rounded-full blur-[80px]"
        animate={{ scale: [1, 1.15, 1], opacity: [0.08, 0.15, 0.08] }}
        transition={{ duration: 12, repeat: Infinity }}
      />
      
      <div className="container relative z-10 px-4">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center max-w-3xl mx-auto"
        >
          {/* Badge */}
          <motion.div
            initial={{ scale: 0 }}
            whileInView={{ scale: 1 }}
            viewport={{ once: true }}
            transition={{ type: "spring", delay: 0.2 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-steel/20 bg-graphite/50 backdrop-blur-sm mb-8"
          >
            <Zap className="w-4 h-4 text-orange" />
            <span className="text-sm text-steel font-semibold">Know your real level</span>
          </motion.div>
          
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-serif font-bold text-bone mb-6 tracking-tight">
            Stop guessing.
            <br />
            <span className="bg-gradient-to-r from-orange via-magenta to-uv bg-clip-text text-transparent">
              Get diagnosed.
            </span>
          </h2>
          
          <p className="text-lg text-steel mb-10 max-w-xl mx-auto leading-relaxed">
            The Speaking Placement Test pinpoints exactly where you freeze under pressure — 
            and gives you a clear action plan to fix it.
          </p>

          {/* Features */}
          <div className="grid md:grid-cols-3 gap-4 mb-10">
            {[
              { icon: Target, title: "Precise Diagnosis", desc: "Know your exact CEFR level" },
              { icon: Zap, title: "Pressure Tested", desc: "Real scenarios, not textbook Q&A" },
              { icon: TrendingUp, title: "Action Plan", desc: "Concrete next steps to improve" },
            ].map((feature) => (
              <div
                key={feature.title}
                className="p-4 rounded-xl border border-steel/15 bg-graphite/40 backdrop-blur-sm"
              >
                <feature.icon className="w-6 h-6 text-orange mx-auto mb-2" />
                <div className="font-serif font-bold text-bone text-sm mb-1">{feature.title}</div>
                <div className="text-steel text-xs">{feature.desc}</div>
              </div>
            ))}
          </div>

          {/* Waiting List Form */}
          {!isSubmitted ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="max-w-xl mx-auto p-6 rounded-2xl border border-steel/20 bg-graphite/60 backdrop-blur-md"
            >
              <div className="flex items-center justify-center gap-3 mb-4">
                <span className="font-serif font-bold text-bone text-lg">Speaking Placement Test</span>
                <span className="px-3 py-1.5 rounded-full bg-orange text-carbon text-sm font-bold shadow-[0_8px_20px_rgba(255,77,26,0.3)]">
                  €17
                </span>
              </div>
              <form onSubmit={handleWaitlistSubmit} className="flex flex-col sm:flex-row gap-3">
                <input
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="flex-1 px-5 py-3.5 rounded-full border border-steel/30 bg-carbon/50 text-bone placeholder:text-steel/50 focus:outline-none focus:border-orange focus:ring-2 focus:ring-orange/20 transition-all"
                />
                <Button 
                  type="submit" 
                  disabled={isLoading}
                  className="bg-orange hover:bg-orange/90 text-carbon font-bold px-8 py-3.5 rounded-full shadow-[0_18px_38px_rgba(255,77,26,0.26)] hover:shadow-[0_22px_46px_rgba(255,77,26,0.3)] transition-all"
                >
                  {isLoading ? "Joining..." : "Join Waiting List"}
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </form>
              <p className="text-steel/60 text-xs mt-4">
                Be the first to know when we launch. No spam, ever.
              </p>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="max-w-xl mx-auto p-8 rounded-2xl border border-orange/30 bg-orange/10 backdrop-blur-md"
            >
              <div className="flex items-center justify-center gap-2 mb-3">
                <PartyPopper className="w-8 h-8 text-orange" />
                <span className="font-serif font-bold text-bone text-xl">You're on the list!</span>
              </div>
              <p className="text-steel">
                We'll email you the moment the Speaking Placement Test goes live. 
                Get ready to discover your real level.
              </p>
            </motion.div>
          )}

          {/* Trust signals */}
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.4 }}
            className="mt-10 flex items-center justify-center gap-6 text-steel/60 text-sm font-mono"
          >
            <span className="flex items-center gap-1"><CheckCircle className="w-3.5 h-3.5" /> 3-min test</span>
            <span className="flex items-center gap-1"><CheckCircle className="w-3.5 h-3.5" /> Instant results</span>
            <span className="flex items-center gap-1"><CheckCircle className="w-3.5 h-3.5" /> Actionable feedback</span>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
