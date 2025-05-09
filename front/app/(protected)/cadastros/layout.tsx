import { ReactNode } from "react";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

export default function CadastrosLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex-1 ">
      {/*space-y-4 p-4 md:p-8 pt-6*/}
      {children}
    </div>
  );
}
