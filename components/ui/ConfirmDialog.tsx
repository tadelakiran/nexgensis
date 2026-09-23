"use client";

import { useState, type ReactNode } from "react";

import { Button } from "./Button";
import { Modal } from "./Modal";

/**
 * Confirmation dialog for destructive actions.
 *
 * The dialog owns the "an action is running" state rather than trusting the
 * caller to. That is what stops a fast double-click on Delete from firing two
 * requests: the button is disabled while the promise is pending, and the guard
 * below also bails out synchronously if a second click somehow lands first.
 */

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description?: ReactNode;
  confirmLabel?: string;
  workingLabel?: string;
  cancelLabel?: string;
  tone?: "danger" | "primary";
  /** Return a promise to keep the dialog in its busy state until it settles. */
  onConfirm: () => void | Promise<void>;
  onClose: () => void;
}

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "Confirm",
  workingLabel = "Working…",
  cancelLabel = "Cancel",
  tone = "danger",
  onConfirm,
  onClose,
}: ConfirmDialogProps) {
  const [isWorking, setIsWorking] = useState(false);

  const handleConfirm = async () => {
    if (isWorking) return; // synchronous guard against a double click
    setIsWorking(true);
    try {
      await onConfirm();
    } finally {
      // Also the reset path: the busy state is cleared when the action settles,
      // so a re-opened dialog never comes back mid-flight. That removes the need
      // for an effect that watched `open`, and with it a wasted render pass.
      setIsWorking(false);
    }
  };

  const handleClose = () => {
    if (isWorking) return; // closing mid-flight would orphan the request
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title={title}
      footer={
        <>
          <Button variant="secondary" onClick={handleClose} disabled={isWorking}>
            {cancelLabel}
          </Button>
          <Button
            variant={tone === "danger" ? "danger" : "primary"}
            onClick={handleConfirm}
            isLoading={isWorking}
            loadingText={workingLabel}
            data-autofocus
          >
            {confirmLabel}
          </Button>
        </>
      }
    >
      <div className="text-sm leading-relaxed text-slate-600">{description}</div>
    </Modal>
  );
}
