"use client";

import CustomerDetailPage from "@/features/customers/customer-detail-page";
import { use } from "react";

export default function Page({
  params,
}: {
  params: Promise<{ customerId: string }>;
}) {
  const resolved = use(params);
  return <CustomerDetailPage customerId={resolved.customerId} />;
}
