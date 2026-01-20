import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";

interface ExitButtonProps {
  onClick: () => void;
  label?: string;
}

const ExitButton = ({ onClick, label = "Save & Exit" }: ExitButtonProps) => {
  return (
    <Button
      variant="outline"
      size="sm"
      onClick={onClick}
      className="fixed bottom-20 left-4 z-50 bg-background/95 backdrop-blur border-border hover:bg-muted shadow-md"
    >
      <LogOut className="h-4 w-4 mr-2" />
      {label}
    </Button>
  );
};

export default ExitButton;
