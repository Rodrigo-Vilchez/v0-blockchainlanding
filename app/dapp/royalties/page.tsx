"use client"

import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt, useWatchContractEvent } from "wagmi"
import { useEffect, useState } from "react"
import { parseUnits, formatUnits } from "viem"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Music, Users, Share2, Loader2, Plus, X, AlertCircle, Info, Eye, CheckCircle2 } from "lucide-react"
import { TransactionLink } from "@/components/transaction-link"
import { ROYALTY_DISTRIBUTOR_ABI, ROYALTY_DISTRIBUTOR_ADDRESS } from "@/lib/abi"
import { PAYMENT_TOKEN_ADDRESS, PAYMENT_TOKEN_ABI } from "@/lib/contracts"
import { useAutoApprove } from "@/hooks/useAutoApprove"
import { DAppHeader } from "@/components/dapp-header"

interface Beneficiary {
  address: string
  percentage: string // En basis points (10000 = 100%)
}

// Tipos para los datos del contrato
type PreviewDistributionTuple = readonly [
  readonly `0x${string}`[], // addresses
  readonly bigint[]          // amounts
]

export default function RoyaltiesPage() {
  const { address, status } = useAccount()

  // Estados para configurar beneficiarios
  const [workId, setWorkId] = useState("")
  const [beneficiaries, setBeneficiaries] = useState<Beneficiary[]>([
    { address: "", percentage: "" },
  ])

  // Estados para distribuir regalías
  const [distributionWorkId, setDistributionWorkId] = useState("")
  const [distributionAmount, setDistributionAmount] = useState("")
  const [txHash, setTxHash] = useState<string | undefined>()

  // Leer balance de tokens
  const { data: tokenBalance } = useReadContract({
    address: PAYMENT_TOKEN_ADDRESS,
    abi: PAYMENT_TOKEN_ABI,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  }) as { data: bigint | undefined }

  // Preview de distribución
  const { data: previewData } = useReadContract({
    address: ROYALTY_DISTRIBUTOR_ADDRESS,
    abi: ROYALTY_DISTRIBUTOR_ABI,
    functionName: "previewDistribution",
    args: distributionWorkId && distributionAmount
      ? [distributionWorkId, parseUnits(distributionAmount, 18)]
      : undefined,
    query: { enabled: !!(distributionWorkId && distributionAmount) },
  }) as { data: PreviewDistributionTuple | undefined }  // Hook para escribir contratos
  const { writeContractAsync, data: hash, isPending } = useWriteContract()

  // Auto-approve hook
  const { executeWithAutoApprove, isApproving } = useAutoApprove({
    spenderAddress: ROYALTY_DISTRIBUTOR_ADDRESS,
  })

  // Esperar confirmación de transacción
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  })

  // Event listeners
  useWatchContractEvent({
    address: ROYALTY_DISTRIBUTOR_ADDRESS,
    abi: ROYALTY_DISTRIBUTOR_ABI,
    eventName: "BeneficiariesUpdated",
    onLogs(logs) {
      console.log("[Royalties] BeneficiariesUpdated:", logs)
    },
  })

  useWatchContractEvent({
    address: ROYALTY_DISTRIBUTOR_ADDRESS,
    abi: ROYALTY_DISTRIBUTOR_ABI,
    eventName: "RoyaltiesDistributed",
    onLogs(logs) {
      console.log("[Royalties] RoyaltiesDistributed:", logs)
    },
  })

  // Actualizar hash cuando cambie
  useEffect(() => {
    if (hash) {
      setTxHash(hash)
    }
  }, [hash])

  // Agregar beneficiario
  const addBeneficiary = () => {
    setBeneficiaries([...beneficiaries, { address: "", percentage: "" }])
  }

  // Remover beneficiario
  const removeBeneficiary = (index: number) => {
    if (beneficiaries.length > 1) {
      setBeneficiaries(beneficiaries.filter((_, i) => i !== index))
    }
  }

  // Actualizar beneficiario
  const updateBeneficiary = (index: number, field: "address" | "percentage", value: string) => {
    const updated = [...beneficiaries]
    updated[index][field] = value
    setBeneficiaries(updated)
  }

  // Configurar beneficiarios
  const handleSetBeneficiaries = async () => {
    if (!workId || beneficiaries.some((b) => !b.address || !b.percentage)) {
      return
    }

    try {
      const addresses = beneficiaries.map((b) => b.address as `0x${string}`)
      const percentages = beneficiaries.map((b) => BigInt(b.percentage))

      const txHash = await writeContractAsync({
        address: ROYALTY_DISTRIBUTOR_ADDRESS,
        abi: ROYALTY_DISTRIBUTOR_ABI,
        functionName: "setBeneficiaries",
        args: [workId, addresses, percentages],
      })
      setTxHash(txHash)
      console.log("[Royalties] Beneficiarios configurados:", txHash)
    } catch (error: any) {
      console.error("[Royalties] Error setting beneficiaries:", error)
    }
  }

  // Distribuir regalías con auto-approve
  const handleDistributeRoyalties = async () => {
    if (!distributionWorkId || !distributionAmount) return

    try {
      const amount = parseUnits(distributionAmount, 18)

      const txHash = await executeWithAutoApprove(amount, async () => {
        return await writeContractAsync({
          address: ROYALTY_DISTRIBUTOR_ADDRESS,
          abi: ROYALTY_DISTRIBUTOR_ABI,
          functionName: "distributeRoyalties",
          args: [distributionWorkId, PAYMENT_TOKEN_ADDRESS, amount],
        })
      })
      if (txHash) {
        setTxHash(txHash)
        console.log("[Royalties] Regalías distribuidas:", txHash)
      }
    } catch (error: any) {
      console.error("[Royalties] Error distributing royalties:", error)
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
              <AlertCircle className="w-12 h-12 mx-auto mb-4 text-violet-400" />
              <h3 className="text-xl font-semibold text-white mb-2">Wallet No Conectada</h3>
              <p className="text-white/70 mb-4">
                Por favor conecta tu wallet para usar el distribuidor de regalías.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  const totalPercentage = beneficiaries.reduce((sum, b) => sum + (parseInt(b.percentage) || 0), 0)

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
              <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
                <Music className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white">Royalty Distributor</h1>
                <p className="text-white/70">Distribuye regalías automáticamente entre beneficiarios</p>
              </div>
            </div>
          </div>

          {/* Transaction Status */}
          {isConfirming && (
            <Alert className="bg-blue-500/20 border-blue-500/50 text-blue-300">
              <Loader2 className="h-4 w-4 animate-spin" />
              <AlertDescription>Confirmando transacción en blockchain...</AlertDescription>
            </Alert>
          )}

          {isSuccess && txHash && (
            <Alert className="bg-green-500/20 border-green-500/50 text-green-300">
              <CheckCircle2 className="h-4 w-4" />
              <AlertDescription className="flex items-center justify-between">
                <span>¡Transacción exitosa!</span>
                <TransactionLink hash={txHash} />
              </AlertDescription>
            </Alert>
          )}

          {/* Set Beneficiaries */}
          <Card className="bg-white/10 backdrop-blur-md border-white/20">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Users className="w-5 h-5" />
                Configurar Beneficiarios
              </CardTitle>
              <CardDescription className="text-white/70">
                Define quiénes recibirán las regalías de una obra
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="workId" className="text-white">ID de la Obra</Label>
                <Input
                  id="workId"
                  type="text"
                  placeholder="cancion-demo-001"
                  value={workId}
                  onChange={(e) => setWorkId(e.target.value)}
                  className="bg-white/5 border-white/10 text-white placeholder:text-white/40"
                />
              </div>

              <div className="space-y-3">
                <Label className="text-white">Beneficiarios (basis points: 10000 = 100%)</Label>
                {beneficiaries.map((beneficiary, index) => (
                  <div key={index} className="flex gap-2">
                    <Input
                      type="text"
                      placeholder="0x..."
                      value={beneficiary.address}
                      onChange={(e) => updateBeneficiary(index, "address", e.target.value)}
                      className="flex-1 bg-white/5 border-white/10 text-white placeholder:text-white/40"
                    />
                    <Input
                      type="number"
                      placeholder="5000"
                      value={beneficiary.percentage}
                      onChange={(e) => updateBeneficiary(index, "percentage", e.target.value)}
                      className="w-32 bg-white/5 border-white/10 text-white placeholder:text-white/40"
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => removeBeneficiary(index)}
                      disabled={beneficiaries.length === 1}
                      className="border-white/10 text-white/70 hover:bg-red-500/20 hover:text-red-400"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ))}

                <Button
                  variant="outline"
                  onClick={addBeneficiary}
                  className="w-full border-white/20 text-white hover:bg-white/10"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Agregar Beneficiario
                </Button>

                <div className={`text-sm text-center p-2 rounded-lg ${totalPercentage === 10000
                  ? "bg-green-500/20 text-green-300"
                  : "bg-orange-500/20 text-orange-300"
                  }`}>
                  Total: {totalPercentage} bp ({(totalPercentage / 100).toFixed(2)}%)
                  {totalPercentage === 10000 ? " ✓" : " (debe ser 10000)"}
                </div>
              </div>

              <Button
                onClick={handleSetBeneficiaries}
                disabled={
                  !workId ||
                  totalPercentage !== 10000 ||
                  beneficiaries.some((b) => !b.address || !b.percentage) ||
                  isPending ||
                  isConfirming
                }
                className="w-full bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white disabled:opacity-50"
              >
                {isPending || isConfirming ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Configurando...
                  </>
                ) : (
                  <>
                    <Users className="w-4 h-4 mr-2" />
                    Configurar Beneficiarios
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Distribute Royalties */}
          <Card className="bg-white/10 backdrop-blur-md border-white/20">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Share2 className="w-5 h-5" />
                Distribuir Regalías
              </CardTitle>
              <CardDescription className="text-white/70">
                Distribuye tokens entre los beneficiarios configurados
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="distWorkId" className="text-white">ID de la Obra</Label>
                <Input
                  id="distWorkId"
                  type="text"
                  placeholder="cancion-demo-001 (usa 'default' para probar)"
                  value={distributionWorkId}
                  onChange={(e) => setDistributionWorkId(e.target.value)}
                  className="bg-white/5 border-white/10 text-white placeholder:text-white/40"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="distAmount" className="text-white">Cantidad (PMT)</Label>
                <Input
                  id="distAmount"
                  type="number"
                  placeholder="1000"
                  value={distributionAmount}
                  onChange={(e) => setDistributionAmount(e.target.value)}
                  className="bg-white/5 border-white/10 text-white placeholder:text-white/40"
                />
                {tokenBalance !== undefined && tokenBalance > BigInt(0) && (
                  <p className="text-white/60 text-xs">
                    Balance: {formatUnits(tokenBalance, 18)} PMT
                  </p>
                )}
              </div>

              {/* Preview */}
              {previewData !== undefined && (
                <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <Eye className="w-4 h-4 text-blue-300" />
                    <p className="text-blue-300 text-sm font-semibold">Vista previa de distribución:</p>
                  </div>
                  <div className="space-y-1">
                    {previewData[0].map((recipient, i) => (
                      <div key={i} className="text-blue-200 text-xs flex justify-between">
                        <span>{recipient.slice(0, 6)}...{recipient.slice(-4)}</span>
                        <span>{formatUnits(previewData[1][i], 18)} PMT</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-3">
                <p className="text-green-300 text-sm">
                  <span className="font-semibold">✓ Aprobación automática:</span> Los tokens se aprobarán automáticamente si es necesario.
                </p>
              </div>

              <Button
                onClick={handleDistributeRoyalties}
                disabled={!distributionWorkId || !distributionAmount || isPending || isConfirming || isApproving}
                className="w-full bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white disabled:opacity-50"
              >
                {isApproving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Aprobando tokens...
                  </>
                ) : isPending || isConfirming ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Distribuyendo...
                  </>
                ) : (
                  <>
                    <Share2 className="w-4 h-4 mr-2" />
                    Distribuir Regalías
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Info Card */}
          <div className="bg-white/5 backdrop-blur-md rounded-xl p-6 border border-white/10">
            <div className="flex items-center gap-2 mb-3">
              <Info className="w-5 h-5 text-violet-400" />
              <h3 className="text-white font-semibold">¿Cómo funciona?</h3>
            </div>
            <ul className="space-y-2 text-white/70 text-sm">
              <li className="flex items-start gap-2">
                <span className="text-violet-400 mt-1">•</span>
                <span>Los porcentajes se definen en <strong>basis points</strong>: 10000 = 100%, 5000 = 50%, 2500 = 25%</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-violet-400 mt-1">•</span>
                <span>Los porcentajes deben sumar <strong>exactamente 10000</strong> para evitar fondos bloqueados</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-violet-400 mt-1">•</span>
                <span>Hay un workId <strong>"default"</strong> configurado al 100% para ti (úsalo para probar)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-violet-400 mt-1">•</span>
                <span>El contrato distribuye automáticamente según los porcentajes configurados</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-violet-400 mt-1">•</span>
                <span>Solo acepta tokens ERC20 (el contrato rechaza ETH)</span>
              </li>
            </ul>
          </div>
        </div>
      </main>
    </div>
  )
}