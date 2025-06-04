"use client";
import { Button } from "@/app/components/ui/button";
import { cn } from "@/lib/utils";

export default function AIButton({ onClick, className }: { onClick: () => void; className?: string }) {
  return (
    <Button
      type="button"
      variant="outline"
      onClick={onClick}
      className={cn(
        "px-2 h-7 text-xs font-semibold border-transparent bg-gradient-to-r from-blue-600 to-purple-500 text-white",
        className,
      )}
    >
      AI
    </Button>
  );
}
