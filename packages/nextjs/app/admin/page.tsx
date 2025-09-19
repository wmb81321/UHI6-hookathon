"use client";

import { useCallback, useEffect, useState } from "react";
import { useAccount } from "wagmi";
import { Address, AddressInput } from "~~/components/scaffold-eth";
import { useScaffoldWriteContract } from "~~/hooks/scaffold-eth";

// AdminContractInfo removed - using direct contract calls

const ADMIN_ADDRESS = process.env.NEXT_PUBLIC_ADMIN_ADDRESS || "0x70478DBB02b4026437E5015A0B4798c99E04C564";
const COMPLIANCE_NFT_ADDRESS = process.env.NEXT_PUBLIC_COMPLIANCE_NFT;
const COMPLIANT_HOOK_ADDRESS = process.env.NEXT_PUBLIC_COMPLIANT_HOOK;

interface VerificationRequest {
  id: string;
  address: string;
  kind: "PERSON" | "INSTITUTION";
  fields: Record<string, any>;
  status: "PENDING" | "APPROVED" | "REJECTED" | "CANCELED";
  createdAt: string;
  updatedAt: string;
  user?: {
    username?: string;
    email?: string;
    ens?: string;
  };
}

interface CashRequest {
  id: string;
  address: string;
  direction: "IN" | "OUT";
  token: string;
  amountWei: string;
  bankRef?: string;
  status: "PENDING" | "APPROVED" | "REJECTED" | "CANCELED";
  createdAt: string;
  updatedAt: string;
  user?: {
    username?: string;
    email?: string;
    ens?: string;
  };
}

