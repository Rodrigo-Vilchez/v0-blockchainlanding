"use client"

/**
 * BOTÓN DE CONEXIÓN DE WALLET
 * ============================
 * Botón para conectar/desconectar MetaMask.
 * Redirige a /connect para conectarse o a /dapp si ya está conectado.
 */

import { useAccount, useDisconnect } from "wagmi"
import { Button } from "@/components/ui/button"
import { ArrowRight, Wallet } from "lucide-react"
import { useRouter } from "next/navigation"
import { useEffect } from "react"

interface ConnectButtonProps {
  size?: "default" | "sm" | "lg" | "icon"
  variant?: "default" | "outline" | "ghost"
  className?: string
  showIcon?: boolean
}

export function ConnectButton({
  size = "lg",
  variant = "default",
  className = "",
  showIcon = true,
}: ConnectButtonProps) {
  const { address, isConnected } = useAccount()
  const { disconnect } = useDisconnect()
  const router = useRouter()

  useEffect(() => {
    if (isConnected && address && window.location.pathname === "/") {
      console.log("[v0] Connected from landing page, redirecting to /dapp")
      router.push("/dapp")
    }
  }, [isConnected, address, router])

  const shortenAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`
  }

  const handleConnect = () => {
    console.log("[v0] Navigating to connect page")
    router.push("/connect")
  }

  const handleDisconnect = () => {
    console.log("[v0] Disconnecting wallet")
    disconnect()
    // Redirigir a home después de desconectar
    if (window.location.pathname === "/dapp") {
      router.push("/")
    }
  }

  if (isConnected && address) {
    return (
      <Button
        size={size}
        variant={variant}
        onClick={handleDisconnect}
        className={className}
        title="Click para desconectar"
      >
        {showIcon && <Wallet className="w-4 h-4 mr-2" />}
        {shortenAddress(address)}
      </Button>
    )
  }

  return (
    <Button
      size={size}
      variant={variant}
      onClick={handleConnect}
      className={className}
      title="Click para conectar MetaMask"
    >
      {showIcon && <ArrowRight className="w-4 h-4 mr-2" />}
      Comenzar Ahora
    </Button>
  )
}
