/**
 * This file specifies external contract addresses for specific networks.
 * These contracts are not deployed by this project but are used by it.
 */
import { GenericContractsDeclaration } from "~~/utils/scaffold-eth/contract";

/**
 * Specify your external contract addresses for each network here.
 */
const externalContracts = {
  // External contracts will be configured here if needed
  // The deployed contracts will be automatically available via deployedContracts.ts
} as const;

export default externalContracts satisfies GenericContractsDeclaration;
