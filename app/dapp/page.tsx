"use client"

/**
 * PÁGINA DE DAPP
 * ==============
 * Interfaz principal para interactuar con los Smart Contracts.
 * Incluye:
 * - Token ERC20 (Capa Monetaria)
 * - Pago Escalonado (Capa Lógica)
 */

import { useAccount, useDisconnect } from "wagmi"
import { ConnectButton } from "@/components/connect-button"
import { TokenManager } from "@/components/token-manager"
import { EscrowManager } from "@/components/escrow-manager"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { Coins, FileText, LogOut } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function DAppPage() {
  const { isConnected } = useAccount()
  const { disconnect } = useDisconnect()
  const router = useRouter()

  useEffect(() => {
    if (!isConnected) {
      router.push("/connect")
    }
  }, [isConnected, router])

  const handleDisconnect = () => {
    disconnect()
    router.push("/")
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-950 via-purple-900 to-fuchsia-900">
      {/* Header */}
      <header className="border-b border-white/10 bg-white/5 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="Logo" className="h-10 w-10" />
            <div>
              <h1 className="text-2xl font-bold text-white">SmartPay</h1>
              <p className="text-xs text-white/50">Dinero Programable</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleDisconnect}
              className="text-white/70 hover:text-white hover:bg-white/10"
              title="Desconectar wallet"
            >
              <LogOut className="w-5 h-5" />
            </Button>
            <ConnectButton size="default" variant="outline" className="border-white/20 text-white hover:bg-white/10" />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-12">
        {!isConnected ? (
          <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-12 max-w-md">
              <h2 className="text-3xl font-bold text-white mb-4">Conecta tu Wallet</h2>
              <p className="text-white/70 mb-8">
                Conecta tu wallet de MetaMask para interactuar con los Smart Contracts
              </p>
              <ConnectButton size="lg" className="bg-purple-600 hover:bg-purple-700 text-white" />
            </div>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Dashboard Header */}
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
              <h2 className="text-3xl font-bold text-white mb-2">Panel de Control</h2>
              <p className="text-white/70">Gestiona tus Smart Contracts y transacciones</p>
            </div>

            {/* Contratos Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              {/* Token Contract Card */}
              <div className="bg-white/5 backdrop-blur-md rounded-xl p-6 border border-white/10 hover:border-cyan-400/50 transition-colors">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-lg bg-cyan-500/20 flex items-center justify-center">
                    <Coins className="w-6 h-6 text-cyan-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">Token ERC20</h3>
                    <p className="text-xs text-white/50">Capa Monetaria</p>
                  </div>
                </div>
                <p className="text-white/70 text-sm">
                  Gestiona tokens de prueba, transferencias y aprobaciones para el sistema de pagos escalonados.
                </p>
              </div>

              {/* Escrow Contract Card */}
              <div className="bg-white/5 backdrop-blur-md rounded-xl p-6 border border-white/10 hover:border-purple-400/50 transition-colors">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-lg bg-purple-500/20 flex items-center justify-center">
                    <FileText className="w-6 h-6 text-purple-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">Pago Escalonado</h3>
                    <p className="text-xs text-white/50">Capa Lógica</p>
                  </div>
                </div>
                <p className="text-white/70 text-sm">
                  Crea órdenes de pago con custodia, entrega, disputas y reembolsos automáticos.
                </p>
              </div>
            </div>

            {/* Token Manager */}
            <TokenManager />

            {/* Escrow Manager */}
            <EscrowManager />
          </div>
        )}
      </main>
    </div>
  )
}
