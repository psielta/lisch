"use client";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import LightLogo from "@/public/Light.png";
import DarkLogo from "@/public/Dark.png";
import Image from "next/image";
import { FooterHome } from "@/components/my/FooterHome";
import { useAuth } from "@/context/auth-context";
import {
  Button,
  Card,
  CardContent,
  Typography,
  CardHeader,
} from "@mui/material";

export default function Dashboard() {
  const { user } = useAuth();
  if (!user) redirect("/login");

  return (
    <Suspense fallback={<p>Carregando…</p>}>
      <div className="flex flex-1 flex-col items-center justify-center">
        <div className="flex-1 flex items-center justify-center" />

        <div className="flex-1 flex items-center justify-center" />
      </div>
    </Suspense>
  );
}
