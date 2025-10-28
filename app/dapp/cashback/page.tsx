"use client"

import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from "wagmi"
import { useEffect, useState } from "react"
import { parseUnits, formatUnits } from "viem"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Gift, Coins, TrendingUp, Loader2, CheckCircle2 } from "lucide-react"
import { TransactionLink } from "@/components/transaction-link"
import { CASHBACK_REWARDS_ABI, CASHBACK_REWARDS_ADDRESS } from "@/lib/abi"
import { PAYMENT_TOKEN_ADDRESS, PAYMENT_TOKEN_ABI } from "@/lib/contracts"
import { useAutoApprove } from "@/hooks/useAutoApprove"
import { DAppHeader } from "@/components/dapp-header"

export default function CashbackPage() {
  const { address, isConnected } = useAccount()

  // Estados para formularios
  const [paymentAmount, setPaymentAmount] = useState("")
  const [recipientAddress, setRecipientAddress] = useState("")
  const [redeemAmount, setRedeemAmount] = useState("")
  const [txHash, setTxHash] = useState<string | undefined>()

  // Auto-approve hook
  const { executeWithAutoApprove, isApproving } = useAutoApprove({
    spenderAddress: CASHBACK_REWARDS_ADDRESS,
  })

  // Leer balance de tokens
  const { data: tokenBalance, refetch: refetchBalance } = useReadContract({
    address: PAYMENT_TOKEN_ADDRESS,
    abi: PAYMENT_TOKEN_ABI,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
  })

  // Leer puntos del usuario
  const { data: userPoints, refetch: refetchPoints } = useReadContract({
    address: CASHBACK_REWARDS_ADDRESS,
    abi: CASHBACK_REWARDS_ABI,
    functionName: "userPoints",
    args: address ? [address] : undefined,
  })

  // Leer configuración de recompensas
  const { data: rewardConfig } = useReadContract({
    address: CASHBACK_REWARDS_ADDRESS,
    abi: CASHBACK_REWARDS_ABI,
    functionName: "rewardConfig",
  })

  // Hook para escribir contratos
  const { writeContractAsync, data: hash, isPending } = useWriteContract()

  // Esperar confirmación de transacción
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
    timeout: 60_000, // 60 segundos timeout
    confirmations: 1, // Solo esperar 1 confirmación
  })

  // Actualizar hash cuando cambie
  useEffect(() => {
    if (hash) {
      setTxHash(hash)
    }
  }, [hash])

  // Refetch data cuando la transacción sea exitosa
  useEffect(() => {
    if (isSuccess) {
      refetchBalance()
      refetchPoints()
    }
  }, [isSuccess, refetchBalance, refetchPoints])

  // Procesar pago con auto-approve
  const handleProcessPayment = async () => {
    if (!paymentAmount || !recipientAddress) return

    try {
      const amount = parseUnits(paymentAmount, 18)

      const txHash = await executeWithAutoApprove(amount, async () => {
        return await writeContractAsync({
          address: CASHBACK_REWARDS_ADDRESS,
          abi: CASHBACK_REWARDS_ABI,
          functionName: "processPayment",
          args: [amount, recipientAddress as `0x${string}`],
          gas: BigInt(200000), // Gas explícito
        })
      })
      if (txHash) {
        setTxHash(txHash)
        console.log("[Cashback] Pago procesado:", txHash)
      }
    } catch (error: any) {
      console.error("[Cashback] Error processing payment:", error)
    }
  }

  // Canjear puntos
  const handleRedeemPoints = async () => {
    if (!redeemAmount) return

    try {
      const points = parseUnits(redeemAmount, 0) // Los puntos no tienen decimales
      const txHash = await writeContractAsync({
        address: CASHBACK_REWARDS_ADDRESS,
        abi: CASHBACK_REWARDS_ABI,
        functionName: "redeemPoints",
        args: [points],
        gas: BigInt(150000), // Gas explícito
      })
      setTxHash(txHash)
      console.log("[Cashback] Puntos canjeados:", txHash)
    } catch (error: any) {
      console.error("[Cashback] Error redeeming points:", error)
    }
  }

  if (!isConnected) return null

  const formattedBalance = tokenBalance ? formatUnits(tokenBalance as bigint, 18) : "0"
  const formattedPoints = userPoints ? (userPoints as bigint).toString() : "0"
  const cashbackRate = rewardConfig ? (rewardConfig as any)[1].toString() : "0"
  const pointsRate = rewardConfig ? (rewardConfig as any)[2].toString() : "0"

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-950 via-purple-900 to-fuchsia-900">
      <DAppHeader />

      {/* Main Content */}
      <main className="container mx-auto px-6 py-12">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Page Title */}
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-pink-500 to-orange-500 flex items-center justify-center">
                <Gift className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white">Cashback Rewards</h1>
                <p className="text-white/70">Gana puntos y cashback en tus pagos</p>
              </div>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="bg-white/5 backdrop-blur-md border-white/10">
              <CardHeader className="pb-3">
                <CardDescription className="text-white/70">Balance de Tokens</CardDescription>
                <CardTitle className="text-2xl text-white flex items-center gap-2">
                  <Coins className="w-5 h-5 text-cyan-400" />
                  {parseFloat(formattedBalance).toFixed(2)} PMT
                </CardTitle>
              </CardHeader>
            </Card>

            <Card className="bg-white/5 backdrop-blur-md border-white/10">
              <CardHeader className="pb-3">
                <CardDescription className="text-white/70">Puntos Acumulados</CardDescription>
                <CardTitle className="text-2xl text-white flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-green-400" />
                  {formattedPoints}
                </CardTitle>
              </CardHeader>
            </Card>

            <Card className="bg-white/5 backdrop-blur-md border-white/10">
              <CardHeader className="pb-3">
                <CardDescription className="text-white/70">Tasa de Recompensa</CardDescription>
                <CardTitle className="text-2xl text-white">
                  {cashbackRate}% / {pointsRate}pts
                </CardTitle>
              </CardHeader>
            </Card>
          </div>

          {/* Transaction Success */}
          {isSuccess && txHash && (
            <TransactionLink hash={txHash} />
          )}

          {/* Process Payment */}
          <Card className="bg-white/10 backdrop-blur-md border-white/20">
            <CardHeader>
              <CardTitle className="text-white">Realizar Pago con Cashback</CardTitle>
              <CardDescription className="text-white/70">
                Paga tokens y recibe puntos de recompensa
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="amount" className="text-white">Cantidad (PMT)</Label>
                <Input
                  id="amount"
                  type="number"
                  placeholder="100"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  className="bg-white/5 border-white/10 text-white placeholder:text-white/40"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="recipient" className="text-white">Dirección del Destinatario</Label>
                <Input
                  id="recipient"
                  type="text"
                  placeholder="0x..."
                  value={recipientAddress}
                  onChange={(e) => setRecipientAddress(e.target.value)}
                  className="bg-white/5 border-white/10 text-white placeholder:text-white/40"
                />
              </div>

              <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-3">
                <p className="text-green-300 text-sm">
                  <span className="font-semibold">✓ Aprobación automática:</span> Los tokens se aprobarán automáticamente si es necesario.
                </p>
              </div>

              <Button
                onClick={handleProcessPayment}
                disabled={!paymentAmount || !recipientAddress || isPending || isConfirming || isApproving}
                className="w-full bg-gradient-to-r from-pink-600 to-orange-600 hover:from-pink-700 hover:to-orange-700 text-white"
              >
                {isApproving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Aprobando tokens...
                  </>
                ) : isPending || isConfirming ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Procesando pago...
                  </>
                ) : (
                  <>
                    <Gift className="w-4 h-4 mr-2" />
                    Procesar Pago y Ganar Puntos
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Redeem Points */}
          <Card className="bg-white/10 backdrop-blur-md border-white/20">
            <CardHeader>
              <CardTitle className="text-white">Canjear Puntos</CardTitle>
              <CardDescription className="text-white/70">
                Convierte tus puntos en tokens
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="redeem" className="text-white">Cantidad de Puntos</Label>
                <Input
                  id="redeem"
                  type="number"
                  placeholder="100"
                  value={redeemAmount}
                  onChange={(e) => setRedeemAmount(e.target.value)}
                  className="bg-white/5 border-white/10 text-white placeholder:text-white/40"
                />
                <p className="text-white/50 text-sm">Puntos disponibles: {formattedPoints}</p>
              </div>

              <Button
                onClick={handleRedeemPoints}
                disabled={!redeemAmount || isPending || isConfirming}
                className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white"
              >
                {isPending || isConfirming ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Canjeando...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                    Canjear Puntos
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
                <span>Realiza pagos usando tus tokens PMT y gana puntos automáticamente</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-cyan-400 mt-1">•</span>
                <span>Los puntos se acumulan según la tasa configurada</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-cyan-400 mt-1">•</span>
                <span>Canjea tus puntos por tokens en cualquier momento</span>
              </li>
            </ul>
          </div>
        </div>
      </main>
    </div>
  )
}
