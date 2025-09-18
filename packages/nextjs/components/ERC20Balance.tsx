"use client";

import { Address, formatUnits } from "viem";
import { useReadContract } from "wagmi";

type ERC20BalanceProps = {
  address?: Address;
  tokenAddress: Address;
  tokenSymbol: string;
  decimals?: number;
  className?: string;
};

/**
 * Display ERC20 token balance of an address.
 */
export const ERC20Balance = ({ 
  address, 
  tokenAddress, 
  tokenSymbol, 
  decimals = 18, 
  className = "" 
}: ERC20BalanceProps) => {
  const {
    data: balance,
    isError,
    isLoading,
  } = useReadContract({
    address: tokenAddress,
    abi: [
      {
        name: "balanceOf",
        type: "function",
        stateMutability: "view",
        inputs: [{ name: "account", type: "address" }],
        outputs: [{ name: "", type: "uint256" }],
      },
    ],
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    query: {
      enabled: !!address,
    },
  });

  if (!address || isLoading) {
    return (
      <div className="animate-pulse flex space-x-4">
        <div className="rounded-md bg-slate-300 h-6 w-6"></div>
        <div className="flex items-center space-y-6">
          <div className="h-2 w-28 bg-slate-300 rounded-sm"></div>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="border-2 border-base-content/30 rounded-md px-2 flex flex-col items-center max-w-fit">
        <div className="text-warning">Error</div>
      </div>
    );
  }

  const formattedBalance = balance ? Number(formatUnits(balance, decimals)) : 0;

  return (
    <div className={`btn btn-sm btn-ghost flex flex-col font-normal items-center hover:bg-transparent ${className}`}>
      <div className="w-full flex items-center justify-center">
        <span>{formattedBalance.toFixed(6)}</span>
        <span className="text-[0.8em] font-bold ml-1">{tokenSymbol}</span>
      </div>
    </div>
  );
};
