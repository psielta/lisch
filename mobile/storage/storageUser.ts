import AsyncStorage from "@react-native-async-storage/async-storage";

import { TokenResponse, User } from "../context/AuthContext";
import { TOKEN_STORAGE } from "./storage.config";
import { USER_STORAGE } from "./storage.config";

export async function storageTokenSave(
  token: TokenResponse | null
): Promise<void> {
  await AsyncStorage.setItem(TOKEN_STORAGE, JSON.stringify(token));
}

export async function storageTokenGet(): Promise<TokenResponse | null> {
  const tokenString = await AsyncStorage.getItem(TOKEN_STORAGE);
  return tokenString ? JSON.parse(tokenString) : null;
}

export async function storageTokenRemove(): Promise<void> {
  await AsyncStorage.removeItem(TOKEN_STORAGE);
}

export async function storageUserSave(
  user: User | null
): Promise<void> {
  await AsyncStorage.setItem(USER_STORAGE, JSON.stringify(user));
}

export async function storageUserGet(): Promise<User | null> {
  const userString = await AsyncStorage.getItem(USER_STORAGE);
  return userString ? JSON.parse(userString) : null;
}

export async function storageUserRemove(): Promise<void> {
  await AsyncStorage.removeItem(USER_STORAGE);
}
