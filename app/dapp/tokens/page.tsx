"use client"

import { useAccount, useReadContract, useWriteContract, useConfig } from "wagmi"
import { waitForTransactionReceipt } from "@wagmi/core"
import { useState } from "react"
import { formatEther, parseEther, isAddress } from "viem"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Coins, Send, Check, Loader2, Zap, AlertCircle, AlertTriangle } from "lucide-react"
import { TransactionLink } from "@/components/transaction-link"
import { NetworkAlert } from "@/components/network-alert"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { TOKEN_CONTRACT, ESCROW_CONTRACT } from "@/lib/contracts"
import { useNetworkCheck } from "@/hooks/useNetworkCheck"
import { DAppHeader } from "@/components/dapp-header"

export default function TokensPage() {
  const { address, status } = useAccount()
  const config = useConfig()
  const { isCorrectNetwork } = useNetworkCheck()

  // Estados
  const [transferTo, setTransferTo] = useState("")
  const [transferAmount, setTransferAmount] = useState("")
  const [approveAmount, setApproveAmount] = useState("")
  const [txHash, setTxHash] = useState<string | undefined>()
  const [error, setError] = useState<string | undefined>()
  const [isProcessing, setIsProcessing] = useState(false)

  // Leer balance (solo cuando hay address)
  const { data: balance, refetch: refetchBalance } = useReadContract({
    ...TOKEN_CONTRACT,
    functionName: "balanceOf",
    args: address ? [address as `0x${string}`] : undefined,
    query: { enabled: !!address },
  })

  // Leer allowance (solo cuando hay address)
  const { data: allowance, refetch: refetchAllowance } = useReadContract({
    ...TOKEN_CONTRACT,
    functionName: "allowance",
    args: address ? [address as `0x${string}`, ESCROW_CONTRACT.address] : undefined,
    query: { enabled: !!address },
  })

  // Hooks de escritura
  const { writeContractAsync } = useWriteContract()

  // Obtener tokens del faucet
  const handleFaucet = async () => {
    console.log("[Faucet Debug] Iniciando llamada al faucet")
    console.log("[Faucet Debug] Address:", address)
    console.log("[Faucet Debug] Status:", status)
    console.log("[Faucet Debug] isCorrectNetwork:", isCorrectNetwork)

    setError(undefined)
    setTxHash(undefined)
    setIsProcessing(true)

    if (!address) {
      const msg = "Por favor conecta tu wallet"
      console.error("[Faucet Debug]", msg)
      setError(msg)
      setIsProcessing(false)
      return
    }

    if (!isCorrectNetwork) {
      const msg = "Por favor cambia a la red Sepolia"
      console.error("[Faucet Debug]", msg)
      setError(msg)
      setIsProcessing(false)
      return
    }

    console.log("[Faucet Debug] Llamando a writeContractAsync con:")
    console.log("[Faucet Debug] Contract Address:", TOKEN_CONTRACT.address)
    console.log("[Faucet Debug] Function:", "faucet")

    try {
      const txHash = await writeContractAsync({
        address: TOKEN_CONTRACT.address,
        abi: TOKEN_CONTRACT.abi,
        functionName: "faucet",
        args: [],
        gas: BigInt(100000),
      })

      console.log("[Faucet Debug] ✓ Transacción enviada exitosamente!")
      console.log("[Faucet Debug] Hash:", txHash)
      console.log("[Faucet Debug] Verifica en: https://sepolia.etherscan.io/tx/" + txHash)
      setTxHash(txHash)

      console.log("[Faucet Debug] Esperando confirmación...")
      const receipt = await waitForTransactionReceipt(config, {
        hash: txHash,
        confirmations: 1,
      })

      console.log("[Faucet Debug] ✓ Transacción confirmada!", receipt)
      refetchBalance()
      refetchAllowance()

      setTimeout(() => {
        setTxHash(undefined)
      }, 5000)

      setIsProcessing(false)
    } catch (err: any) {
      console.error("[Faucet Debug] ✗ Error en la transacción:", err)
      console.error("[Faucet Debug] Error message:", err.message)

      let errorMsg = "Error al obtener tokens del faucet"
      if (err.message?.includes("User rejected") || err.message?.includes("User denied")) {
        errorMsg = "Transacción rechazada por el usuario"
      } else if (err.message?.includes("insufficient funds")) {
        errorMsg = "Fondos insuficientes para gas (necesitas ETH en Sepolia)"
      } else if (err.message?.includes("nonce")) {
        errorMsg = "Error de nonce. Intenta resetear tu cuenta en MetaMask"
      } else if (err.message) {
        errorMsg = err.message
      }

      setError(errorMsg)
      setIsProcessing(false)
    }
  }

  // Transferir tokens
  const handleTransfer = async () => {
    setError(undefined)
    setTxHash(undefined)
    setIsProcessing(true)

    if (!transferTo || !transferAmount) {
      setError("Por favor completa todos los campos")
      setIsProcessing(false)
      return
    }

    if (!isAddress(transferTo)) {
      setError("Dirección inválida")
      setIsProcessing(false)
      return
    }

    if (!isCorrectNetwork) {
      setError("Por favor cambia a la red Sepolia")
      setIsProcessing(false)
      return
    }

    const amount = parseEther(transferAmount)
    const currentBalance = (balance as bigint) || BigInt(0)

    if (amount > currentBalance) {
      setError(`Balance insuficiente. Tienes ${formatEther(currentBalance)} PMT`)
      setIsProcessing(false)
      return
    }

    try {
      const txHash = await writeContractAsync({
        ...TOKEN_CONTRACT,
        functionName: "transfer",
        args: [transferTo as `0x${string}`, amount],
        gas: BigInt(100000),
      })

      console.log("[Transfer] Transacción enviada:", txHash)
      setTxHash(txHash)

      const receipt = await waitForTransactionReceipt(config, {
        hash: txHash,
        confirmations: 1,
      })

      console.log("[Transfer] ✓ Transacción confirmada!", receipt)
      refetchBalance()
      refetchAllowance()

      setTransferTo("")
      setTransferAmount("")

      setTimeout(() => {
        setTxHash(undefined)
      }, 5000)

      setIsProcessing(false)
    } catch (err: any) {
      console.error("[Transfer Error]", err)
      let errorMsg = "Error al transferir tokens"
      if (err.message?.includes("insufficient funds")) {
        errorMsg = "Fondos insuficientes para gas (necesitas ETH en Sepolia)"
      } else if (err.message?.includes("nonce")) {
        errorMsg = "Error de nonce. Intenta resetear tu cuenta en MetaMask"
      } else if (err.message) {
        errorMsg = err.message
      }
      setError(errorMsg)
      setIsProcessing(false)
    }
  }

  // Aprobar tokens
  const handleApprove = async () => {
    setError(undefined)
    setTxHash(undefined)
    setIsProcessing(true)

    if (!approveAmount) {
      setError("Por favor ingresa una cantidad")
      setIsProcessing(false)
      return
    }

    if (!isCorrectNetwork) {
      setError("Por favor cambia a la red Sepolia")
      setIsProcessing(false)
      return
    }

    const amount = parseEther(approveAmount)
    const currentBalance = (balance as bigint) || BigInt(0)

    if (amount > currentBalance) {
      setError(`Balance insuficiente. Tienes ${formatEther(currentBalance)} PMT`)
      setIsProcessing(false)
      return
    }

    try {
      const txHash = await writeContractAsync({
        ...TOKEN_CONTRACT,
        functionName: "approve",
        args: [ESCROW_CONTRACT.address, amount],
        gas: BigInt(100000),
      })

      console.log("[Approve] Transacción enviada:", txHash)
      setTxHash(txHash)

      const receipt = await waitForTransactionReceipt(config, {
        hash: txHash,
        confirmations: 1,
      })

      console.log("[Approve] ✓ Transacción confirmada!", receipt)
      refetchBalance()
      refetchAllowance()

      setApproveAmount("")

      setTimeout(() => {
        setTxHash(undefined)
      }, 5000)

      setIsProcessing(false)
    } catch (err: any) {
      console.error("[Approve Error]", err)
      let errorMsg = "Error al aprobar tokens"
      if (err.message?.includes("insufficient funds")) {
        errorMsg = "Fondos insuficientes para gas (necesitas ETH en Sepolia)"
      } else if (err.message?.includes("nonce")) {
        errorMsg = "Error de nonce. Intenta resetear tu cuenta en MetaMask"
      } else if (err.message) {
        errorMsg = err.message
      }
      setError(errorMsg)
      setIsProcessing(false)
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
              <AlertCircle className="w-12 h-12 mx-auto mb-4 text-cyan-400" />
              <h3 className="text-xl font-semibold text-white mb-2">Wallet No Conectada</h3>
              <p className="text-white/70 mb-4">
                Por favor conecta tu wallet para gestionar tus tokens PMT.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  const displayBalance = balance ? formatEther(balance as bigint) : "0"
  const displayAllowance = allowance ? formatEther(allowance as bigint) : "0"

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
              <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center">
                <Coins className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white">Token ERC20</h1>
                <p className="text-white/70">Gestiona tus tokens PMT (Payment Token)</p>
              </div>
            </div>
          </div>

          {/* Network Alert */}
          <NetworkAlert />

          {/* Error Alert */}
          {error && (
            <Alert variant="error">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
                <AlertDescription>{error}</AlertDescription>
              </div>
            </Alert>
          )}

          {/* Transaction Link - Mostrar incluso mientras confirma */}
          {txHash && (
            <div className="space-y-2">
              {isProcessing && (
                <Alert variant="warning">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <AlertDescription>
                    Esperando confirmación de la blockchain... Si tarda más de 1 minuto, verifica el estado en Etherscan.
                  </AlertDescription>
                </Alert>
              )}
              <TransactionLink hash={txHash} />
            </div>
          )}

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
                disabled={isProcessing}
                className="w-full bg-gradient-to-r from-yellow-600 to-orange-600 hover:from-yellow-700 hover:to-orange-700 text-white"
              >
                {isProcessing ? (
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
                disabled={!transferTo || !transferAmount || isProcessing}
                className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Procesando...
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
                disabled={!approveAmount || isProcessing}
                className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Procesando...
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
