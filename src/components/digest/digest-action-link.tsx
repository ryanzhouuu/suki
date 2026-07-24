"use client";

import Link from "next/link";

import { logDigestAction } from "@/actions/digest";

export function DigestActionLink({
  actionKind,
  children,
  className,
  digestId,
  href,
  section,
}: {
  actionKind: string;
  children: React.ReactNode;
  className: string;
  digestId: string;
  href: string;
  section: string;
}) {
  return (
    <Link
      href={href}
      className={className}
      onClick={() => void logDigestAction(digestId, section, actionKind)}
    >
      {children}
    </Link>
  );
}
