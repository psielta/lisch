"use client";
import React, { useEffect, useState, useMemo } from "react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { ModeToggle } from "./mode-toggle";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import BrowseGalleryIcon from "@mui/icons-material/BrowseGallery";
import ScheduleIcon from "@mui/icons-material/Schedule";
function Header() {
  const [date, setDate] = useState(new Date());

  // useMemo evita recalcular a cada render
  const formattedDate = useMemo(() => {
    return format(date, "EEEE, dd 'de' MMMM 'de' yyyy, HH:mm:ss", {
      locale: ptBR,
    });
  }, [date]);

  useEffect(() => {
    const interval = setInterval(() => {
      setDate(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header
      className={cn(
        "sticky top-0 px-6 h-[5.05rem] z-50 dark:bg-neutral-700 flex items-center border-b backdrop-blur-sm transition-all mb-4"
      )}
    >
      <div className="flex-1" />
      <div className="flex flex-col items-center">
        {/* <ScheduleIcon /> */}
        <span className="text-base">{formattedDate}</span>
      </div>
      <div className="flex-1" />
      <ModeToggle />
    </header>
  );
}

export default Header;
