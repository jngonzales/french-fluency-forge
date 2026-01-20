import { useState, useCallback, memo } from "react";
import { motion, LazyMotion, domAnimation } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowRight, Zap, PartyPopper } from "lucide-react";

// Memoized KPI pill component to prevent unnecessary re-renders
const KPIPill = memo(function KPIPill({ label }: { label: string }) {
  return (
    <span className="px-4 py-2 rounded-full border border-steel/20 bg-graphite/40 font-mono text-xs text-steel/80 uppercase tracking-wider">
      {label}
    </span>
  );
});

export function HeroSection() {
  const [email, setEmail] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleWaitlistSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    
    setIsLoading(true);
    // Simulate API call - replace with actual Supabase integration
    await new Promise(resolve => setTimeout(resolve, 1000));
    setIsSubmitted(true);
    setIsLoading(false);
  }, [email]);

  const handleEmailChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
  }, []);

  const kpis = ["CLARITY", "ACTION", "REAL COMMUNICATION", "REALNESS"];

  return (
    <LazyMotion features={domAnimation}>
      <section id="hero" className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* SOLV Dark background with gradient glows */}
        <div className="absolute inset-0 bg-carbon" />
        
        {/* Animated gradient orbs - Using CSS animations for better performance */}
        <div
          className="absolute top-1/4 left-[15%] w-[600px] h-[400px] bg-uv/20 rounded-full blur-[120px] animate-pulse-slow"
          style={{ animationDuration: '8s' }}
        />
        <div
          className="absolute top-[20%] right-[15%] w-[450px] h-[325px] bg-magenta/15 rounded-full blur-[100px] animate-pulse-slow"
          style={{ animationDuration: '10s', animationDelay: '1s' }}
        />
        <div
          className="absolute bottom-[15%] right-[35%] w-[350px] h-[260px] bg-orange/15 rounded-full blur-[80px] animate-pulse-slow"
          style={{ animationDuration: '12s', animationDelay: '2s' }}
        />

        {/* Subtle film grain overlay */}
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[url('data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22160%22%20height%3D%22160%22%3E%3Cfilter%20id%3D%22n%22%3E%3CfeTurbulence%20type%3D%22fractalNoise%22%20baseFrequency%3D%22.9%22%20numOctaves%3D%223%22%20stitchTiles%3D%22stitch%22%2F%3E%3C%2Ffilter%3E%3Crect%20width%3D%22160%22%20height%3D%22160%22%20filter%3D%22url(%23n)%22%20opacity%3D%22.35%22%2F%3E%3C%2Fsvg%3E')]" />
      
      <div className="container relative z-10 px-4 py-20">
        <div className="max-w-4xl mx-auto text-center">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-3 px-4 py-2.5 rounded-full border border-steel/20 bg-graphite/50 backdrop-blur-sm mb-8"
          >
            <span className="w-2.5 h-2.5 rounded-full bg-orange shadow-[0_0_0_4px_rgba(255,77,26,0.2)]" />
            <span className="font-mono text-xs text-steel uppercase tracking-wider">We Value Reality</span>
          </motion.div>

          {/* Headline - Space Grotesk */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-serif font-bold text-bone leading-[1.0] tracking-tight mb-6"
          >
            Solving languages.
            <br />
            <span className="bg-gradient-to-r from-orange via-magenta to-uv bg-clip-text text-transparent">
              Under pressure.
            </span>
          </motion.h1>
          
          {/* Subheadline */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="text-lg md:text-xl text-steel mb-10 max-w-2xl mx-auto leading-relaxed font-medium"
          >
            SOLV is the anti-school. No "studying" cosplay. Clean systems, coaching energy, 
            real-life reps — so you speak when it matters.
          </motion.p>
          
          {/* CTA: Waiting list for Speaking Placement Test */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.6 }}
            className="max-w-xl mx-auto"
          >
            {!isSubmitted ? (
              <div className="p-6 rounded-2xl border border-steel/20 bg-graphite/60 backdrop-blur-md">
                <div className="flex items-center justify-center gap-2 mb-4">
                  <Zap className="w-5 h-5 text-orange" />
                  <span className="font-serif font-bold text-bone">Speaking Placement Test</span>
                  <span className="px-2 py-1 rounded-full bg-orange/20 text-orange text-sm font-bold">€17</span>
                </div>
                <p className="text-steel text-sm mb-5">
                  Get a precise diagnostic of your speaking level. Know exactly where you freeze — and what to do next.
                </p>
                <form onSubmit={handleWaitlistSubmit} className="flex flex-col sm:flex-row gap-3">
                  <input
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={handleEmailChange}
                    required
                    className="flex-1 px-4 py-3 rounded-full border border-steel/30 bg-carbon/50 text-bone placeholder:text-steel/50 focus:outline-none focus:border-orange focus:ring-2 focus:ring-orange/20 transition-all"
                  />
                  <Button 
                    type="submit" 
                    disabled={isLoading}
                    className="bg-orange hover:bg-orange/90 text-carbon font-bold px-6 py-3 rounded-full shadow-[0_18px_38px_rgba(255,77,26,0.26)] hover:shadow-[0_22px_46px_rgba(255,77,26,0.3)] transition-all"
                  >
                    {isLoading ? "Joining..." : "Join Waiting List"}
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </form>
              </div>
            ) : (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="p-6 rounded-2xl border border-orange/30 bg-orange/10 backdrop-blur-md"
              >
                <div className="flex items-center justify-center gap-2 mb-2">
                  <PartyPopper className="w-6 h-6 text-orange" />
                  <span className="font-serif font-bold text-bone">You're on the list!</span>
                </div>
                <p className="text-steel text-sm">
                  We'll notify you when the Speaking Placement Test launches. Get ready to discover your real level.
                </p>
              </motion.div>
            )}
          </motion.div>

          {/* KPI Pills */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6, duration: 0.6 }}
            className="mt-10 flex flex-wrap items-center justify-center gap-3"
          >
            {kpis.map((kpi) => (
              <KPIPill key={kpi} label={kpi} />
            ))}
          </motion.div>
        </div>
      </div>
      
      {/* Bottom fade */}
      <div className="absolute bottom-0 left-0 w-full h-32 bg-gradient-to-t from-bone to-transparent" />
    </section>
    </LazyMotion>
  );
}
