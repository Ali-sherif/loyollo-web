import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const SENDER_DOMAIN = "notify.loyollo.com";
const FROM_DOMAIN = "loyollo.com";
const APP_ORIGIN = "https://www.loyollo.com";

const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");

const getProgramSchema = z.object({
  programId: z.string().uuid(),
});

export const getJoinProgram = createServerFn({ method: "GET" })
  .inputValidator((data) => getProgramSchema.parse(data))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: program, error } = await supabaseAdmin
      .from("loyalty_programs")
      .select(
        "id, name, owner_id, program_type, spend_amount, points_earned, visits_required, reward_on_completion",
      )
      .eq("id", data.programId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!program) return null;
    let businessName: string | null = null;
    if (program.owner_id) {
      const { data: profile } = await supabaseAdmin
        .from("profiles")
        .select("business_name")
        .eq("id", program.owner_id)
        .maybeSingle();
      businessName = profile?.business_name ?? null;
    }
    const { data: qr } = await supabaseAdmin
      .from("qr_page_settings")
      .select("*")
      .eq("loyalty_program_id", program.id)
      .maybeSingle();
    return {
      id: program.id,
      name: program.name,
      businessName,
      qr: qr ?? null,
      config: {
        program_type: (program.program_type as "points" | "visit" | "tier" | null) ?? null,
        spend_amount: Number(program.spend_amount ?? 0),
        points_earned: Number(program.points_earned ?? 0),
        visits_required: Number(program.visits_required ?? 0),
        reward_on_completion: (program.reward_on_completion as string | null) ?? null,
      },
    };
  });

const enrollSchema = z
  .object({
    programId: z.string().uuid(),
    fullName: z.string().trim().min(1).max(120),
    email: z.string().trim().max(255).optional().or(z.literal("")),
    phone: z.string().trim().max(40).optional().or(z.literal("")),
    birthday: z.string().trim().max(20).optional().or(z.literal("")),
    gender: z.string().trim().max(40).optional().or(z.literal("")),
    city: z.string().trim().max(120).optional().or(z.literal("")),
    customFieldValue: z.string().trim().max(255).optional().or(z.literal("")),
  })
  .refine((v) => v.fullName.trim().length > 0, {
    message: "Please enter your name",
    path: ["fullName"],
  });


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

export const enrollCustomer = createServerFn({ method: "POST" })
  .inputValidator((data) => enrollSchema.parse(data))
  .handler(async ({ data }): Promise<EnrollResult> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: program, error: programErr } = await supabaseAdmin
      .from("loyalty_programs")
      .select(
        "id, owner_id, program_type, points_earned, visits_required, reward_on_completion, double_stamp_weekends, max_visits_per_day, after_reward_action"
      )
      .eq("id", data.programId)
      .maybeSingle();
    if (programErr) throw new Error(programErr.message);
    if (!program) throw new Error("Program not found");

    const email = data.email && data.email.length > 0 ? data.email.toLowerCase() : null;
    const phone = data.phone && data.phone.length > 0 ? data.phone : null;

    // Dedupe: match by email OR phone within the same program
    let existingId: string | null = null;
    if (email || phone) {
      const orFilters: string[] = [];
      if (email) orFilters.push(`email.eq.${email}`);
      if (phone) orFilters.push(`phone.eq.${phone}`);
      const { data: existing, error: dupErr } = await supabaseAdmin
        .from("customers")
        .select("id")
        .eq("loyalty_program_id", data.programId)
        .or(orFilters.join(","))
        .limit(1)
        .maybeSingle();
      if (dupErr) throw new Error(dupErr.message);
      if (existing) existingId = existing.id;
    }

    if (existingId) {
      // Existing customer scanning again => real check-in with progression
      return await recordCheckIn({ customerId: existingId, program });
    }

    const { data: inserted, error: insErr } = await supabaseAdmin
      .from("customers")
      .insert({
        loyalty_program_id: data.programId,
        full_name: data.fullName.trim(),
        email,
        phone,
        status: "active",
        points: 0,
        last_activity_at: new Date().toISOString(),
        birth_date: data.birthday && data.birthday.length > 0 ? data.birthday : null,
        gender: data.gender && data.gender.length > 0 ? data.gender : null,
        city: data.city && data.city.length > 0 ? data.city : null,
        custom_field_value:
          data.customFieldValue && data.customFieldValue.length > 0 ? data.customFieldValue : null,
      })
      .select("id, points, visits")
      .single();
    if (insErr) throw new Error(insErr.message);


    void notifyOwnerOfNewCustomer({
      programId: data.programId,
      customerId: inserted.id,
      customerName: data.fullName.trim(),
    }).catch((err) => {
      console.error("[enrollCustomer] owner notification failed:", err);
    });

    return {
      customerId: inserted.id,
      alreadyEnrolled: false,
      programType: (program.program_type as EnrollResult["programType"]) ?? null,
      progress: { points: inserted.points ?? 0, visits: inserted.visits ?? 0 },
      earnedReward: null,
    };
  });

