import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Menu, X, LayoutDashboard } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

const navLinks = [
  { label: "Features", href: "#features" },
  { label: "How it Works", href: "#how-it-works" },
  { label: "Pricing", href: "#pricing" },
];

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const { user, isLoading } = useAuth();

  return (
    <motion.nav
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      className="fixed top-4 left-4 right-4 z-50"
    >
      <div className="max-w-6xl mx-auto px-4 py-3 rounded-2xl border border-steel/20 bg-graphite/80 backdrop-blur-xl shadow-[0_18px_60px_rgba(0,0,0,0.55)]">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3">
            <img 
              src="/SOLV.png" 
              alt="SOLV Languages Logo" 
              width={40} 
              height={40}
              className="w-10 h-10 rounded-xl object-contain"
            />
            <div className="hidden sm:block">
              <span className="text-lg font-serif font-bold text-bone tracking-tight">SOLV</span>
              <span className="block text-xs text-steel font-medium">Reality-first language training</span>
            </div>
          </Link>
          
          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-2">
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className="px-4 py-2 rounded-full text-steel hover:text-bone hover:bg-steel/10 transition-all text-sm font-semibold border border-transparent hover:border-steel/20"
              >
                {link.label}
              </a>
            ))}
          </div>
          
          {/* Desktop CTA */}
          <div className="hidden md:flex items-center gap-3">
            {isLoading ? (
              <div className="w-20 h-9 bg-steel/20 rounded-full animate-pulse" />
            ) : user ? (
              <Link to="/dashboard">
                <Button className="bg-orange hover:bg-orange/90 text-carbon font-bold rounded-full shadow-[0_12px_24px_rgba(255,77,26,0.2)] gap-2">
                  <LayoutDashboard className="w-4 h-4" />
                  Dashboard
                </Button>
              </Link>
            ) : (
              <>
                <Link to="/login">
                  <Button variant="ghost" className="text-steel hover:text-bone hover:bg-steel/10 rounded-full border border-transparent hover:border-steel/20">
                    Sign In
                  </Button>
                </Link>
                <a href="#hero">
                  <Button className="bg-orange hover:bg-orange/90 text-carbon font-bold rounded-full shadow-[0_12px_24px_rgba(255,77,26,0.2)]">
                    Get Placement Test →
                  </Button>
                </a>
              </>
            )}
          </div>
          
          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2 hover:bg-steel/10 rounded-xl transition-colors text-bone"
            onClick={() => setIsOpen(!isOpen)}
          >
            {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>
      
      {/* Mobile Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="md:hidden mt-2 mx-auto max-w-6xl rounded-2xl border border-steel/20 bg-graphite/95 backdrop-blur-xl shadow-[0_18px_60px_rgba(0,0,0,0.55)]"
          >
            <div className="p-4 space-y-2">
              {navLinks.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  className="block px-4 py-3 rounded-xl text-steel hover:text-bone hover:bg-steel/10 transition-all font-medium"
                  onClick={() => setIsOpen(false)}
                >
                  {link.label}
                </a>
              ))}
              <div className="flex flex-col gap-2 pt-4 border-t border-steel/20">
                {user ? (
                  <Link to="/dashboard">
                    <Button className="w-full bg-orange hover:bg-orange/90 text-carbon font-bold rounded-full gap-2">
                      <LayoutDashboard className="w-4 h-4" />
                      Dashboard
                    </Button>
                  </Link>
                ) : (
                  <>
                    <Link to="/login">
                      <Button variant="outline" className="w-full rounded-full border-steel/30 text-bone hover:bg-steel/10">
                        Sign In
                      </Button>
                    </Link>
                    <a href="#hero">
                      <Button className="w-full bg-orange hover:bg-orange/90 text-carbon font-bold rounded-full">
                        Get Placement Test →
                      </Button>
                    </a>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
}
