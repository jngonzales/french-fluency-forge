import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Navbar, Footer } from "@/components/landing";
import { BookOpen, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

const posts = [
  {
    title: "Why Speaking Under Pressure is the Only Way to Learn",
    excerpt: "Traditional language learning focuses on memorization. But real fluency comes from pressure training.",
    date: "January 15, 2026",
    category: "Learning Science"
  },
  {
    title: "The Reality Reps Method: How We Train Fluency",
    excerpt: "An inside look at our AI-powered drill system designed to simulate real conversational pressure.",
    date: "January 10, 2026",
    category: "Product"
  },
  {
    title: "From B1 to B2: A Student's Journey with SOLV",
    excerpt: "How one student went from freezing in conversations to speaking confidently in French meetings.",
    date: "January 5, 2026",
    category: "Success Stories"
  }
];

export default function BlogPage() {
  return (
    <div className="min-h-screen bg-bone">
      <Navbar />
      <main className="pt-20">
        {/* Hero */}
        <section className="py-16 md:py-20 relative overflow-hidden">
          <div className="absolute top-[10%] left-[15%] w-[350px] h-[250px] bg-magenta/15 rounded-full blur-[100px]" />
          <div className="absolute bottom-[10%] right-[10%] w-[300px] h-[200px] bg-uv/12 rounded-full blur-[80px]" />
          <div className="container px-4 relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-center max-w-3xl mx-auto"
            >
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/80 border border-steel/20 text-steel text-sm font-mono uppercase tracking-wider mb-6">
                <BookOpen className="w-4 h-4 text-magenta" />
                Blog
              </div>
              <h1 className="text-4xl md:text-5xl font-serif font-bold mb-4 text-graphite">
                Insights & Updates
              </h1>
              <p className="text-xl text-steel">
                Thoughts on language learning, fluency science, and product updates.
              </p>
            </motion.div>
          </div>
        </section>

        {/* Blog Posts */}
        <section className="py-16 md:py-20">
          <div className="container px-4">
            <div className="max-w-4xl mx-auto space-y-8">
              {posts.map((post, i) => (
                <motion.article
                  key={post.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="p-6 md:p-8 rounded-2xl bg-white border border-steel/20 hover:border-orange/30 transition-all hover:shadow-lg cursor-pointer"
                >
                  <div className="flex items-center gap-3 mb-4">
                    <span className="px-3 py-1 rounded-full bg-orange/10 text-orange text-xs font-medium">
                      {post.category}
                    </span>
                    <span className="text-steel/60 text-sm">{post.date}</span>
                  </div>
                  <h2 className="text-xl md:text-2xl font-serif font-bold text-graphite mb-3">
                    {post.title}
                  </h2>
                  <p className="text-steel mb-4">{post.excerpt}</p>
                  <span className="inline-flex items-center text-orange font-medium text-sm">
                    Read more <ArrowRight className="w-4 h-4 ml-1" />
                  </span>
                </motion.article>
              ))}
            </div>
          </div>
        </section>

        {/* Newsletter CTA */}
        <section className="py-16 md:py-20 bg-white/50">
          <div className="container px-4 text-center">
            <h2 className="text-2xl font-serif font-bold mb-4 text-graphite">Stay Updated</h2>
            <p className="text-steel mb-8 max-w-xl mx-auto">
              Join our waitlist to get notified about new features and language learning tips.
            </p>
            <Link to="/#hero">
              <Button size="lg" className="bg-orange hover:bg-orange/90 text-carbon font-bold rounded-xl">
                Join Waitlist
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
