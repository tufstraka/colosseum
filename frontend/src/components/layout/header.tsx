"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ConnectButton } from "@/components/wallet/connect-button";
import { Bot } from "lucide-react";

export function Header() {
  const pathname = usePathname();
  
  // Don't render header on pages that have their own nav
  if (pathname === "/" || pathname.startsWith("/arena")) {
    return null;
  }

  return (
    <header className="fixed top-0 left-0 right-0 z-50 px-6 py-4 bg-[#0a0a0a]/90 backdrop-blur-md border-b border-zinc-900">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center">
            <Bot className="w-5 h-5 text-white" />
          </div>
          <span className="font-bold text-white text-lg">Colosseum</span>
        </Link>
        <nav className="hidden md:flex items-center gap-6">
          <NavLink href="/arena" active={pathname === "/arena"}>Arena</NavLink>
          <NavLink href="/arena/deploy" active={pathname === "/arena/deploy"}>Deploy Agent</NavLink>
        </nav>
        <ConnectButton />
      </div>
    </header>
  );
}

function NavLink({ href, active, children }: { href: string; active: boolean; children: React.ReactNode }) {
  return (
    <Link href={href} className={`text-sm transition-colors ${active ? "text-white" : "text-zinc-400 hover:text-white"}`}>
      {children}
    </Link>
  );
}
