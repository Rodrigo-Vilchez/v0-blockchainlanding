import { useState, useCallback } from "react"
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from "wagmi"
import { PAYMENT_TOKEN_ADDRESS, PAYMENT_TOKEN_ABI } from "@/lib/contracts"

interface UseAutoApproveParams {
  spenderAddress: `0x${string}`
  onSuccess?: (hash: string) => void
  onError?: (error: Error) => void
}

export function useAutoApprove({ spenderAddress, onSuccess, onError }: UseAutoApproveParams) {
  const { address } = useAccount()
  const [isApproving, setIsApproving] = useState(false)
  const [approvalHash, setApprovalHash] = useState<string | undefined>()

  const { writeContract } = useWriteContract()

  // Leer allowance actual
  const { data: currentAllowance, refetch: refetchAllowance } = useReadContract({
    address: PAYMENT_TOKEN_ADDRESS,
    abi: PAYMENT_TOKEN_ABI,
    functionName: "allowance",
    args: address ? [address, spenderAddress] : undefined,
  })

  // Esperar confirmación de aprobación
  const { isLoading: isWaitingApproval, isSuccess: isApprovalSuccess } = useWaitForTransactionReceipt({
    hash: approvalHash as `0x${string}` | undefined,
  })

  /**
   * Ejecuta una transacción con auto-approve si es necesario
   */
  const executeWithAutoApprove = useCallback(
    async (
      amount: bigint,
      executeTransaction: () => void
    ) => {
      try {
        const allowance = (currentAllowance as bigint) || 0n

        // Si ya hay suficiente allowance, ejecutar directamente
        if (allowance >= amount) {
          console.log("[AutoApprove] Suficiente allowance, ejecutando transacción...")
          executeTransaction()
          return
        }

        // Aprobar con un buffer del 20% para futuras transacciones
        const approveAmount = (amount * 120n) / 100n
        console.log(`[AutoApprove] Aprobando ${approveAmount} tokens...`)

        setIsApproving(true)

        // Aprobar tokens
        writeContract(
          {
            address: PAYMENT_TOKEN_ADDRESS,
            abi: PAYMENT_TOKEN_ABI,
            functionName: "approve",
            args: [spenderAddress, approveAmount],
          },
          {
            onSuccess: (hash) => {
              console.log("[AutoApprove] Aprobación enviada:", hash)
              setApprovalHash(hash)

              // Esperar confirmación y luego ejecutar la transacción principal
              const checkApproval = setInterval(async () => {
                const newAllowance = await refetchAllowance()
                if (newAllowance.data && (newAllowance.data as bigint) >= amount) {
                  clearInterval(checkApproval)
                  setIsApproving(false)
                  console.log("[AutoApprove] Aprobación confirmada, ejecutando transacción...")
                  executeTransaction()
                }
              }, 2000)

              // Timeout después de 30 segundos
              setTimeout(() => {
                clearInterval(checkApproval)
                setIsApproving(false)
                onError?.(new Error("Timeout esperando confirmación de aprobación"))
              }, 30000)
            },
            onError: (error) => {
              console.error("[AutoApprove] Error en aprobación:", error)
              setIsApproving(false)
              onError?.(error)
            },
          }
        )
      } catch (error) {
        console.error("[AutoApprove] Error:", error)
        setIsApproving(false)
        onError?.(error as Error)
      }
    },
    [currentAllowance, spenderAddress, writeContract, refetchAllowance, onError]
  )

  return {
    executeWithAutoApprove,
    isApproving,
    isWaitingApproval,
    isApprovalSuccess,
    currentAllowance: currentAllowance as bigint | undefined,
  }
}
