"use client";

import { type ReactNode } from "react";

import { Dialog } from "@/components/ui/dialog";

type RecommendDialogProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: ReactNode;
};

/**
 * Thin wrapper around the shared {@link Dialog} shell, kept for the friend
 * recommendation flow's existing call sites.
 */
export function RecommendDialog(props: RecommendDialogProps) {
  return <Dialog {...props} />;
}
