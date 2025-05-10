import { createContext, useEffect, useState } from "react";

interface User {
  id: string;
  user_name: string;
  email: string;
  bio: string;
  created_at: string;
  updated_at: string;
  tenant_id: string;
}
export interface TokenResponse {
  access_token: string;
  expires_at: number;
  token_type: string;
}
interface UserLoginDTO {
  email: string;
  password: string;
}

export type AuthContextDataProps = {
  user: User | null;
  token: TokenResponse | null;
  setUser: (user: User | null) => void;
  setToken: (token: TokenResponse | null) => void;
  signIn: (email: string, password: string) => Promise<void>;
  isLoadingUserStorageData: boolean;
  signOut: () => Promise<void>;
  signInLoading: boolean;
};

import {
  storageTokenGet,
  storageTokenRemove,
  storageTokenSave,
  storageUserGet,
  storageUserRemove,
  storageUserSave
} from "../storage/storageUser";
import { api } from "../services/api";
import { Alert } from "react-native";

export const AuthContext = createContext<AuthContextDataProps>(
  {} as AuthContextDataProps
);

type AuthContextProviderProps = {
  children: React.ReactNode;
};

export function AuthContextProvider({ children }: AuthContextProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [signInLoading, setSignInLoading] = useState(false);
  const [token, setToken] = useState<TokenResponse | null>(null);
  const [isLoadingUserStorageData, setIsLoadingUserDataStorage] =
    useState(true);

  async function storageUserAndToken(data: TokenResponse) {
    try {
      setIsLoadingUserDataStorage(true);
      await storageTokenSave(data);
      api.defaults.headers.common['Authorization'] = `Bearer ${data.access_token}`;
      setToken(data);
      const responseMe = await api.get<User>("/me");
      await storageUserSave(responseMe.data);
      setUser(responseMe.data);
    } catch (error) {
      throw error;
    } finally {
      setIsLoadingUserDataStorage(false);
    }
  }

  async function signIn(email: string, password: string) {
    try {
      setSignInLoading(true);
      const userLoginDto: UserLoginDTO = {
        email: email,
        password: password,
      };
      const response = await api.post<TokenResponse>("/login", userLoginDto);
      if (response.data) {
        await storageUserAndToken(response.data);
      } else {
        throw new Error("Usuário ou senha inválidos");
      }
    } catch (error) {
      console.error(error);
      throw error;
    } finally {
      setSignInLoading(false);
    }
  }

  async function signOut() {
    try {
      setIsLoadingUserDataStorage(true);
      setUser(null);
      setToken(null);
      await storageTokenRemove();
      await storageUserRemove();
      api.defaults.headers.common['Authorization'] = undefined;
    } catch (error) {
      throw error;
    } finally {
      setIsLoadingUserDataStorage(false);
    }
  }

  async function loadUserData() {
    try {
      setIsLoadingUserDataStorage(true);
      const storedToken = await storageTokenGet();
      const storedUser = await storageUserGet();

      if (storedToken && storedUser) {
        api.defaults.headers.common['Authorization'] = `Bearer ${storedToken.access_token}`;
        setToken(storedToken);
        setUser(storedUser);
      }
    } catch (error) {
      await signOut();
    } finally {
      setIsLoadingUserDataStorage(false);
    }
  }

  useEffect(() => {
    loadUserData();
  }, []);

  useEffect(() => {
    const interceptorId = api.interceptors.response.use(
      response => response,
      async error => {
        const status = error.response?.status
        if (status === 401 && !error.config.url?.includes('/login')) {
          await signOut()
          Alert.alert('Sessão expirada', 'Por favor, faça login novamente.')
        }
        return Promise.reject(error)
      }
    )

    return () => {
      api.interceptors.response.eject(interceptorId)
    }
  }, [signOut])

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        setUser,
        setToken,
        signIn,
        isLoadingUserStorageData,
        signOut,
        signInLoading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
