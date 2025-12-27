import { Button } from "@/components/ui/button";
import { SkipForward } from "lucide-react";

interface SkipButtonProps {
  onClick: () => void;
  label?: string;
}

const SkipButton = ({ onClick, label = "Skip (Dev)" }: SkipButtonProps) => {
  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={onClick}
      className="fixed bottom-4 right-4 opacity-50 hover:opacity-100 text-muted-foreground"
    >
      <SkipForward className="h-4 w-4 mr-1" />
      {label}
    </Button>
  );
};

export default SkipButton;