type ProgramRow = {
  id: string;
  owner_id: string;
  program_type: "points" | "visit" | "tier" | string;
  points_earned: number;
  visits_required: number;
  reward_on_completion: string | null;
  double_stamp_weekends: boolean;
  max_visits_per_day: number;
  after_reward_action: string | null;
};

async function recordCheckIn(args: {
  customerId: string;
  program: ProgramRow;
}): Promise<EnrollResult> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { program, customerId } = args;
  const nowIso = new Date().toISOString();

  const { data: customer, error: cErr } = await supabaseAdmin
    .from("customers")
    .select("id, full_name, email, points, visits, last_activity_at")
    .eq("id", customerId)
    .maybeSingle();
  if (cErr) throw new Error(cErr.message);
  if (!customer) throw new Error("Customer not found");

  let newPoints = customer.points ?? 0;
  let newVisits = customer.visits ?? 0;
  let pointsAdded = 0;
  let visitsAdded = 0;
  let earnedReward: EnrollResult["earnedReward"] = null;
  let visitProgramReset = false;

  if (program.program_type === "points") {
    pointsAdded = program.points_earned ?? 0;
    newPoints = newPoints + pointsAdded;
  } else if (program.program_type === "visit" || program.program_type === "tier") {
    // Respect max_visits_per_day (0 = no cap)
    let allowThisVisit = true;
    if ((program.max_visits_per_day ?? 0) > 0 && customer.last_activity_at) {
      const last = new Date(customer.last_activity_at);
      const now = new Date();
      const sameDay =
        last.getUTCFullYear() === now.getUTCFullYear() &&
        last.getUTCMonth() === now.getUTCMonth() &&
        last.getUTCDate() === now.getUTCDate();
      if (sameDay) allowThisVisit = false;
    }
    if (allowThisVisit) {
      const isWeekend = [0, 6].includes(new Date().getUTCDay());
      visitsAdded = program.double_stamp_weekends && isWeekend ? 2 : 1;
      newVisits = newVisits + visitsAdded;
    }
  }

  // Persist updated counters + last_activity
  const { error: updErr } = await supabaseAdmin
    .from("customers")
    .update({
      points: newPoints,
      visits: newVisits,
      last_activity_at: nowIso,
    })
    .eq("id", customerId);
  if (updErr) throw new Error(updErr.message);

  // Check for a newly-earnable reward
  if (program.program_type === "points" && pointsAdded > 0) {
    const { data: rewards } = await supabaseAdmin
      .from("rewards")
      .select("id, name, point_cost, status")
      .eq("loyalty_program_id", program.id)
      .eq("status", "live")
      .not("point_cost", "is", null)
      .order("point_cost", { ascending: true });

    if (rewards) {
      for (const r of rewards) {
        if (r.point_cost == null) continue;
        if (newPoints < r.point_cost) break;
        // Try to insert; unique constraint prevents dupes
        const { data: crIns, error: crErr } = await supabaseAdmin
          .from("customer_rewards")
          .insert({
            customer_id: customerId,
            loyalty_program_id: program.id,
            reward_id: r.id,
            reward_name_snapshot: r.name,
            milestone: r.point_cost,
            status: "earned",
          })
          .select("id")
          .maybeSingle();
        if (!crErr && crIns) {
          earnedReward = {
            name: r.name,
            milestone: r.point_cost,
            programType: "points",
          };
          break;
        }
        // Unique violation => already earned; keep looking for next higher one
      }
    }
  } else if (
    (program.program_type === "visit" || program.program_type === "tier") &&
    visitsAdded > 0 &&
    (program.visits_required ?? 0) > 0 &&
    newVisits >= program.visits_required
  ) {
    const rewardName = program.reward_on_completion?.trim() || "Reward";
    const { data: crIns, error: crErr } = await supabaseAdmin
      .from("customer_rewards")
      .insert({
        customer_id: customerId,
        loyalty_program_id: program.id,
        reward_id: null,
        reward_name_snapshot: rewardName,
        milestone: program.visits_required,
        status: "earned",
      })
      .select("id")
      .maybeSingle();
    if (!crErr && crIns) {
      earnedReward = {
        name: rewardName,
        milestone: program.visits_required,
        programType: program.program_type as "visit" | "tier",
      };
      // Apply after_reward_action for visit programs (tier programs continue accumulating)
      if (program.program_type === "visit" && (program.after_reward_action ?? "reset") === "reset") {
        const remaining = Math.max(0, newVisits - program.visits_required);
        await supabaseAdmin
          .from("customers")
          .update({ visits: remaining })
          .eq("id", customerId);
        newVisits = remaining;
        visitProgramReset = true;
      }
    }
  }

  if (earnedReward) {
    void notifyOwnerOfRewardEarned({
      programId: program.id,
      customerId,
      customerName: customer.full_name,
      rewardName: earnedReward.name,
    }).catch((err) => console.error("[recordCheckIn] owner reward notify failed:", err));

    if (customer.email) {
      void emailCustomerRewardEarned({
        programId: program.id,
        customerEmail: customer.email,
        customerName: customer.full_name,
        rewardName: earnedReward.name,
      }).catch((err) => console.error("[recordCheckIn] customer reward email failed:", err));
    }
  }

  return {
    customerId,
    alreadyEnrolled: true,
    programType: (program.program_type as EnrollResult["programType"]) ?? null,
    progress: {
      points: newPoints,
      visits: newVisits,
      pointsAdded: pointsAdded > 0 ? pointsAdded : undefined,
      visitsAdded: visitsAdded > 0 ? visitsAdded : undefined,
    },
    earnedReward,
    message: visitProgramReset ? "Card reset — starting a fresh punch card." : undefined,
  };
}

