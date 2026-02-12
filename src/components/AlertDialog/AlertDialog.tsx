import React from "react";
import {
  AlertDialog as AlertDialogRoot,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

type AlertDialogProps = {
  trigger?: React.ReactElement;
  title: string;
  description: string;
  cancelText?: string;
  confirmText?: string;
  onCancel?: () => void;
  onConfirm: () => void;
  onOpenChange?: (open: boolean) => void;
  open?: boolean;
};

export const AlertDialog = ({
  trigger,
  title,
  description,
  cancelText = "Cancel",
  confirmText = "Continue",
  onCancel,
  onConfirm,
  open,
  onOpenChange,
}: AlertDialogProps) => {
  return (
    <AlertDialogRoot open={open} onOpenChange={onOpenChange}>
      {trigger && <AlertDialogTrigger render={trigger} />}

      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>

        <AlertDialogFooter>
          <AlertDialogCancel onClick={onCancel}>{cancelText}</AlertDialogCancel>
          {/* cancel instead of action because action does not close the dialog */}
          <AlertDialogCancel
            data-slot="alert-dialog-action"
            variant="destructive"
            onClick={onConfirm}
          >
            {confirmText}
          </AlertDialogCancel>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialogRoot>
  );
};
