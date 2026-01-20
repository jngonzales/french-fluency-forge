import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Navbar, Footer } from "@/components/landing";
import { Briefcase, ArrowRight, MapPin, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";

const openPositions = [
  {
    title: "Senior Full-Stack Developer",
    location: "Paris, France (Remote OK)",
    type: "Full-time",
    department: "Engineering"
  },
  {
    title: "AI/ML Engineer",
    location: "Paris, France (Remote OK)",
    type: "Full-time",
    department: "Engineering"
  },
  {
    title: "Product Designer",
    location: "Remote",
    type: "Full-time",
    department: "Design"
  }
];

export default function CareersPage() {
  return (
    <div className="min-h-screen bg-bone">
      <Navbar />
      <main className="pt-20">
        {/* Hero */}
        <section className="py-16 md:py-20 relative overflow-hidden">
          <div className="absolute top-[10%] right-[15%] w-[350px] h-[250px] bg-uv/15 rounded-full blur-[100px]" />
          <div className="absolute bottom-[10%] left-[10%] w-[300px] h-[200px] bg-magenta/12 rounded-full blur-[80px]" />
          <div className="container px-4 relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-center max-w-3xl mx-auto"
            >
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/80 border border-steel/20 text-steel text-sm font-mono uppercase tracking-wider mb-6">
                <Briefcase className="w-4 h-4 text-uv" />
                Careers
              </div>
              <h1 className="text-4xl md:text-5xl font-serif font-bold mb-4 text-graphite">
                Join the SOLV Team
              </h1>
              <p className="text-xl text-steel">
                Help us build the future of language learning. We're looking for passionate people who want to make a difference.
              </p>
            </motion.div>
          </div>
        </section>

        {/* Why Join */}
        <section className="py-16 md:py-20 bg-white/50">
          <div className="container px-4">
            <div className="max-w-3xl mx-auto text-center">
              <h2 className="text-3xl font-serif font-bold mb-6 text-graphite">Why SOLV?</h2>
              <div className="space-y-4 text-steel">
                <p>
                  We're building something different. While most language apps focus on gamification and streaks, 
                  we're obsessed with outcomes — helping people actually speak when it matters.
                </p>
                <p>
                  Our team is small, fast, and focused. We value reality over theory, shipping over planning, 
                  and impact over hours logged. If you want to build products that genuinely help people, 
                  you'll fit right in.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Open Positions */}
        <section className="py-16 md:py-20">
          <div className="container px-4">
            <h2 className="text-3xl font-serif font-bold text-center mb-12 text-graphite">Open Positions</h2>
            <div className="max-w-3xl mx-auto space-y-4">
              {openPositions.map((position, i) => (
                <motion.div
                  key={position.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="p-6 rounded-2xl bg-white border border-steel/20 hover:border-orange/30 transition-all hover:shadow-lg cursor-pointer"
                >
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                      <span className="text-xs font-medium text-orange uppercase tracking-wider">{position.department}</span>
                      <h3 className="text-lg font-serif font-bold text-graphite mt-1">{position.title}</h3>
                      <div className="flex items-center gap-4 mt-2 text-steel text-sm">
                        <span className="flex items-center gap-1">
                          <MapPin className="w-4 h-4" /> {position.location}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-4 h-4" /> {position.type}
                        </span>
                      </div>
                    </div>
                    <Button variant="outline" className="border-steel/30 text-graphite hover:bg-orange hover:text-carbon hover:border-orange rounded-full">
                      Apply <ArrowRight className="w-4 h-4 ml-1" />
                    </Button>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* No Position CTA */}
        <section className="py-16 md:py-20 bg-gradient-to-r from-orange/10 via-magenta/5 to-uv/10">
          <div className="container px-4 text-center">
            <h2 className="text-2xl font-serif font-bold mb-4 text-graphite">Don't see your role?</h2>
            <p className="text-steel mb-8 max-w-xl mx-auto">
              We're always looking for talented people. Send us your resume and tell us how you'd contribute.
            </p>
            <Link to="/contact">
              <Button size="lg" className="bg-orange hover:bg-orange/90 text-carbon font-bold rounded-xl">
                Get in Touch
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
