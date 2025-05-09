// app/providers.tsx   👈 componente CLIENT que contém o AuthProvider
"use client";
import { AuthProvider } from "@/context/auth-context";
import { Provider } from "react-redux";
import { store } from "@/rxjs/store";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <Provider store={store}>{children}</Provider>
    </AuthProvider>
  );
}
