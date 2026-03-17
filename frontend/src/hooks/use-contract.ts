import { useChainId } from "wagmi";
import { CONTRACT_ADDRESSES, VAULTSTONE_INVOICE_ABI } from "@/lib/contracts/abi";

export function useContractConfig() {
  const chainId = useChainId();
  
  const contractAddress = CONTRACT_ADDRESSES[chainId] || CONTRACT_ADDRESSES[11155111];
  
  return {
    address: contractAddress,
    abi: VAULTSTONE_INVOICE_ABI,
    chainId,
  };
}