export default function AdminPage() {
  const { address, isConnected } = useAccount();
  const [activeTab, setActiveTab] = useState<"verification" | "cash">("verification");
  const [verificationRequests, setVerificationRequests] = useState<VerificationRequest[]>([]);
  const [cashRequests, setCashRequests] = useState<CashRequest[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<VerificationRequest | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // NFT management
  const [nftTargetAddress, setNftTargetAddress] = useState("");
  const [isNftActionLoading, setIsNftActionLoading] = useState(false);
  // NFT management state

  // Contract interactions - using deployed contracts or .env configuration
  const { writeContractAsync: writeComplianceNFT } = useScaffoldWriteContract({
    contractName: "ComplianceNFT",
  });

  // Check if user is admin
  const isAdmin = address === ADMIN_ADDRESS;

  const loadVerificationRequests = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/verification/list?address=${address}`);
      if (response.ok) {
        const data = await response.json();
        setVerificationRequests(data.requests);
      }
    } catch (error) {
      console.error("Failed to load verification requests:", error);
    } finally {
      setIsLoading(false);
    }
  }, [address]);

  const loadCashRequests = useCallback(async () => {
    try {
      const response = await fetch(`/api/cash/list?address=${address}`);
      if (response.ok) {
        const data = await response.json();
        setCashRequests(data.requests);
      }
    } catch (error) {
      console.error("Failed to load cash requests:", error);
    }
  }, [address]);

  useEffect(() => {
    if (isAdmin) {
      loadVerificationRequests();
      loadCashRequests();
    }
  }, [isAdmin, loadVerificationRequests, loadCashRequests]);

  const updateVerificationStatus = async (requestId: string, status: string) => {
    try {
      const response = await fetch(`/api/verification/${requestId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, adminAddress: address }),
      });

      if (response.ok) {
        loadVerificationRequests();
        alert(`Verification request ${status.toLowerCase()} successfully!`);
      } else {
        throw new Error("Failed to update status");
      }
    } catch (error) {
      console.error("Failed to update verification status:", error);
      alert("Failed to update verification status. Please try again.");
    }
  };

  const updateCashStatus = async (requestId: string, status: string) => {
    try {
      const response = await fetch(`/api/cash/${requestId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, adminAddress: address }),
      });

      if (response.ok) {
        loadCashRequests();
        alert(`Cash request ${status.toLowerCase()} successfully!`);
      } else {
        throw new Error("Failed to update status");
      }
    } catch (error) {
      console.error("Failed to update cash status:", error);
      alert("Failed to update cash status. Please try again.");
    }
  };

  const handleNFTAction = async (action: "mint" | "renew" | "revoke") => {
    if (!nftTargetAddress || !isAdmin) return;

    setIsNftActionLoading(true);
    try {
      // Call the appropriate function directly based on action
      if (action === "mint") {
        await writeComplianceNFT({
          functionName: "adminMint",
          args: [nftTargetAddress as `0x${string}`],
        });
      } else if (action === "renew") {
        await writeComplianceNFT({
          functionName: "adminRenew",
          args: [nftTargetAddress as `0x${string}`],
        });
      } else if (action === "revoke") {
        await writeComplianceNFT({
          functionName: "adminRevoke",
          args: [nftTargetAddress as `0x${string}`],
        });
      }

      alert(`NFT ${action} successful!`);
      setNftTargetAddress("");
    } catch (error) {
      console.error(`Failed to ${action} NFT:`, error);
      alert(`Failed to ${action} NFT. Please try again.`);
    } finally {
      setIsNftActionLoading(false);
    }
  };

  const formatAmount = (amountWei: string, decimals: number = 6) => {
    const amount = parseFloat(amountWei) / Math.pow(10, decimals);
    return amount.toFixed(6);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "APPROVED":
        return "badge-success";
      case "PENDING":
        return "badge-warning";
      case "REJECTED":
        return "badge-error";
      case "CANCELED":
        return "badge-neutral";
      default:
        return "badge-neutral";
    }
  };

  if (!isConnected) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <h1 className="text-4xl font-bold mb-4">Admin Panel</h1>
        <p className="text-lg mb-8">Please connect your wallet to access the admin panel.</p>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <h1 className="text-4xl font-bold mb-4">Access Denied</h1>
        <p className="text-lg mb-8">You do not have admin privileges.</p>
        <p className="text-sm text-base-content/70">
          Current address: <Address address={address} />
        </p>
      </div>
    );
  }

  // Check if contracts are deployed via environment variables
  const contractsDeployed = COMPLIANCE_NFT_ADDRESS && COMPLIANT_HOOK_ADDRESS;

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold mb-8">Admin Panel</h1>

      {/* Deployment Status Alert */}
      {!contractsDeployed && (
        <div className="alert alert-warning mb-8">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="stroke-current shrink-0 h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
            />
          </svg>
          <div>
            <h3 className="font-bold">Environment Variables Missing</h3>
            <div className="text-xs space-y-1">
              <div>
                1. Deploy contracts:{" "}
                <code className="bg-base-300 px-2 py-1 rounded">yarn deploy --network unichainSepolia</code>
              </div>
              <div>2. Update .env.local with:</div>
              <div className="ml-4 space-y-1">
                <div>
                  • <code className="bg-base-300 px-1 rounded">NEXT_PUBLIC_COMPLIANCE_NFT=0x[DeployedAddress]</code>
                </div>
                <div>
                  • <code className="bg-base-300 px-1 rounded">NEXT_PUBLIC_COMPLIANT_HOOK=0x[DeployedAddress]</code>
                </div>
              </div>
              <div>3. Restart the app to see contract information</div>
            </div>
            <div className="mt-2">
              <div className="text-xs opacity-70">
                Current status: NFT={COMPLIANCE_NFT_ADDRESS ? "✅" : "❌"}
                Hook={COMPLIANT_HOOK_ADDRESS ? "✅" : "❌"}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Deployment Success Alert */}
      {contractsDeployed && (
        <div className="alert alert-success mb-8">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="stroke-current shrink-0 h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <div>
            <h3 className="font-bold">Contracts Deployed Successfully!</h3>
            <div className="text-xs">
              ComplianceNFT: <code className="bg-base-300 px-1 rounded">{COMPLIANCE_NFT_ADDRESS}</code> | Hook:{" "}
              <code className="bg-base-300 px-1 rounded">{COMPLIANT_HOOK_ADDRESS}</code>
            </div>
          </div>
        </div>
      )}

      {/* Contract Status */}
      {COMPLIANCE_NFT_ADDRESS && (
        <div className="alert alert-success mb-8">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="stroke-current shrink-0 h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <div>
            <h3 className="font-bold">Contracts Configured!</h3>
            <div className="text-xs">
              ComplianceNFT: <code className="bg-base-300 px-1 rounded">{COMPLIANCE_NFT_ADDRESS}</code>
            </div>
          </div>
        </div>
      )}

      {/* NFT Management Section */}
      <div className="card bg-base-100 shadow-lg mb-8">
        <div className="card-body">
          <h2 className="card-title">NFT Management</h2>

          {/* Check if contracts are configured */}
          {!COMPLIANCE_NFT_ADDRESS && (
            <div className="alert alert-info mb-4">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                className="stroke-current shrink-0 w-6 h-6"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                ></path>
              </svg>
              <span>Configure NEXT_PUBLIC_COMPLIANCE_NFT in .env.local to enable NFT management functions</span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="form-control">
              <label className="label">
                <span className="label-text">Target Address</span>
              </label>
              <AddressInput placeholder="Enter user address" value={nftTargetAddress} onChange={setNftTargetAddress} />
            </div>

            <div className="flex items-end gap-2">
              <button
                className={`btn btn-success ${isNftActionLoading ? "loading" : ""}`}
                onClick={() => handleNFTAction("mint")}
                disabled={!nftTargetAddress || isNftActionLoading || !COMPLIANCE_NFT_ADDRESS}
              >
                Mint
              </button>
              <button
                className={`btn btn-warning ${isNftActionLoading ? "loading" : ""}`}
                onClick={() => handleNFTAction("renew")}
                disabled={!nftTargetAddress || isNftActionLoading || !COMPLIANCE_NFT_ADDRESS}
              >
                Renew
              </button>
              <button
                className={`btn btn-error ${isNftActionLoading ? "loading" : ""}`}
                onClick={() => handleNFTAction("revoke")}
                disabled={!nftTargetAddress || isNftActionLoading || !COMPLIANCE_NFT_ADDRESS}
              >
                Revoke
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs tabs-boxed mb-8">
        <button
          className={`tab ${activeTab === "verification" ? "tab-active" : ""}`}
          onClick={() => setActiveTab("verification")}
        >
          Verification Queue
        </button>
        <button className={`tab ${activeTab === "cash" ? "tab-active" : ""}`} onClick={() => setActiveTab("cash")}>
          Cash Requests
        </button>
      </div>

      {/* Verification Requests */}
      {activeTab === "verification" && (
        <div className="card bg-base-100 shadow-lg">
          <div className="card-body">
            <h3 className="card-title">Verification Requests</h3>

            {isLoading ? (
              <div className="flex justify-center py-8">
                <div className="loading loading-spinner loading-md"></div>
              </div>
            ) : verificationRequests.length === 0 ? (
              <p className="text-center text-base-content/70 py-8">No verification requests found.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="table table-zebra">
                  <thead>
                    <tr>
                      <th>Address</th>
                      <th>Kind</th>
                      <th>Date</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {verificationRequests.map(request => (
                      <tr key={request.id}>
                        <td>
                          <Address address={request.address as `0x${string}`} format="short" />
                        </td>
                        <td>
                          <span
                            className={`badge ${request.kind === "PERSON" ? "badge-primary" : "badge-secondary"} badge-sm`}
                          >
                            {request.kind}
                          </span>
                        </td>
                        <td className="text-sm">{new Date(request.createdAt).toLocaleDateString()}</td>
                        <td>
                          <span className={`badge ${getStatusColor(request.status)} badge-sm`}>{request.status}</span>
                        </td>
                        <td>
                          <div className="flex gap-1">
                            <button className="btn btn-xs btn-info" onClick={() => setSelectedRequest(request)}>
                              View
                            </button>
                            {request.status === "PENDING" && (
                              <>
                                <button
                                  className="btn btn-xs btn-success"
                                  onClick={() => updateVerificationStatus(request.id, "APPROVED")}
                                >
                                  Approve
                                </button>
                                <button
                                  className="btn btn-xs btn-error"
                                  onClick={() => updateVerificationStatus(request.id, "REJECTED")}
                                >
                                  Reject
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Cash Requests */}
      {activeTab === "cash" && (
        <div className="card bg-base-100 shadow-lg">
          <div className="card-body">
            <h3 className="card-title">Cash Requests</h3>

            {cashRequests.length === 0 ? (
              <p className="text-center text-base-content/70 py-8">No cash requests found.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="table table-zebra">
                  <thead>
                    <tr>
                      <th>Address</th>
                      <th>Type</th>
                      <th>Amount</th>
                      <th>Bank</th>
                      <th>Date</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cashRequests.map(request => (
                      <tr key={request.id}>
                        <td>
                          <Address address={request.address as `0x${string}`} format="short" />
                        </td>
                        <td>
                          <span
                            className={`badge ${request.direction === "IN" ? "badge-success" : "badge-warning"} badge-sm`}
                          >
                            {request.direction}
                          </span>
                        </td>
                        <td className="font-mono text-sm">
                          {formatAmount(request.amountWei)} {request.token}
                        </td>
                        <td className="text-sm">{request.bankRef || "N/A"}</td>
                        <td className="text-sm">{new Date(request.createdAt).toLocaleDateString()}</td>
                        <td>
                          <span className={`badge ${getStatusColor(request.status)} badge-sm`}>{request.status}</span>
                        </td>
                        <td>
                          {request.status === "PENDING" && (
                            <div className="flex gap-1">
                              <button
                                className="btn btn-xs btn-success"
                                onClick={() => updateCashStatus(request.id, "APPROVED")}
                              >
                                Approve
                              </button>
                              <button
                                className="btn btn-xs btn-error"
                                onClick={() => updateCashStatus(request.id, "REJECTED")}
                              >
                                Reject
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Verification Request Details Modal */}
      {selectedRequest && (
        <div className="modal modal-open">
          <div className="modal-box w-11/12 max-w-4xl max-h-[90vh] overflow-y-auto">
            <h3 className="font-bold text-lg mb-4">Verification Request Details</h3>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <strong>Address:</strong> <Address address={selectedRequest.address as `0x${string}`} />
                </div>
                <div>
                  <strong>Kind:</strong> {selectedRequest.kind}
                </div>
                <div>
                  <strong>Status:</strong>
                  <span className={`badge ${getStatusColor(selectedRequest.status)} badge-sm ml-2`}>
                    {selectedRequest.status}
                  </span>
                </div>
                <div>
                  <strong>Created:</strong> {new Date(selectedRequest.createdAt).toLocaleString()}
                </div>
              </div>

              <div className="divider">Submitted Fields</div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.entries(selectedRequest.fields).map(([key, value]) => (
                  <div key={key} className="form-control">
                    <label className="label">
                      <span className="label-text font-semibold">{key.replace(/_/g, " ")}</span>
                    </label>
                    <div className="p-2 bg-base-200 rounded text-sm">
                      {typeof value === "object" ? JSON.stringify(value) : String(value)}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="modal-action">
              <button className="btn btn-ghost" onClick={() => setSelectedRequest(null)}>
                Close
              </button>
              {selectedRequest.status === "PENDING" && (
                <>
                  <button
                    className="btn btn-success"
                    onClick={() => {
                      updateVerificationStatus(selectedRequest.id, "APPROVED");
                      setSelectedRequest(null);
                    }}
                  >
                    Approve
                  </button>
                  <button
                    className="btn btn-error"
                    onClick={() => {
                      updateVerificationStatus(selectedRequest.id, "REJECTED");
                      setSelectedRequest(null);
                    }}
                  >
                    Reject
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
