import { Shield, Zap, Users, Lock } from "lucide-react"

const features = [
  {
    icon: Zap,
    title: "Automatización Total",
    description: "Los contratos ejecutan pagos automáticamente una vez cumplidas las condiciones predefinidas.",
  },
  {
    icon: Shield,
    title: "Seguridad y Transparencia",
    description: "Todas las transacciones son verificables en blockchain, garantizando confianza basada en código.",
  },
  {
    icon: Users,
    title: "Sin Intermediarios",
    description: "Elimina terceros de confianza, reduciendo costos y aumentando la eficiencia del sistema.",
  },
  {
    icon: Lock,
    title: "Inmutabilidad",
    description: "Las reglas de pago son inmutables, proporcionando un marco de confianza inquebrantable.",
  },
]

/**
 * COMPONENTE FEATURES
 * ===================
 * Muestra las características principales del proyecto.
 * Ocupa toda la altura de la pantalla para scroll perfecto.
 */
export function Features() {
  return (
    <section
      id="features"
      className="scroll-mt-6 min-h-screen flex items-center justify-center py-20 px-4 bg-gradient-to-b from-transparent to-purple-950/20"
    >
      <div className="container mx-auto max-w-6xl">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {features.map((feature, index) => (
            <div
              key={index}
              className="group p-8 rounded-2xl bg-card/80 backdrop-blur-sm border border-border hover:border-cyan-500/50 transition-all duration-300 hover:shadow-lg hover:shadow-cyan-500/10"
            >
              <div className="w-12 h-12 rounded-xl bg-cyan-500/10 flex items-center justify-center mb-6 group-hover:bg-cyan-500/20 transition-colors">
                <feature.icon className="w-6 h-6 text-cyan-400" />
              </div>
              <h3 className="text-2xl font-bold mb-3">{feature.title}</h3>
              <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
