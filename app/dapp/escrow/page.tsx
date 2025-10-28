"use client"

import { useAccount, useReadContract, useWriteContract, useConfig } from "wagmi"
import { waitForTransactionReceipt } from "@wagmi/core"
import { useState, type ReactNode } from "react"
import { formatEther, parseEther, isAddress, decodeEventLog } from "viem"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { FileText, Package, CheckCircle, AlertTriangle, RefreshCw, Loader2, Search, AlertCircle } from "lucide-react"
import { TransactionLink } from "@/components/transaction-link"
import { NetworkAlert } from "@/components/network-alert"
import { ESCROW_CONTRACT, TOKEN_CONTRACT } from "@/lib/contracts"
import { useNetworkCheck } from "@/hooks/useNetworkCheck"
import { DAppHeader } from "@/components/dapp-header"

// Tipo para el tuple que retorna getOrder
type OrderTuple = readonly [
  bigint,        // orderId
  `0x${string}`, // customer
  `0x${string}`, // provider
  bigint,        // totalAmount
  bigint,        // firstPayment
  bigint,        // secondPayment
  number,        // status
  boolean,       // firstPaymentReleased
  boolean        // secondPaymentReleased
]

export default function EscrowPage() {
  const { address, status: connectionStatus } = useAccount()
  const config = useConfig()
  const { isCorrectNetwork } = useNetworkCheck()

  // Estados para crear orden
  const [seller, setSeller] = useState("")
  const [amount, setAmount] = useState("")
  const [orderId, setOrderId] = useState("")
  const [createdOrderId, setCreatedOrderId] = useState<string | undefined>()
  const [txHash, setTxHash] = useState<string | undefined>()
  const [error, setError] = useState<string | undefined>()
  const [isProcessing, setIsProcessing] = useState(false)

  // Hooks de escritura
  const { writeContractAsync } = useWriteContract()

  // Leer orden con tipo explícito
  const { data: orderData, refetch: refetchOrder } = useReadContract({
    ...ESCROW_CONTRACT,
    functionName: "getOrder",
    args: orderId ? [BigInt(orderId)] : undefined,
  }) as { data: OrderTuple | undefined; refetch: () => void }

  // Leer balance y allowance (solo cuando hay address)
  const { data: balance, refetch: refetchBalance } = useReadContract({
    ...TOKEN_CONTRACT,
    functionName: "balanceOf",
    args: address ? [address as `0x${string}`] : undefined,
    query: { enabled: !!address },
  })

  const { data: allowance, refetch: refetchAllowance } = useReadContract({
    ...TOKEN_CONTRACT,
    functionName: "allowance",
    args: address ? [address as `0x${string}`, ESCROW_CONTRACT.address] : undefined,
    query: { enabled: !!address },
  })

  // Crear orden con aprobación automática si es necesario
  const handleCreateOrder = async () => {
    setError(undefined)
    setTxHash(undefined)
    setCreatedOrderId(undefined)
    setIsProcessing(true)

    if (!seller || !amount) {
      setError("Por favor completa todos los campos")
      setIsProcessing(false)
      return
    }

    if (!isAddress(seller)) {
      setError("Dirección inválida del vendedor")
      setIsProcessing(false)
      return
    }

    if (!isCorrectNetwork) {
      setError("Por favor cambia a la red Sepolia")
      setIsProcessing(false)
      return
    }

    const amountInWei = parseEther(amount)
    const currentBalance = (balance as bigint) || BigInt(0)
    const currentAllowance = (allowance as bigint) || BigInt(0)

    if (amountInWei > currentBalance) {
      setError(`Balance insuficiente. Tienes ${formatEther(currentBalance)} PMT`)
      setIsProcessing(false)
      return
    }

    try {
      // Verificar si necesitamos aprobar primero
      if (currentAllowance < amountInWei) {
        console.log("[Escrow] Aprobando tokens primero...")
        const approveTxHash = await writeContractAsync({
          ...TOKEN_CONTRACT,
          functionName: "approve",
          args: [ESCROW_CONTRACT.address, amountInWei],
        })

        console.log("[Escrow] Transacción de aprobación enviada:", approveTxHash)

        await waitForTransactionReceipt(config, {
          hash: approveTxHash,
          confirmations: 1,
        })

        console.log("[Escrow] ✓ Aprobación confirmada")
        refetchAllowance()
      }

      // Crear la orden
      const txHash = await writeContractAsync({
        ...ESCROW_CONTRACT,
        functionName: "createOrder",
        args: [seller as `0x${string}`, amountInWei],
      })

      console.log("[Escrow] Orden creada:", txHash)
      setTxHash(txHash)

      const receipt = await waitForTransactionReceipt(config, {
        hash: txHash,
        confirmations: 1,
      })

      console.log("[Escrow] ✓ Transacción confirmada!", receipt)

      // Extraer el orderId del evento OrderCreated
      try {
        if (receipt.logs && receipt.logs.length > 0) {
          // Buscar el evento OrderCreated en los logs
          for (const log of receipt.logs) {
            try {
              const decodedLog = decodeEventLog({
                abi: ESCROW_CONTRACT.abi,
                data: log.data,
                topics: log.topics,
              })

              if (decodedLog.eventName === "OrderCreated") {
                const args = decodedLog.args as { orderId?: bigint; customer?: string; provider?: string }
                const newOrderId = args.orderId?.toString()
                if (newOrderId) {
                  console.log("[Escrow] ✓ Orden creada con ID:", newOrderId)
                  setCreatedOrderId(newOrderId)
                  setOrderId(newOrderId) // Actualizar automáticamente el campo de búsqueda
                }
                break
              }
            } catch (e) {
              // Ignorar logs que no coinciden con nuestro ABI
              continue
            }
          }
        }
      } catch (e) {
        console.warn("[Escrow] No se pudo extraer el orderId del evento:", e)
      }

      refetchBalance()
      refetchAllowance()
      refetchOrder()

      setSeller("")
      setAmount("")

      setTimeout(() => {
        setTxHash(undefined)
      }, 8000) // Mantener el hash visible por más tiempo

      setIsProcessing(false)
    } catch (err: any) {
      console.error("[Escrow] Error al crear orden:", err)
      let errorMsg = "Error al crear orden"
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

  // Marcar como enviado
  const handleMarkAsShipped = async () => {
    setError(undefined)
    setTxHash(undefined)
    setIsProcessing(true)

    if (!orderId) {
      setError("Por favor ingresa un ID de orden")
      setIsProcessing(false)
      return
    }

    if (!isCorrectNetwork) {
      setError("Por favor cambia a la red Sepolia")
      setIsProcessing(false)
      return
    }

    try {
      const txHash = await writeContractAsync({
        ...ESCROW_CONTRACT,
        functionName: "markAsShipped",
        args: [BigInt(orderId)],
        gas: BigInt(100000),
      })

      console.log("[Escrow] Marcado como enviado:", txHash)
      setTxHash(txHash)

      const receipt = await waitForTransactionReceipt(config, {
        hash: txHash,
        confirmations: 1,
      })

      console.log("[Escrow] ✓ Transacción confirmada!", receipt)
      refetchOrder()

      setTimeout(() => {
        setTxHash(undefined)
      }, 5000)

      setIsProcessing(false)
    } catch (err: any) {
      console.error("[Escrow] Error al marcar como enviado:", err)
      let errorMsg = "Error al marcar como enviado"
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

  // Confirmar entrega
  const handleConfirmDelivery = async () => {
    setError(undefined)
    setTxHash(undefined)
    setIsProcessing(true)

    if (!orderId) {
      setError("Por favor ingresa un ID de orden")
      setIsProcessing(false)
      return
    }

    if (!isCorrectNetwork) {
      setError("Por favor cambia a la red Sepolia")
      setIsProcessing(false)
      return
    }

    try {
      const txHash = await writeContractAsync({
        ...ESCROW_CONTRACT,
        functionName: "confirmDelivery",
        args: [BigInt(orderId)],
        gas: BigInt(150000),
      })

      console.log("[Escrow] Entrega confirmada:", txHash)
      setTxHash(txHash)

      const receipt = await waitForTransactionReceipt(config, {
        hash: txHash,
        confirmations: 1,
      })

      console.log("[Escrow] ✓ Transacción confirmada!", receipt)
      refetchOrder()

      setTimeout(() => {
        setTxHash(undefined)
      }, 5000)

      setIsProcessing(false)
    } catch (err: any) {
      console.error("[Escrow] Error al confirmar entrega:", err)
      let errorMsg = "Error al confirmar entrega"
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

  // Disputar orden
  const handleDisputeOrder = async () => {
    setError(undefined)
    setTxHash(undefined)
    setIsProcessing(true)

    if (!orderId) {
      setError("Por favor ingresa un ID de orden")
      setIsProcessing(false)
      return
    }

    if (!isCorrectNetwork) {
      setError("Por favor cambia a la red Sepolia")
      setIsProcessing(false)
      return
    }

    try {
      const txHash = await writeContractAsync({
        ...ESCROW_CONTRACT,
        functionName: "disputeOrder",
        args: [BigInt(orderId)],
        gas: BigInt(100000),
      })

      console.log("[Escrow] Orden disputada:", txHash)
      setTxHash(txHash)

      const receipt = await waitForTransactionReceipt(config, {
        hash: txHash,
        confirmations: 1,
      })

      console.log("[Escrow] ✓ Transacción confirmada!", receipt)
      refetchOrder()

      setTimeout(() => {
        setTxHash(undefined)
      }, 5000)

      setIsProcessing(false)
    } catch (err: any) {
      console.error("[Escrow] Error al disputar orden:", err)
      let errorMsg = "Error al disputar orden"
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

  // Solicitar reembolso
  const handleRequestRefund = async () => {
    setError(undefined)
    setTxHash(undefined)
    setIsProcessing(true)

    if (!orderId) {
      setError("Por favor ingresa un ID de orden")
      setIsProcessing(false)
      return
    }

    if (!isCorrectNetwork) {
      setError("Por favor cambia a la red Sepolia")
      setIsProcessing(false)
      return
    }

    try {
      const txHash = await writeContractAsync({
        ...ESCROW_CONTRACT,
        functionName: "requestRefund",
        args: [BigInt(orderId)],
        gas: BigInt(100000),
      })

      console.log("[Escrow] Reembolso solicitado:", txHash)
      setTxHash(txHash)

      const receipt = await waitForTransactionReceipt(config, {
        hash: txHash,
        confirmations: 1,
      })

      console.log("[Escrow] ✓ Transacción confirmada!", receipt)
      refetchOrder()

      setTimeout(() => {
        setTxHash(undefined)
      }, 5000)

      setIsProcessing(false)
    } catch (err: any) {
      console.error("[Escrow] Error al solicitar reembolso:", err)
      let errorMsg = "Error al solicitar reembolso"
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
  if (connectionStatus !== 'connected') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-950 via-purple-900 to-fuchsia-900">
        <DAppHeader />
        <div className="flex items-center justify-center min-h-[80vh]">
          <Card className="bg-white/10 backdrop-blur-md border-white/20 max-w-md">
            <CardContent className="p-8 text-center">
              <AlertCircle className="w-12 h-12 mx-auto mb-4 text-purple-400" />
              <h3 className="text-xl font-semibold text-white mb-2">Wallet No Conectada</h3>
              <p className="text-white/70 mb-4">
                Por favor conecta tu wallet para usar las funciones de pago escalonado.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  const displayBalance = balance ? formatEther(balance as bigint) : "0"
  const displayAllowance = allowance ? formatEther(allowance as bigint) : "0"

  // Mapeo de estados
  const getOrderStatus = (status: number) => {
    const statuses = ["Creada", "Enviada", "Entregada", "Disputada", "Reembolsada"]
    return statuses[status] ?? "Desconocido"
  }

  const getStatusColor = (status: number) => {
    const colors = [
      "bg-blue-500/20 text-blue-300 border-blue-500/30",
      "bg-indigo-500/20 text-indigo-300 border-indigo-500/30",
      "bg-green-500/20 text-green-300 border-green-500/30",
      "bg-orange-500/20 text-orange-300 border-orange-500/30",
      "bg-red-500/20 text-red-300 border-red-500/30",
    ]
    return colors[status] ?? "bg-gray-500/20 text-gray-300 border-gray-500/30"
  }

  // Parsear datos de la orden desde el contrato
  // getOrder retorna: [orderId, customer, provider, totalAmount, firstPayment, secondPayment, status, firstPaymentReleased, secondPaymentReleased]
  // Estructura del contrato: struct Order { customer, provider, totalAmount, status }
  // Pero getOrder calcula y retorna 9 campos incluyendo los pagos divididos y flags
  const parseOrderData = () => {
    if (!orderData) return null

    try {
      // Ya no necesitamos el cast porque orderData está tipado como OrderTuple
      const [
        orderId,
        customer,
        provider,
        totalAmount,
        firstPayment,
        secondPayment,
        status,
        firstPaymentReleased,
        secondPaymentReleased
      ] = orderData

      // Validar dirección válida
      if (!customer || customer === '0x0000000000000000000000000000000000000000') {
        return null
      }

      return {
        orderId: Number(orderId),
        customer,
        provider,
        totalAmount,
        firstPayment,
        secondPayment,
        status: Number(status),
        firstPaymentReleased: Boolean(firstPaymentReleased),
        secondPaymentReleased: Boolean(secondPaymentReleased)
      }
    } catch (err) {
      console.error("Error parseando orden:", err)
      return null
    }
  }

  // Parsear orden actual
  const currentOrder = parseOrderData()
  const hasValidOrder = Boolean(orderData) && currentOrder !== null

  // Order card component
  const orderCard = hasValidOrder && currentOrder ? (
    <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-lg p-6 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <span className="text-white/70 text-sm font-semibold">Orden #{currentOrder.orderId}</span>
        <span className={`px-4 py-1.5 rounded-full text-xs font-semibold border ${getStatusColor(currentOrder.status)}`}>
          {getOrderStatus(currentOrder.status)}
        </span>
      </div>

      {/* Addresses */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white/5 rounded-lg p-3 border border-white/10">
          <p className="text-white/50 text-xs mb-1">Comprador</p>
          <p className="text-white text-sm font-mono break-all">{currentOrder.customer}</p>
        </div>
        <div className="bg-white/5 rounded-lg p-3 border border-white/10">
          <p className="text-white/50 text-xs mb-1">Vendedor</p>
          <p className="text-white text-sm font-mono break-all">{currentOrder.provider}</p>
        </div>
      </div>

      {/* Payments */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white/5 rounded-lg p-3 border border-white/10">
          <p className="text-white/50 text-xs mb-1">Total</p>
          <p className="text-white text-lg font-bold">{formatEther(currentOrder.totalAmount)} PMT</p>
        </div>
        <div className={`rounded-lg p-3 border ${currentOrder.firstPaymentReleased ? 'bg-green-500/10 border-green-500/30' : 'bg-white/5 border-white/10'}`}>
          <p className="text-white/50 text-xs mb-1">1er Pago (70%)</p>
          <div className="flex items-center gap-2">
            <p className="text-white text-lg font-bold">{formatEther(currentOrder.firstPayment)} PMT</p>
            {currentOrder.firstPaymentReleased && <CheckCircle className="w-4 h-4 text-green-400" />}
          </div>
          {currentOrder.firstPaymentReleased && <p className="text-green-400 text-xs mt-1">✓ Pagado</p>}
        </div>
        <div className={`rounded-lg p-3 border ${currentOrder.secondPaymentReleased ? 'bg-green-500/10 border-green-500/30' : 'bg-white/5 border-white/10'}`}>
          <p className="text-white/50 text-xs mb-1">2do Pago (30%)</p>
          <div className="flex items-center gap-2">
            <p className="text-white text-lg font-bold">{formatEther(currentOrder.secondPayment)} PMT</p>
            {currentOrder.secondPaymentReleased && <CheckCircle className="w-4 h-4 text-green-400" />}
          </div>
          <p className={`text-xs mt-1 ${currentOrder.secondPaymentReleased ? 'text-green-400' : 'text-yellow-400'}`}>
            {currentOrder.secondPaymentReleased ? '✓ Pagado' : '⏳ Pendiente'}
          </p>
        </div>
      </div>

      {/* Status Messages */}
      {currentOrder.status === 1 && !currentOrder.secondPaymentReleased && (
        <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
            <div className="text-blue-300 text-sm">
              <p className="font-semibold">Pago del 30% restante ({formatEther(currentOrder.secondPayment)} PMT)</p>
              <p className="text-xs mt-1">El comprador debe confirmar la entrega para liberar el pago restante al vendedor.</p>
            </div>
          </div>
        </div>
      )}

      {currentOrder.status === 2 && currentOrder.secondPaymentReleased && (
        <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-3">
          <div className="flex items-start gap-3">
            <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
            <div className="text-green-300 text-sm">
              <p className="font-semibold">¡Orden completada!</p>
              <p className="text-xs mt-1">Todos los pagos han sido liberados. Total pagado: {formatEther(currentOrder.totalAmount)} PMT</p>
            </div>
          </div>
        </div>
      )}
    </div>
  ) : orderData ? (
    <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
      <div className="flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
        <p className="text-red-300 text-sm">Orden no encontrada o inválida.</p>
      </div>
    </div>
  ) : null

  // Si llegamos aquí, el usuario está conectado
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-950 via-purple-900 to-fuchsia-900">
      <DAppHeader />

      {/* Main Content */}
      <main className="container mx-auto px-6 py-12">
        <div className="max-w-5xl mx-auto space-y-6">
          {/* Page Title */}
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center">
                <FileText className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white">Pago Escalonado</h1>
                <p className="text-white/70">Sistema de custodia con liberación por etapas</p>
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

          {/* Transaction Success */}
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


          {(createdOrderId && (
            <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                <div className="text-green-300">
                  <p className="font-semibold">¡Orden creada exitosamente!</p>
                  <p className="text-sm">ID: <span className="text-white font-mono">#{createdOrderId}</span></p>
                  <p className="text-xs text-green-400 mt-1">La orden se ha cargado automáticamente abajo para que puedas verla.</p>
                </div>
              </div>
            </div>
          )) as ReactNode}

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

          {/* Create Order */}
          <Card className="bg-white/10 backdrop-blur-md border-white/20">
            <CardHeader>
              <CardTitle className="text-white">Crear Nueva Orden</CardTitle>
              <CardDescription className="text-white/70">
                Crea una orden de pago con custodia y liberación escalonada (70% al envío, 30% al confirmar)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="seller" className="text-white">Dirección del Vendedor</Label>
                <Input
                  id="seller"
                  type="text"
                  placeholder="0x..."
                  value={seller}
                  onChange={(e) => setSeller(e.target.value)}
                  className="bg-white/5 border-white/10 text-white placeholder:text-white/40"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="amount" className="text-white">Cantidad Total (PMT)</Label>
                <Input
                  id="amount"
                  type="number"
                  placeholder="1000"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="bg-white/5 border-white/10 text-white placeholder:text-white/40"
                />
              </div>

              <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-3">
                <p className="text-green-300 text-sm">
                  <span className="font-semibold">✓ Aprobación automática:</span> Los tokens se aprobarán automáticamente si es necesario.
                  Balance disponible: <strong>{parseFloat(displayBalance).toFixed(2)} PMT</strong>
                </p>
              </div>

              <Button
                onClick={handleCreateOrder}
                disabled={!seller || !amount || isProcessing}
                className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Procesando...
                  </>
                ) : (
                  <>
                    <FileText className="w-4 h-4 mr-2" />
                    Crear Orden
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* View Order */}
          <Card className="bg-white/10 backdrop-blur-md border-white/20">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Search className="w-5 h-5" />
                Consultar Orden
              </CardTitle>
              <CardDescription className="text-white/70">
                Busca una orden existente por su ID
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="orderId" className="text-white">ID de la Orden</Label>
                <Input
                  id="orderId"
                  type="number"
                  placeholder="0"
                  value={orderId}
                  onChange={(e) => setOrderId(e.target.value)}
                  className="bg-white/5 border-white/10 text-white placeholder:text-white/40"
                />
              </div>

              {orderCard}
            </CardContent>
          </Card>

          {/* Order Actions */}
          {orderId && orderData && (
            <Card className="bg-white/10 backdrop-blur-md border-white/20">
              <CardHeader>
                <CardTitle className="text-white">Acciones de Orden</CardTitle>
                <CardDescription className="text-white/70">
                  Gestiona el estado de la orden #{orderId}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                  <Button
                    onClick={handleMarkAsShipped}
                    disabled={isProcessing}
                    className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white"
                  >
                    <Package className="w-4 h-4 mr-2" />
                    {isProcessing ? "Procesando..." : "Marcar Envío"}
                  </Button>

                  <Button
                    onClick={handleConfirmDelivery}
                    disabled={isProcessing}
                    className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white"
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    {isProcessing ? "Procesando..." : "Confirmar"}
                  </Button>

                  <Button
                    onClick={handleDisputeOrder}
                    disabled={isProcessing}
                    className="bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white"
                  >
                    <AlertTriangle className="w-4 h-4 mr-2" />
                    {isProcessing ? "Procesando..." : "Disputar"}
                  </Button>

                  <Button
                    onClick={handleRequestRefund}
                    disabled={isProcessing}
                    className="bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700 text-white"
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    {isProcessing ? "Procesando..." : "Reembolso"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Info Card */}
          <div className="bg-white/5 backdrop-blur-md rounded-xl p-6 border border-white/10">
            <h3 className="text-white font-semibold mb-3">¿Cómo funciona el pago escalonado?</h3>
            <ul className="space-y-2 text-white/70 text-sm">
              <li className="flex items-start gap-2">
                <span className="text-purple-400 mt-1">1.</span>
                <span><strong>Crear Orden:</strong> El comprador deposita los tokens en custodia</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-purple-400 mt-1">2.</span>
                <span><strong>Marcar Envío:</strong> El vendedor marca el pedido como enviado (libera 70%)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-purple-400 mt-1">3.</span>
                <span><strong>Confirmar Entrega:</strong> El comprador confirma recepción (libera 30% restante)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-purple-400 mt-1">•</span>
                <span><strong>Disputar/Reembolso:</strong> Si hay problemas, se puede disputar o solicitar reembolso</span>
              </li>
            </ul>
          </div>
        </div>
      </main>
    </div>
  )
}
