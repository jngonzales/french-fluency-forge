import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Navbar, Footer } from "@/components/landing";
import { 
  FileText, 
  Building2, 
  BookOpen, 
  User, 
  CreditCard, 
  Undo2,
  Ban, 
  Copyright, 
  Pen, 
  Server,
  AlertTriangle,
  RefreshCw,
  Power,
  MessageSquare,
  Scale,
  Mail,
  ChevronDown 
} from "lucide-react";

const sections = [
  {
    id: "acceptance",
    icon: FileText,
    title: "Acceptance of Terms",
    content: `By accessing or using SOLV Languages ("the Service"), you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our Service.`
  },
  {
    id: "company",
    icon: Building2,
    title: "Company Information",
    content: `SOLV Languages is operated by Tom Gauthier, based in Paris, France. Contact: tomgauthier0@gmail.com`
  },
  {
    id: "description",
    icon: BookOpen,
    title: "Description of Service",
    content: `SOLV Languages provides an AI-powered French language learning platform that includes:`,    
    list: [
      { label: "Interactive lessons and exercises", desc: "" },
      { label: "Speech recognition and pronunciation analysis", desc: "" },
      { label: "Personalized learning paths", desc: "" },
      { label: "Progress tracking and analytics", desc: "" },
      { label: "Community features and support", desc: "" }
    ]
  },
  {
    id: "accounts",
    icon: User,
    title: "User Accounts",
    content: `To access certain features of the Service, you must create an account. You agree to:`,
    list: [
      { label: "Provide accurate and complete information", desc: "" },
      { label: "Maintain the security of your password", desc: "" },
      { label: "Accept responsibility for all activities under your account", desc: "" },
      { label: "Notify us immediately of any unauthorized use", desc: "" }
    ]
  },
  {
    id: "payments",
    icon: CreditCard,
    title: "Subscription and Payments",
    content: `Some features require a paid subscription. By subscribing, you agree that:`,
    list: [
      { label: "Recurring charges", desc: "You authorize us to charge your payment method on a recurring basis" },
      { label: "Price changes", desc: "We may change pricing with 30 days notice" },
      { label: "Cancellation", desc: "You can cancel your subscription at any time via your account settings" }
    ]
  },
  {
    id: "withdrawal",
    icon: Undo2,
    title: "Right of Withdrawal (Droit de Retractation)",
    content: `In accordance with Article L221-18 of the French Consumer Code, you have the right to withdraw from your purchase within 14 days of subscribing without providing any reason.

To exercise this right, contact us at tomgauthier0@gmail.com with your request. If you have expressly requested that the service begin before the end of the withdrawal period and have accessed premium content, you may be charged a pro-rata amount for services already consumed.

Refunds will be processed within 14 days of receiving your withdrawal request using the same payment method.`
  },
  {
    id: "acceptable-use",
    icon: Ban,
    title: "Acceptable Use",
    content: `You agree not to:`,
    list: [
      { label: "Use the Service for any illegal purpose", desc: "" },
      { label: "Share your account credentials with others", desc: "" },
      { label: "Attempt to reverse engineer or copy our technology", desc: "" },
      { label: "Upload malicious code or interfere with the Service", desc: "" },
      { label: "Harass, abuse, or harm other users", desc: "" },
      { label: "Scrape or collect data from the Service", desc: "" }
    ]
  },
  {
    id: "ip",
    icon: Copyright,
    title: "Intellectual Property",
    content: `All content, features, and functionality of the Service are owned by SOLV Languages and are protected by international copyright, trademark, and other intellectual property laws. You may not reproduce, distribute, or create derivative works without our express written permission.`
  },
  {
    id: "user-content",
    icon: Pen,
    title: "User Content",
    content: `You retain ownership of content you create or upload. By submitting content, you grant us a non-exclusive, worldwide, royalty-free license to use, reproduce, and display such content in connection with the Service.`
  },
  {
    id: "availability",
    icon: Server,
    title: "Service Availability",
    content: `We strive to maintain 99.9% uptime for our Service. However, the Service may occasionally be unavailable due to maintenance, updates, or circumstances beyond our control. We will endeavor to notify users in advance of planned maintenance.`
  },
  {
    id: "disclaimer",
    icon: AlertTriangle,
    title: "Disclaimer of Warranties",
    content: `While we strive to provide a high-quality learning experience, the Service is provided "as is". Learning outcomes depend on individual effort, dedication, and consistent practice. We do not guarantee specific language proficiency results.`
  },
  {
    id: "liability",
    icon: Scale,
    title: "Limitation of Liability",
    content: `To the extent permitted by French law, our liability is limited to the amount you have paid for the Service in the 12 months preceding any claim. This does not affect your statutory rights as a consumer under French law.`
  },
  {
    id: "modifications",
    icon: RefreshCw,
    title: "Modifications to Terms",
    content: `We reserve the right to modify these Terms with 30 days notice. We will notify you of significant changes via email. If you do not agree with the modified terms, you may cancel your subscription before the changes take effect.`
  },
  {
    id: "termination",
    icon: Power,
    title: "Termination",
    content: `We may terminate or suspend your account for material violation of these Terms after providing you with notice and an opportunity to remedy the violation where possible. Upon termination, you may request a copy of your personal data.`
  },
  {
    id: "disputes",
    icon: MessageSquare,
    title: "Dispute Resolution and Mediation",
    content: `In accordance with Articles L611-1 to L616-3 of the French Consumer Code, if you have a complaint that we cannot resolve directly, you may use a consumer mediation service. We will provide details of the applicable mediator upon request.

Before initiating legal proceedings, we encourage you to contact us at tomgauthier0@gmail.com to seek an amicable resolution.`
  },
  {
    id: "governing-law",
    icon: Scale,
    title: "Governing Law",
    content: `These Terms are governed by French law. For consumers residing in the European Union, this choice of law does not deprive you of the protection afforded by mandatory provisions of your country of residence.

Any disputes shall be subject to the exclusive jurisdiction of the courts of Paris, France, unless you are a consumer entitled to bring proceedings in your local courts.`
  },
  {
    id: "contact",
    icon: Mail,
    title: "Contact",
    content: `For questions about these Terms, contact us at:`,
    list: [
      { label: "Company", desc: "SOLV Languages" },
      { label: "Email", desc: "tomgauthier0@gmail.com" },
      { label: "Address", desc: "Paris, France" }
    ],
    extra: `For consumer complaints, you may also contact the European Online Dispute Resolution platform: https://ec.europa.eu/consumers/odr`
  }
];

