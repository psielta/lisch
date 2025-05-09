/**
 * v0 by Vercel.
 * @see https://v0.dev/t/FhHJTdJDd5T
 * Documentation: https://v0.dev/docs#integrating-generated-code-into-your-nextjs-app
 */
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function Component() {
  return (
    <div className="flex items-center min-h-screen px-4 py-12 sm:px-6 md:px-8 lg:px-12 xl:px-16">
      <div className="w-full space-y-6 text-center">
        <div className="space-y-3">
          <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl animate-bounce">
            404
          </h1>
          <p className="text-gray-500">
            Parece que você navegou para um lugar desconhecido.
          </p>
        </div>
        <Link href="/" prefetch={false}>
          <Button className="cursor-pointer">Voltar para o site</Button>
        </Link>
      </div>
    </div>
  );
}
