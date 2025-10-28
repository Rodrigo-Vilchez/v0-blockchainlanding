import { ConnectButton } from "@rainbow-me/rainbowkit"
import { Button } from "@/components/ui/button"
import Link from "next/link"

/**
 * COMPONENTE HERO
 * ===============
 * Versión mejorada del hero: dos columnas, titular claro, subtítulo breve,
 * lista con beneficios y CTAs para conectar o ver los casos de uso.
 */
export function Hero() {
  return (
    <section id="hero" className="min-h-screen flex items-center px-4 pt-20 relative overflow-hidden">
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat animate-slow-zoom"
        style={{
          backgroundImage: "url('/blockchain-hero.png')",
          backgroundSize: "cover",
          backgroundPosition: "center center",
          filter: "brightness(0.45)",
        }}
      />

      <div className="absolute inset-0 bg-gradient-to-r from-blue-900/40 via-purple-900/30 to-transparent" />

      <div className="container mx-auto max-w-6xl relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
          <div className="text-left">
            <h1 className="text-4xl md:text-6xl font-bold text-white leading-tight">
              Construye con confianza: <span className="text-cyan-300">Dinero programable</span>
            </h1>

            <p className="mt-4 text-lg text-white/85 max-w-xl">
              Pagos escalonados, regalías automáticas y programas de cashback — todo gestionado por smart
              contracts, sin intermediarios.
            </p>

            <ul className="mt-6 space-y-2 text-white/80 text-sm">
              <li>• Retención segura de fondos y liberación por etapas.</li>
              <li>• Distribución automática de regalías entre creadores.</li>
              <li>• Recompensas instantáneas para programas de fidelidad.</li>
            </ul>

            <div className="mt-6 flex items-center gap-3">
              <ConnectButton />
              <Link href="#contracts">
                <Button variant="outline" size="lg" className="text-white/90">
                  Ver casos de uso
                </Button>
              </Link>
            </div>
          </div>

          <div className="hidden md:flex items-center justify-center">
            <div className="w-full max-w-md bg-white/5 backdrop-blur-md rounded-2xl p-6 border border-white/10">
              <h4 className="text-white font-semibold mb-3">Ejemplo: Pago Escalonado</h4>
              <p className="text-white/80 text-sm mb-4">
                El comprador deposita 100 tokens en custodia. Al enviar se libera 70 tokens. Al confirmar entrega se
                liberan los 30 tokens restantes.
              </p>

              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-white/70">Total</p>
                  <p className="text-lg font-bold text-white">100 TOK</p>
                </div>

                <div>
                  <p className="text-xs text-white/70">1er pago</p>
                  <p className="text-lg font-semibold text-cyan-300">70 TOK</p>
                </div>
              </div>

              <div className="mt-6">
                <Link href="/dapp">
                  <Button className="w-full bg-cyan-500 hover:bg-cyan-600 text-white">Probar la DApp</Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
