import { redirect } from "next/navigation";

// Demo mode: no login required — redirect to dashboard
export default function LoginPage() {
  redirect("/");
}
