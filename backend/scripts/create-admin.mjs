import "dotenv/config";
import bcrypt from "bcrypt";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error("❌ Error: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required in .env");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

async function createAdmin(email, password, fullName = "Admin") {
  try {
    console.log(`\n📝 Creating admin with email: ${email}`);
    
    // Hash the password
    const passwordHash = await bcrypt.hash(password, 10);
    console.log("✅ Password hashed successfully");

    // Insert into admins table
    const { data, error } = await supabase
      .from("admins")
      .insert([
        {
          email: email,
          password_hash: passwordHash,
          full_name: fullName,
          role: "admin",
          created_at: new Date().toISOString(),
        },
      ])
      .select();

    if (error) {
      if (error.message.includes("unique constraint")) {
        console.log("⚠️  Admin with this email already exists. Updating password instead...");
        const { data: updateData, error: updateError } = await supabase
          .from("admins")
          .update({ password_hash: passwordHash, full_name: fullName })
          .eq("email", email)
          .select();

        if (updateError) {
          console.error("❌ Error updating admin:", updateError.message);
          return false;
        }
        console.log("✅ Admin password updated successfully!");
        return true;
      }
      console.error("❌ Error creating admin:", error.message);
      return false;
    }

    console.log("✅ Admin created successfully!");
    console.log("\n" + "=".repeat(60));
    console.log("🎯 LOGIN CREDENTIALS");
    console.log("=".repeat(60));
    console.log(`📧 Email:    ${email}`);
    console.log(`🔐 Password: ${password}`);
    console.log("=".repeat(60));
    console.log("\n✨ You can now login to the Admin Dashboard!");
    console.log(`📍 Login URL: https://itda-ai-classroom.vercel.app/login`);
    console.log("\n");

    return true;
  } catch (err) {
    console.error("❌ Error:", err.message);
    return false;
  }
}

// Get email and password from command line args or use defaults
const email = process.argv[2] || "admin@itda.edu";
const password = process.argv[3] || "Admin@123456";
const fullName = process.argv[4] || "ITDA Admin";

console.log("\n🚀 Admin Creation Script");
console.log("========================\n");

createAdmin(email, password, fullName).then((success) => {
  process.exit(success ? 0 : 1);
});
