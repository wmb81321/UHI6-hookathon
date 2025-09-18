"use client";

import { useState, useEffect } from "react";
import { useAccount } from "wagmi";
import { AddressInput, Address } from "~~/components/scaffold-eth";
import { useScaffoldWriteContract } from "~~/hooks/scaffold-eth";

const ADMIN_ADDRESS = process.env.NEXT_PUBLIC_ADMIN_ADDRESS;

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

  // Contract interactions
  const { writeContractAsync: writeComplianceNFT } = useScaffoldWriteContract({
    contractName: "ComplianceNFT",
  });

  // Check if user is admin
  const isAdmin = address === ADMIN_ADDRESS;

  useEffect(() => {
    if (isAdmin) {
      loadVerificationRequests();
      loadCashRequests();
    }
  }, [isAdmin]);

  const loadVerificationRequests = async () => {
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
  };

  const loadCashRequests = async () => {
    try {
      const response = await fetch(`/api/cash/list?address=${address}`);
      if (response.ok) {
        const data = await response.json();
        setCashRequests(data.requests);
      }
    } catch (error) {
      console.error("Failed to load cash requests:", error);
    }
  };

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
        <p className="text-sm text-base-content/70">Current address: <Address address={address} /></p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold mb-8">Admin Panel</h1>

      {/* NFT Management Section */}
      <div className="card bg-base-100 shadow-lg mb-8">
        <div className="card-body">
          <h2 className="card-title">ComplianceNFT Management</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="form-control">
              <label className="label">
                <span className="label-text">Target Address</span>
              </label>
              <AddressInput
                placeholder="Enter user address"
                value={nftTargetAddress}
                onChange={setNftTargetAddress}
              />
            </div>
            
            <div className="flex items-end gap-2">
              <button
                className={`btn btn-success ${isNftActionLoading ? "loading" : ""}`}
                onClick={() => handleNFTAction("mint")}
                disabled={!nftTargetAddress || isNftActionLoading}
              >
                Mint
              </button>
              <button
                className={`btn btn-warning ${isNftActionLoading ? "loading" : ""}`}
                onClick={() => handleNFTAction("renew")}
                disabled={!nftTargetAddress || isNftActionLoading}
              >
                Renew
              </button>
              <button
                className={`btn btn-error ${isNftActionLoading ? "loading" : ""}`}
                onClick={() => handleNFTAction("revoke")}
                disabled={!nftTargetAddress || isNftActionLoading}
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
        <button 
          className={`tab ${activeTab === "cash" ? "tab-active" : ""}`}
          onClick={() => setActiveTab("cash")}
        >
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
              <p className="text-center text-base-content/70 py-8">
                No verification requests found.
              </p>
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
                    {verificationRequests.map((request) => (
                      <tr key={request.id}>
                        <td>
                          <Address address={request.address as `0x${string}`} format="short" />
                        </td>
                        <td>
                          <span className={`badge ${request.kind === "PERSON" ? "badge-primary" : "badge-secondary"} badge-sm`}>
                            {request.kind}
                          </span>
                        </td>
                        <td className="text-sm">
                          {new Date(request.createdAt).toLocaleDateString()}
                        </td>
                        <td>
                          <span className={`badge ${getStatusColor(request.status)} badge-sm`}>
                            {request.status}
                          </span>
                        </td>
                        <td>
                          <div className="flex gap-1">
                            <button
                              className="btn btn-xs btn-info"
                              onClick={() => setSelectedRequest(request)}
                            >
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
              <p className="text-center text-base-content/70 py-8">
                No cash requests found.
              </p>
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
                    {cashRequests.map((request) => (
                      <tr key={request.id}>
                        <td>
                          <Address address={request.address as `0x${string}`} format="short" />
                        </td>
                        <td>
                          <span className={`badge ${request.direction === "IN" ? "badge-success" : "badge-warning"} badge-sm`}>
                            {request.direction}
                          </span>
                        </td>
                        <td className="font-mono text-sm">
                          {formatAmount(request.amountWei)} {request.token}
                        </td>
                        <td className="text-sm">
                          {request.bankRef || "N/A"}
                        </td>
                        <td className="text-sm">
                          {new Date(request.createdAt).toLocaleDateString()}
                        </td>
                        <td>
                          <span className={`badge ${getStatusColor(request.status)} badge-sm`}>
                            {request.status}
                          </span>
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
            <h3 className="font-bold text-lg mb-4">
              Verification Request Details
            </h3>
            
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
              <button 
                className="btn btn-ghost"
                onClick={() => setSelectedRequest(null)}
              >
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
