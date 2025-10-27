"use client"

import React from "react"

/**
 * TOKEN MANAGER
 * =============
 * Componente para interactuar con el Token ERC20 (Capa Monetaria).
 * Funcionalidades:
 * - Ver balance
 * - Obtener tokens del faucet
 * - Transferir tokens
 * - Aprobar tokens para el contrato de Escrow
 */

import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from "wagmi"
import { formatEther, parseEther, isAddress } from "viem"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { TOKEN_CONTRACT, ESCROW_CONTRACT } from "@/lib/contracts"
import { useState } from "react"
import { Coins, Send, Check, AlertCircle, CheckCircle } from "lucide-react"

export function TokenManager() {
  const { address } = useAccount()
  const [transferTo, setTransferTo] = useState("")
  const [transferAmount, setTransferAmount] = useState("")
  const [approveAmount, setApproveAmount] = useState("")
  const [transferError, setTransferError] = useState("")
  const [approveError, setApproveError] = useState("")
  const [faucetError, setFaucetError] = useState("")

  const { writeContract: faucetWriteContract, data: faucetHash, error: faucetWriteError } = useWriteContract()
  const { writeContract: transferWriteContract, data: transferHash } = useWriteContract()
  const { writeContract: approveWriteContract, data: approveHash } = useWriteContract()

  const { data: balance, refetch: refetchBalance } = useReadContract({
    ...TOKEN_CONTRACT,
    functionName: "balanceOf",
    args: address ? [address as `0x${string}`] : undefined,
  })

  const { data: allowance, refetch: refetchAllowance } = useReadContract({
    ...TOKEN_CONTRACT,
    functionName: "allowance",
    args: address ? [address as `0x${string}`, ESCROW_CONTRACT.address] : undefined,
  })

  const {
    isLoading: isFaucetLoading,
    isSuccess: isFaucetSuccess,
    error: faucetReceiptError,
  } = useWaitForTransactionReceipt({
    hash: faucetHash,
  })
  const { isLoading: isTransferLoading, isSuccess: isTransferSuccess } = useWaitForTransactionReceipt({
    hash: transferHash,
  })
  const { isLoading: isApproveLoading, isSuccess: isApproveSuccess } = useWaitForTransactionReceipt({
    hash: approveHash,
  })

  React.useEffect(() => {
    if (faucetWriteError) {
      console.log("[v0] Faucet write error:", faucetWriteError)
      setFaucetError(faucetWriteError.message || "Error al obtener tokens")
    }
    if (faucetReceiptError) {
      console.log("[v0] Faucet receipt error:", faucetReceiptError)
      setFaucetError(faucetReceiptError.message || "Error en la transacción")
    }
  }, [faucetWriteError, faucetReceiptError])

  const handleFaucet = () => {
    setFaucetError("")
    console.log("[v0] Attempting faucet call with address:", address)

    if (!address) {
      setFaucetError("Debes conectar tu wallet primero")
      return
    }

    faucetWriteContract({
      ...TOKEN_CONTRACT,
      functionName: "faucet",
    })
  }

  const handleTransfer = () => {
    setTransferError("")

    if (!transferTo || !transferAmount) {
      setTransferError("Por favor completa todos los campos")
      return
    }

    if (!isAddress(transferTo)) {
      setTransferError("Dirección inválida")
      return
    }

    if (isNaN(Number(transferAmount)) || Number(transferAmount) <= 0) {
      setTransferError("Cantidad debe ser mayor a 0")
      return
    }

    transferWriteContract({
      ...TOKEN_CONTRACT,
      functionName: "transfer",
      args: [transferTo as `0x${string}`, parseEther(transferAmount)],
    })
    setTransferTo("")
    setTransferAmount("")
  }

  const handleApprove = () => {
    setApproveError("")

    if (!approveAmount) {
      setApproveError("Por favor ingresa una cantidad")
      return
    }

    if (isNaN(Number(approveAmount)) || Number(approveAmount) <= 0) {
      setApproveError("Cantidad debe ser mayor a 0")
      return
    }

    approveWriteContract({
      ...TOKEN_CONTRACT,
      functionName: "approve",
      args: [ESCROW_CONTRACT.address, parseEther(approveAmount)],
    })
    setApproveAmount("")
  }

  const displayBalance = balance ? formatEther(balance as bigint) : "0"
  const displayAllowance = allowance ? formatEther(allowance as bigint) : "0"

  return (
    <Card className="bg-white/10 backdrop-blur-md border-white/20">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <Coins className="w-6 h-6" />
          Token ERC20
        </CardTitle>
        <CardDescription className="text-white/70">
          Gestiona tus tokens para usar en el sistema de pagos escalonados
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Balance */}
        <div className="bg-white/5 rounded-lg p-4 border border-white/10">
          <p className="text-white/70 text-sm mb-1">Tu Balance</p>
          <p className="text-3xl font-bold text-white">{displayBalance} Tokens</p>
          {displayAllowance && (
            <p className="text-white/50 text-sm mt-2">Aprobado para Escrow: {displayAllowance} Tokens</p>
          )}
        </div>

        {/* Faucet */}
        <div className="space-y-2">
          <h3 className="text-white font-semibold">Obtener Tokens de Prueba</h3>
          <Button
            onClick={handleFaucet}
            disabled={isFaucetLoading}
            className="w-full bg-cyan-600 hover:bg-cyan-700 text-white"
          >
            {isFaucetLoading ? "Procesando..." : "Obtener 1000 Tokens"}
          </Button>
          {faucetError && (
            <div className="flex items-center gap-2 text-red-400 text-sm">
              <AlertCircle className="w-4 h-4" />
              {faucetError}
            </div>
          )}
          {isFaucetSuccess && (
            <div className="flex items-center gap-2 text-green-400 text-sm">
              <CheckCircle className="w-4 h-4" />
              Tokens obtenidos exitosamente
            </div>
          )}
        </div>

        {/* Transfer */}
        <div className="space-y-2">
          <h3 className="text-white font-semibold flex items-center gap-2">
            <Send className="w-4 h-4" />
            Transferir Tokens
          </h3>
          <Input
            placeholder="Dirección destino (0x...)"
            value={transferTo}
            onChange={(e) => {
              setTransferTo(e.target.value)
              setTransferError("")
            }}
            className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
          />
          <Input
            type="number"
            placeholder="Cantidad"
            value={transferAmount}
            onChange={(e) => {
              setTransferAmount(e.target.value)
              setTransferError("")
            }}
            className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
          />
          {transferError && (
            <div className="flex items-center gap-2 text-red-400 text-sm">
              <AlertCircle className="w-4 h-4" />
              {transferError}
            </div>
          )}
          <Button
            onClick={handleTransfer}
            disabled={isTransferLoading || !transferTo || !transferAmount}
            className="w-full bg-purple-600 hover:bg-purple-700 text-white"
          >
            {isTransferLoading ? "Procesando..." : "Transferir"}
          </Button>
          {isTransferSuccess && (
            <div className="flex items-center gap-2 text-green-400 text-sm">
              <CheckCircle className="w-4 h-4" />
              Transferencia completada
            </div>
          )}
        </div>

        {/* Approve */}
        <div className="space-y-2">
          <h3 className="text-white font-semibold flex items-center gap-2">
            <Check className="w-4 h-4" />
            Aprobar para Escrow
          </h3>
          <p className="text-white/60 text-sm">Debes aprobar tokens antes de crear órdenes de pago escalonado</p>
          <Input
            type="number"
            placeholder="Cantidad a aprobar"
            value={approveAmount}
            onChange={(e) => {
              setApproveAmount(e.target.value)
              setApproveError("")
            }}
            className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
          />
          {approveError && (
            <div className="flex items-center gap-2 text-red-400 text-sm">
              <AlertCircle className="w-4 h-4" />
              {approveError}
            </div>
          )}
          <Button
            onClick={handleApprove}
            disabled={isApproveLoading || !approveAmount}
            className="w-full bg-green-600 hover:bg-green-700 text-white"
          >
            {isApproveLoading ? "Procesando..." : "Aprobar"}
          </Button>
          {isApproveSuccess && (
            <div className="flex items-center gap-2 text-green-400 text-sm">
              <CheckCircle className="w-4 h-4" />
              Aprobación completada
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
