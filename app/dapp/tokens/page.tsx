"use client"

import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from "wagmi"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { formatEther, parseEther, isAddress } from "viem"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ArrowLeft, Coins, Send, Check, Loader2, Zap } from "lucide-react"
import { TransactionLink } from "@/components/transaction-link"
import { TOKEN_CONTRACT, ESCROW_CONTRACT } from "@/lib/contracts"

export default function TokensPage() {
  const { address, isConnected } = useAccount()
  const router = useRouter()

  // Estados
  const [transferTo, setTransferTo] = useState("")
  const [transferAmount, setTransferAmount] = useState("")
  const [approveAmount, setApproveAmount] = useState("")
  const [txHash, setTxHash] = useState<string | undefined>()

  // Leer balance
  const { data: balance, refetch: refetchBalance } = useReadContract({
    ...TOKEN_CONTRACT,
    functionName: "balanceOf",
    args: address ? [address as `0x${string}`] : undefined,
  })

  // Leer allowance
  const { data: allowance, refetch: refetchAllowance } = useReadContract({
    ...TOKEN_CONTRACT,
    functionName: "allowance",
    args: address ? [address as `0x${string}`, ESCROW_CONTRACT.address] : undefined,
  })

  // Hooks de escritura
  const { writeContract, data: hash, isPending } = useWriteContract()

  // Esperar confirmación
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  })

  // Actualizar hash
  useEffect(() => {
    if (hash) {
      setTxHash(hash)
    }
  }, [hash])

  // Refetch después de éxito
  useEffect(() => {
    if (isSuccess) {
      refetchBalance()
      refetchAllowance()
    }
  }, [isSuccess, refetchBalance, refetchAllowance])

  // Redirigir si no está conectado
  useEffect(() => {
    if (!isConnected) {
      router.push("/connect")
    }
  }, [isConnected, router])

  // Obtener tokens del faucet
  const handleFaucet = () => {
    writeContract({
      ...TOKEN_CONTRACT,
      functionName: "faucet",
    })
  }

  // Transferir tokens
  const handleTransfer = () => {
    if (!transferTo || !transferAmount) return
    if (!isAddress(transferTo)) return

    writeContract({
      ...TOKEN_CONTRACT,
      functionName: "transfer",
      args: [transferTo as `0x${string}`, parseEther(transferAmount)],
    })
  }

  // Aprobar tokens
  const handleApprove = () => {
    if (!approveAmount) return

    writeContract({
      ...TOKEN_CONTRACT,
      functionName: "approve",
      args: [ESCROW_CONTRACT.address, parseEther(approveAmount)],
    })
  }

  if (!isConnected) return null

  const displayBalance = balance ? formatEther(balance as bigint) : "0"
  const displayAllowance = allowance ? formatEther(allowance as bigint) : "0"

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-950 via-purple-900 to-fuchsia-900">
      {/* Header */}
      <header className="border-b border-white/10 bg-white/5 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4">
          <Button
            variant="ghost"
            onClick={() => router.push("/dapp")}
            className="text-white/70 hover:text-white hover:bg-white/10"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver al Dashboard
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-12">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Page Title */}
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center">
                <Coins className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white">Token ERC20</h1>
                <p className="text-white/70">Gestiona tus tokens PMT (Payment Token)</p>
              </div>
            </div>
          </div>

          {/* Stats Card */}
          <Card className="bg-white/5 backdrop-blur-md border-white/10">
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                  <p className="text-white/70 text-sm mb-1">Balance Total</p>
                  <p className="text-3xl font-bold text-white">{parseFloat(displayBalance).toFixed(2)} PMT</p>
                </div>
                <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                  <p className="text-white/70 text-sm mb-1">Aprobado para Escrow</p>
                  <p className="text-3xl font-bold text-white">{parseFloat(displayAllowance).toFixed(2)} PMT</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Transaction Success */}
          {isSuccess && txHash && (
            <TransactionLink hash={txHash} />
          )}

          {/* Faucet */}
          <Card className="bg-white/10 backdrop-blur-md border-white/20">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Zap className="w-5 h-5 text-yellow-400" />
                Obtener Tokens de Prueba
              </CardTitle>
              <CardDescription className="text-white/70">
                Solicita 1000 PMT gratis del faucet
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                onClick={handleFaucet}
                disabled={isPending || isConfirming}
                className="w-full bg-gradient-to-r from-yellow-600 to-orange-600 hover:from-yellow-700 hover:to-orange-700 text-white"
              >
                {isPending || isConfirming ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Procesando...
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4 mr-2" />
                    Obtener 1000 PMT
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Transfer */}
          <Card className="bg-white/10 backdrop-blur-md border-white/20">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Send className="w-5 h-5 text-purple-400" />
                Transferir Tokens
              </CardTitle>
              <CardDescription className="text-white/70">
                Envía tokens a otra dirección
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="transferTo" className="text-white">Dirección Destino</Label>
                <Input
                  id="transferTo"
                  type="text"
                  placeholder="0x..."
                  value={transferTo}
                  onChange={(e) => setTransferTo(e.target.value)}
                  className="bg-white/5 border-white/10 text-white placeholder:text-white/40"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="transferAmount" className="text-white">Cantidad (PMT)</Label>
                <Input
                  id="transferAmount"
                  type="number"
                  placeholder="100"
                  value={transferAmount}
                  onChange={(e) => setTransferAmount(e.target.value)}
                  className="bg-white/5 border-white/10 text-white placeholder:text-white/40"
                />
              </div>

              <Button
                onClick={handleTransfer}
                disabled={!transferTo || !transferAmount || isPending || isConfirming}
                className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white"
              >
                {isPending || isConfirming ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Transfiriendo...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Transferir
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Approve */}
          <Card className="bg-white/10 backdrop-blur-md border-white/20">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Check className="w-5 h-5 text-green-400" />
                Aprobar para Escrow
              </CardTitle>
              <CardDescription className="text-white/70">
                Permite que el contrato de Escrow use tus tokens
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-cyan-500/10 border border-cyan-500/30 rounded-lg p-3">
                <p className="text-cyan-300 text-sm">
                  <span className="font-semibold">Nota:</span> Debes aprobar tokens antes de crear órdenes de pago escalonado.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="approveAmount" className="text-white">Cantidad a Aprobar (PMT)</Label>
                <Input
                  id="approveAmount"
                  type="number"
                  placeholder="500"
                  value={approveAmount}
                  onChange={(e) => setApproveAmount(e.target.value)}
                  className="bg-white/5 border-white/10 text-white placeholder:text-white/40"
                />
              </div>

              <Button
                onClick={handleApprove}
                disabled={!approveAmount || isPending || isConfirming}
                className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white"
              >
                {isPending || isConfirming ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Aprobando...
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4 mr-2" />
                    Aprobar
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Info Card */}
          <div className="bg-white/5 backdrop-blur-md rounded-xl p-6 border border-white/10">
            <h3 className="text-white font-semibold mb-3">¿Cómo funciona?</h3>
            <ul className="space-y-2 text-white/70 text-sm">
              <li className="flex items-start gap-2">
                <span className="text-cyan-400 mt-1">•</span>
                <span>Obtén tokens gratis del faucet para probar la plataforma</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-cyan-400 mt-1">•</span>
                <span>Transfiere tokens a cualquier dirección de Ethereum</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-cyan-400 mt-1">•</span>
                <span>Aprueba tokens para que otros contratos (como Escrow) puedan usarlos</span>
              </li>
            </ul>
          </div>
        </div>
      </main>
    </div>
  )
}
