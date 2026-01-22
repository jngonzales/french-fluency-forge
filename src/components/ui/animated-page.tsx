import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";

interface AnimatedPageProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  animation?: "fade" | "fade-up" | "fade-down" | "slide-left" | "slide-right" | "scale";
  delay?: number;
}

const animationClasses = {
  fade: "animate-fade-in",
  "fade-up": "animate-fade-in-up",
  "fade-down": "animate-fade-in-down",
  "slide-left": "animate-slide-in-left",
  "slide-right": "animate-slide-in-right",
  scale: "animate-scale-in",
};

/**
 * AnimatedPage - Wrapper component for smooth page transitions
 * Wrap your page content in this component for entrance animations
 */
function AnimatedPage({ 
  children, 
  animation = "fade-up", 
  delay = 0,
  className, 
  ...props 
}: AnimatedPageProps) {
  const [isVisible, setIsVisible] = useState(delay === 0);

  useEffect(() => {
    if (delay > 0) {
      const timer = setTimeout(() => setIsVisible(true), delay);
      return () => clearTimeout(timer);
    }
  }, [delay]);

  if (!isVisible) {
    return <div className="opacity-0" {...props}>{children}</div>;
  }

  return (
    <div className={cn(animationClasses[animation], className)} {...props}>
      {children}
    </div>
  );
}

interface StaggeredListProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode[];
  staggerDelay?: number;
  animation?: "fade" | "fade-up" | "fade-down" | "slide-left" | "slide-right" | "scale";
}

/**
 * StaggeredList - Animates children with staggered delays
 * Great for lists, grids, and card layouts
 */
function StaggeredList({ 
  children, 
  staggerDelay = 50, 
  animation = "fade-up",
  className,
  ...props 
}: StaggeredListProps) {
  return (
    <div className={className} {...props}>
      {children.map((child, index) => (
        <AnimatedPage 
          key={index} 
          animation={animation} 
          delay={index * staggerDelay}
        >
          {child}
        </AnimatedPage>
      ))}
    </div>
  );
}

export { AnimatedPage, StaggeredList };
