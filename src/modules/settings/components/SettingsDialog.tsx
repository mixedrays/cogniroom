import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { SettingsContent } from "./SettingsContent";
import { useSettingsSearch } from "../hooks/useSettingsSearch";

export function SettingsDialog() {
  const { isOpen, tab, section, close } = useSettingsSearch();

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) close();
      }}
    >
      <DialogContent className="sm:max-w-3xl h-[min(80vh,600px)] overflow-hidden p-0 gap-0">
        <DialogTitle className="sr-only">Settings</DialogTitle>
        {isOpen && <SettingsContent defaultTab={tab} section={section} />}
      </DialogContent>
    </Dialog>
  );
}
