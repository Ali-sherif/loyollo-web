"use client";

export async function sendPasswordChangedEmail() {
  const res = await fetch("/api/account/password-changed-email", {
    method: "POST",
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body.error || "Failed to queue email");
  return body;
}

export async function deleteMyAccount() {
  const res = await fetch("/api/account/delete", { method: "POST" });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body.error || "Failed to delete account");
  return body;
}
