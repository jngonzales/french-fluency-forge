import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

interface ExitButtonProps {
  onClick: () => void;
  label?: string;
}

/**
 * Exit Button - "Grandparent-Proof" Design
 * Prominent, high-contrast button for exiting the assessment
 * Users must never feel "trapped" in the assessment flow
 */
const ExitButton = ({ onClick, label = "Exit to Dashboard" }: ExitButtonProps) => {
  return (
    <Button
      variant="outline"
      size="lg"
      onClick={onClick}
      className="fixed top-4 left-4 z-50 bg-background border-2 border-destructive/50 hover:bg-destructive/10 hover:border-destructive shadow-lg transition-all duration-200 text-base font-semibold gap-2 px-6 py-3"
    >
      <X className="h-5 w-5" />
      {label}
    </Button>
  );
};

export default ExitButton;