async function getOwnerProfile(ownerId: string) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data: profile } = await supabaseAdmin
    .from("profiles")
    .select("email, full_name, business_name")
    .eq("id", ownerId)
    .maybeSingle();
  return profile;
}

function brandNameOf(profile: { business_name?: string | null; full_name?: string | null } | null | undefined) {
  return (
    (profile?.business_name && profile.business_name.trim()) ||
    (profile?.full_name && profile.full_name.trim()) ||
    "Loyollo"
  );
}

async function enqueueTransactional(args: {
  supabase: Awaited<ReturnType<typeof importAdmin>>["supabaseAdmin"];
  messageId: string;
  templateName: string;
  to: string;
  fromName: string;
  subject: string;
  html: string;
  text: string;
  label: string;
}) {
  try {
    await args.supabase.from("email_send_log").insert({
      message_id: args.messageId,
      template_name: args.templateName,
      recipient_email: args.to,
      status: "pending",
    });
  } catch (err) {
    console.error("[enqueueTransactional] log insert failed:", err);
  }
  const { data: unsubToken, error: tokErr } = await args.supabase.rpc("mint_unsubscribe_token", {
    p_email: args.to,
  });
  if (tokErr) throw new Error(tokErr.message);
  const { error: enqErr } = await args.supabase.rpc("enqueue_email", {
    queue_name: "transactional_emails",
    payload: {
      message_id: args.messageId,
      idempotency_key: args.messageId,
      to: args.to,
      from: `${args.fromName} <noreply@${FROM_DOMAIN}>`,
      sender_domain: SENDER_DOMAIN,
      subject: args.subject,
      html: args.html,
      text: args.text,
      purpose: "transactional",
      label: args.label,
      unsubscribe_token: unsubToken,
      queued_at: new Date().toISOString(),
    },
  });
  if (enqErr) throw new Error(enqErr.message);
}

