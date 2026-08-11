"use client";

import BranchDetailPage from "@/features/branches/branch-detail-page";
import { use } from "react";

export default function Page({
  params,
}: {
  params: Promise<{ branchId: string }>;
}) {
  const resolved = use(params);
  return <BranchDetailPage branchId={resolved.branchId} />;
}
