import { Layers, Users, Gift } from "lucide-react"

const contracts = [
  {
    icon: Layers,
    title: "Pago Escalonado",
    description: "Custodia y liberación de fondos en etapas para transacciones con condiciones de entrega.",
    color: "text-cyan-400",
    bgColor: "bg-cyan-500/10",
  },
  {
    icon: Users,
    title: "Regalías Automatizadas",
    description:
      "Distribución instantánea y verificable de ingresos entre múltiples creadores según porcentajes predefinidos.",
    color: "text-purple-400",
    bgColor: "bg-purple-500/10",
  },
  {
    icon: Gift,
    title: "Cashback",
    description: "Generación y envío automático de recompensas al cliente en tiempo real como parte de la compra.",
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
            Tres escenarios clave que demuestran la aplicación del código para gestionar transacciones complejas
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {contracts.map((contract, index) => (
            <div
              key={index}
              className="group p-8 rounded-2xl bg-card/80 backdrop-blur-sm border border-border hover:border-cyan-500/50 transition-all duration-300 hover:shadow-lg hover:shadow-cyan-500/10 hover:-translate-y-1"
            >
              <div className={`w-16 h-16 rounded-xl ${contract.bgColor} flex items-center justify-center mb-6`}>
                <contract.icon className={`w-8 h-8 ${contract.color}`} />
              </div>
              <h3 className="text-2xl font-bold mb-4">{contract.title}</h3>
              <p className="text-muted-foreground leading-relaxed">{contract.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
