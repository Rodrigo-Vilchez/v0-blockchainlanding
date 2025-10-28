"use client"

import { useAccount, useReadContract } from "wagmi"
import { useRouter } from "next/navigation"
import { ArrowLeft, Coins } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ConnectButton } from "@rainbow-me/rainbowkit"
import { TOKEN_CONTRACT } from "@/lib/contracts"
import { formatEther } from "viem"

export function DAppHeader() {
  const router = useRouter()
  const { address, isConnected } = useAccount()

  // Leer balance del token
  const { data: balance } = useReadContract({
    ...TOKEN_CONTRACT,
    functionName: "balanceOf",
    args: address ? [address as `0x${string}`] : undefined,
  })

  const displayBalance = balance ? formatEther(balance as bigint) : "0"

  return (
    <header className="border-b border-white/10 bg-white/5 backdrop-blur-sm sticky top-0 z-50">
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={() => router.push("/dapp")}
            className="text-white/70 hover:text-white hover:bg-white/10"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver al Dashboard
          </Button>

          <div className="flex items-center gap-4">
            {isConnected && (
              <div className="hidden sm:flex items-center gap-2 px-4 py-2 bg-white/10 rounded-lg border border-white/20">
                <Coins className="w-4 h-4 text-cyan-400" />
                <div className="text-sm">
                  <span className="text-white/60">Balance: </span>
                  <span className="text-white font-semibold">{parseFloat(displayBalance).toFixed(2)} PMT</span>
                </div>
              </div>
            )}
            <ConnectButton />
          </div>
        </div>
      </div>
    </header>
  )
}
