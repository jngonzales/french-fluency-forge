import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Navbar, Footer } from "@/components/landing";
import { Mail, MessageSquare, MapPin, Send, CheckCircle } from "lucide-react";
import { toast } from "sonner";

export default function ContactPage() {
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setLoading(false);
    setSubmitted(true);
    toast.success("Message sent! We'll get back to you soon.");
  };

  return (
    <div className="min-h-screen bg-bone">
      <Navbar />
      <main className="pt-20">
        {/* Hero */}
        <section className="py-16 md:py-20 relative overflow-hidden">
          {/* Gradient orbs */}
          <div className="absolute top-[10%] left-[15%] w-[350px] h-[250px] rounded-full bg-[radial-gradient(50%_50%_at_50%_50%,hsl(260_100%_58%_/_0.15)_0%,transparent_70%)]" />
          <div className="absolute bottom-[20%] right-[10%] w-[300px] h-[200px] rounded-full bg-[radial-gradient(50%_50%_at_50%_50%,hsl(12_100%_55%_/_0.12)_0%,transparent_70%)]" />
          
          <div className="container px-4 relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-center max-w-3xl mx-auto"
            >
              <h1 className="text-4xl md:text-5xl font-serif font-bold mb-4 text-graphite">
                Get in Touch
              </h1>
              <p className="text-xl text-steel">
                Have a question or feedback? We'd love to hear from you.
              </p>
            </motion.div>
          </div>
        </section>

        {/* Contact Section */}
        <section className="py-16 md:py-20 bg-white/50">
          <div className="container px-4">
            <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-12">
              {/* Contact Info */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
              >
                <h2 className="text-2xl font-serif font-bold mb-6 text-graphite">Contact Information</h2>
                <div className="space-y-6">
                  <div className="flex gap-4">
                    <div className="w-12 h-12 rounded-xl bg-orange/20 flex items-center justify-center flex-shrink-0">
                      <Mail className="w-6 h-6 text-orange" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-graphite">Email</h3>
                      <a href="mailto:tomgauthier0@gmail.com" className="text-steel hover:text-orange transition-colors">
                        tomgauthier0@gmail.com
                      </a>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <div className="w-12 h-12 rounded-xl bg-magenta/20 flex items-center justify-center flex-shrink-0">
                      <MessageSquare className="w-6 h-6 text-magenta" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-graphite">Support</h3>
                      <p className="text-steel">We respond within 24 hours</p>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <div className="w-12 h-12 rounded-xl bg-uv/20 flex items-center justify-center flex-shrink-0">
                      <MapPin className="w-6 h-6 text-uv" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-graphite">Location</h3>
                      <p className="text-steel">
                        Paris, France
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-12 p-6 bg-bone/50 rounded-xl border border-steel/20">
                  <h3 className="font-semibold mb-2 text-graphite">Response Time</h3>
                  <p className="text-steel text-sm">
                    We typically respond within 24 hours during business days.
                  </p>
                </div>
              </motion.div>

              {/* Contact Form */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
              >
                {submitted ? (
                  <div className="h-full flex flex-col items-center justify-center text-center p-8 bg-white rounded-2xl border border-steel/20">
                    <div className="w-16 h-16 rounded-full bg-orange/20 flex items-center justify-center mb-4">
                      <CheckCircle className="w-8 h-8 text-orange" />
                    </div>
                    <h2 className="text-2xl font-serif font-bold mb-2 text-graphite">Message Sent!</h2>
                    <p className="text-steel mb-6">
                      Thanks for reaching out. We'll get back to you within 24 hours.
                    </p>
                    <Button onClick={() => setSubmitted(false)} variant="outline" className="border-steel/30 text-graphite hover:bg-bone/50">
                      Send Another Message
                    </Button>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-steel/20 p-8">
                    <h2 className="text-2xl font-serif font-bold mb-6 text-graphite">Send a Message</h2>
                    <div className="space-y-4">
                      <div className="grid sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium mb-2 text-steel">First Name</label>
                          <Input required placeholder="John" className="bg-bone/50 border-steel/30 text-graphite placeholder:text-steel/50 rounded-xl focus:border-orange" />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-2 text-steel">Last Name</label>
                          <Input required placeholder="Doe" className="bg-bone/50 border-steel/30 text-graphite placeholder:text-steel/50 rounded-xl focus:border-orange" />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2 text-steel">Email</label>
                        <Input required type="email" placeholder="john@example.com" className="bg-bone/50 border-steel/30 text-graphite placeholder:text-steel/50 rounded-xl focus:border-orange" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2 text-steel">Subject</label>
                        <Input required placeholder="How can we help?" className="bg-bone/50 border-steel/30 text-graphite placeholder:text-steel/50 rounded-xl focus:border-orange" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2 text-steel">Message</label>
                        <Textarea required placeholder="Tell us more..." rows={5} className="bg-bone/50 border-steel/30 text-graphite placeholder:text-steel/50 rounded-xl focus:border-orange resize-none" />
                      </div>
                      <Button type="submit" className="w-full h-12 bg-orange hover:bg-orange/90 text-carbon font-bold rounded-xl shadow-[0_12px_24px_rgba(255,77,26,0.25)]" disabled={loading}>
                        {loading ? (
                          "Sending..."
                        ) : (
                          <>
                            Send Message
                            <Send className="w-4 h-4 ml-2" />
                          </>
                        )}
                      </Button>
                    </div>
                  </form>
                )}
              </motion.div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
