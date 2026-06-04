"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useCreateCampaign } from "@/hooks/useFundFlow";
import { useAccount } from "wagmi";
import { ConnectButton } from "@rainbow-me/rainbowkit";

export function CreateForm() {
  const router = useRouter();
  const { isConnected } = useAccount();
  const { create, isPending, isConfirming, isSuccess } = useCreateCampaign();

  const [form, setForm] = useState({
    title: "",
    description: "",
    imageUrl: "",
    target: "",
    deadline: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.deadline) return;
    const deadlineTs = Math.floor(new Date(form.deadline).getTime() / 1000);
    try {
      await create(form.title, form.description, form.imageUrl, form.target, deadlineTs);
    } catch (err) {
      console.error(err);
    }
  };

  if (isSuccess) {
    setTimeout(() => router.push("/"), 2000);
    return (
      <div className="text-center py-16">
        <div className="text-5xl mb-4">🎉</div>
        <h2 className="text-2xl font-bold text-white mb-2">Campaign Created!</h2>
        <p className="text-gray-400">Redirecting to campaigns...</p>
      </div>
    );
  }

  const fieldClass =
    "w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-violet-500 transition-colors";
  const labelClass = "block text-sm font-medium text-gray-400 mb-2";

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label className={labelClass}>Campaign Title *</label>
        <input
          required
          className={fieldClass}
          placeholder="Give your campaign a clear title"
          value={form.title}
          onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
        />
      </div>
      <div>
        <label className={labelClass}>Description *</label>
        <textarea
          required
          rows={4}
          className={fieldClass}
          placeholder="What are you raising funds for?"
          value={form.description}
          onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
        />
      </div>
      <div>
        <label className={labelClass}>Cover Image URL</label>
        <input
          className={fieldClass}
          placeholder="https://..."
          value={form.imageUrl}
          onChange={(e) => setForm((f) => ({ ...f, imageUrl: e.target.value }))}
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelClass}>Funding Goal (ETH) *</label>
          <input
            required
            type="number"
            step="0.001"
            min="0.001"
            className={fieldClass}
            placeholder="0.5"
            value={form.target}
            onChange={(e) => setForm((f) => ({ ...f, target: e.target.value }))}
          />
        </div>
        <div>
          <label className={labelClass}>Deadline *</label>
          <input
            required
            type="date"
            className={fieldClass}
            min={new Date(Date.now() + 86400000).toISOString().split("T")[0]}
            value={form.deadline}
            onChange={(e) => setForm((f) => ({ ...f, deadline: e.target.value }))}
          />
        </div>
      </div>
      {isConnected ? (
        <button
          type="submit"
          disabled={isPending || isConfirming}
          className="w-full py-4 rounded-xl font-semibold bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isPending ? "Confirm in wallet..." : isConfirming ? "Creating campaign..." : "Launch Campaign"}
        </button>
      ) : (
        <div className="flex justify-center">
          <ConnectButton />
        </div>
      )}
    </form>
  );
}
