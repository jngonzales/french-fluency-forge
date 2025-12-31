import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Bug, X, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const routes = [
  { path: "/", label: "Home" },
  { path: "/login", label: "Login" },
  { path: "/signup", label: "Signup" },
  { path: "/assessment", label: "Assessment" },
  { path: "/results", label: "Results" },
  { path: "/dev", label: "Dev Preview" },
];

export function DevNav() {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();

  // Only show in development
  if (import.meta.env.PROD) return null;

  return (
    <div className="fixed bottom-4 right-4 z-[9999]">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="absolute bottom-14 right-0 bg-popover border border-border rounded-lg shadow-xl p-2 min-w-[160px]"
          >
            {routes.map((route) => (
              <Link
                key={route.path}
                to={route.path}
                onClick={() => setIsOpen(false)}
                className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors ${
                  location.pathname === route.path
                    ? "bg-primary text-primary-foreground"
                    : "hover:bg-muted"
                }`}
              >
                <ChevronRight className="h-3 w-3" />
                {route.label}
              </Link>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      <button
        onClick={() => setIsOpen(!isOpen)}
        className="h-12 w-12 rounded-full bg-amber-500 text-white shadow-lg hover:bg-amber-600 transition-colors flex items-center justify-center"
      >
        {isOpen ? <X className="h-5 w-5" /> : <Bug className="h-5 w-5" />}
      </button>
    </div>
  );
}
