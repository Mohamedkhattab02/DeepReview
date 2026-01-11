// actions/profile.ts
"use server";

import { createClient } from "@/lib/supabase-server";
import { revalidatePath } from "next/cache";

interface UpdateProfileData {
  fullName: string;
}

export async function updateProfile(data: UpdateProfileData) {
  try {
    const supabase = await createClient();
    
    // בדיקת משתמש מחובר
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return {
        success: false,
        error: "משתמש לא מחובר"
      };
    }

    // עדכון הפרופיל בטבלת users
    const { data: updatedData, error: updateError } = await supabase
      .from("users")
      .update({
        full_name: data.fullName
      })
      .eq("id", user.id)
      .select();

    if (updateError) {
      console.error("Error updating profile:", updateError);
      console.error("Error details:", JSON.stringify(updateError, null, 2));
      return {
        success: false,
        error: `שגיאה בעדכון הפרופיל: ${updateError.message}`
      };
    }

    console.log("Profile updated successfully:", updatedData);

    // רענון הדף
    revalidatePath("/dashboard/student/profile");
    revalidatePath("/dashboard/student");

    return {
      success: true
    };
  } catch (error) {
    console.error("Unexpected error:", error);
    return {
      success: false,
      error: "אירעה שגיאה בלתי צפויה"
    };
  }
}

export async function changePassword(currentPassword: string, newPassword: string) {
  try {
    const supabase = await createClient();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return {
        success: false,
        error: "משתמש לא מחובר"
      };
    }

    // אימות הסיסמה הנוכחית
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: user.email!,
      password: currentPassword
    });

    if (signInError) {
      return {
        success: false,
        error: "הסיסמה הנוכחית שגויה"
      };
    }

    // עדכון לסיסמה החדשה
    const { error: updateError } = await supabase.auth.updateUser({
      password: newPassword
    });

    if (updateError) {
      return {
        success: false,
        error: "שגיאה בעדכון הסיסמה"
      };
    }

    return {
      success: true
    };
  } catch (error) {
    console.error("Password change error:", error);
    return {
      success: false,
      error: "אירעה שגיאה בלתי צפויה"
    };
  }
}

export async function deleteAccount() {
  try {
    const supabase = await createClient();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return {
        success: false,
        error: "משתמש לא מחובר"
      };
    }

    // מחיקת נתוני המשתמש מהטבלה
    const { error: deleteError } = await supabase
      .from("users")
      .delete()
      .eq("id", user.id);

    if (deleteError) {
      return {
        success: false,
        error: "שגיאה במחיקת החשבון"
      };
    }

    // התנתקות
    await supabase.auth.signOut();

    return {
      success: true
    };
  } catch (error) {
    console.error("Account deletion error:", error);
    return {
      success: false,
      error: "אירעה שגיאה בלתי צפויה"
    };
  }
}