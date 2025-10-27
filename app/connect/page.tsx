"use client"

/**
 * PÁGINA DE CONEXIÓN A METAMASK
 * =============================
 * Formulario para conectar wallet de MetaMask.
 * Redirige a /dapp después de conectarse exitosamente.
 */

import { useAccount, useConnect } from "wagmi"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { Wallet, ArrowRight, Shield, Zap, Lock, AlertCircle, Loader2 } from "lucide-react"

export default function ConnectPage() {
  const { address, isConnected } = useAccount()
  const { connect, connectors, isPending, error } = useConnect()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  useEffect(() => {
    if (isConnected && address) {
      console.log("[v0] Connected successfully, redirecting to /dapp")
      router.push("/dapp")
    }
  }, [isConnected, address, router])

  useEffect(() => {
    if (error) {
      console.log("[v0] Connection error:", error.message)
      setErrorMessage(error.message)
      setIsLoading(false)
    }
  }, [error])

  const handleConnect = async () => {
    try {
      setErrorMessage(null)
      setIsLoading(true)

      // Verificar si MetaMask está instalado
      if (!window.ethereum) {
        setErrorMessage("MetaMask no está instalado. Instálalo desde https://metamask.io")
        setIsLoading(false)
        return
      }

      // Conectar con el primer conector disponible (MetaMask)
      if (connectors.length > 0) {
        console.log("[v0] Attempting to connect with connector:", connectors[0].name)
        connect({ connector: connectors[0] })
      } else {
        setErrorMessage("No se encontraron conectores disponibles.")
        setIsLoading(false)
      }
    } catch (err) {
      console.log("[v0] Connection error:", err)
      setErrorMessage("Error al conectar. Por favor, intenta de nuevo.")
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-950 via-purple-900 to-fuchsia-900 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center">
              <Wallet className="w-8 h-8 text-white" />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-white mb-2">Conecta tu Wallet</h1>
          <p className="text-white/70">Accede a la plataforma de Dinero Programable</p>
        </div>

        {/* Main Card */}
        <Card className="bg-white/10 backdrop-blur-md border-white/20 mb-6">
          <CardHeader>
            <CardTitle className="text-white">MetaMask</CardTitle>
            <CardDescription className="text-white/70">
              Conecta tu wallet de MetaMask para interactuar con los Smart Contracts
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Features */}
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <Shield className="w-5 h-5 text-cyan-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-white font-semibold text-sm">Seguro</p>
                  <p className="text-white/60 text-xs">Tu wallet nunca abandona tu dispositivo</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Zap className="w-5 h-5 text-cyan-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-white font-semibold text-sm">Rápido</p>
                  <p className="text-white/60 text-xs">Transacciones instantáneas en Sepolia</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Lock className="w-5 h-5 text-cyan-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-white font-semibold text-sm">Privado</p>
                  <p className="text-white/60 text-xs">Control total sobre tus datos</p>
                </div>
              </div>
            </div>

            {/* Error Message */}
            {errorMessage && (
              <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-4 flex gap-3">
                <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                <p className="text-red-200 text-sm">{errorMessage}</p>
              </div>
            )}

            {/* Connect Button */}
            <Button
              onClick={handleConnect}
              disabled={isLoading || isPending}
              size="lg"
              className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading || isPending ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Conectando...
                </>
              ) : (
                <>
                  <Wallet className="w-5 h-5 mr-2" />
                  Conectar MetaMask
                  <ArrowRight className="w-5 h-5 ml-2" />
                </>
              )}
            </Button>

            {/* Info */}
            <div className="bg-white/5 rounded-lg p-4 border border-white/10">
              <p className="text-white/70 text-sm">
                <span className="font-semibold text-white">Red:</span> Ethereum Sepolia (Testnet)
              </p>
              <p className="text-white/70 text-sm mt-2">
                <span className="font-semibold text-white">Nota:</span> Asegúrate de tener MetaMask instalado y estar en
                la red Sepolia
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Back Link */}
        <div className="text-center">
          <Button variant="ghost" onClick={() => router.push("/")} className="text-white/70 hover:text-white">
            Volver a inicio
          </Button>
        </div>
      </div>
    </div>
  )
}
