import { CreateForm } from "@/components/CreateForm";

export default function CreatePage() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Create a Campaign</h1>
        <p className="text-gray-400">Launch your fundraiser on Base Sepolia testnet.</p>
      </div>
      <div className="rounded-2xl border border-white/10 bg-white/5 p-8">
        <CreateForm />
      </div>
    </div>
  );
}
