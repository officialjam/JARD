import { createClient } from "../../../lib/supabase/server";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return Response.json({ error: "Not signed in." }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("profiles")
    .select("profile, applications, edit_signals")
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json({
    profile: data?.profile ?? null,
    applications: data?.applications ?? [],
    editSignals: data?.edit_signals ?? [],
  });
}

export async function POST(request) {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return Response.json({ error: "Not signed in." }, { status: 401 });
  }

  let body;
  try {
    body = await request.json();
  } catch (e) {
    return Response.json({ error: "Invalid request body." }, { status: 400 });
  }

  const update = { user_id: user.id, updated_at: new Date().toISOString() };
  if (body.profile !== undefined) update.profile = body.profile;
  if (body.applications !== undefined) update.applications = body.applications;
  if (body.editSignals !== undefined) update.edit_signals = body.editSignals;

  const { error } = await supabase.from("profiles").upsert(update, { onConflict: "user_id" });

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json({ ok: true });
}
