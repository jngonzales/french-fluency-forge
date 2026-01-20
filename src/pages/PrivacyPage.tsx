import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Navbar, Footer } from "@/components/landing";
import { 
  Shield, 
  Database, 
  Scale, 
  Clock, 
  Globe, 
  Lock, 
  UserCheck, 
  Cookie, 
  Baby, 
  Bell,
  Mail,
  ChevronDown 
} from "lucide-react";

const sections = [
  {
    id: "controller",
    icon: Shield,
    title: "Data Controller",
    content: `SOLV Languages, operated by Tom Gauthier, is the data controller responsible for your personal data. You can contact us at tomgauthier0@gmail.com for any data protection inquiries.`
  },
  {
    id: "collection",
    icon: Database,
    title: "Information We Collect",
    content: `We collect information you provide directly to us, such as when you create an account, make a purchase, participate in any interactive features, fill out a form, or otherwise communicate with us.`,
    list: [
      { label: "Account Information", desc: "Name, email address, password, and profile information" },
      { label: "Learning Data", desc: "Your progress, quiz results, and practice history" },
      { label: "Payment Information", desc: "Billing address and payment method details (processed securely via Stripe)" },
      { label: "Communication", desc: "Messages you send us for support or feedback" },
      { label: "Voice Recordings", desc: "Audio recordings for pronunciation analysis (processed and deleted after analysis unless you opt to save them)" }
    ]
  },
  {
    id: "legal-basis",
    icon: Scale,
    title: "Legal Basis for Processing (GDPR)",
    content: `Under the General Data Protection Regulation (GDPR), we process your data based on the following legal grounds:`,
    list: [
      { label: "Contract", desc: "Processing necessary to provide our services to you" },
      { label: "Consent", desc: "Where you have given explicit consent (e.g., marketing communications)" },
      { label: "Legitimate Interest", desc: "For analytics, security, and service improvement" },
      { label: "Legal Obligation", desc: "To comply with applicable laws" }
    ]
  },
  {
    id: "usage",
    icon: Database,
    title: "How We Use Your Information",
    content: `We use the information we collect to:`,
    list: [
      { label: "Service Delivery", desc: "Provide, maintain, and improve our services" },
      { label: "Personalization", desc: "Personalize your learning experience with AI-powered recommendations" },
      { label: "Transactions", desc: "Process transactions and send related information" },
      { label: "Communications", desc: "Send you technical notices, updates, and support messages" },
      { label: "Support", desc: "Respond to your comments, questions, and requests" },
      { label: "Analytics", desc: "Monitor and analyze trends, usage, and activities" }
    ]
  },
  {
    id: "retention",
    icon: Clock,
    title: "Data Retention",
    content: `We retain your personal data only for as long as necessary to fulfill the purposes for which it was collected:`,
    list: [
      { label: "Account Data", desc: "Retained while your account is active, deleted within 30 days of account closure" },
      { label: "Learning Data", desc: "Retained while your account is active for progress continuity" },
      { label: "Payment Records", desc: "Retained for 10 years as required by French tax law" },
      { label: "Voice Recordings", desc: "Processed in real-time and deleted immediately unless you choose to save" },
      { label: "Support Communications", desc: "Retained for 3 years for quality and training purposes" }
    ]
  },
  {
    id: "sharing",
    icon: Globe,
    title: "Information Sharing",
    content: `We do not sell, trade, or otherwise transfer your personal information to third parties except in the following circumstances:`,
    list: [
      { label: "With your consent", desc: "" },
      { label: "To comply with legal obligations", desc: "" },
      { label: "With service providers", desc: "Who assist in our operations (subject to confidentiality agreements)" },
      { label: "To protect rights", desc: "The rights, property, or safety of SOLV Languages, our users, or the public" }
    ]
  },
  {
    id: "transfers",
    icon: Globe,
    title: "International Data Transfers",
    content: `Your data may be processed by third-party services located outside the European Economic Area (EEA). We ensure appropriate safeguards are in place:`,
    list: [
      { label: "Supabase", desc: "EU data region (Frankfurt) - data remains within EEA" },
      { label: "Stripe", desc: "EU-US Data Privacy Framework certified" },
      { label: "OpenAI/ElevenLabs", desc: "Standard Contractual Clauses (SCCs) in place" }
    ]
  },
  {
    id: "security",
    icon: Lock,
    title: "Data Security",
    content: `We implement appropriate technical and organizational measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction:`,
    list: [
      { label: "Encryption", desc: "Data encrypted in transit and at rest" },
      { label: "Security Audits", desc: "Regular security assessments and audits" },
      { label: "Access Controls", desc: "Authentication measures and access restrictions" },
      { label: "Cloud Infrastructure", desc: "Secure infrastructure powered by Supabase" }
    ]
  },
  {
    id: "rights",
    icon: UserCheck,
    title: "Your Rights (GDPR)",
    content: `Under the General Data Protection Regulation (GDPR) and French data protection law, you have the following rights. To exercise any of these rights, contact us at tomgauthier0@gmail.com. We will respond within 30 days.`,
    list: [
      { label: "Right of Access", desc: "Request a copy of your personal data" },
      { label: "Right to Rectification", desc: "Correct inaccurate or incomplete data" },
      { label: "Right to Erasure", desc: "Request deletion of your personal data" },
      { label: "Right to Restrict Processing", desc: "Limit how we use your data" },
      { label: "Right to Data Portability", desc: "Receive your data in a structured, machine-readable format" },
      { label: "Right to Object", desc: "Object to processing based on legitimate interests" },
      { label: "Right to Withdraw Consent", desc: "Withdraw consent at any time where processing is based on consent" },
      { label: "Right to Lodge a Complaint", desc: "File a complaint with the CNIL at www.cnil.fr" }
    ]
  },
  {
    id: "cookies",
    icon: Cookie,
    title: "Cookies and Tracking",
    content: `We use cookies and similar technologies to collect information about your browsing activities and to remember your preferences. You can manage your cookie preferences through your browser settings or our cookie consent banner.`,
    list: [
      { label: "Essential Cookies", desc: "Required for the Service to function (always active)" },
      { label: "Analytics Cookies", desc: "Help us understand how you use our Service (with your consent)" },
      { label: "Preference Cookies", desc: "Remember your settings and preferences" }
    ]
  },
  {
    id: "children",
    icon: Baby,
    title: "Children's Privacy",
    content: `Our services are not directed to children under 16 (the minimum age for consent under French law). We do not knowingly collect personal information from children under 16. If you are a parent or guardian and believe we have collected information from a child, please contact us immediately.`
  },
  {
    id: "changes",
    icon: Bell,
    title: "Changes to This Policy",
    content: `We may update this privacy policy from time to time. We will notify you of any material changes by email at least 30 days before they take effect, and update the "Last updated" date.`
  },
  {
    id: "contact",
    icon: Mail,
    title: "Contact Us",
    content: `For any questions about this Privacy Policy or to exercise your rights, please contact:`,
    list: [
      { label: "Data Controller", desc: "SOLV Languages" },
      { label: "Email", desc: "tomgauthier0@gmail.com" },
      { label: "Address", desc: "Paris, France" },
      { label: "Supervisory Authority", desc: "CNIL (Commission Nationale de l'Informatique et des Libertes) - www.cnil.fr" }
    ]
  }
];

