import { AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { useNetworkCheck } from "@/hooks/useNetworkCheck"

export function NetworkAlert() {
  const { isWrongNetwork, switchToSepolia } = useNetworkCheck()

  if (!isWrongNetwork) return null

  return (
    <Alert variant="warning" className="mb-6">
      <div className="flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 mt-0.5 flex-shrink-0" />
        <div className="flex-1">
          <AlertTitle>Red Incorrecta</AlertTitle>
          <AlertDescription className="mt-2">
            Estás conectado a la red incorrecta. Por favor, cambia a Sepolia Testnet para usar esta aplicación.
          </AlertDescription>
          <Button
            onClick={switchToSepolia}
            size="sm"
            className="mt-3 bg-yellow-600 hover:bg-yellow-700 text-white"
          >
            Cambiar a Sepolia
          </Button>
        </div>
      </div>
    </Alert>
  )
}
