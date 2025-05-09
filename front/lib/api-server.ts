// app/lib/api-server.ts
import { cookies } from "next/headers";

export async function apiServer<T = unknown>(
  path: string,
  init: RequestInit = {}
): Promise<T> {
  const cookie = (await cookies()).toString(); // cookie HttpOnly enviado pelo browser
  console.log("SSR COOKIE →", cookie || "<vazio>");
  const res = await fetch(process.env.NEXT_PUBLIC_API_URL + path, {
    ...init,
    headers: { ...init.headers, Cookie: cookie },
    cache: "no-store", // sempre fresh
  });

  if (res.status === 401) throw new Error("unauth");
  if (res.status === 404) return [] as T; // lista vazia
  return res.json() as Promise<T>;
}
