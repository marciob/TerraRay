"use client";

import Link from "next/link";
import { Globe } from "lucide-react";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export function Header() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 flex w-full items-center justify-between border-b border-rayls-border bg-rayls-charcoal/80 p-4 backdrop-blur-md">
      <div className="flex items-center gap-8">
        <Link href="/" className="flex items-center gap-2 transition-opacity hover:opacity-80">
          <div className="h-8 w-8 rounded-full bg-rayls-lime/20 flex items-center justify-center border border-rayls-lime/50">
            <Globe className="h-5 w-5 text-rayls-lime" />
          </div>
          <span className="text-lg font-bold tracking-tight text-white">
            TERRARAY
          </span>
        </Link>

        <nav className="hidden md:flex items-center gap-6">
          <Link 
            href="/operator/farmers/new"
            className={cn(
              "text-sm font-medium transition-colors hover:text-rayls-lime",
              pathname.startsWith("/operator") ? "text-rayls-lime" : "text-rayls-grey"
            )}
          >
            Origination Desk
          </Link>
          <Link 
            href="/investor/vaults"
            className={cn(
              "text-sm font-medium transition-colors hover:text-rayls-lime",
              pathname.startsWith("/investor") ? "text-rayls-lime" : "text-rayls-grey"
            )}
          >
            Capital Markets
          </Link>
        </nav>
      </div>

      <div className="flex items-center gap-4">
        <ConnectButton 
          accountStatus="address"
          chainStatus="icon"
          showBalance={false}
        />
      </div>
    </header>
  );
}
