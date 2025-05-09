import api from "@/lib/api";

export type User = {
  id: string;
  user_name: string;
  email: string;
  bio: string;
  created_at: string;
  updated_at: string;
}

export const getMe = async (): Promise<User> => {
  const response = await api.get("/users/me");
  return response.data;
};
