"use client"

/**
 * ESCROW MANAGER
 * ==============
 * Componente para interactuar con el contrato de Pago Escalonado.
 * Funcionalidades:
 * - Crear órdenes
 * - Ver órdenes
 * - Marcar envío (proveedor)
 * - Confirmar entrega (cliente)
 * - Disputar órdenes
 * - Solicitar reembolso
 */

import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from "wagmi"
import { formatEther, parseEther, isAddress } from "viem"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ESCROW_CONTRACT } from "@/lib/contracts"
import { useState } from "react"
import { FileText, Package, AlertTriangle, RefreshCw, AlertCircle, CheckCircle } from "lucide-react"

export function EscrowManager() {
  const { address } = useAccount()
  const [seller, setSeller] = useState("")
  const [amount, setAmount] = useState("")
  const [deadline, setDeadline] = useState("") // opcional a nivel UI (el contrato usa DEFAULT_DELIVERY_DEADLINE)
  const [orderId, setOrderId] = useState("")
  const [createError, setCreateError] = useState("")

  // Writes
  const { writeContract: createOrderWrite, data: createHash } = useWriteContract()
  const { writeContract: markAsShippedWrite, data: deliverHash } = useWriteContract()
  const { writeContract: confirmDeliveryWrite, data: confirmHash } = useWriteContract()
  const { writeContract: disputeOrderWrite, data: disputeHash } = useWriteContract()
  const { writeContract: requestRefundWrite, data: refundHash } = useWriteContract()

  // Receipts
  const { isLoading: isCreateLoading, isSuccess: isCreateSuccess } = useWaitForTransactionReceipt({ hash: createHash })
  const { isLoading: isDeliverLoading } = useWaitForTransactionReceipt({ hash: deliverHash })
  const { isLoading: isConfirmLoading, isSuccess: isConfirmSuccess } = useWaitForTransactionReceipt({ hash: confirmHash })
  const { isLoading: isDisputeLoading } = useWaitForTransactionReceipt({ hash: disputeHash })
  const { isLoading: isRefundLoading } = useWaitForTransactionReceipt({ hash: refundHash })

  // Read
  const { data: orderData } = useReadContract({
    ...ESCROW_CONTRACT,
    functionName: "getOrder",
    args: orderId ? [BigInt(orderId)] : undefined,
  })

  const handleCreateOrder = () => {
    setCreateError("")

    if (!seller || !amount) {
      setCreateError("Por favor completa vendedor y cantidad")
      return
    }

    if (!isAddress(seller)) {
      setCreateError("Dirección del vendedor inválida")
      return
    }

    if (isNaN(Number(amount)) || Number(amount) <= 0) {
      setCreateError("Cantidad debe ser mayor a 0")
      return
    }

    // Nota: el contrato no recibe deadline; usa DEFAULT_DELIVERY_DEADLINE interno
    createOrderWrite({
      ...ESCROW_CONTRACT,
      functionName: "createOrder",
      args: [seller as `0x${string}`, parseEther(amount)],
      // gas opcional si el estimador falla:
      // gas: 300000n,
    })

    setSeller("")
    setAmount("")
    setDeadline("") // opcional, limpieza de UI
  }

  const handleDeliverOrder = () => {
    if (!orderId) return
    markAsShippedWrite({
      ...ESCROW_CONTRACT,
      functionName: "markAsShipped",
      args: [BigInt(orderId)],
      // gas: 200000n,
    })
  }

  const handleConfirmDelivery = () => {
    if (!orderId) return
    confirmDeliveryWrite({
      ...ESCROW_CONTRACT,
      functionName: "confirmDelivery",
      args: [BigInt(orderId)],
      // gas: 200000n,
    })
  }

  const handleDisputeOrder = () => {
    if (!orderId) return
    disputeOrderWrite({
      ...ESCROW_CONTRACT,
      functionName: "disputeOrder",
      args: [BigInt(orderId)],
      // gas: 200000n,
    })
  }

  const handleRefundOrder = () => {
    if (!orderId) return
    requestRefundWrite({
      ...ESCROW_CONTRACT,
      functionName: "requestRefund",
      args: [BigInt(orderId)],
      // gas: 200000n,
    })
  }

  // Mapeo de estados (enum del contrato: 0 Created, 1 Shipped, 2 Delivered, 3 Disputed, 4 Refunded)
  const getOrderStatus = (status: number) => {
    const statuses = ["Creada", "Enviada", "Entregada", "Disputada", "Reembolsada"]
    return statuses[status] ?? "Desconocido"
  }

  const getStatusColor = (status: number) => {
    const colors = [
      "bg-blue-500/20 text-blue-300",   // Created
      "bg-indigo-500/20 text-indigo-300", // Shipped
      "bg-green-500/20 text-green-300", // Delivered
      "bg-orange-500/20 text-orange-300", // Disputed
      "bg-red-500/20 text-red-300",     // Refunded
    ]
    return colors[status] ?? "bg-gray-500/20 text-gray-300"
  }

  // Helpers de orden (indices alineados al struct real)
  const renderOrderCard = () => {
    if (!orderData) return null

    const o = orderData as unknown as any[]
    // Índices según ABI:
    // 0 orderId
    // 1 customer
    // 2 provider
    // 3 totalAmount
    // 4 firstPayment
    // 5 secondPayment
    // 6 status (uint8)
    // 7 createdAt
    // 8 shippedAt
    // 9 deadline
    // 10 firstPaymentReleased (bool)
    // 11 secondPaymentReleased (bool)

    const status = Number(o[6])
    const customer = o[1] as string
    const provider = o[2] as string
    const total = o[3] as bigint
    const first = o[4] as bigint
    const second = o[5] as bigint
    const deadlineSec = Number(o[9])
    const createdAtSec = Number(o[7])
    const shippedAtSec = Number(o[8])
    const firstReleased = Boolean(o[10])
    const secondReleased = Boolean(o[11])

    return (
      <div className="bg-white/5 rounded-lg p-4 space-y-3 border border-white/10">
        <div className="flex items-center justify-between">
          <p className="text-white/70 text-sm">
            <span className="font-semibold">Estado:</span>
          </p>
          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(status)}`}>
            {getOrderStatus(status)}
          </span>
        </div>

        <p className="text-white/70 text-sm">
          <span className="font-semibold">Comprador:</span>{" "}
          {customer.slice(0, 6) + "..." + customer.slice(-4)}
        </p>
        <p className="text-white/70 text-sm">
          <span className="font-semibold">Vendedor:</span>{" "}
          {provider.slice(0, 6) + "..." + provider.slice(-4)}
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          <p className="text-white/70 text-sm">
            <span className="font-semibold">Total:</span> {formatEther(total)} Tokens
          </p>
          <p className="text-white/70 text-sm">
            <span className="font-semibold">1er pago (70%):</span> {formatEther(first)} {firstReleased ? "✅" : "⏳"}
          </p>
          <p className="text-white/70 text-sm">
            <span className="font-semibold">2do pago (30%):</span> {formatEther(second)} {secondReleased ? "✅" : "⏳"}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          <p className="text-white/70 text-sm">
            <span className="font-semibold">Creada:</span> {createdAtSec ? new Date(createdAtSec * 1000).toLocaleString() : "-"}
          </p>
          <p className="text-white/70 text-sm">
            <span className="font-semibold">Enviada:</span> {shippedAtSec ? new Date(shippedAtSec * 1000).toLocaleString() : "—"}
          </p>
          <p className="text-white/70 text-sm md:col-span-2">
            <span className="font-semibold">Fecha límite:</span> {deadlineSec ? new Date(deadlineSec * 1000).toLocaleString() : "—"}
          </p>
        </div>
      </div>
    )
  }

  return (
    <Card className="bg-white/10 backdrop-blur-md border-white/20">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <FileText className="w-6 h-6" />
          Pago Escalonado
        </CardTitle>
        <CardDescription className="text-white/70">
          Crea y gestiona órdenes de pago con custodia y liberación en etapas
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Crear Orden */}
        <div className="space-y-2">
          <h3 className="text-white font-semibold">Crear Nueva Orden</h3>
          <Input
            placeholder="Dirección del vendedor (0x...)"
            value={seller}
            onChange={(e) => {
              setSeller(e.target.value)
              setCreateError("")
            }}
            className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
          />
          <Input
            type="number"
            placeholder="Cantidad de tokens"
            value={amount}
            onChange={(e) => {
              setAmount(e.target.value)
              setCreateError("")
            }}
            className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
          />
          {/* Campo opcional de UI (el contrato no lo usa directamente) */}
          <Input
            type="datetime-local"
            placeholder="Fecha límite de entrega (opcional)"
            value={deadline}
            onChange={(e) => {
              setDeadline(e.target.value)
              setCreateError("")
            }}
            className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
          />
          {createError && (
            <div className="flex items-center gap-2 text-red-400 text-sm">
              <AlertCircle className="w-4 h-4" />
              {createError}
            </div>
          )}
          <Button
            onClick={handleCreateOrder}
            disabled={isCreateLoading || !seller || !amount}
            className="w-full bg-purple-600 hover:bg-purple-700 text-white"
          >
            {isCreateLoading ? "Creando..." : "Crear Orden"}
          </Button>
          {isCreateSuccess && (
            <div className="flex items-center gap-2 text-green-400 text-sm">
              <CheckCircle className="w-4 h-4" />
              Orden creada exitosamente
            </div>
          )}
        </div>

        {/* Ver Orden */}
        <div className="space-y-2">
          <h3 className="text-white font-semibold">Consultar Orden</h3>
          <Input
            type="number"
            placeholder="ID de la orden"
            value={orderId}
            onChange={(e) => setOrderId(e.target.value)}
            className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
          />
          {renderOrderCard()}
        </div>

        {/* Acciones de Orden */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <Button
            onClick={handleDeliverOrder}
            disabled={isDeliverLoading || !orderId}
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            <Package className="w-4 h-4 mr-2" />
            {isDeliverLoading ? "Procesando..." : "Marcar Envío"}
          </Button>

          <Button
            onClick={handleConfirmDelivery}
            disabled={isConfirmLoading || !orderId}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            {isConfirmLoading ? "Procesando..." : "Confirmar Entrega"}
          </Button>

          <Button
            onClick={handleDisputeOrder}
            disabled={isDisputeLoading || !orderId}
            className="bg-orange-600 hover:bg-orange-700 text-white"
          >
            <AlertTriangle className="w-4 h-4 mr-2" />
            {isDisputeLoading ? "Procesando..." : "Disputar"}
          </Button>

          <Button
            onClick={handleRefundOrder}
            disabled={isRefundLoading || !orderId}
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            {isRefundLoading ? "Procesando..." : "Reembolsar"}
          </Button>
        </div>

        {isConfirmSuccess && (
          <div className="flex items-center gap-2 text-green-400 text-sm">
            <CheckCircle className="w-4 h-4" />
            Entrega confirmada exitosamente
          </div>
        )}
      </CardContent>
    </Card>
  )
}
