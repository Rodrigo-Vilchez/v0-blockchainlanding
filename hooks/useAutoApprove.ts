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

  const { writeContractAsync } = useWriteContract()

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
      executeTransaction: () => Promise<string>
    ): Promise<string | undefined> => {
      try {
        const allowance = (currentAllowance as bigint) || BigInt(0)

        // Si ya hay suficiente allowance, ejecutar directamente
        if (allowance >= amount) {
          console.log("[AutoApprove] Suficiente allowance, ejecutando transacción...")
          const txHash = await executeTransaction()
          return txHash
        }

        // Aprobar con un buffer del 20% para futuras transacciones
        const approveAmount = (amount * BigInt(120)) / BigInt(100)
        console.log(`[AutoApprove] Aprobando ${approveAmount} tokens...`)

        setIsApproving(true)

        try {
          // Aprobar tokens
          const hash = await writeContractAsync({
            address: PAYMENT_TOKEN_ADDRESS,
            abi: PAYMENT_TOKEN_ABI,
            functionName: "approve",
            args: [spenderAddress, approveAmount],
            gas: BigInt(100000), // Gas explícito
          })

          console.log("[AutoApprove] Aprobación enviada:", hash)
          setApprovalHash(hash)

          // Esperar confirmación
          console.log("[AutoApprove] Esperando confirmación de aprobación...")
          let retries = 0
          const maxRetries = 15 // 30 segundos (15 * 2s)

          while (retries < maxRetries) {
            await new Promise((resolve) => setTimeout(resolve, 2000))
            const newAllowance = await refetchAllowance()

            if (newAllowance.data && (newAllowance.data as bigint) >= amount) {
              setIsApproving(false)
              console.log("[AutoApprove] Aprobación confirmada, ejecutando transacción...")
              const txHash = await executeTransaction()
              return txHash
            }

            retries++
          }

          // Si llegamos aquí, timeout
          setIsApproving(false)
          const timeoutError = new Error("Timeout esperando confirmación de aprobación")
          onError?.(timeoutError)
          throw timeoutError
        } catch (error: any) {
          console.error("[AutoApprove] Error en aprobación:", error)
          setIsApproving(false)
          onError?.(error)
          throw error
        }
      } catch (error) {
        console.error("[AutoApprove] Error:", error)
        setIsApproving(false)
        onError?.(error as Error)
        throw error
      }
    },
    [currentAllowance, spenderAddress, writeContractAsync, refetchAllowance, onError]
  )

  return {
    executeWithAutoApprove,
    isApproving,
    isWaitingApproval,
    isApprovalSuccess,
    currentAllowance: currentAllowance as bigint | undefined,
  }
}
