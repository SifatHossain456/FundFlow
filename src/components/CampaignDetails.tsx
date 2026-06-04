"use client";
import { useAccount } from "wagmi";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useState } from "react";
import {
  useCampaign,
  useMyContribution,
  useContribute,
  useWithdraw,
  useRefund,
} from "@/hooks/useFundFlow";
import {
  formatETH,
  timeLeft,
  progressPercent,
  formatDeadline,
  shortenAddress,
} from "@/lib/utils";

export function CampaignDetails({ id }: { id: number }) {
  const { address, isConnected } = useAccount();
  const { data: campaign, refetch } = useCampaign(id);
  const { data: myContribution } = useMyContribution(id);
  const { contribute, isPending: contributing, isConfirming: confirmingContrib } = useContribute(id);
  const { withdraw, isPending: withdrawing } = useWithdraw(id);
  const { refund, isPending: refunding } = useRefund(id);
  const [ethAmount, setEthAmount] = useState("");

  if (!campaign) {
    return <div className="text-center py-20 text-gray-400">Loading campaign...</div>;
  }

  const now = Date.now();
  const deadlineMs = Number(campaign.deadline) * 1000;
  const ended = now > deadlineMs;
  const goalMet = campaign.amountRaised >= campaign.target;
  const progress = progressPercent(campaign.amountRaised, campaign.target);
  const isOwner = address?.toLowerCase() === campaign.owner.toLowerCase();
  const canWithdraw = isOwner && ended && goalMet && !campaign.withdrawn;
  const canRefund =
    !isOwner && ended && !goalMet && myContribution !== undefined && myContribution > 0n;

  const handleContribute = async () => {
    if (!ethAmount) return;
    try {
      await contribute(ethAmount);
      setEthAmount("");
      refetch();
    } catch {
      // error handled by wagmi
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Banner */}
      <div className="h-72 rounded-2xl overflow-hidden mb-8 bg-gradient-to-br from-violet-900/40 to-indigo-900/40">
        {campaign.imageUrl ? (
          <img
            src={campaign.imageUrl}
            alt={campaign.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-8xl opacity-20">
            💡
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left: info */}
        <div className="lg:col-span-2 space-y-6">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">{campaign.title}</h1>
            <p className="text-gray-400 text-sm">
              by <span className="text-violet-400">{shortenAddress(campaign.owner)}</span>
            </p>
          </div>
          <p className="text-gray-300 leading-relaxed">{campaign.description}</p>
        </div>

        {/* Right: stats + actions */}
        <div className="space-y-4">
          {/* Stats card */}
          <div className="rounded-2xl border border-white/10 bg-white/5 p-5 space-y-4">
            <div>
              <p className="text-3xl font-bold text-white">
                {formatETH(campaign.amountRaised)}{" "}
                <span className="text-lg text-gray-400">ETH</span>
              </p>
              <p className="text-gray-400 text-sm">
                raised of {formatETH(campaign.target)} ETH goal
              </p>
            </div>

            {/* Progress */}
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-violet-400 font-medium">{progress}% funded</span>
                <span className="text-gray-400">{ended ? "Ended" : timeLeft(campaign.deadline)}</span>
              </div>
              <div className="h-3 bg-white/10 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full ${goalMet ? "bg-green-500" : "bg-violet-500"}`}
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>

            <div className="pt-2 border-t border-white/10 text-sm text-gray-400">
              Deadline: {formatDeadline(campaign.deadline)}
            </div>
          </div>

          {/* Action card */}
          <div className="rounded-2xl border border-white/10 bg-white/5 p-5 space-y-3">
            {!isConnected ? (
              <ConnectButton />
            ) : canWithdraw ? (
              <>
                <p className="text-green-400 text-sm font-medium">Goal reached! You can withdraw.</p>
                <button
                  onClick={() => withdraw()}
                  disabled={withdrawing}
                  className="w-full py-3 rounded-xl bg-green-600 hover:bg-green-500 text-white font-semibold transition-colors disabled:opacity-50"
                >
                  {withdrawing ? "Withdrawing..." : "Withdraw Funds"}
                </button>
              </>
            ) : canRefund ? (
              <>
                <p className="text-orange-400 text-sm">
                  Goal not met. Your contribution: {formatETH(myContribution!)} ETH
                </p>
                <button
                  onClick={() => refund()}
                  disabled={refunding}
                  className="w-full py-3 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-semibold transition-colors disabled:opacity-50"
                >
                  {refunding ? "Refunding..." : "Claim Refund"}
                </button>
              </>
            ) : !ended && !isOwner ? (
              <>
                <input
                  type="number"
                  step="0.001"
                  min="0.001"
                  placeholder="0.01 ETH"
                  value={ethAmount}
                  onChange={(e) => setEthAmount(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-violet-500"
                />
                <button
                  onClick={handleContribute}
                  disabled={contributing || confirmingContrib || !ethAmount}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-semibold transition-all disabled:opacity-50"
                >
                  {contributing
                    ? "Confirm in wallet..."
                    : confirmingContrib
                    ? "Processing..."
                    : "Fund This Campaign"}
                </button>
                {myContribution !== undefined && myContribution > 0n && (
                  <p className="text-center text-sm text-gray-400">
                    Your contribution: {formatETH(myContribution)} ETH
                  </p>
                )}
              </>
            ) : ended ? (
              <p className="text-gray-400 text-sm text-center">This campaign has ended.</p>
            ) : (
              <p className="text-gray-400 text-sm text-center">You are the campaign owner.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
