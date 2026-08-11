import * as React from "react";
import { useNavigate } from "@/lib/navigation";
import { useAuth } from "@/hooks/use-auth";

type Props = {
  children: React.ReactNode;
  /** When true, allow unverified authenticated users. Default false. */
  allowUnverified?: boolean;
};

export function ProtectedRoute({ children, allowUnverified = false }: Props) {
  const { user, isVerified, loading } = useAuth();
  const navigate = useNavigate();

  React.useEffect(() => {
    if (loading) return;
    if (!user) {
      navigate({ to: "/signin", replace: true });
      return;
    }
    if (!isVerified && !allowUnverified) {
      navigate({
        to: "/verify",
        search: { email: user.email ?? "" },
        replace: true,
      });
    }
  }, [user, isVerified, loading, allowUnverified, navigate]);

  if (loading || !user || (!isVerified && !allowUnverified)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#eef1f7]">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#feb602] border-t-transparent" />
      </div>
    );
  }

  return <>{children}</>;
}