interface SectionType {
  id: string;
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  content: string;
  list?: { label: string; desc: string }[];
  extra?: string;
}

function TermsSection({ section, index }: { section: SectionType; index: number }) {
  const [isOpen, setIsOpen] = useState(index < 3); // First 3 sections open by default
  const Icon = section.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.05 }}
      className="bg-white rounded-xl border border-steel/20 overflow-hidden hover:border-steel/40 transition-colors"
    >
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center gap-4 p-5 text-left"
      >
        <div className="w-10 h-10 rounded-lg bg-magenta/20 flex items-center justify-center flex-shrink-0">
          <Icon className="w-5 h-5 text-magenta" />
        </div>
        <span className="flex-1 font-semibold text-graphite">{section.title}</span>
        <ChevronDown className={`w-5 h-5 text-steel transition-transform ${isOpen ? "rotate-180" : ""}`} />
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
            <div className="px-5 pb-5 pt-0">
              <div className="pl-14">
                <p className="text-steel mb-4 whitespace-pre-line">{section.content}</p>
                {section.list && (
                  <ul className="space-y-2">
                    {section.list.map((item, i) => (
                      <li key={i} className="flex gap-2 text-sm">
                        <span className="text-magenta font-medium min-w-fit">{item.label}{item.desc ? ":" : ""}</span>
                        {item.desc && <span className="text-steel">{item.desc}</span>}
                      </li>
                    ))}
                  </ul>
                )}
                {section.extra && (
                  <p className="text-steel text-sm mt-4">{section.extra}</p>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-bone">
      <Navbar />
      <main className="pt-20">
        {/* Hero */}
        <section className="py-16 md:py-20 relative overflow-hidden">
          <div className="absolute top-[10%] right-[15%] w-[350px] h-[250px] rounded-full bg-[radial-gradient(50%_50%_at_50%_50%,hsl(335_100%_59%_/_0.15)_0%,transparent_70%)]" />
          <div className="absolute bottom-[10%] left-[10%] w-[300px] h-[200px] rounded-full bg-[radial-gradient(50%_50%_at_50%_50%,hsl(260_100%_58%_/_0.12)_0%,transparent_70%)]" />
          <div className="container px-4 relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-center max-w-3xl mx-auto"
            >
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/80 border border-steel/20 text-steel text-sm font-mono uppercase tracking-wider mb-6">
                <FileText className="w-4 h-4 text-magenta" />
                Legal Agreement
              </div>
              <h1 className="text-4xl md:text-5xl font-serif font-bold mb-4 text-graphite">
                Terms of Service
              </h1>
              <p className="text-xl text-steel mb-4">
                Clear terms for using SOLV Languages. No legal jargon, just clarity.
              </p>
              <p className="text-sm text-steel/60">
                Last updated: January 19, 2026
              </p>
            </motion.div>
          </div>
        </section>

        {/* Quick Summary */}
        <section className="py-8 bg-white/30">
          <div className="container px-4">
            <div className="max-w-3xl mx-auto grid sm:grid-cols-3 gap-4">
              <div className="bg-white/50 rounded-xl p-4 border border-steel/10 text-center">
                <Undo2 className="w-6 h-6 text-magenta mx-auto mb-2" />
                <p className="text-sm text-steel">14-Day Refund Right</p>
              </div>
              <div className="bg-white/50 rounded-xl p-4 border border-steel/10 text-center">
                <Scale className="w-6 h-6 text-uv mx-auto mb-2" />
                <p className="text-sm text-steel">French Law Protected</p>
              </div>
              <div className="bg-white/50 rounded-xl p-4 border border-steel/10 text-center">
                <Power className="w-6 h-6 text-orange mx-auto mb-2" />
                <p className="text-sm text-steel">Cancel Anytime</p>
              </div>
            </div>
          </div>
        </section>

        {/* Terms Sections */}
        <section className="py-16 md:py-20">
          <div className="container px-4">
            <div className="max-w-3xl mx-auto space-y-4">
              {sections.map((section, i) => (
                <TermsSection key={section.id} section={section} index={i} />
              ))}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
