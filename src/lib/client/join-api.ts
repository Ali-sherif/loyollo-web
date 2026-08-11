"use client";

export type EnrollResult = {
  customerId: string;
  alreadyEnrolled: boolean;
  programType: "points" | "visit" | "tier" | null;
  progress: {
    points: number;
    visits: number;
    pointsAdded?: number;
    visitsAdded?: number;
  };
  earnedReward: {
    name: string;
    milestone: number;
    programType: "points" | "visit" | "tier";
  } | null;
  message?: string;
};

export async function getJoinProgram(data: { programId: string }) {
  const res = await fetch(`/api/join/program?programId=${encodeURIComponent(data.programId)}`, {
    method: "GET",
    cache: "no-store",
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || "Failed to load program");
  }
  return res.json();
}

export async function enrollCustomer(data: {
  programId: string;
  fullName: string;
  email?: string;
  phone?: string;
  birthday?: string;
  gender?: string;
  city?: string;
  customFieldValue?: string;
}): Promise<EnrollResult> {
  const res = await fetch("/api/join/enroll", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body.error || "Enrollment failed");
  return body as EnrollResult;
}
