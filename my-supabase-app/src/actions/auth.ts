// actions/auth.ts
"use server";

import { createClient } from "@/lib/supabase-server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";


// ============================================
// הרשמה - Sign Up
// ============================================
export async function signUp(formData: FormData) {
  const supabase = await createClient();

  // שליפת נתונים מהטופס
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const full_name = formData.get("full_name") as string;
  const role = formData.get("role") as "student" | "instructor";

  // ולידציה בסיסית
  if (!email || !password || !full_name || !role) {
    return { error: "All fields are required" };
  }

  if (password.length < 6) {
    return { error: "Password must be at least 6 characters" };
  }

  try {
    // 1. יצירת משתמש ב-Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
    });

    if (authError) {
      return { error: authError.message };
    }

    if (!authData.user) {
      return { error: "Failed to create user" };
    }

    // 2. הוספה לטבלת users
    const { error: dbError } = await supabase.from("users").insert([
      {
        id: authData.user.id,
        email,
        full_name,
        role,
      },
    ]);

    if (dbError) {
      // אם נכשלה ההוספה לטבלה, נמחק את המשתמש מ-Auth
      await supabase.auth.admin.deleteUser(authData.user.id);
      return { error: dbError.message };
    }

    // 3. הצלחה! נעביר לדשבורד
    revalidatePath("/", "layout");
    
    if (role === "student") {
      redirect("/student");
    } else {
      redirect("/instructor");
    }
  } catch (error: any) {
    return { error: error.message || "An error occurred" };
  }
}

// ============================================
// התחברות - Sign In
// ============================================


export async function signIn(formData: FormData) {
  const supabase = await createClient();

  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  if (!email || !password) {
    return { error: "Email and password are required" };
  }

  // 1️⃣ התחברות ל-Supabase Auth
  const { data: authData, error: authError } =
    await supabase.auth.signInWithPassword({
      email,
      password,
    });

  if (authError) {
    return { error: authError.message };
  }

  const userId = authData.user.id; // ← UUID אמיתי

  // 2️⃣ שליפת role מהטבלה users (תואם interface)
  const { data: user, error: userError } = await supabase
    .from("users")
    .select("role")
    .eq("id", userId)       // ✅ תואם User.id
    .single();

  if (userError) {
    return { error: userError.message };
  }

  if (!user) {
    return { error: "User record not found in users table" };
  }

  revalidatePath("/", "layout");

  // 3️⃣ redirect – בלי try/catch ❗
  if (user.role === "instructor") {
    redirect("/dashboard/instructor");
  }

  redirect("/dashboard/student");
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