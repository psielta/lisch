// app/page.tsx (página raiz)
import { permanentRedirect } from "next/navigation"; // SERVER

export default function Home() {
  permanentRedirect("/dashboard"); // executa no servidor
}
