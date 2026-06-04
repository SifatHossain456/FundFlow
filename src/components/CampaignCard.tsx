import Link from "next/link";
import { Campaign } from "@/hooks/useFundFlow";
import { formatETH, timeLeft, progressPercent } from "@/lib/utils";

type Props = {
  id: number;
  campaign: Campaign;
};

export function CampaignCard({ id, campaign }: Props) {
  const progress = progressPercent(campaign.amountRaised, campaign.target);
  const ended = Date.now() > Number(campaign.deadline) * 1000;
  const succeeded = campaign.amountRaised >= campaign.target;

  return (
    <Link href={`/campaign/${id}`}>
      <div className="group rounded-2xl border border-white/10 bg-white/5 hover:border-violet-500/50 hover:bg-white/8 transition-all duration-200 overflow-hidden cursor-pointer">
        {/* Image */}
        <div className="h-48 bg-gradient-to-br from-violet-900/40 to-indigo-900/40 relative overflow-hidden">
          {campaign.imageUrl ? (
            <img src={campaign.imageUrl} alt={campaign.title} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-4xl opacity-30">
              💡
            </div>
          )}
          {/* Status badge */}
          <div className="absolute top-3 right-3">
            {succeeded ? (
              <span className="px-2 py-1 rounded-full text-xs bg-green-500/20 text-green-400 border border-green-500/30">
                Funded
              </span>
            ) : ended ? (
              <span className="px-2 py-1 rounded-full text-xs bg-red-500/20 text-red-400 border border-red-500/30">
                Failed
              </span>
            ) : (
              <span className="px-2 py-1 rounded-full text-xs bg-violet-500/20 text-violet-400 border border-violet-500/30">
                {timeLeft(campaign.deadline)}
              </span>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="p-5">
          <h3 className="font-semibold text-white text-lg mb-1 group-hover:text-violet-300 transition-colors line-clamp-1">
            {campaign.title}
          </h3>
          <p className="text-gray-400 text-sm mb-4 line-clamp-2">{campaign.description}</p>

          {/* Progress bar */}
          <div className="mb-3">
            <div className="h-2 bg-white/10 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${succeeded ? "bg-green-500" : "bg-violet-500"}`}
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {/* Stats */}
          <div className="flex items-center justify-between text-sm">
            <div>
              <p className="text-white font-medium">{formatETH(campaign.amountRaised)} ETH</p>
              <p className="text-gray-500">of {formatETH(campaign.target)} ETH goal</p>
            </div>
            <div className="text-right">
              <p className="text-violet-400 font-medium">{progress}%</p>
              <p className="text-gray-500">funded</p>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
