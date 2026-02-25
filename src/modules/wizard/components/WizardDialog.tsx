import { Wand2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useWizard } from "../hooks/useWizard";
import type { WizardDialogProps } from "../types";
import { WizardChat } from "./WizardChat";

export function WizardDialog({
  open,
  onOpenChange,
  context,
  onGenerate,
  trigger,
}: WizardDialogProps) {
  const wizard = useWizard({ context, onGenerate });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {trigger && <DialogTrigger render={trigger} />}
      <DialogContent className="sm:max-w-2xl h-[80vh] max-h-160 flex flex-col gap-0 p-0">
        <DialogHeader className="p-4 shrink-0">
          <DialogTitle className="flex items-center gap-2">
            <Wand2 className="size-4" />
            Content Generation Wizard
          </DialogTitle>
        </DialogHeader>
        <WizardChat {...wizard} />
      </DialogContent>
    </Dialog>
  );
}
