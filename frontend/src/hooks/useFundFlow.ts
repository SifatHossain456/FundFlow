"use client";
import { useReadContract, useWriteContract, useWaitForTransactionReceipt, useAccount } from "wagmi";
import { CONTRACT_ADDRESS, FUNDFLOW_ABI } from "@/lib/contract";
import { parseEther } from "viem";

export type Campaign = {
  owner: `0x${string}`;
  withdrawn: boolean;
  target: bigint;
  deadline: bigint;
  amountRaised: bigint;
  title: string;
  description: string;
  imageUrl: string;
};

export function useCampaignCount() {
  return useReadContract({
    address: CONTRACT_ADDRESS,
    abi: FUNDFLOW_ABI,
    functionName: "campaignCount",
  });
}

export function useCampaigns(from: number, limit: number) {
  return useReadContract({
    address: CONTRACT_ADDRESS,
    abi: FUNDFLOW_ABI,
    functionName: "getCampaigns",
    args: [BigInt(from), BigInt(limit)],
  });
}

export function useCampaign(id: number) {
  return useReadContract({
    address: CONTRACT_ADDRESS,
    abi: FUNDFLOW_ABI,
    functionName: "getCampaign",
    args: [BigInt(id)],
  });
}

export function useMyContribution(campaignId: number) {
  const { address } = useAccount();
  return useReadContract({
    address: CONTRACT_ADDRESS,
    abi: FUNDFLOW_ABI,
    functionName: "contributions",
    args: address ? [BigInt(campaignId), address] : undefined,
    query: { enabled: !!address },
  });
}

export function useCreateCampaign() {
  const { writeContractAsync, isPending, data: hash } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const create = async (
    title: string,
    description: string,
    imageUrl: string,
    targetEth: string,
    deadlineTs: number
  ) => {
    return writeContractAsync({
      address: CONTRACT_ADDRESS,
      abi: FUNDFLOW_ABI,
      functionName: "createCampaign",
      args: [title, description, imageUrl, BigInt(parseEther(targetEth)), BigInt(deadlineTs)],
    });
  };

  return { create, isPending, isConfirming, isSuccess, hash };
}

export function useContribute(campaignId: number) {
  const { writeContractAsync, isPending, data: hash } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const contribute = async (ethAmount: string) => {
    return writeContractAsync({
      address: CONTRACT_ADDRESS,
      abi: FUNDFLOW_ABI,
      functionName: "contribute",
      args: [BigInt(campaignId)],
      value: parseEther(ethAmount),
    });
  };

  return { contribute, isPending, isConfirming, isSuccess, hash };
}

export function useWithdraw(campaignId: number) {
  const { writeContractAsync, isPending, data: hash } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const withdraw = async () => {
    return writeContractAsync({
      address: CONTRACT_ADDRESS,
      abi: FUNDFLOW_ABI,
      functionName: "withdraw",
      args: [BigInt(campaignId)],
    });
  };

  return { withdraw, isPending, isConfirming, isSuccess };
}

export function useRefund(campaignId: number) {
  const { writeContractAsync, isPending, data: hash } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const refund = async () => {
    return writeContractAsync({
      address: CONTRACT_ADDRESS,
      abi: FUNDFLOW_ABI,
      functionName: "refund",
      args: [BigInt(campaignId)],
    });
  };

  return { refund, isPending, isConfirming, isSuccess };
}
