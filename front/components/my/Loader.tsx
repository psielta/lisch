"use client";
import { Loader2 } from "lucide-react";
import Image from "next/image";
import LightLogo from "@/public/Light.png";
import DarkLogo from "@/public/Dark.png";

export default function Loader() {
  return (
    <div className="absolute inset-0 flex items-center justify-center">
      <div className="rounded-full h-64 w-64 border-black dark:border-white">
        <Image src={LightLogo} width={300} height={300} alt="Logo" />
      </div>
    </div>
  );
}
