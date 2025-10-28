import { ExternalLink } from "lucide-react"
import { Button } from "@/components/ui/button"

interface TransactionLinkProps {
  hash: string
  label?: string
}

export function TransactionLink({ hash, label = "Ver en Etherscan" }: TransactionLinkProps) {
  const etherscanUrl = `https://sepolia.etherscan.io/tx/${hash}`

  return (
    <div className="bg-green-500/20 border border-green-500/50 rounded-lg p-4 flex flex-col gap-3">
      <div className="flex items-center gap-2 text-green-400">
        <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
        <span className="font-semibold">Transacción exitosa</span>
      </div>
      <div className="flex items-center justify-between gap-2">
        <code className="text-xs text-white/70 truncate flex-1">{hash}</code>
        <Button
          variant="outline"
          size="sm"
          onClick={() => window.open(etherscanUrl, "_blank")}
          className="border-green-500/50 text-green-400 hover:bg-green-500/10 flex-shrink-0"
        >
          {label}
          <ExternalLink className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </div>
  )
}
