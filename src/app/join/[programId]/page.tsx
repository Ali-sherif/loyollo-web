"use client";

import JoinPage from "@/features/join/join-page";
import { use } from "react";

export default function Page({ params }: { params: Promise<{ programId: string }> }) {
  const resolved = use(params);
  return <JoinPage programId={resolved.programId} />;
}
