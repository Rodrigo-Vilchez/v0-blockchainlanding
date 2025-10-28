import { Layers, Users, Gift } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"

const contracts = [
  {
    icon: Layers,
    title: "Pago Escalonado",
    description:
      "Custodia y liberación de fondos en etapas para transacciones con condiciones de entrega.",
    meta: "70% / 30%",
    color: "text-cyan-400",
    bgColor: "bg-cyan-500/10",
  },
  {
    icon: Users,
    title: "Regalías Automatizadas",
    description:
      "Distribución instantánea y verificable de ingresos entre múltiples creadores según porcentajes predefinidos.",
    meta: "Ej: 60% / 30% / 10%",
    color: "text-purple-400",
    bgColor: "bg-purple-500/10",
  },
  {
    icon: Gift,
    title: "Cashback",
    description:
      "Generación y envío automático de recompensas al cliente en tiempo real como parte de la compra.",
    meta: "5%",
    color: "text-fuchsia-400",
    bgColor: "bg-fuchsia-500/10",
  },
]

export function SmartContracts() {
  return (
    <section id="contracts" className="min-h-screen flex items-center justify-center py-20 px-4">
      <div className="container mx-auto max-w-6xl">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-4 text-balance">Smart Contracts Implementados</h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto text-pretty">
            Tres escenarios clave que muestran cómo nuestro código gestiona pagos, regalías y recompensas de forma
            automática y transparente.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {contracts.map((contract, index) => (
            <div
              key={index}
              className="group p-8 rounded-2xl bg-card/80 backdrop-blur-sm border border-border transition-all duration-300 hover:shadow-lg hover:-translate-y-1"
            >
              <div className={`w-16 h-16 rounded-xl ${contract.bgColor} flex items-center justify-center mb-4`}>
                <contract.icon className={`w-8 h-8 ${contract.color}`} />
              </div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-2xl font-bold">{contract.title}</h3>
                {contract.meta && <span className="text-sm text-muted-foreground">{contract.meta}</span>}
              </div>

              <p className="text-muted-foreground leading-relaxed mb-4">{contract.description}</p>

              {/* Pequeño listado de ejemplos / beneficios */}
              {contract.title === "Pago Escalonado" && (
                <ul className="text-sm text-muted-foreground mb-4 list-inside list-disc pl-4">
                  <li>Cliente deposita el total en el contrato (retención segura).</li>
                  <li>Al enviar: se libera el primer pago (ej. 70%).</li>
                  <li>Al confirmar entrega: se libera el resto (ej. 30%).</li>
                  <li>Disputas o reembolsos automáticos según condiciones.</li>
                </ul>
              )}

              {contract.title === "Regalías Automatizadas" && (
                <ul className="text-sm text-muted-foreground mb-4 list-inside list-disc pl-4">
                  <li>Configura wallets y porcentajes en el contrato.</li>
                  <li>Cada venta distribuye automáticamente las regalías.</li>
                  <li>Auditable en blockchain, sin intermediarios.</li>
                </ul>
              )}

              {contract.title === "Cashback" && (
                <ul className="text-sm text-muted-foreground mb-4 list-inside list-disc pl-4">
                  <li>Porcentaje configurable (ej. 5%) por transacción.</li>
                  <li>Recompensa instantánea enviada al comprador.</li>
                  <li>Ideal para programas de fidelidad sin backend adicional.</li>
                </ul>
              )}

              <div className="mt-4">
                <Link href="/dapp" aria-label={`Explorar ${contract.title}`}>
                  <Button size="sm" variant="outline" className="text-white/80">
                    Explorar DApp
                  </Button>
                </Link>
              </div>
            </div>
          ))}
        </div>

        <div className="text-center mt-12">
          <Link href="/dapp">
            <Button size="lg" className="bg-purple-600 hover:bg-purple-700 text-white">
              Probar la DApp
            </Button>
          </Link>
        </div>
      </div>
    </section>
  )
}
