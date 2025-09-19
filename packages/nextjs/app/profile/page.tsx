"use client";

import { useEffect, useState } from "react";
import { formatEther, parseEther, parseUnits } from "viem";
import { useAccount } from "wagmi";
import { useSendTransaction, useWriteContract } from "wagmi";
import { ComplianceStatus } from "~~/components/ComplianceStatus";
import { DynamicForm } from "~~/components/DynamicForm";
import { ERC20Balance } from "~~/components/ERC20Balance";
import { Address, AddressInput, Balance } from "~~/components/scaffold-eth";
import { FormSchema, parseCSV } from "~~/utils/csvParser";

// Contract addresses from environment
const USDC_ADDRESS = "0x31d0220469e10c4E71834a79b1f276d740d3768F";
const ECOP_ADDRESS = "0xfa3d179e2440d8a1fdf8ddbb3f3d23c36683d78b";

export default function ProfilePage() {
  const { address, isConnected } = useAccount();
  const [showVerificationForm, setShowVerificationForm] = useState(false);
  const [verificationKind, setVerificationKind] = useState<"PERSON" | "INSTITUTION" | null>(null);
  const [formSchema, setFormSchema] = useState<FormSchema | null>(null);
  const [isLoadingSchema, setIsLoadingSchema] = useState(false);
  const [isSubmittingVerification, setIsSubmittingVerification] = useState(false);

  // Send funds form
  const [showSendForm, setShowSendForm] = useState(false);
  const [sendToAddress, setSendToAddress] = useState("");
  const [sendAmount, setSendAmount] = useState("");
  const [sendToken, setSendToken] = useState<"ETH" | "USDC" | "ECOP">("ETH");

  const { sendTransaction } = useSendTransaction();
  const { writeContract } = useWriteContract();

  // Load verification form schema
  const loadVerificationForm = async (kind: "PERSON" | "INSTITUTION") => {
    setIsLoadingSchema(true);
    try {
      const csvPath = kind === "PERSON" ? "/data/personas.csv" : "/data/institutions.csv";
      const schema = await parseCSV(csvPath);
      setFormSchema(schema);
      setVerificationKind(kind);
      setShowVerificationForm(true);
    } catch (error) {
      console.error("Failed to load verification form:", error);
      alert("Failed to load verification form. Please try again.");
    } finally {
      setIsLoadingSchema(false);
    }
  };

  // Submit verification request
  const handleVerificationSubmit = async (formData: Record<string, any>) => {
    if (!address) return;

    setIsSubmittingVerification(true);
    try {
      const response = await fetch("/api/verification/submit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          address,
          kind: verificationKind,
          fields: formData,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to submit verification request");
      }

      alert("Verification request submitted successfully! You will be notified once reviewed.");
      setShowVerificationForm(false);
      setFormSchema(null);
      setVerificationKind(null);
    } catch (error) {
      console.error("Failed to submit verification:", error);
      alert("Failed to submit verification request. Please try again.");
    } finally {
      setIsSubmittingVerification(false);
    }
  };

  // Handle send funds
  const handleSendFunds = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!address || !sendToAddress || !sendAmount) return;

    try {
      if (sendToken === "ETH") {
        // Send ETH
        await sendTransaction({
          to: sendToAddress as `0x${string}`,
          value: parseEther(sendAmount),
        });
      } else {
        // Send ERC20 token
        const tokenAddress = sendToken === "USDC" ? USDC_ADDRESS : ECOP_ADDRESS;
        const decimals = 6; // Both USDC and ECOP use 6 decimals typically
        const amount = parseUnits(sendAmount, decimals);

        // ERC20 transfer function ABI
        await writeContract({
          address: tokenAddress as `0x${string}`,
          abi: [
            {
              name: "transfer",
              type: "function",
              stateMutability: "nonpayable",
              inputs: [
                { name: "to", type: "address" },
                { name: "amount", type: "uint256" },
              ],
              outputs: [{ name: "", type: "bool" }],
            },
          ],
          functionName: "transfer",
          args: [sendToAddress as `0x${string}`, amount],
        });
      }

      alert(`Successfully sent ${sendAmount} ${sendToken} to ${sendToAddress}`);
      setSendToAddress("");
      setSendAmount("");
      setShowSendForm(false);
    } catch (error) {
      console.error("Failed to send funds:", error);
      alert("Failed to send funds. Please try again.");
    }
  };

  if (!isConnected) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <h1 className="text-4xl font-bold mb-4">Profile</h1>
        <p className="text-lg mb-8">Please connect your wallet to view your profile.</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold mb-8">Profile</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* User Info Section */}
        <div className="space-y-6">
          {/* Address & ENS */}
          <div className="card bg-base-100 shadow-lg">
            <div className="card-body">
              <h2 className="card-title">Account Information</h2>
              <div className="space-y-4">
                <div>
                  <label className="label">
                    <span className="label-text font-semibold">Address</span>
                  </label>
                  <Address address={address} />
                </div>
                {/* TODO: Add username and email fields when user management is implemented */}
              </div>
            </div>
          </div>

          {/* Compliance Status */}
          <ComplianceStatus address={address} />

          {/* Verification Request */}
          <div className="card bg-base-100 shadow-lg">
            <div className="card-body">
              <h3 className="card-title">Request Verification</h3>
              <p className="text-sm text-base-content/70 mb-4">
                Complete KYC/AML verification to access funding features.
              </p>

              <div className="flex gap-2">
                <button
                  className={`btn btn-primary ${isLoadingSchema ? "loading" : ""}`}
                  onClick={() => loadVerificationForm("PERSON")}
                  disabled={isLoadingSchema}
                >
                  Person
                </button>
                <button
                  className={`btn btn-secondary ${isLoadingSchema ? "loading" : ""}`}
                  onClick={() => loadVerificationForm("INSTITUTION")}
                  disabled={isLoadingSchema}
                >
                  Institution
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Balances & Send Section */}
        <div className="space-y-6">
          {/* Token Balances */}
          <div className="card bg-base-100 shadow-lg">
            <div className="card-body">
              <h3 className="card-title">Token Balances</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="font-semibold">ETH</span>
                  <Balance address={address} />
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-semibold">USDC</span>
                  <ERC20Balance
                    address={address}
                    tokenAddress={USDC_ADDRESS as `0x${string}`}
                    tokenSymbol="USDC"
                    decimals={6}
                  />
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-semibold">ECOP</span>
                  <ERC20Balance
                    address={address}
                    tokenAddress={ECOP_ADDRESS as `0x${string}`}
                    tokenSymbol="ECOP"
                    decimals={6}
                  />
                </div>
              </div>

              <div className="card-actions justify-end mt-4">
                <button className="btn btn-outline btn-sm" onClick={() => setShowSendForm(true)}>
                  Send Funds
                </button>
              </div>
            </div>
          </div>

          {/* Send Funds Form */}
          {showSendForm && (
            <div className="card bg-base-100 shadow-lg">
              <div className="card-body">
                <h3 className="card-title">Send Funds</h3>
                <form onSubmit={handleSendFunds} className="space-y-4">
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text">To Address</span>
                    </label>
                    <AddressInput placeholder="Recipient address" value={sendToAddress} onChange={setSendToAddress} />
                  </div>

                  <div className="form-control">
                    <label className="label">
                      <span className="label-text">Token</span>
                    </label>
                    <select
                      className="select select-bordered w-full"
                      value={sendToken}
                      onChange={e => setSendToken(e.target.value as "ETH" | "USDC" | "ECOP")}
                    >
                      <option value="ETH">ETH</option>
                      <option value="USDC">USDC</option>
                      <option value="ECOP">ECOP</option>
                    </select>
                  </div>

                  <div className="form-control">
                    <label className="label">
                      <span className="label-text">Amount</span>
                    </label>
                    <input
                      type="number"
                      step="0.000001"
                      className="input input-bordered w-full"
                      placeholder="0.0"
                      value={sendAmount}
                      onChange={e => setSendAmount(e.target.value)}
                      required
                    />
                  </div>

                  <div className="flex gap-2">
                    <button type="button" className="btn btn-ghost flex-1" onClick={() => setShowSendForm(false)}>
                      Cancel
                    </button>
                    <button type="submit" className="btn btn-primary flex-1">
                      Send
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Verification Form Modal */}
      {showVerificationForm && formSchema && (
        <DynamicForm
          schema={formSchema}
          onSubmit={handleVerificationSubmit}
          onCancel={() => {
            setShowVerificationForm(false);
            setFormSchema(null);
            setVerificationKind(null);
          }}
          isLoading={isSubmittingVerification}
        />
      )}
    </div>
  );
}
