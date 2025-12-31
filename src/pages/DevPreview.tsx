import { useState } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Wrench, Eye, FileText, Brain, Mic, BarChart3, CheckCircle } from "lucide-react";

// Dev preview pages
import { PersonalityQuiz } from "@/components/assessment/personality-quiz";
import Results from "./Results";

type PreviewPage = 'none' | 'personality-quiz' | 'results';

const DevPreview = () => {
  const [activePage, setActivePage] = useState<PreviewPage>('none');

  const pages = [
    { 
      id: 'personality-quiz' as const, 
      name: 'Personality Quiz', 
      icon: Brain,
      description: 'The 3-axis learner personality test'
    },
    { 
      id: 'results' as const, 
      name: 'Results Page', 
      icon: BarChart3,
      description: 'Final assessment results display'
    },
  ];

  // Render the selected preview page
  if (activePage === 'personality-quiz') {
    return (
      <div className="relative">
        <div className="fixed top-4 right-4 z-50">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setActivePage('none')}
            className="bg-background/80 backdrop-blur-sm"
          >
            ← Back to Dev Menu
          </Button>
        </div>
        <PersonalityQuiz 
          sessionId="dev-session-123" 
          onComplete={(archetype) => {
            console.log('Quiz completed with archetype:', archetype);
            alert(`Quiz completed! Archetype: ${archetype}`);
          }}
          onSkip={() => {
            console.log('Quiz skipped');
            setActivePage('none');
          }}
        />
      </div>
    );
  }

  if (activePage === 'results') {
    return (
      <div className="relative">
        <div className="fixed top-4 right-4 z-50">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setActivePage('none')}
            className="bg-background/80 backdrop-blur-sm"
          >
            ← Back to Dev Menu
          </Button>
        </div>
        <Results />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <div className="p-3 rounded-xl bg-amber-500/10">
            <Wrench className="h-8 w-8 text-amber-500" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Dev Preview Mode</h1>
            <p className="text-muted-foreground">
              Test pages without authentication
            </p>
          </div>
          <Badge variant="outline" className="ml-auto border-amber-500 text-amber-500">
            DEV ONLY
          </Badge>
        </div>

        {/* Warning */}
        <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 mb-8">
          <p className="text-sm text-amber-600 dark:text-amber-400">
            ⚠️ This page bypasses authentication. Data won't be saved to a real session.
          </p>
        </div>

        {/* Page List */}
        <div className="space-y-3">
          <h2 className="text-lg font-semibold mb-4">Preview Pages</h2>
          
          {pages.map((page) => (
            <button
              key={page.id}
              onClick={() => setActivePage(page.id)}
              className="w-full p-4 rounded-xl border border-border bg-card hover:border-primary/50 hover:bg-muted/50 transition-all text-left flex items-center gap-4"
            >
              <div className="p-2 rounded-lg bg-primary/10">
                <page.icon className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1">
                <h3 className="font-medium">{page.name}</h3>
                <p className="text-sm text-muted-foreground">{page.description}</p>
              </div>
              <Eye className="h-5 w-5 text-muted-foreground" />
            </button>
          ))}
        </div>

        {/* Quick Links */}
        <div className="mt-8 pt-8 border-t border-border">
          <h2 className="text-lg font-semibold mb-4">Quick Links</h2>
          <div className="flex flex-wrap gap-2">
            <Link to="/">
              <Button variant="outline" size="sm">Home</Button>
            </Link>
            <Link to="/login">
              <Button variant="outline" size="sm">Login</Button>
            </Link>
            <Link to="/signup">
              <Button variant="outline" size="sm">Signup</Button>
            </Link>
            <Link to="/assessment">
              <Button variant="outline" size="sm">Assessment (Auth Required)</Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DevPreview;
