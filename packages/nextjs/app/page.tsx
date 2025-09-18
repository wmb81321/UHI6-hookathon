"use client";

import Link from "next/link";
import type { NextPage } from "next";
import { useAccount } from "wagmi";
import { UserIcon, CurrencyDollarIcon, ShieldCheckIcon, CogIcon } from "@heroicons/react/24/outline";
import { Address } from "~~/components/scaffold-eth";
import { ComplianceStatus } from "~~/components/ComplianceStatus";

const Home: NextPage = () => {
  const { address: connectedAddress, isConnected } = useAccount();

  return (
    <>
      <div className="flex items-center flex-col grow pt-10">
        <div className="px-5 max-w-4xl">
          <h1 className="text-center mb-8">
            <span className="block text-2xl mb-2">Welcome to</span>
            <span className="block text-4xl font-bold">Convexo</span>
            <span className="block text-lg text-base-content/70 mt-2">
              Compliant DeFi Infrastructure
            </span>
          </h1>

          {isConnected ? (
            <div className="flex justify-center items-center space-x-2 flex-col mb-8">
              <p className="my-2 font-medium">Connected Address:</p>
              <Address address={connectedAddress} />
            </div>
          ) : (
            <div className="text-center mb-8">
              <p className="text-lg mb-4">Connect your wallet to get started</p>
            </div>
          )}

          <div className="text-center mb-12">
            <p className="text-lg mb-4">
              A comprehensive compliance platform for DeFi, featuring soulbound verification NFTs 
              and seamless fiat-to-crypto onboarding.
            </p>
            <p className="text-base-content/70">
              Complete KYC/AML verification to access funding features and participate in compliant liquidity provision.
            </p>
          </div>
        </div>

        {/* Compliance Status Section */}
        {isConnected && (
          <div className="w-full max-w-2xl px-5 mb-12">
            <ComplianceStatus address={connectedAddress} />
          </div>
        )}

        <div className="grow bg-base-300 w-full px-8 py-12">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-12">Platform Features</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {/* Profile Management */}
              <div className="flex flex-col bg-base-100 px-6 py-8 text-center items-center rounded-3xl shadow-lg">
                <UserIcon className="h-12 w-12 text-primary mb-4" />
                <h3 className="font-bold text-lg mb-2">Profile</h3>
                <p className="text-sm text-base-content/70 mb-4">
                  Manage your account, view balances, and submit verification requests.
                </p>
                <Link href="/profile" className="btn btn-primary btn-sm">
                  View Profile
                </Link>
              </div>

              {/* Compliance Verification */}
              <div className="flex flex-col bg-base-100 px-6 py-8 text-center items-center rounded-3xl shadow-lg">
                <ShieldCheckIcon className="h-12 w-12 text-success mb-4" />
                <h3 className="font-bold text-lg mb-2">Verification</h3>
                <p className="text-sm text-base-content/70 mb-4">
                  Complete KYC/AML verification to receive your soulbound compliance NFT.
                </p>
                <Link href="/profile" className="btn btn-success btn-sm">
                  Get Verified
                </Link>
              </div>

              {/* Funding */}
              <div className="flex flex-col bg-base-100 px-6 py-8 text-center items-center rounded-3xl shadow-lg">
                <CurrencyDollarIcon className="h-12 w-12 text-warning mb-4" />
                <h3 className="font-bold text-lg mb-2">Funding</h3>
                <p className="text-sm text-base-content/70 mb-4">
                  Cash in/out functionality for seamless fiat-to-crypto conversion.
                </p>
                <Link href="/funding" className="btn btn-warning btn-sm">
                  Access Funding
                </Link>
              </div>

              {/* Admin Panel */}
              <div className="flex flex-col bg-base-100 px-6 py-8 text-center items-center rounded-3xl shadow-lg">
                <CogIcon className="h-12 w-12 text-secondary mb-4" />
                <h3 className="font-bold text-lg mb-2">Admin</h3>
                <p className="text-sm text-base-content/70 mb-4">
                  Admin panel for managing verification requests and NFT operations.
                </p>
                <Link href="/admin" className="btn btn-secondary btn-sm">
                  Admin Panel
                </Link>
              </div>
            </div>

            <div className="mt-16 text-center">
              <h3 className="text-2xl font-bold mb-6">How It Works</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="flex flex-col items-center">
                  <div className="w-12 h-12 bg-primary text-primary-content rounded-full flex items-center justify-center font-bold text-xl mb-4">
                    1
                  </div>
                  <h4 className="font-bold mb-2">Connect Wallet</h4>
                  <p className="text-sm text-base-content/70">
                    Connect your Ethereum wallet to access the platform
                  </p>
                </div>
                <div className="flex flex-col items-center">
                  <div className="w-12 h-12 bg-success text-success-content rounded-full flex items-center justify-center font-bold text-xl mb-4">
                    2
                  </div>
                  <h4 className="font-bold mb-2">Get Verified</h4>
                  <p className="text-sm text-base-content/70">
                    Complete KYC/AML verification to receive your compliance NFT
                  </p>
                </div>
                <div className="flex flex-col items-center">
                  <div className="w-12 h-12 bg-warning text-warning-content rounded-full flex items-center justify-center font-bold text-xl mb-4">
                    3
                  </div>
                  <h4 className="font-bold mb-2">Access Funding</h4>
                  <p className="text-sm text-base-content/70">
                    Use cash in/out features and participate in compliant DeFi
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Home;
