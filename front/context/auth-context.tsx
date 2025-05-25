// app/context/auth-context.tsx
"use client";
import { createContext, useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import { getMe } from "@/proxies/users/GetMe";

export interface User {
  id: string;
  user_name: string;
  email: string;
  bio: string;
  created_at: string;
  updated_at: string;
  tenant_id: string;
  admin: number;
  permission_users: number | null;
  permission_categoria: number | null;
  permission_produto: number | null;
  permission_adicional: number | null;
  permission_vendas: number | null;
  permission_cliente: number | null;
}

export interface Tenant {
  id: string;
  name: string | null;
  plan: string | null;
  status: string | null;
  created_at: string | null;
  id_cliente_padrao: string | null;
}

interface LoginInput {
  email: string;
  password: string;
}

interface AuthCtx {
  user: User | null;
  tenant: Tenant | null;
  reloadUser: () => void;
  loading: boolean;
  login(data: LoginInput): Promise<void>;
  logout(): Promise<void>;
}

const AuthContext = createContext<AuthCtx>({} as AuthCtx);
export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const router = useRouter();

  function reloadUser() {
    getMe()
      .then((user) => setUser(user as User))
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }

  // tenta recuperar o usuário na montagem
  useEffect(() => {
    getMe()
      .then((user) => setUser(user as User))
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  async function login(data: LoginInput) {
    await api.post("/users/login", data); // backend seta cookie httpOnly
    const { data: me } = await api.get<User>("/users/me");
    setUser(me);
    router.replace("/dashboard");
  }

  async function logout() {
    await api.post("/users/logout");
    setUser(null);
    router.replace("/login");
  }

  useEffect(() => {
    const id = api.interceptors.response.use(
      (res) => res,
      async (err) => {
        if (err.response?.status === 401) {
          await logout();
        }
        return Promise.reject(err);
      }
    );
    return () => api.interceptors.response.eject(id);
  }, [logout]);

  async function getTenant() {
    const { data } = await api.get<Tenant>(`/users/tenant/${user?.tenant_id}`);
    return data;
  }

  useEffect(() => {
    if (user && user.tenant_id) {
      getTenant()
        .then((tenant) => setTenant(tenant as Tenant))
        .catch(() => setTenant(null));
    }
  }, [user]);

  return (
    <AuthContext.Provider
      value={{ user, loading, login, logout, reloadUser, tenant }}
    >
      {children}
    </AuthContext.Provider>
  );
}
