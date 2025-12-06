"use client";
import { useEffect } from "react";
import { authClient } from "./auth-client";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useRouter, usePathname } from "next/navigation";
import { useUserStore } from "@/store/user";

export default function AuthProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { setUser, user } = useUserStore();
  const { data: session, isPending: isAuthLoading } = authClient.useSession();
  const userQuery = useQuery(
    api.functions.users.queries.getUser,
    session?.user?.email ? { email: session.user.email } : "skip"
  );

  // Sync user to store
  useEffect(() => {
    if (userQuery !== undefined) {
      setUser(userQuery || null);
    }
  }, [userQuery, setUser]);


  return <>{children}</>;
}
