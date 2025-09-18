"use client";

import { useState, useEffect } from "react";
import { useAccount } from "wagmi";
import Link from "next/link";
import { ComplianceStatus } from "~~/components/ComplianceStatus";
import { useScaffoldReadContract } from "~~/hooks/scaffold-eth";

// Treasury address for cash out instructions
const TREASURY_ADDRESS = "0x3f9b734394FC1E96afe9523c69d30D227dF4ffca";

interface CashRequest {
  id: string;
  direction: "IN" | "OUT";
  token: string;
  amountWei: string;
  bankRef?: string;
  status: "PENDING" | "APPROVED" | "REJECTED" | "CANCELED";
  createdAt: string;
}

interface BankAccount {
  id: string;
  alias?: string;
  bankName?: string;
  accountNoMasked?: string;
  currency?: string;
}

export default function FundingPage() {
  const { address, isConnected } = useAccount();
  const [activeTab, setActiveTab] = useState<"in" | "out">("in");
  const [cashRequests, setCashRequests] = useState<CashRequest[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  // Cash In form
  const [cashInAmount, setCashInAmount] = useState("");
  const [cashInBank, setCashInBank] = useState("");
  const [isSubmittingCashIn, setIsSubmittingCashIn] = useState(false);
  
  // Cash Out form
  const [cashOutAmount, setCashOutAmount] = useState("");
  const [cashOutBank, setCashOutBank] = useState("");
  const [isSubmittingCashOut, setIsSubmittingCashOut] = useState(false);

  // Check compliance status
  const { data: isCompliant, isLoading: isCheckingCompliance } = useScaffoldReadContract({
    contractName: "ComplianceNFT",
    functionName: "isCompliant",
    args: [address],
  });

  // Load cash requests
  useEffect(() => {
    if (address && isCompliant) {
      loadCashRequests();
    }
  }, [address, isCompliant]);

  const loadCashRequests = async () => {
    if (!address) return;
    
    setIsLoading(true);
    try {
      const response = await fetch(`/api/cash/list?address=${address}`);
      if (response.ok) {
        const data = await response.json();
        setCashRequests(data.requests);
      }
    } catch (error) {
      console.error("Failed to load cash requests:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCashInSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!address || !cashInAmount) return;

    setIsSubmittingCashIn(true);
    try {
      // Convert amount to wei (assuming 6 decimals for ECOP)
      const amountWei = BigInt(parseFloat(cashInAmount) * Math.pow(10, 6));

      const response = await fetch("/api/cash/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          address,
          direction: "IN",
          token: "ECOP",
          amountWei: amountWei.toString(),
          bankRef: cashInBank,
        }),
      });

      if (response.ok) {
        alert("Cash in request submitted successfully!");
        setCashInAmount("");
        setCashInBank("");
        loadCashRequests();
      } else {
        throw new Error("Failed to submit request");
      }
    } catch (error) {
      console.error("Failed to submit cash in request:", error);
      alert("Failed to submit cash in request. Please try again.");
    } finally {
      setIsSubmittingCashIn(false);
    }
  };

  const handleCashOutSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!address || !cashOutAmount) return;

    setIsSubmittingCashOut(true);
    try {
      // Convert amount to wei (assuming 6 decimals for ECOP)
      const amountWei = BigInt(parseFloat(cashOutAmount) * Math.pow(10, 6));

      const response = await fetch("/api/cash/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          address,
          direction: "OUT",
          token: "ECOP",
          amountWei: amountWei.toString(),
          bankRef: cashOutBank,
        }),
      });

      if (response.ok) {
        alert("Cash out request submitted successfully!");
        setCashOutAmount("");
        setCashOutBank("");
        loadCashRequests();
      } else {
        throw new Error("Failed to submit request");
      }
    } catch (error) {
      console.error("Failed to submit cash out request:", error);
      alert("Failed to submit cash out request. Please try again.");
    } finally {
      setIsSubmittingCashOut(false);
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
        <h1 className="text-4xl font-bold mb-4">Funding</h1>
        <p className="text-lg mb-8">Please connect your wallet to access funding features.</p>
      </div>
    );
  }

  if (isCheckingCompliance) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <div className="loading loading-spinner loading-lg"></div>
        <p className="mt-4">Checking compliance status...</p>
      </div>
    );
  }

  if (!isCompliant) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold mb-8">Funding</h1>
        
        <div className="alert alert-warning mb-8">
          <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
          <div>
            <h3 className="font-bold">Verification Required</h3>
            <div className="text-xs">You must be verified to access funding features.</div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <ComplianceStatus address={address} />
          
          <div className="card bg-base-100 shadow-lg">
            <div className="card-body">
              <h3 className="card-title">Get Verified</h3>
              <p className="text-sm text-base-content/70 mb-4">
                Complete the verification process to access cash in/out functionality.
              </p>
              <div className="card-actions">
                <Link href="/profile" className="btn btn-primary">
                  Go to Profile
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold mb-8">Funding</h1>

      {/* Tabs */}
      <div className="tabs tabs-boxed mb-8">
        <button 
          className={`tab ${activeTab === "in" ? "tab-active" : ""}`}
          onClick={() => setActiveTab("in")}
        >
          Cash In
        </button>
        <button 
          className={`tab ${activeTab === "out" ? "tab-active" : ""}`}
          onClick={() => setActiveTab("out")}
        >
          Cash Out
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Cash In/Out Form */}
        <div className="card bg-base-100 shadow-lg">
          <div className="card-body">
            {activeTab === "in" ? (
              <>
                <h2 className="card-title">Cash In</h2>
                <p className="text-sm text-base-content/70 mb-4">
                  Request to deposit fiat currency and receive ECOP tokens.
                </p>
                
                <form onSubmit={handleCashInSubmit} className="space-y-4">
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text">Amount (USD)</span>
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      className="input input-bordered w-full"
                      placeholder="0.00"
                      value={cashInAmount}
                      onChange={(e) => setCashInAmount(e.target.value)}
                      required
                    />
                  </div>

                  <div className="form-control">
                    <label className="label">
                      <span className="label-text">Bank Account</span>
                    </label>
                    <input
                      type="text"
                      className="input input-bordered w-full"
                      placeholder="Bank account reference or alias"
                      value={cashInBank}
                      onChange={(e) => setCashInBank(e.target.value)}
                    />
                  </div>

                  <button 
                    type="submit" 
                    className={`btn btn-primary w-full ${isSubmittingCashIn ? "loading" : ""}`}
                    disabled={isSubmittingCashIn}
                  >
                    {isSubmittingCashIn ? "Submitting..." : "Submit Cash In Request"}
                  </button>
                </form>
              </>
            ) : (
              <>
                <h2 className="card-title">Cash Out</h2>
                <p className="text-sm text-base-content/70 mb-4">
                  Send ECOP tokens to treasury and request fiat withdrawal.
                </p>

                <div className="alert alert-info mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="stroke-current shrink-0 w-6 h-6">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                  </svg>
                  <div className="text-sm">
                    <p><strong>Instructions:</strong></p>
                    <p>1. Send ECOP tokens to treasury: <code className="bg-base-200 px-1 rounded">{TREASURY_ADDRESS}</code></p>
                    <p>2. Submit the form below with the amount and bank details</p>
                  </div>
                </div>
                
                <form onSubmit={handleCashOutSubmit} className="space-y-4">
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text">Amount (ECOP)</span>
                    </label>
                    <input
                      type="number"
                      step="0.000001"
                      className="input input-bordered w-full"
                      placeholder="0.000000"
                      value={cashOutAmount}
                      onChange={(e) => setCashOutAmount(e.target.value)}
                      required
                    />
                  </div>

                  <div className="form-control">
                    <label className="label">
                      <span className="label-text">Bank Account</span>
                    </label>
                    <input
                      type="text"
                      className="input input-bordered w-full"
                      placeholder="Bank account reference or alias"
                      value={cashOutBank}
                      onChange={(e) => setCashOutBank(e.target.value)}
                      required
                    />
                  </div>

                  <button 
                    type="submit" 
                    className={`btn btn-primary w-full ${isSubmittingCashOut ? "loading" : ""}`}
                    disabled={isSubmittingCashOut}
                  >
                    {isSubmittingCashOut ? "Submitting..." : "Submit Cash Out Request"}
                  </button>
                </form>
              </>
            )}
          </div>
        </div>

        {/* Request History */}
        <div className="card bg-base-100 shadow-lg">
          <div className="card-body">
            <h3 className="card-title">Request History</h3>
            
            {isLoading ? (
              <div className="flex justify-center py-8">
                <div className="loading loading-spinner loading-md"></div>
              </div>
            ) : cashRequests.length === 0 ? (
              <p className="text-center text-base-content/70 py-8">
                No requests found.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="table table-zebra">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Type</th>
                      <th>Amount</th>
                      <th>Bank</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cashRequests.map((request) => (
                      <tr key={request.id}>
                        <td className="text-sm">
                          {new Date(request.createdAt).toLocaleDateString()}
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
                        <td>
                          <span className={`badge ${getStatusColor(request.status)} badge-sm`}>
                            {request.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
