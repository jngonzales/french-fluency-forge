import { useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown } from "lucide-react";

const footerLinks = {
  Product: [
    { label: "Features", href: "#features" },
    { label: "Pricing", href: "#pricing" },
    { label: "Lessons", href: "/dashboard" },
    { label: "Mobile App", href: "#" },
  ],
  Company: [
    { label: "About Us", href: "/about" },
    { label: "Careers", href: "/careers" },
    { label: "Blog", href: "/blog" },
    { label: "Press", href: "/blog" },
  ],
  Support: [
    { label: "Help Center", href: "/help" },
    { label: "Contact", href: "/contact" },
    { label: "Privacy Policy", href: "/privacy" },
    { label: "Terms of Service", href: "/terms" },
  ],
};

function FooterAccordion({ title, links }: { title: string; links: { label: string; href: string }[] }) {
  const [isOpen, setIsOpen] = useState(false);
  
  return (
    <div className="md:hidden border-b border-bone/10">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between py-4 text-left"
      >
        <span className="font-semibold">{title}</span>
        <ChevronDown className={`w-5 h-5 transition-transform ${isOpen ? "rotate-180" : ""}`} />
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <ul className="space-y-2 pb-4">
              {links.map((link) => (
                <li key={link.label}>
                  {link.href.startsWith('#') ? (
                    <a
                      href={link.href}
                      className="text-bone/60 hover:text-bone transition-colors text-sm"
                    >
                      {link.label}
                    </a>
                  ) : (
                    <Link
                      to={link.href}
                      className="text-bone/60 hover:text-bone transition-colors text-sm"
                    >
                      {link.label}
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function Footer() {
  return (
    <footer className="bg-carbon text-bone py-12 md:py-16">
      <div className="container px-4">
        <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-8 md:gap-12 mb-8 md:mb-12">
          {/* Brand */}
          <div className="lg:col-span-2">
            <Link to="/" className="flex items-center gap-3 mb-4">
              <img 
                src="/SOLV.png" 
                alt="SOLV Languages Logo" 
                width={44} 
                height={44}
                className="w-11 h-11 rounded-xl object-contain"
              />
              <div>
                <span className="text-xl font-serif font-bold tracking-tight">SOLV</span>
                <span className="block text-xs text-steel font-medium">Reality-first language training</span>
              </div>
            </Link>
            <p className="text-steel mb-6 max-w-sm text-sm leading-relaxed font-medium">
              Stop studying. Start speaking. Real-life reps so you speak when it matters.
            </p>
            <div className="flex gap-3">
              {["Twitter", "Instagram", "YouTube", "Discord"].map((social) => (
                <a
                  key={social}
                  href="#"
                  className="w-9 h-9 rounded-full bg-graphite hover:bg-steel/20 border border-steel/20 flex items-center justify-center transition-colors"
                  aria-label={social}
                >
                  <span className="text-sm font-medium text-steel">{social[0]}</span>
                </a>
              ))}
            </div>
          </div>
          
          {/* Mobile: Accordion links */}
          <div className="lg:col-span-3 md:hidden">
            {Object.entries(footerLinks).map(([category, links]) => (
              <FooterAccordion key={category} title={category} links={links} />
            ))}
          </div>
          
          {/* Desktop: Column links */}
          <div className="hidden md:contents">
            {Object.entries(footerLinks).map(([category, links]) => (
              <div key={category}>
                <h4 className="font-serif font-bold mb-4 text-bone">{category}</h4>
                <ul className="space-y-3">
                  {links.map((link) => (
                    <li key={link.label}>
                      {link.href.startsWith('#') ? (
                        <a
                          href={link.href}
                          className="text-steel hover:text-orange transition-colors text-sm font-medium"
                        >
                          {link.label}
                        </a>
                      ) : (
                        <Link
                          to={link.href}
                          className="text-steel hover:text-orange transition-colors text-sm font-medium"
                        >
                          {link.label}
                        </Link>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
        
        <div className="pt-8 border-t border-steel/20 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-4">
            <p className="text-steel/60 text-sm">
              © 2026 SOLV Languages
            </p>
            <span className="font-mono text-xs text-steel/40 uppercase tracking-wider hidden sm:inline">
              "We value reality"
            </span>
          </div>
          <div className="flex items-center gap-6 text-steel/60 font-mono uppercase text-xs tracking-wider">
            <span>Carbon</span>
            <span className="text-orange">Orange</span>
            <span className="text-magenta">Magenta</span>
            <span className="text-uv">UV</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
