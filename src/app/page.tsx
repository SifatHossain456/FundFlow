"use client";
import { useCampaigns, useCampaignCount } from "@/hooks/useFundFlow";
import { CampaignCard } from "@/components/CampaignCard";
import Link from "next/link";

export default function Home() {
  const { data: count } = useCampaignCount();
  const total = Number(count ?? 0);
  const { data: campaigns, isLoading } = useCampaigns(0, Math.max(total, 1));

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      {/* Hero */}
      <div className="text-center mb-16">
        <h1 className="text-5xl font-bold text-white mb-4">
          Fund What{" "}
          <span className="bg-gradient-to-r from-violet-400 to-indigo-400 bg-clip-text text-transparent">
            Matters
          </span>
        </h1>
        <p className="text-gray-400 text-xl mb-8 max-w-xl mx-auto">
          Decentralized crowdfunding on Base. Funds release only when goals are met.
        </p>
        <Link href="/create">
          <button className="px-8 py-4 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-semibold transition-all text-lg">
            Start a Campaign
          </button>
        </Link>
      </div>

      {/* Stats bar */}
      {total > 0 && (
        <div className="flex justify-center gap-12 mb-12">
          <div className="text-center">
            <p className="text-3xl font-bold text-violet-400">{total}</p>
            <p className="text-gray-400 text-sm">Campaigns</p>
          </div>
        </div>
      )}

      {/* Campaign grid */}
      <h2 className="text-2xl font-bold text-white mb-6">Active Campaigns</h2>
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-80 rounded-2xl bg-white/5 animate-pulse" />
          ))}
        </div>
      ) : !campaigns || campaigns.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <p className="text-4xl mb-4">🌱</p>
          <p className="text-lg">No campaigns yet. Be the first!</p>
          <Link href="/create" className="text-violet-400 hover:underline mt-2 inline-block">
            Create Campaign →
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {campaigns.map((campaign, i) => (
            <CampaignCard key={i} id={i} campaign={campaign} />
          ))}
        </div>
      )}
    </div>
  );
}
