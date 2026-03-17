"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ConnectButton } from "@/components/wallet/connect-button";

export function Header() {
  const pathname = usePathname();
  
  // Don't render header on home page (it has its own nav)
  if (pathname === "/") {
    return null;
  }

  return (
    <header className="fixed top-0 left-0 right-0 z-50 px-6 py-4 bg-[#0a0a0a]/90 backdrop-blur-md border-b border-zinc-900">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center">
            <span className="text-black font-bold text-sm">V</span>
          </div>
          <span className="font-semibold text-white text-lg tracking-tight">Vaultstone</span>
        </Link>

        <nav className="hidden md:flex items-center gap-6">
          <NavLink href="/dashboard" active={pathname === "/dashboard"}>
            Dashboard
          </NavLink>
          <NavLink href="/dashboard/invoices" active={pathname.includes("/invoices")}>
            Invoices
          </NavLink>
        </nav>

        <ConnectButton />
      </div>
    </header>
  );
}

function NavLink({ href, active, children }: { href: string; active: boolean; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className={`text-sm transition-colors ${active ? "text-white" : "text-zinc-400 hover:text-white"}`}
    >
      {children}
    </Link>
  );
}
