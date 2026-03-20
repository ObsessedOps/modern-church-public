import { getServerSession } from "@/lib/server-auth";
import { can } from "@/lib/rbac";
import { AccessDenied } from "@/components/ui/AccessDenied";
import GraceAIPage from "./GraceClient";

export default async function GracePage() {
  const session = await getServerSession();
  if (!can(session, "grace:use")) return <AccessDenied />;
  return <GraceAIPage />;
}
