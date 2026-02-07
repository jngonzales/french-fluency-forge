import { Button } from "@/components/ui/button";
import { SkipForward } from "lucide-react";

interface SkipButtonProps {
  onClick: () => void;
  label?: string;
}

const SkipButton = ({ onClick, label = "Skip Module" }: SkipButtonProps) => {
  return (
    <Button
      variant="outline"
      size="sm"
      onClick={onClick}
      className="fixed bottom-20 right-4 bg-background/95 border-border hover:bg-muted shadow-md transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5"
    >
      <SkipForward className="h-4 w-4 mr-2" />
      {label}
    </Button>
  );
};

export default SkipButton;
