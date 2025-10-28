"use client"

import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from "wagmi"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { formatEther, parseEther, isAddress } from "viem"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ArrowLeft, FileText, Package, CheckCircle, AlertTriangle, RefreshCw, Loader2, Search } from "lucide-react"
import { TransactionLink } from "@/components/transaction-link"
import { ESCROW_CONTRACT } from "@/lib/contracts"
import { useAutoApprove } from "@/hooks/useAutoApprove"

export default function EscrowPage() {
  const { address, isConnected } = useAccount()
  const router = useRouter()

  // Estados para crear orden
  const [seller, setSeller] = useState("")
  const [amount, setAmount] = useState("")
  const [orderId, setOrderId] = useState("")
  const [txHash, setTxHash] = useState<string | undefined>()

  // Hooks de escritura
  const { writeContract, data: hash, isPending } = useWriteContract()

  // Auto-approve hook
  const { executeWithAutoApprove, isApproving } = useAutoApprove({
    spenderAddress: ESCROW_CONTRACT.address,
  })

  // Esperar confirmación
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  })

  // Leer orden
  const { data: orderData, refetch: refetchOrder } = useReadContract({
    ...ESCROW_CONTRACT,
    functionName: "getOrder",
    args: orderId ? [BigInt(orderId)] : undefined,
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
      refetchOrder()
    }
  }, [isSuccess, refetchOrder])

  // Redirigir si no está conectado
  useEffect(() => {
    if (!isConnected) {
      router.push("/connect")
    }
  }, [isConnected, router])

  // Crear orden con auto-approve
  const handleCreateOrder = () => {
    if (!seller || !amount) return
    if (!isAddress(seller)) return

    const amountInWei = parseEther(amount)

    executeWithAutoApprove(amountInWei, () => {
      writeContract({
        ...ESCROW_CONTRACT,
        functionName: "createOrder",
        args: [seller as `0x${string}`, amountInWei],
      })
    })
  }

  // Marcar como enviado
  const handleMarkAsShipped = () => {
    if (!orderId) return
    writeContract({
      ...ESCROW_CONTRACT,
      functionName: "markAsShipped",
      args: [BigInt(orderId)],
    })
  }

  // Confirmar entrega
  const handleConfirmDelivery = () => {
    if (!orderId) return
    writeContract({
      ...ESCROW_CONTRACT,
      functionName: "confirmDelivery",
      args: [BigInt(orderId)],
    })
  }

  // Disputar orden
  const handleDisputeOrder = () => {
    if (!orderId) return
    writeContract({
      ...ESCROW_CONTRACT,
      functionName: "disputeOrder",
      args: [BigInt(orderId)],
    })
  }

  // Solicitar reembolso
  const handleRequestRefund = () => {
    if (!orderId) return
    writeContract({
      ...ESCROW_CONTRACT,
      functionName: "requestRefund",
      args: [BigInt(orderId)],
    })
  }

  if (!isConnected) return null

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

  // Renderizar tarjeta de orden
  const renderOrderCard = () => {
    if (!orderData) return null

    const o = orderData as unknown as any[]
    const status = Number(o[6])
    const customer = o[1] as string
    const provider = o[2] as string
    const total = o[3] as bigint
    const first = o[4] as bigint
    const second = o[5] as bigint
    const createdAtSec = Number(o[7])
    const shippedAtSec = Number(o[8])
    const deadlineSec = Number(o[9])
    const firstReleased = Boolean(o[10])
    const secondReleased = Boolean(o[11])

    return (
      <Card className="bg-white/5 backdrop-blur-md border-white/10">
        <CardContent className="pt-6 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-white/70 text-sm font-semibold">Estado de la Orden</span>
            <span className={`px-4 py-1.5 rounded-full text-xs font-semibold border ${getStatusColor(status)}`}>
              {getOrderStatus(status)}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white/5 rounded-lg p-3 border border-white/10">
              <p className="text-white/50 text-xs mb-1">Comprador</p>
              <p className="text-white text-sm font-mono">{customer.slice(0, 10)}...{customer.slice(-8)}</p>
            </div>
            <div className="bg-white/5 rounded-lg p-3 border border-white/10">
              <p className="text-white/50 text-xs mb-1">Vendedor</p>
              <p className="text-white text-sm font-mono">{provider.slice(0, 10)}...{provider.slice(-8)}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white/5 rounded-lg p-3 border border-white/10">
              <p className="text-white/50 text-xs mb-1">Total</p>
              <p className="text-white text-lg font-bold">{formatEther(total)} PMT</p>
            </div>
            <div className="bg-white/5 rounded-lg p-3 border border-white/10">
              <p className="text-white/50 text-xs mb-1">1er Pago (70%)</p>
              <p className="text-white text-lg font-bold flex items-center gap-2">
                {formatEther(first)} {firstReleased && <CheckCircle className="w-4 h-4 text-green-400" />}
              </p>
            </div>
            <div className="bg-white/5 rounded-lg p-3 border border-white/10">
              <p className="text-white/50 text-xs mb-1">2do Pago (30%)</p>
              <p className="text-white text-lg font-bold flex items-center gap-2">
                {formatEther(second)} {secondReleased && <CheckCircle className="w-4 h-4 text-green-400" />}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white/5 rounded-lg p-3 border border-white/10">
              <p className="text-white/50 text-xs mb-1">Creada</p>
              <p className="text-white text-sm">{createdAtSec ? new Date(createdAtSec * 1000).toLocaleString() : "-"}</p>
            </div>
            <div className="bg-white/5 rounded-lg p-3 border border-white/10">
              <p className="text-white/50 text-xs mb-1">Enviada</p>
              <p className="text-white text-sm">{shippedAtSec ? new Date(shippedAtSec * 1000).toLocaleString() : "Pendiente"}</p>
            </div>
            <div className="bg-white/5 rounded-lg p-3 border border-white/10 md:col-span-2">
              <p className="text-white/50 text-xs mb-1">Fecha Límite</p>
              <p className="text-white text-sm">{deadlineSec ? new Date(deadlineSec * 1000).toLocaleString() : "-"}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

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

          {/* Transaction Success */}
          {isSuccess && txHash && (
            <TransactionLink hash={txHash} />
          )}

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
                </p>
              </div>

              <Button
                onClick={handleCreateOrder}
                disabled={!seller || !amount || isPending || isConfirming || isApproving}
                className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white"
              >
                {isApproving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Aprobando tokens...
                  </>
                ) : isPending || isConfirming ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Creando Orden...
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

              {orderData && renderOrderCard()}
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
                    disabled={isPending || isConfirming}
                    className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white"
                  >
                    <Package className="w-4 h-4 mr-2" />
                    {isPending || isConfirming ? "Procesando..." : "Marcar Envío"}
                  </Button>

                  <Button
                    onClick={handleConfirmDelivery}
                    disabled={isPending || isConfirming}
                    className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white"
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    {isPending || isConfirming ? "Procesando..." : "Confirmar"}
                  </Button>

                  <Button
                    onClick={handleDisputeOrder}
                    disabled={isPending || isConfirming}
                    className="bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white"
                  >
                    <AlertTriangle className="w-4 h-4 mr-2" />
                    {isPending || isConfirming ? "Procesando..." : "Disputar"}
                  </Button>

                  <Button
                    onClick={handleRequestRefund}
                    disabled={isPending || isConfirming}
                    className="bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700 text-white"
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    {isPending || isConfirming ? "Procesando..." : "Reembolso"}
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
