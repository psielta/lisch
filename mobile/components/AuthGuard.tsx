// components/AuthGuard.tsx
import { useContext, useEffect } from "react";
import { AuthContext } from "@/context/AuthContext";
import { useRouter } from "expo-router";

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user } = useContext(AuthContext);
  const router = useRouter();

  useEffect(() => {
    if (!user) {
      router.replace("/(auth)/login");
    }
  }, [user]);

  if (!user) {
    return null;
  }

  return children;
}
