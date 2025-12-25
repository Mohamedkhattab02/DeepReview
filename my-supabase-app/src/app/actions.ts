// Ilya Zeldner
"use server"; // Next.js Server Action

import { supabase } from "@/lib/supabase";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const TABLE_NAME = "Waitlist2026"; // Supabase Table Name

// Protection Schema (Using Regex to avoid the 'email' deprecation warning)
const EmailSchema = z
  .string() 
  .min(1, "Email is required") // Non-empty check
  .regex(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "Invalid email format"); // Basic email format check

// Add a new student to the waitlist
export async function addEmail(formData: FormData): Promise<void> {
  const rawEmail = formData.get("email") as string; // Extract email from form data

  // Zod Validation (The Firewall)
  const validated = EmailSchema.safeParse(rawEmail); // Validate email

  if (!validated.success) {
    console.error("❌ Validation Failed:", validated.error.issues[0].message); // Log validation error
    return;
  }

  // Database Insert (The Frankfurt Connection)
  const { error } = await supabase
    .from(TABLE_NAME)
    .insert([{ email: validated.data }]); // Insert validated email

  if (error) {
    // Handle the "Unique" error (Postgres code 23505)
    if (error.code === "23505") {
      console.error("❌ Error: This student is already on the list!");
    } else {
      console.error("❌ Supabase Error:", error.message);
    }
    return;
  }

  console.log("✅ Success: Added", validated.data); // Log success

  // Refresh the UI
  revalidatePath("/");
}

// Remove a student from the waitlist

export async function deleteEmail(id: number): Promise<void> {
  const { error } = await supabase.from(TABLE_NAME).delete().eq("id", id); // Delete by ID

  if (error) {
    console.error("❌ Delete Error:", error.message); 
    return;
  }

  revalidatePath("/"); // Refresh the UI
}

const LIKES_TABLE = "likes";

export async function getLikes(): Promise<number> {
  const { data, error } = await supabase
    .from(LIKES_TABLE)
    .select("count")
    .eq("id", 1)
    .single();

  if (error) {
    console.error("❌ Fetch likes error:", error.message);
    return 0;
  }

  return data.count ?? 0;
}

export async function incrementLikes(): Promise<void> {
  const { error } = await supabase.rpc("increment_likes");

  if (error) {
    console.error("❌ Increment likes error:", error.message);
    return;
  }

  revalidatePath("/");
}
