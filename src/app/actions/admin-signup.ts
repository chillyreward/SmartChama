"use server";

import { createClient } from "@supabase/supabase-js";

export async function createAdminProfile(
  admin_user_id: string,
  full_name: string,
  phone_number: string,
  email: string
) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error("Missing Supabase admin credentials");
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    const { error: adminError } = await supabaseAdmin
      .from("chama_admins")
      .insert([
        {
          admin_user_id,
          full_name,
          phone_number,
          email,
        },
      ]);

    if (adminError) {
      console.error("Admin Profile Creation Error:", adminError);
      return { success: false, error: adminError.message };
    }

    return { success: true };
  } catch (error: any) {
    console.error("Server Action Error:", error);
    return { success: false, error: error.message || "Failed to create admin profile" };
  }
}
