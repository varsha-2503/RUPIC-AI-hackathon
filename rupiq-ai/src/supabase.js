import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export async function getCurrentUser() {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

export async function signUp(email, password) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  });
  return { data, error };
}

export async function signIn(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  return { data, error };
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  return { error };
}

export async function getUserProfile(userId) {
  const { data, error } = await supabase
    .from("financial_profiles")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();
  return { data, error };
}

export async function upsertUserProfile(profile) {
  const { data, error } = await supabase
    .from("financial_profiles")
    .upsert(profile, { onConflict: "user_id" })
    .select()
    .single();
  return { data, error };
}

export async function saveAIReport(userId, reportType, reportData, email) {
  const { data, error } = await supabase
    .from("ai_reports")
    .insert({
      user_id: userId,
      email: email || null,
      report_type: reportType,
      report: reportData,
    })
    .select()
    .single();
  return { data, error };
}

export async function getUserReports(userId, reportType = null) {
  let query = supabase
    .from("ai_reports")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (reportType) {
    query = query.eq("report_type", reportType);
  }

  const { data, error } = await query;
  return { data, error };
}
