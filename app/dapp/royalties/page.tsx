"use client"

import { useAccount, useWriteContract, useWaitForTransactionReceipt } from "wagmi"
import { useEffect, useState } from "react"
import { parseUnits } from "viem"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Music, Users, Share2, Loader2, Plus, X, AlertTriangle, AlertCircle } from "lucide-react"
import { TransactionLink } from "@/components/transaction-link"
import { ROYALTY_DISTRIBUTOR_ABI, ROYALTY_DISTRIBUTOR_ADDRESS } from "@/lib/abi"
import { PAYMENT_TOKEN_ADDRESS } from "@/lib/contracts"
import { useAutoApprove } from "@/hooks/useAutoApprove"
import { DAppHeader } from "@/components/dapp-header"

interface Beneficiary {
  address: string
  percentage: string
}

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

  // Hook para escribir contratos
  const { writeContractAsync, data: hash, isPending } = useWriteContract()

  // Auto-approve hook
  const { executeWithAutoApprove, isApproving } = useAutoApprove({
    spenderAddress: ROYALTY_DISTRIBUTOR_ADDRESS,
  })

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
        gas: BigInt(200000), // Gas explícito
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
          gas: BigInt(200000), // Gas explícito
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

          {/* Transaction Success */}
          {isSuccess && txHash && (
            <TransactionLink hash={txHash} />
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
                <Label className="text-white">Beneficiarios</Label>
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
                      placeholder="%"
                      value={beneficiary.percentage}
                      onChange={(e) => updateBeneficiary(index, "percentage", e.target.value)}
                      className="w-24 bg-white/5 border-white/10 text-white placeholder:text-white/40"
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

                <div className={`text-sm text-center p-2 rounded-lg ${totalPercentage === 100
                  ? "bg-green-500/20 text-green-300"
                  : "bg-orange-500/20 text-orange-300"
                  }`}>
                  Total: {totalPercentage}% {totalPercentage === 100 ? "✓" : "(debe ser 100%)"}
                </div>
              </div>

              <Button
                onClick={handleSetBeneficiaries}
                disabled={
                  !workId ||
                  totalPercentage !== 100 ||
                  beneficiaries.some((b) => !b.address || !b.percentage) ||
                  isPending ||
                  isConfirming
                }
                className="w-full bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white"
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
                  placeholder="cancion-demo-001"
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
              </div>

              <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-3">
                <p className="text-green-300 text-sm">
                  <span className="font-semibold">✓ Aprobación automática:</span> Los tokens se aprobarán automáticamente si es necesario.
                </p>
              </div>

              <Button
                onClick={handleDistributeRoyalties}
                disabled={!distributionWorkId || !distributionAmount || isPending || isConfirming || isApproving}
                className="w-full bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white"
              >
                {isApproving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Aprobando tokens...
                  </>
                ) : isPending || isConfirming ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Distribuyendo regalías...
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
            <h3 className="text-white font-semibold mb-3">¿Cómo funciona?</h3>
            <ul className="space-y-2 text-white/70 text-sm">
              <li className="flex items-start gap-2">
                <span className="text-violet-400 mt-1">•</span>
                <span>Configura los beneficiarios de una obra con sus respectivos porcentajes (deben sumar 100%)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-violet-400 mt-1">•</span>
                <span>Distribuye regalías y el contrato las dividirá automáticamente según los porcentajes</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-violet-400 mt-1">•</span>
                <span>Cada beneficiario recibe su parte directamente en su wallet</span>
              </li>
            </ul>
          </div>
        </div>
      </main>
    </div>
  )
}