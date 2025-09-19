"use client";

import { useAccount } from "wagmi";
import { useScaffoldReadContract } from "~~/hooks/scaffold-eth";

export type ComplianceStatusType = "UNVERIFIED" | "PROCESSING" | "VERIFIED" | "EXPIRED";

interface ComplianceStatusProps {
  address?: string;
  showDetails?: boolean;
}

export const ComplianceStatus = ({ address, showDetails = true }: ComplianceStatusProps) => {
  const { address: connectedAddress } = useAccount();
  const targetAddress = address || connectedAddress;

  const { data: isCompliant } = useScaffoldReadContract({
    contractName: "ComplianceNFT",
    functionName: "isCompliant",
    args: [targetAddress],
  });

  const { data: tokenId } = useScaffoldReadContract({
    contractName: "ComplianceNFT",
    functionName: "tokenOf",
    args: [targetAddress],
  });

  const { data: validUntil } = useScaffoldReadContract({
    contractName: "ComplianceNFT",
    functionName: "validUntil",
    args: [targetAddress],
  });

  const getStatus = (): ComplianceStatusType => {
    if (!tokenId || tokenId === 0n) return "UNVERIFIED";
    if (!isCompliant && validUntil && validUntil > 0n) return "EXPIRED";
    if (isCompliant) return "VERIFIED";
    return "PROCESSING";
  };

  const status = getStatus();

  const getStatusColor = (status: ComplianceStatusType) => {
    switch (status) {
      case "VERIFIED":
        return "badge-success";
      case "PROCESSING":
        return "badge-warning";
      case "EXPIRED":
        return "badge-error";
      default:
        return "badge-neutral";
    }
  };

  const formatDate = (timestamp: bigint) => {
    if (!timestamp || timestamp === 0n) return "";
    return new Date(Number(timestamp) * 1000).toLocaleDateString();
  };

  return (
    <div className="card bg-base-100 shadow-lg">
      <div className="card-body">
        <h3 className="card-title">Compliance Status</h3>

        <div className="flex items-center gap-2 mb-4">
          <span className={`badge ${getStatusColor(status)} badge-lg`}>{status}</span>
        </div>

        {showDetails && (
          <div className="space-y-2">
            {tokenId && tokenId > 0n && (
              <div>
                <span className="font-semibold">Token ID:</span> {tokenId.toString()}
              </div>
            )}

            {validUntil && validUntil > 0n && (
              <div>
                <span className="font-semibold">Valid Until:</span> {formatDate(validUntil)}
                {status === "EXPIRED" && (
                  <div className="text-error text-sm mt-1">Expired — contact admin to renew</div>
                )}
                {status === "VERIFIED" &&
                  validUntil &&
                  validUntil - BigInt(Math.floor(Date.now() / 1000)) < BigInt(30 * 24 * 60 * 60) && (
                    <div className="text-warning text-sm mt-1">Expires within 30 days — consider renewal</div>
                  )}
              </div>
            )}
          </div>
        )}

        {status === "UNVERIFIED" && (
          <div className="text-sm text-base-content/70">
            No compliance NFT found. Request verification to access funding features.
          </div>
        )}
      </div>
    </div>
  );
};
