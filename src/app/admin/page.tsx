import { connection } from "next/server";
import { redirect } from "next/navigation";
import AdminDashboard from "@/components/admin/AdminDashboard";
import { getSupabaseServerClient } from "@/lib/supabase/server";


export default async function AdminPage() {
  await connection();
  const supabase = await getSupabaseServerClient();

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user || user.app_metadata?.role !== "admin") {
    redirect("/admin/login");
  }

  return <AdminDashboard />;
}