interface SectionType {
  id: string;
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  content: string;
  list?: { label: string; desc: string }[];
}

function PolicySection({ section, index }: { section: SectionType; index: number }) {
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
        <div className="w-10 h-10 rounded-lg bg-orange/20 flex items-center justify-center flex-shrink-0">
          <Icon className="w-5 h-5 text-orange" />
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
                <p className="text-steel mb-4">{section.content}</p>
                {section.list && (
                  <ul className="space-y-2">
                    {section.list.map((item, i) => (
                      <li key={i} className="flex gap-2 text-sm">
                        <span className="text-orange font-medium min-w-fit">{item.label}{item.desc ? ":" : ""}</span>
                        {item.desc && <span className="text-steel">{item.desc}</span>}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-bone">
      <Navbar />
      <main className="pt-20">
        {/* Hero */}
        <section className="py-16 md:py-20 relative overflow-hidden">
          <div className="absolute top-[10%] left-[15%] w-[350px] h-[250px] bg-uv/15 rounded-full blur-[100px]" />
          <div className="absolute bottom-[10%] right-[15%] w-[300px] h-[200px] bg-orange/12 rounded-full blur-[80px]" />
          <div className="container px-4 relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-center max-w-3xl mx-auto"
            >
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/80 border border-steel/20 text-steel text-sm font-mono uppercase tracking-wider mb-6">
                <Shield className="w-4 h-4 text-orange" />
                Your Privacy Matters
              </div>
              <h1 className="text-4xl md:text-5xl font-serif font-bold mb-4 text-graphite">
                Privacy Policy
              </h1>
              <p className="text-xl text-steel mb-4">
                We believe in transparency. Here's exactly how we handle your data.
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
                <Lock className="w-6 h-6 text-orange mx-auto mb-2" />
                <p className="text-sm text-steel">Encrypted & Secure</p>
              </div>
              <div className="bg-white/50 rounded-xl p-4 border border-steel/10 text-center">
                <Globe className="w-6 h-6 text-uv mx-auto mb-2" />
                <p className="text-sm text-steel">GDPR Compliant</p>
              </div>
              <div className="bg-white/50 rounded-xl p-4 border border-steel/10 text-center">
                <UserCheck className="w-6 h-6 text-magenta mx-auto mb-2" />
                <p className="text-sm text-steel">You Control Your Data</p>
              </div>
            </div>
          </div>
        </section>

        {/* Policy Sections */}
        <section className="py-16 md:py-20">
          <div className="container px-4">
            <div className="max-w-3xl mx-auto space-y-4">
              {sections.map((section, i) => (
                <PolicySection key={section.id} section={section} index={i} />
              ))}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