async function importAdmin() {
  return await import("@/integrations/supabase/client.server");
}

async function notifyOwnerOfNewCustomer(args: {
  programId: string;
  customerId: string;
  customerName: string;
}) {
  const { supabaseAdmin } = await importAdmin();
  const { data: program } = await supabaseAdmin
    .from("loyalty_programs")
    .select("owner_id")
    .eq("id", args.programId)
    .maybeSingle();
  const ownerId = program?.owner_id;
  if (!ownerId) return;

  const { data: prefs } = await supabaseAdmin
    .from("notification_preferences")
    .select("new_customer_joined")
    .eq("id", ownerId)
    .maybeSingle();
  if (!prefs?.new_customer_joined) return;

  const profileUrlPath = `/customers/${args.customerId}`;
  try {
    await supabaseAdmin.from("notifications").insert({
      recipient_id: ownerId,
      type: "new_customer_joined",
      title: "New customer joined",
      message: `${args.customerName} just joined your loyalty program.`,
      link: profileUrlPath,
    });
  } catch (err) {
    console.error("[notifyOwnerOfNewCustomer] in-app notification insert failed:", err);
  }

  const profile = await getOwnerProfile(ownerId);
  if (!profile?.email) return;
  const businessName = brandNameOf(profile);
  const profileUrl = `${APP_ORIGIN}/customers/${args.customerId}`;
  const subject = `New customer joined: ${args.customerName}`;
  const text = `${args.customerName} just joined your loyalty program.\n\nView their profile: ${profileUrl}`;
  const html = `<!doctype html><html><body style="margin:0;padding:0;background:#f4f6fb;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;">
  <div style="max-width:560px;margin:0 auto;padding:32px 16px;">
    <div style="background:#fff;border-radius:14px;padding:32px;border:1px solid #eef1f7;">
      <h1 style="margin:0 0 12px 0;font-size:20px;color:#0a152f;">New customer joined</h1>
      <p style="margin:0 0 20px 0;line-height:1.55;color:#0a152f;font-size:15px;"><strong>${esc(args.customerName)}</strong> just joined your loyalty program.</p>
      <p style="margin:0 0 24px 0;"><a href="${esc(profileUrl)}" style="display:inline-block;background:#0a152f;color:#fff;text-decoration:none;padding:12px 20px;border-radius:10px;font-size:14px;">View customer profile</a></p>
    </div>
    <p style="margin:16px 0 0;text-align:center;font-size:12px;color:#8698bb;">Sent by ${esc(businessName)} via Loyollo</p>
  </div>
</body></html>`;
  await enqueueTransactional({
    supabase: supabaseAdmin,
    messageId: `new-customer-${args.customerId}`,
    templateName: "notification:new_customer_joined",
    to: profile.email,
    fromName: businessName,
    subject,
    html,
    text,
    label: "notification:new_customer_joined",
  });
}

