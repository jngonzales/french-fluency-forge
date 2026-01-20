import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Navbar, Footer } from "@/components/landing";
import { Target, Zap, Mic, Brain } from "lucide-react";

const team = [
  { name: "Tom Gauthier", role: "Founder & CEO", image: "/TomGauthier.jpg" },
];

const values = [
  { icon: Target, title: "Reality-First", description: "No flashcards. No theory. We train you for real conversations under pressure." },
  { icon: Zap, title: "Diagnostic-Driven", description: "Every session begins with diagnosis. We target what's broken, not what's easy." },
  { icon: Mic, title: "Speaking Over Studying", description: "You don't learn French by reading about it. You learn by speaking it." },
  { icon: Brain, title: "Pressure Training", description: "Real fluency means thinking fast. We prepare you for the speed of real life." },
];

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-bone">
      <Navbar />
      <main className="pt-20">
        {/* Hero */}
        <section className="py-20 md:py-28 relative overflow-hidden">
          {/* Gradient orbs */}
          <div className="absolute top-[10%] right-[10%] w-[400px] h-[300px] bg-uv/15 rounded-full blur-[100px]" />
          <div className="absolute bottom-[20%] left-[10%] w-[350px] h-[250px] bg-orange/12 rounded-full blur-[80px]" />
          
          <div className="container px-4 relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-center max-w-3xl mx-auto"
            >
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/80 border border-steel/20 text-steel text-sm font-mono uppercase tracking-wider mb-6">
                <Target className="w-4 h-4 text-orange" />
                About SOLV
              </div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-serif font-bold mb-6 text-graphite tracking-tight">
                Solving languages.<br/>
                <span className="text-orange">Under pressure.</span>
              </h1>
              <p className="text-xl text-steel leading-relaxed">
                SOLV Languages is built for people who want to speak French—not study it. 
                We train under pressure so you're ready when it matters.
              </p>
            </motion.div>
          </div>
        </section>

        {/* Story */}
        <section className="py-16 md:py-20 bg-white/50">
          <div className="container px-4">
            <div className="max-w-3xl mx-auto">
              <h2 className="text-3xl font-serif font-bold mb-6 text-graphite">The Problem</h2>
              <div className="space-y-4 text-steel">
                <p>
                  Most language apps teach you to memorize. Flashcards, grammar drills, multiple choice quizzes. 
                  You study for months, feel like you're learning, then freeze when someone actually speaks to you in French.
                </p>
                <p>
                  That's because studying about a language and speaking it are completely different skills. 
                  One is passive. The other demands real-time production under pressure.
                </p>
                <p className="text-graphite font-semibold">
                  SOLV is built around one belief: the only way to learn to speak is to speak.
                </p>
              </div>
              
              <h2 className="text-3xl font-serif font-bold mb-6 mt-12 text-graphite">Our Method</h2>
              <div className="space-y-4 text-steel">
                <p>
                  Every SOLV session starts with diagnosis. We identify exactly where your French breaks down—
                  pronunciation, syntax, fluency, vocabulary retrieval—and we target those gaps with Reality Reps™.
                </p>
                <p>
                  Reality Reps are AI-powered drills designed to simulate real conversational pressure. 
                  No multiple choice. No safety net. Just you, speaking French, getting immediate feedback.
                </p>
                <p>
                  It's harder than traditional apps. But it works. Because when you finally speak French 
                  in Paris, in a meeting, with a friend—you'll have done it hundreds of times already.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Values */}
        <section className="py-16 md:py-20">
          <div className="container px-4">
            <h2 className="text-3xl font-serif font-bold text-center mb-12 text-graphite">Our Principles</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-5xl mx-auto">
              {values.map((value, i) => (
                <motion.div
                  key={value.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="text-center"
                >
                  <div className="w-16 h-16 rounded-2xl bg-white border border-steel/20 flex items-center justify-center mx-auto mb-4">
                    <value.icon className="w-8 h-8 text-orange" />
                  </div>
                  <h3 className="font-semibold text-lg mb-2 text-graphite">{value.title}</h3>
                  <p className="text-steel text-sm">{value.description}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Team */}
        <section className="py-16 md:py-20 bg-white/50">
          <div className="container px-4">
            <h2 className="text-3xl font-serif font-bold text-center mb-12 text-graphite">Meet the Founder</h2>
            <div className="flex justify-center">
              {team.map((member, i) => (
                <motion.div
                  key={member.name}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="text-center"
                >
                  <div className="w-24 h-24 rounded-full overflow-hidden mx-auto mb-4 bg-steel/20">
                    <img 
                      src={member.image} 
                      alt={member.name}
                      width={96}
                      height={96}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        // Fallback to initials if image fails to load
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  </div>
                  <h3 className="font-semibold text-graphite">{member.name}</h3>
                  <p className="text-steel text-sm">{member.role}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-16 md:py-20 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-orange/20 via-magenta/10 to-uv/20" />
          <div className="container px-4 text-center relative z-10">
            <h2 className="text-3xl font-serif font-bold mb-4 text-graphite">Ready to stop studying?</h2>
            <p className="text-steel mb-8 max-w-xl mx-auto">
              Join the waitlist for our €17 Speaking Placement Test. 
              Find out exactly where your French breaks—and how to fix it.
            </p>
            <Link to="/#hero">
              <Button size="lg" className="h-14 px-8 bg-orange hover:bg-orange/90 text-carbon font-bold rounded-xl shadow-[0_12px_24px_rgba(255,77,26,0.25)]">
                Join the Waitlist
              </Button>
            </Link>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
