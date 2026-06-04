"use client";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import Link from "next/link";

export function Navbar() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/10 bg-black/80 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center">
            <span className="text-white font-bold text-sm">FF</span>
          </div>
          <span className="font-bold text-white text-lg">FundFlow</span>
        </Link>
        <div className="flex items-center gap-4">
          <Link href="/create" className="text-sm text-gray-400 hover:text-white transition-colors">
            + Create
          </Link>
          <ConnectButton />
        </div>
      </div>
    </nav>
  );
}
