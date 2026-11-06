"use client";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { authClient } from "@/src/lib/auth/client";

export function AdminSignOut() {
  const router = useRouter();
  return (
    <button
      type="button"
      className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-white/70 hover:bg-white/10 hover:text-white"
      onClick={async () => {
        await authClient.signOut();
        router.push("/sign-in");
        router.refresh();
      }}
    >
      <LogOut className="size-4" aria-hidden /> Çıxış
    </button>
  );
}
