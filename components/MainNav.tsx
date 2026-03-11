"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { createBrowserSupabaseClient } from "@/lib/supabase";
import { cn } from "@/lib/utils";

const links = [
  { href: "/gacha", label: "Gacha" },
  { href: "/collection", label: "Collection" },
  { href: "/profile", label: "Profile" },
];

export default function MainNav() {
  const pathname = usePathname();
  const router = useRouter();

  const handleSignOut = async () => {
    const supabase = createBrowserSupabaseClient();
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  };

  return (
    <nav className="sticky top-0 z-20 border-b border-zinc-800 bg-zinc-950/90 backdrop-blur">
      <div className="mx-auto flex w-full max-w-5xl items-center justify-between px-4 py-3">
        <Link href="/gacha" className="text-base font-bold text-cyan-300">
          Book Gacha
        </Link>
        <div className="flex items-center gap-1">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "rounded-md px-3 py-2 text-sm text-zinc-300 transition-colors hover:text-zinc-100",
                pathname === link.href && "bg-zinc-800 text-zinc-50",
              )}
            >
              {link.label}
            </Link>
          ))}
          <Button variant="ghost" size="default" onClick={handleSignOut}>
            Sign out
          </Button>
        </div>
      </div>
    </nav>
  );
}
