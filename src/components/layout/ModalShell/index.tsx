"use client";

import type { ReactNode } from "react";
import { useRef } from "react";

import { useDialogFocus } from "@/hooks/useDialogFocus";
import { cn } from "@/lib/utils";

type ModalShellProps = {
  titleId: string;
  children: ReactNode;
  onClose: () => void;
  size?: "detail" | "form";
  className?: string;
};

const modalSizeClasses = {
  detail: "max-w-lg",
  form: "max-w-xl",
};

export default function ModalShell({
  titleId,
  children,
  onClose,
  size = "detail",
  className,
}: ModalShellProps) {
  const dialogRef = useRef<HTMLElement>(null);
  useDialogFocus(true, dialogRef, onClose);

  return (
    <div
      className="fixed inset-0 z-tooltip flex items-end justify-center bg-overlay p-ds-16 sm:items-center"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={cn(
          "max-h-full w-full overflow-y-auto rounded-xl bg-surface-elevated p-ds-20 shadow-xl animate-in",
          modalSizeClasses[size],
          className,
        )}
      >
        {children}
      </section>
    </div>
  );
}
