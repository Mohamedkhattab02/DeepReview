// actions/auth.ts
"use server";

import { createClient } from "@/lib/supabase-server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { registerSchema, loginSchema } from "@/utils/validation";
import { verifyCaptcha } from "@/lib/captcha"; // ✅ add



// ============================================
// הרשמה - Sign Up
// ============================================
export async function signUp(formData: FormData) {
  const supabase = await createClient();

  // ✅ CAPTCHA fields
  const captchaToken = (formData.get("captcha_token") as string) || "";
  const captchaAnswer = (formData.get("captcha_answer") as string) || "";

  const captchaOk = await verifyCaptcha(captchaToken, captchaAnswer);
  if (!captchaOk) {
    return { error: "CAPTCHA verification failed. Please try again." };
  }

  const rawData = {
    email: formData.get("email") as string,
    password: formData.get("password") as string,
    // ⚠️ אצלך זה היה בטעות אותו password — מומלץ כך:
    confirmPassword: formData.get("confirmPassword") as string,
    full_name: formData.get("full_name") as string,
    role: "student",
  };

  const validation = registerSchema.safeParse(rawData);

  if (!validation.success) {
    return { error: validation.error.issues[0].message };
  }

  const { email, password, full_name, role } = validation.data;

  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { full_name, role } },
  });

  if (authError) return { error: authError.message };
  if (!authData.user) return { error: "Failed to create user" };

  const { error: dbError } = await supabase.from("users").insert([
    { id: authData.user.id, email, full_name, role },
  ]);

  if (dbError) {
    console.error("DB Insert Error:", dbError);
    return { error: "Failed to create user profile" };
  }


    revalidatePath("/", "layout");
  redirect("/?signup=success");

}


// ============================================
// התחברות - Sign In
// ============================================


export async function signIn(formData: FormData) {
  const supabase = await createClient();

  const rawData = {
    email: formData.get("email") as string,
    password: formData.get("password") as string,
  };

  // Zod Validation
  const validation = loginSchema.safeParse(rawData);

  if (!validation.success) {
    return { error: validation.error.issues[0].message };
  }

  const { email, password } = validation.data;

  // ❗ אין try/catch סביב redirect
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return { error: error.message };
  }

  if (!data.user) {
    return { error: "Login failed" };
  }

  // שליפת role מהטבלה
  const { data: userData, error: userError } = await supabase
    .from("users")
    .select("role")
    .eq("id", data.user.id)
    .single();

  if (userError || !userData) {
    return { error: "Failed to fetch user data" };
  }

  revalidatePath("/", "layout");

  // ✅ Redirect לפי role (כמו שביקשת)
  if (userData.role === "instructor") {
    redirect("/dashboard/instructor");
  }

  redirect("/dashboard/student/mylibrary");
}


// ============================================
// התנתקות - Sign Out
// ============================================
export async function signOut() {
  const supabase = await createClient();

  await supabase.auth.signOut();

  revalidatePath("/", "layout");
  redirect("/");
}

// ============================================
// קבלת משתמש נוכחי
// ============================================
export async function getCurrentUser() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  // שליפת המידע המלא מהטבלה
  const { data: userData } = await supabase
    .from("users")
    .select("*")
    .eq("id", user.id)
    .single();

  return userData;
}