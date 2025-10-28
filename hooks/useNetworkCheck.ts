import { useAccount, useChainId, useSwitchChain } from "wagmi"
import { sepolia } from "wagmi/chains"

export function useNetworkCheck() {
  const chainId = useChainId()
  const { isConnected } = useAccount()
  const { switchChain } = useSwitchChain()

  const isCorrectNetwork = chainId === sepolia.id
  const isWrongNetwork = isConnected && !isCorrectNetwork

  const switchToSepolia = () => {
    if (switchChain) {
      switchChain({ chainId: sepolia.id })
    }
  }

  return {
    isCorrectNetwork,
    isWrongNetwork,
    currentChainId: chainId,
    expectedChainId: sepolia.id,
    switchToSepolia,
  }
}