async function notifyOwnerOfRewardEarned(args: {
  programId: string;
  customerId: string;
  customerName: string;
  rewardName: string;
}) {
  const { supabaseAdmin } = await importAdmin();
  const { data: program } = await supabaseAdmin
    .from("loyalty_programs")
    .select("owner_id")
    .eq("id", args.programId)
    .maybeSingle();
  const ownerId = program?.owner_id;
  if (!ownerId) return;

  const { data: prefs } = await supabaseAdmin
    .from("notification_preferences")
    .select("reward_earned")
    .eq("id", ownerId)
    .maybeSingle();
  if (!prefs?.reward_earned) return;

  const profileUrlPath = `/customers/${args.customerId}`;
  try {
    await supabaseAdmin.from("notifications").insert({
      recipient_id: ownerId,
      type: "reward_earned",
      title: "Customer earned a reward",
      message: `${args.customerName} earned "${args.rewardName}".`,
      link: profileUrlPath,
    });
  } catch (err) {
    console.error("[notifyOwnerOfRewardEarned] in-app notification insert failed:", err);
  }

  const profile = await getOwnerProfile(ownerId);
  if (!profile?.email) return;
  const businessName = brandNameOf(profile);
  const profileUrl = `${APP_ORIGIN}/customers/${args.customerId}`;
  const subject = `${args.customerName} earned a reward`;
  const text = `${args.customerName} just earned "${args.rewardName}" in your loyalty program.\n\nView their profile: ${profileUrl}`;
  const html = `<!doctype html><html><body style="margin:0;padding:0;background:#f4f6fb;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;">
  <div style="max-width:560px;margin:0 auto;padding:32px 16px;">
    <div style="background:#fff;border-radius:14px;padding:32px;border:1px solid #eef1f7;">
      <h1 style="margin:0 0 12px 0;font-size:20px;color:#0a152f;">Reward earned 🎉</h1>
      <p style="margin:0 0 20px 0;line-height:1.55;color:#0a152f;font-size:15px;"><strong>${esc(args.customerName)}</strong> just earned <strong>${esc(args.rewardName)}</strong>.</p>
      <p style="margin:0 0 24px 0;"><a href="${esc(profileUrl)}" style="display:inline-block;background:#0a152f;color:#fff;text-decoration:none;padding:12px 20px;border-radius:10px;font-size:14px;">View customer profile</a></p>
    </div>
    <p style="margin:16px 0 0;text-align:center;font-size:12px;color:#8698bb;">Sent by ${esc(businessName)} via Loyollo</p>
  </div>
</body></html>`;
  await enqueueTransactional({
    supabase: supabaseAdmin,
    messageId: `reward-earned-${args.customerId}-${Date.now()}`,
    templateName: "notification:reward_earned",
    to: profile.email,
    fromName: businessName,
    subject,
    html,
    text,
    label: "notification:reward_earned",
  });
}

async function emailCustomerRewardEarned(args: {
  programId: string;
  customerEmail: string;
  customerName: string;
  rewardName: string;
}) {
  const { supabaseAdmin } = await importAdmin();
  const { data: program } = await supabaseAdmin
    .from("loyalty_programs")
    .select("owner_id")
    .eq("id", args.programId)
    .maybeSingle();
  const ownerId = program?.owner_id;
  if (!ownerId) return;
  const profile = await getOwnerProfile(ownerId);
  const businessName = brandNameOf(profile);
  const subject = `You earned ${args.rewardName} at ${businessName}!`;
  const text = `Congratulations ${args.customerName}!\n\nYou just earned "${args.rewardName}" from ${businessName}. Show this email or your card next visit to redeem.`;
  const html = `<!doctype html><html><body style="margin:0;padding:0;background:#f4f6fb;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;">
  <div style="max-width:560px;margin:0 auto;padding:32px 16px;">
    <div style="background:#fff;border-radius:14px;padding:32px;border:1px solid #eef1f7;text-align:center;">
      <div style="font-size:36px;">🎉</div>
      <h1 style="margin:12px 0 8px 0;font-size:22px;color:#0a152f;">Congratulations, ${esc(args.customerName)}!</h1>
      <p style="margin:0 0 16px 0;line-height:1.55;color:#0a152f;font-size:15px;">You've earned <strong>${esc(args.rewardName)}</strong> at ${esc(businessName)}.</p>
      <p style="margin:0;color:#525252;font-size:14px;">Show this email or your loyalty card on your next visit to redeem.</p>
    </div>
    <p style="margin:16px 0 0;text-align:center;font-size:12px;color:#8698bb;">Sent by ${esc(businessName)} via Loyollo</p>
  </div>
</body></html>`;
  await enqueueTransactional({
    supabase: supabaseAdmin,
    messageId: `reward-customer-${args.customerEmail}-${Date.now()}`,
    templateName: "customer:reward_earned",
    to: args.customerEmail,
    fromName: businessName,
    subject,
    html,
    text,
    label: "customer:reward_earned",
  });
}
