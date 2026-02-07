import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Navbar, Footer } from "@/components/landing";
import { HelpCircle, Book, MessageSquare, Mail, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

const helpTopics = [
  {
    icon: Book,
    title: "Getting Started",
    description: "Learn the basics of SOLV Languages and how to begin your journey.",
    href: "#"
  },
  {
    icon: MessageSquare,
    title: "FAQ",
    description: "Find answers to frequently asked questions about our platform.",
    href: "#"
  },
  {
    icon: Mail,
    title: "Contact Support",
    description: "Get in touch with our support team for personalized help.",
    href: "/contact"
  }
];

export default function HelpPage() {
  return (
    <div className="min-h-screen bg-bone">
      <Navbar />
      <main className="pt-20">
        {/* Hero */}
        <section className="py-16 md:py-20 relative overflow-hidden">
          <div className="absolute top-[10%] right-[15%] w-[350px] h-[250px] rounded-full bg-[radial-gradient(50%_50%_at_50%_50%,hsl(260_100%_58%_/_0.15)_0%,transparent_70%)]" />
          <div className="absolute bottom-[10%] left-[10%] w-[300px] h-[200px] rounded-full bg-[radial-gradient(50%_50%_at_50%_50%,hsl(12_100%_55%_/_0.12)_0%,transparent_70%)]" />
          <div className="container px-4 relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-center max-w-3xl mx-auto"
            >
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/80 border border-steel/20 text-steel text-sm font-mono uppercase tracking-wider mb-6">
                <HelpCircle className="w-4 h-4 text-orange" />
                Help Center
              </div>
              <h1 className="text-4xl md:text-5xl font-serif font-bold mb-4 text-graphite">
                How can we help?
              </h1>
              <p className="text-xl text-steel">
                Find answers, tutorials, and support for SOLV Languages.
              </p>
            </motion.div>
          </div>
        </section>

        {/* Help Topics */}
        <section className="py-16 md:py-20">
          <div className="container px-4">
            <div className="max-w-4xl mx-auto grid md:grid-cols-3 gap-6">
              {helpTopics.map((topic, i) => (
                <motion.div
                  key={topic.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                >
                  {topic.href.startsWith('/') ? (
                    <Link to={topic.href} className="block h-full">
                      <div className="h-full p-6 rounded-2xl bg-white border border-steel/20 hover:border-orange/30 transition-all hover:shadow-lg hover:-translate-y-1">
                        <div className="w-12 h-12 rounded-xl bg-orange/20 flex items-center justify-center mb-4">
                          <topic.icon className="w-6 h-6 text-orange" />
                        </div>
                        <h3 className="text-lg font-serif font-bold text-graphite mb-2">{topic.title}</h3>
                        <p className="text-steel text-sm">{topic.description}</p>
                      </div>
                    </Link>
                  ) : (
                    <div className="h-full p-6 rounded-2xl bg-white border border-steel/20 hover:border-orange/30 transition-all hover:shadow-lg hover:-translate-y-1 cursor-pointer">
                      <div className="w-12 h-12 rounded-xl bg-orange/20 flex items-center justify-center mb-4">
                        <topic.icon className="w-6 h-6 text-orange" />
                      </div>
                      <h3 className="text-lg font-serif font-bold text-graphite mb-2">{topic.title}</h3>
                      <p className="text-steel text-sm">{topic.description}</p>
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-16 md:py-20 bg-white/50">
          <div className="container px-4 text-center">
            <h2 className="text-2xl font-serif font-bold mb-4 text-graphite">Still need help?</h2>
            <p className="text-steel mb-8 max-w-xl mx-auto">
              Our support team is here to help. Get in touch and we'll respond within 24 hours.
            </p>
            <Link to="/contact">
              <Button size="lg" className="bg-orange hover:bg-orange/90 text-carbon font-bold rounded-xl">
                Contact Support
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
