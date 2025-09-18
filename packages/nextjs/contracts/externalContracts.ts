/**
 * This file specifies external contract addresses for specific networks.
 * These contracts are not deployed by this project but are used by it.
 */
import { GenericContractsDeclaration } from "~~/utils/scaffold-eth/contract";

/**
 * Specify your external contract addresses for each network here.
 */
const externalContracts = {
  1301: {
    // Unichain Sepolia
    ComplianceNFT: {
      address: "0x6c54026fcccc54424848635edb10591d5fa4fee4",
      abi: [
        {
          inputs: [
            {
              internalType: "address",
              name: "account",
              type: "address"
            }
          ],
          name: "adminMint",
          outputs: [],
          stateMutability: "nonpayable",
          type: "function"
        },
        {
          inputs: [
            {
              internalType: "address",
              name: "account",
              type: "address"
            }
          ],
          name: "adminRenew",
          outputs: [],
          stateMutability: "nonpayable",
          type: "function"
        },
        {
          inputs: [
            {
              internalType: "address",
              name: "account",
              type: "address"
            }
          ],
          name: "adminRevoke",
          outputs: [],
          stateMutability: "nonpayable",
          type: "function"
        },
        {
          inputs: [
            {
              internalType: "address",
              name: "account",
              type: "address"
            }
          ],
          name: "isCompliant",
          outputs: [
            {
              internalType: "bool",
              name: "",
              type: "bool"
            }
          ],
          stateMutability: "view",
          type: "function"
        },
        {
          inputs: [
            {
              internalType: "address",
              name: "account",
              type: "address"
            }
          ],
          name: "tokenOf",
          outputs: [
            {
              internalType: "uint256",
              name: "",
              type: "uint256"
            }
          ],
          stateMutability: "view",
          type: "function"
        },
        {
          inputs: [
            {
              internalType: "address",
              name: "account",
              type: "address"
            }
          ],
          name: "validUntil",
          outputs: [
            {
              internalType: "uint256",
              name: "",
              type: "uint256"
            }
          ],
          stateMutability: "view",
          type: "function"
        }
      ]
    }
  }
} as const;

export default externalContracts satisfies GenericContractsDeclaration;