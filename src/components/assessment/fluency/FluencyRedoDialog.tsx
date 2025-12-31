import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  type: "item" | "module";
}

export function FluencyRedoDialog({ open, onOpenChange, onConfirm, type }: Props) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {type === "item" ? "Redo this answer?" : "Redo entire Fluency module?"}
          </AlertDialogTitle>
          <AlertDialogDescription className="space-y-3">
            <p>
              {type === "item" 
                ? "Your previous take won't be used for scoring." 
                : "All your answers will be cleared and you'll start from question 1."
              }
            </p>
            <p>
              You can redo as many times as needed while you're on this page.
            </p>
            <p className="font-medium text-amber-600 dark:text-amber-400">
              Once you continue to the next section, you can't come back to redo.
            </p>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm}>
            {type === "item" ? "Redo Answer" : "Start Over"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
