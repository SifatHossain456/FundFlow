import { CampaignDetails } from "@/components/CampaignDetails";

export default function CampaignPage({ params }: { params: { id: string } }) {
  const id = parseInt(params.id, 10);
  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      <CampaignDetails id={id} />
    </div>
  );
}
