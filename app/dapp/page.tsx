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
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { Coins, FileText, LogOut, Gift, Music, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function DAppPage() {
  const { isConnected } = useAccount()
  const { disconnect } = useDisconnect()
  const router = useRouter()

  // Evitar mismatch SSR/CSR: esperar al montaje del cliente antes de
  // redirigir o renderizar la UI dependiente de `isConnected`.
  const [mounted, setMounted] = useState(false)
  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (mounted && !isConnected) {
      router.push("/connect")
    }
  }, [mounted, isConnected, router])

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
        {(!mounted || !isConnected) ? (
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Token Contract Card */}
              <div
                onClick={() => router.push("/dapp/tokens")}
                className="bg-gradient-to-br from-cyan-500/10 to-blue-500/10 backdrop-blur-md rounded-xl p-6 border border-cyan-400/30 hover:border-cyan-400/70 transition-all cursor-pointer group"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-cyan-500/30 to-blue-500/30 flex items-center justify-center">
                    <Coins className="w-6 h-6 text-cyan-300" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">Token ERC20</h3>
                    <p className="text-xs text-cyan-300">Capa Monetaria</p>
                  </div>
                </div>
                <p className="text-white/70 text-sm mb-3">
                  Gestiona tokens de prueba, transferencias y aprobaciones para el sistema.
                </p>
                <Button
                  size="sm"
                  className="w-full bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white"
                >
                  Abrir Demo
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>

              {/* Escrow Contract Card */}
              <div
                onClick={() => router.push("/dapp/escrow")}
                className="bg-gradient-to-br from-purple-500/10 to-indigo-500/10 backdrop-blur-md rounded-xl p-6 border border-purple-400/30 hover:border-purple-400/70 transition-all cursor-pointer group"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-purple-500/30 to-indigo-500/30 flex items-center justify-center">
                    <FileText className="w-6 h-6 text-purple-300" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">Pago Escalonado</h3>
                    <p className="text-xs text-purple-300">Capa Lógica</p>
                  </div>
                </div>
                <p className="text-white/70 text-sm mb-3">
                  Crea órdenes de pago con custodia, entrega, disputas y reembolsos automáticos.
                </p>
                <Button
                  size="sm"
                  className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white"
                >
                  Abrir Demo
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>

              {/* Cashback Rewards Card */}
              <div
                onClick={() => router.push("/dapp/cashback")}
                className="bg-gradient-to-br from-pink-500/10 to-orange-500/10 backdrop-blur-md rounded-xl p-6 border border-pink-400/30 hover:border-pink-400/70 transition-all cursor-pointer group"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-pink-500/30 to-orange-500/30 flex items-center justify-center">
                    <Gift className="w-6 h-6 text-pink-300" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">Cashback</h3>
                    <p className="text-xs text-pink-300">Recompensas</p>
                  </div>
                </div>
                <p className="text-white/70 text-sm mb-3">
                  Gana puntos y cashback automático en cada pago realizado.
                </p>
                <Button
                  size="sm"
                  className="w-full bg-gradient-to-r from-pink-600 to-orange-600 hover:from-pink-700 hover:to-orange-700 text-white"
                >
                  Abrir Demo
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>

              {/* Royalty Distributor Card */}
              <div
                onClick={() => router.push("/dapp/royalties")}
                className="bg-gradient-to-br from-violet-500/10 to-purple-500/10 backdrop-blur-md rounded-xl p-6 border border-violet-400/30 hover:border-violet-400/70 transition-all cursor-pointer group"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-violet-500/30 to-purple-500/30 flex items-center justify-center">
                    <Music className="w-6 h-6 text-violet-300" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">Regalías</h3>
                    <p className="text-xs text-violet-300">Distribución</p>
                  </div>
                </div>
                <p className="text-white/70 text-sm mb-3">
                  Distribuye regalías automáticamente entre beneficiarios.
                </p>
                <Button
                  size="sm"
                  className="w-full bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white"
                >
                  Abrir Demo
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
