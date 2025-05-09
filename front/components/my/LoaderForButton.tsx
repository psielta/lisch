"use client";
import Image from "next/image";
import Circle from "@/public/Circle.png";
import CircleWhite from "@/public/CircleWhite.png";
import { CircularProgress } from "@mui/material";

export default function LoaderForButton() {
  return (
    <CircularProgress size={24} color="inherit" className="animate-spin" />
  );
}
