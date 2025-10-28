"use client"

import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt, useBlockNumber, useWatchContractEvent } from "wagmi"
import { useState, useEffect } from "react"
import { parseUnits, formatUnits } from "viem"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Gift, Coins, TrendingUp, Loader2, CheckCircle2, AlertTriangle, AlertCircle, Sparkles, History, Info, ExternalLink } from "lucide-react"
import { TransactionLink } from "@/components/transaction-link"
import { CASHBACK_REWARDS_ABI, CASHBACK_REWARDS_ADDRESS } from "@/lib/abi"
import { PAYMENT_TOKEN_ADDRESS, PAYMENT_TOKEN_ABI } from "@/lib/contracts"
import { useAutoApprove } from "@/hooks/useAutoApprove"
import { DAppHeader } from "@/components/dapp-header"

interface CashbackEvent {
  user: string
  amount: string
  pointsEarned: string
  timestamp: number
  txHash: string
}

interface RedeemEvent {
  user: string
  points: string
  amount: string
  timestamp: number
  txHash: string
}

export default function CashbackPage() {
  const { address, status } = useAccount()

  // Estados para formularios
  const [paymentAmount, setPaymentAmount] = useState("")
  const [recipientAddress, setRecipientAddress] = useState("")
  const [redeemAmount, setRedeemAmount] = useState("")
  const [txHash, setTxHash] = useState<string | undefined>()
  const [lastCashbackEarned, setLastCashbackEarned] = useState<string | null>(null)
  const [lastPointsEarned, setLastPointsEarned] = useState<string | null>(null)
  const [recentEvents, setRecentEvents] = useState<(CashbackEvent | RedeemEvent)[]>([])
  const [showHistory, setShowHistory] = useState(false)

  // Auto-approve hook
  const { executeWithAutoApprove, isApproving } = useAutoApprove({
    spenderAddress: CASHBACK_REWARDS_ADDRESS,
  })

  // Leer balance de tokens (solo cuando hay address)
  const { data: tokenBalance, refetch: refetchBalance } = useReadContract({
    address: PAYMENT_TOKEN_ADDRESS,
    abi: PAYMENT_TOKEN_ABI,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  })

  // Leer puntos del usuario (solo cuando hay address)
  const { data: userPoints, refetch: refetchPoints } = useReadContract({
    address: CASHBACK_REWARDS_ADDRESS,
    abi: CASHBACK_REWARDS_ABI,
    functionName: "userPoints",
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  })

  // Leer configuración de recompensas
  const { data: rewardConfig } = useReadContract({
    address: CASHBACK_REWARDS_ADDRESS,
    abi: CASHBACK_REWARDS_ABI,
    functionName: "rewardConfig",
  })

  // Escuchar eventos de Cashback
  useWatchContractEvent({
    address: CASHBACK_REWARDS_ADDRESS,
    abi: CASHBACK_REWARDS_ABI,
    eventName: "CashbackEarned",
    onLogs(logs: any[]) {
      logs.forEach((log: any) => {
        if (log.args?.user?.toLowerCase() === address?.toLowerCase()) {
          const cashbackAmount = formatUnits(log.args.amount as bigint, 18)
          const points = (log.args.pointsEarned as bigint).toString()
          setLastCashbackEarned(cashbackAmount)
          setLastPointsEarned(points)

          // Agregar al historial
          setRecentEvents(prev => [{
            user: log.args.user as string,
            amount: cashbackAmount,
            pointsEarned: points,
            timestamp: Date.now(),
            txHash: log.transactionHash || ""
          } as CashbackEvent, ...prev.slice(0, 4)])

          console.log(`[Cashback] Ganaste ${cashbackAmount} PMT de cashback y ${points} puntos!`)
        }
      })
    },
  })

  // Escuchar eventos de Redención
  useWatchContractEvent({
    address: CASHBACK_REWARDS_ADDRESS,
    abi: CASHBACK_REWARDS_ABI,
    eventName: "PointsRedeemed",
    onLogs(logs: any[]) {
      logs.forEach((log: any) => {
        if (log.args?.user?.toLowerCase() === address?.toLowerCase()) {
          const points = (log.args.points as bigint).toString()
          const amount = formatUnits(log.args.amount as bigint, 18)

          // Agregar al historial
          setRecentEvents(prev => [{
            user: log.args.user as string,
            points,
            amount,
            timestamp: Date.now(),
            txHash: log.transactionHash || ""
          } as RedeemEvent, ...prev.slice(0, 4)])

          console.log(`[Cashback] Canjeaste ${points} puntos por ${amount} PMT!`)
        }
      })
    },
  })  // Hook para escribir contratos
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
      // Limpiar formularios después del éxito
      setTimeout(() => {
        setPaymentAmount("")
        setRecipientAddress("")
        setRedeemAmount("")
      }, 2000)
    }
  }, [isSuccess, refetchBalance, refetchPoints])

  // Calcular información de recompensas
  const calculateRewards = (amount: string) => {
    if (!amount || !rewardConfig) return null

    try {
      const amountBigInt = parseUnits(amount, 18)
      const cashbackRate = (rewardConfig as any)[1]
      const pointsRate = (rewardConfig as any)[2]

      const cashbackAmount = (amountBigInt * BigInt(cashbackRate)) / BigInt(10000)
      const pointsEarned = (amountBigInt * BigInt(pointsRate)) / BigInt(10 ** 18)

      return {
        cashback: formatUnits(cashbackAmount, 18),
        points: pointsEarned.toString()
      }
    } catch {
      return null
    }
  }

  // Calcular tokens por redención de puntos
  // Según el contrato: tokenAmount = (points * 10^18) / pointsRate
  // Con pointsRate = 100: 100 puntos = 1 token
  const calculateTokensFromPoints = (points: string) => {
    if (!points || !rewardConfig) return null

    try {
      const pointsBigInt = BigInt(points)
      const pointsRate = (rewardConfig as any)[2]

      // Usar la misma fórmula del contrato
      const tokenAmount = (pointsBigInt * BigInt(10 ** 18)) / BigInt(pointsRate)
      return formatUnits(tokenAmount, 18)
    } catch {
      return null
    }
  }

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
      // Enviar los puntos directamente al contrato (sin dividir)
      // El contrato calculará: tokenAmount = (points * 10^18) / pointsRate
      const pointsToRedeem = BigInt(redeemAmount)

      console.log(`[Cashback] Canjeando ${redeemAmount} puntos`)

      const txHash = await writeContractAsync({
        address: CASHBACK_REWARDS_ADDRESS,
        abi: CASHBACK_REWARDS_ABI,
        functionName: "redeemPoints",
        args: [pointsToRedeem],
        gas: BigInt(150000), // Gas explícito
      })
      setTxHash(txHash)
      console.log("[Cashback] Puntos canjeados:", txHash)
    } catch (error: any) {
      console.error("[Cashback] Error redeeming points:", error)
    }
  }

  // Return temprano si no está conectado
  if (status !== 'connected') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-950 via-purple-900 to-fuchsia-900">
        <DAppHeader />
        <div className="flex items-center justify-center min-h-[80vh]">
          <Card className="bg-white/10 backdrop-blur-md border-white/20 max-w-md">
            <CardContent className="p-8 text-center">
              <AlertCircle className="w-12 h-12 mx-auto mb-4 text-pink-400" />
              <h3 className="text-xl font-semibold text-white mb-2">Wallet No Conectada</h3>
              <p className="text-white/70 mb-4">
                Por favor conecta tu wallet para usar el sistema de cashback.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  const formattedBalance = tokenBalance ? formatUnits(tokenBalance as bigint, 18) : "0"
  const formattedPoints = userPoints ? (userPoints as bigint).toString() : "0"
  const cashbackRate = rewardConfig ? (rewardConfig as any)[1].toString() : "0"
  const pointsRate = rewardConfig ? (rewardConfig as any)[2].toString() : "0"
  const minPurchase = rewardConfig ? formatUnits((rewardConfig as any)[3] as bigint, 18) : "0"
  const isRewardActive = rewardConfig ? (rewardConfig as any)[0] : false

  const estimatedRewards = calculateRewards(paymentAmount)
  const estimatedTokens = calculateTokensFromPoints(redeemAmount)

  // Si llegamos aquí, el usuario está conectado
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
                  {(parseFloat(cashbackRate) / 100).toFixed(1)}% / {pointsRate}pts
                </CardTitle>
              </CardHeader>
            </Card>
          </div>

          {/* Status Alert */}
          {!isRewardActive && (
            <Alert className="bg-orange-500/10 border-orange-500/50">
              <AlertTriangle className="h-4 w-4 text-orange-400" />
              <AlertDescription className="text-orange-300">
                El programa de recompensas está actualmente inactivo.
              </AlertDescription>
            </Alert>
          )}

          {/* Cashback Success Banner */}
          {lastCashbackEarned && lastPointsEarned && (
            <div className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-500/50 rounded-xl p-4 animate-in fade-in slide-in-from-top-2 duration-500">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0">
                  <Sparkles className="w-5 h-5 text-green-400" />
                </div>
                <div className="flex-1">
                  <h4 className="text-white font-semibold mb-1">¡Recompensa Ganada!</h4>
                  <p className="text-green-300 text-sm mb-2">
                    Ganaste <span className="font-bold">{parseFloat(lastCashbackEarned).toFixed(4)} PMT</span> de cashback
                    y <span className="font-bold">{lastPointsEarned} puntos</span>
                  </p>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setLastCashbackEarned(null)}
                    className="text-xs h-7 border-green-500/30 text-green-400 hover:bg-green-500/10"
                  >
                    Entendido
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Recent Activity */}
          {recentEvents.length > 0 && (
            <Card className="bg-white/5 backdrop-blur-md border-white/10">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-white flex items-center gap-2">
                    <History className="w-5 h-5" />
                    Actividad Reciente
                  </CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowHistory(!showHistory)}
                    className="text-white/70 hover:text-white"
                  >
                    {showHistory ? "Ocultar" : "Ver más"}
                  </Button>
                </div>
              </CardHeader>
              {showHistory && (
                <CardContent className="space-y-2">
                  {recentEvents.map((event, idx) => (
                    <div key={idx} className="bg-white/5 rounded-lg p-3 text-sm">
                      {"pointsEarned" in event ? (
                        <>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-green-400 font-medium">Cashback Ganado</span>
                            <span className="text-white/50 text-xs">
                              {new Date(event.timestamp).toLocaleTimeString()}
                            </span>
                          </div>
                          <div className="text-white/70 mb-2">
                            +{parseFloat(event.amount).toFixed(4)} PMT • {event.pointsEarned} puntos
                          </div>
                          {event.txHash && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => window.open(`https://sepolia.etherscan.io/tx/${event.txHash}`, "_blank")}
                              className="h-6 text-xs text-green-400/70 hover:text-green-400 hover:bg-green-500/10 p-0"
                            >
                              Ver en blockchain →
                            </Button>
                          )}
                        </>
                      ) : (
                        <>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-cyan-400 font-medium">Puntos Canjeados</span>
                            <span className="text-white/50 text-xs">
                              {new Date(event.timestamp).toLocaleTimeString()}
                            </span>
                          </div>
                          <div className="text-white/70 mb-2">
                            -{event.points} puntos → +{parseFloat(event.amount).toFixed(4)} PMT
                          </div>
                          {event.txHash && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => window.open(`https://sepolia.etherscan.io/tx/${event.txHash}`, "_blank")}
                              className="h-6 text-xs text-cyan-400/70 hover:text-cyan-400 hover:bg-cyan-500/10 p-0"
                            >
                              Ver en blockchain →
                            </Button>
                          )}
                        </>
                      )}
                    </div>
                  ))}
                </CardContent>
              )}
            </Card>
          )}

          {/* Transaction Status */}
          {txHash && (
            <div className="space-y-3">
              {isConfirming && (
                <div className="bg-blue-500/20 border border-blue-500/50 rounded-lg p-4">
                  <div className="flex items-center gap-2 text-blue-400 mb-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span className="font-semibold">Confirmando transacción...</span>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <code className="text-xs text-white/70 truncate flex-1">{txHash}</code>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(`https://sepolia.etherscan.io/tx/${txHash}`, "_blank")}
                      className="border-blue-500/50 text-blue-400 hover:bg-blue-500/10 flex-shrink-0 text-xs h-7"
                    >
                      Ver en Etherscan
                    </Button>
                  </div>
                </div>
              )}

              {isSuccess && (
                <TransactionLink hash={txHash} />
              )}
            </div>
          )}

          {/* Process Payment */}
          <Card className="bg-white/10 backdrop-blur-md border-white/20">
            <CardHeader>
              <CardTitle className="text-white">Realizar Pago con Cashback</CardTitle>
              <CardDescription className="text-white/70">
                Paga tokens y recibe puntos de recompensa automáticamente
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Info sobre compra mínima */}
              <Alert className="bg-blue-500/10 border-blue-500/30">
                <Info className="h-4 w-4 text-blue-400" />
                <AlertDescription className="text-blue-300 text-sm">
                  Compra mínima: <span className="font-semibold">{parseFloat(minPurchase).toFixed(2)} PMT</span>
                  {" • "}
                  Tasa de cashback: <span className="font-semibold">{(parseFloat(cashbackRate) / 100).toFixed(1)}%</span>
                  {" • "}
                  Puntos por token: <span className="font-semibold">{pointsRate}</span>
                </AlertDescription>
              </Alert>

              <div className="space-y-2">
                <Label htmlFor="amount" className="text-white">Cantidad (PMT)</Label>
                <Input
                  id="amount"
                  type="number"
                  placeholder={`Mínimo ${parseFloat(minPurchase).toFixed(2)}`}
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  className="bg-white/5 border-white/10 text-white placeholder:text-white/40"
                />
                {/* Estimación de recompensas */}
                {estimatedRewards && (
                  <div className="bg-gradient-to-r from-pink-500/10 to-orange-500/10 rounded-lg p-3 border border-pink-500/20">
                    <div className="flex items-center gap-2 text-sm">
                      <Sparkles className="w-4 h-4 text-pink-400" />
                      <span className="text-white/90">
                        Ganarás: <span className="font-semibold text-pink-400">{parseFloat(estimatedRewards.cashback).toFixed(4)} PMT</span>
                        {" + "}
                        <span className="font-semibold text-orange-400">{estimatedRewards.points} puntos</span>
                      </span>
                    </div>
                  </div>
                )}
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
                disabled={!paymentAmount || !recipientAddress || isPending || isConfirming || isApproving || !isRewardActive}
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
                    Procesar Pago y Ganar Recompensas
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
                Convierte tus puntos acumulados en tokens
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Info sobre el ratio de conversión */}
              <Alert className="bg-purple-500/10 border-purple-500/30">
                <Info className="h-4 w-4 text-purple-400" />
                <AlertDescription className="text-purple-300 text-sm">
                  Ratio de conversión: <span className="font-semibold">100 puntos = 1 PMT</span> (1%)
                </AlertDescription>
              </Alert>

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
                <div className="flex items-center justify-between text-sm">
                  <p className="text-white/50">Puntos disponibles: <span className="text-white font-medium">{formattedPoints}</span></p>
                  {parseInt(formattedPoints) > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setRedeemAmount(formattedPoints)}
                      className="h-6 text-xs text-cyan-400 hover:text-cyan-300 hover:bg-cyan-500/10"
                    >
                      Usar todos
                    </Button>
                  )}
                </div>
                {/* Estimación de tokens */}
                {estimatedTokens && (
                  <div className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 rounded-lg p-3 border border-green-500/20">
                    <div className="flex items-center gap-2 text-sm">
                      <Coins className="w-4 h-4 text-green-400" />
                      <span className="text-white/90">
                        Recibirás: <span className="font-semibold text-green-400">{parseFloat(estimatedTokens).toFixed(4)} PMT</span>
                      </span>
                    </div>
                    <div className="text-xs text-green-400/70 mt-1">
                      {redeemAmount} puntos ÷ {pointsRate} = {parseFloat(estimatedTokens).toFixed(4)} tokens
                    </div>
                  </div>
                )}
              </div>

              <Button
                onClick={handleRedeemPoints}
                disabled={!redeemAmount || isPending || isConfirming || parseInt(redeemAmount) > parseInt(formattedPoints)}
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
                    Canjear Puntos por Tokens
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Info Card */}
          <div className="bg-white/5 backdrop-blur-md rounded-xl p-6 border border-white/10">
            <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
              <Info className="w-5 h-5 text-cyan-400" />
              ¿Cómo funciona el sistema de Cashback?
            </h3>
            <ul className="space-y-3 text-white/70 text-sm">
              <li className="flex items-start gap-2">
                <span className="text-cyan-400 mt-1">1.</span>
                <span>
                  <span className="font-medium text-white">Realiza pagos:</span> Usa tus tokens PMT para realizar pagos
                  (mínimo {parseFloat(minPurchase).toFixed(2)} PMT) y gana automáticamente {(parseFloat(cashbackRate) / 100).toFixed(1)}% de cashback
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-cyan-400 mt-1">2.</span>
                <span>
                  <span className="font-medium text-white">Acumula puntos:</span> Por cada token gastado, ganas {pointsRate} puntos
                  que se acumulan en tu cuenta
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-cyan-400 mt-1">3.</span>
                <span>
                  <span className="font-medium text-white">Canjea recompensas:</span> Convierte tus puntos en tokens en cualquier momento.
                  Por cada 100 puntos recibes 1 token (ratio 1:100). Los tokens se transfieren instantáneamente a tu wallet
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-cyan-400 mt-1">4.</span>
                <span>
                  <span className="font-medium text-white">Seguimiento blockchain:</span> Todas las transacciones son verificables
                  en la blockchain de Ethereum (Sepolia testnet)
                </span>
              </li>
            </ul>
            <div className="mt-4 p-3 bg-gradient-to-r from-pink-500/10 to-purple-500/10 rounded-lg border border-pink-500/20">
              <p className="text-sm text-pink-300">
                <span className="font-semibold">💡 Consejo:</span> Cuanto más uses el sistema, más puntos acumularás.
                ¡El cashback se retiene en el contrato y está disponible para futuras recompensas!
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
