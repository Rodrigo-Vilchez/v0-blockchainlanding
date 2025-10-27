import { Sparkles, Shield, Zap, Globe, Lock, TrendingUp } from "lucide-react"

const benefits = [
  {
    icon: Zap,
    title: "Mayor Eficiencia",
    description: "Automatización completa elimina procesos manuales y reduce tiempos de ejecución.",
  },
  {
    icon: Shield,
    title: "Transparencia Total",
    description: "Todas las transacciones son auditables y verificables en tiempo real en la blockchain.",
  },
  {
    icon: Lock,
    title: "Inmutabilidad",
    description: "Las reglas de pago no pueden ser alteradas, garantizando confianza entre las partes.",
  },
  {
    icon: Globe,
    title: "Sin Intermediarios",
    description: "Elimina terceros de confianza, reduciendo costos operativos significativamente.",
  },
  {
    icon: TrendingUp,
    title: "Programabilidad",
    description: "Define reglas de negocio complejas que se ejecutan automáticamente según condiciones.",
  },
  {
    icon: Sparkles,
    title: "Confianza Basada en Código",
    description: "El código es ley: las transacciones se ejecutan exactamente como fueron programadas.",
  },
]

export function Benefits() {
  return (
    <section id="benefits" className="scroll-mt-6 min-h-screen flex items-center justify-center py-20 px-4">
      <div className="container mx-auto max-w-6xl">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-4 text-balance">Beneficios del Dinero Programable</h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto text-pretty">
            Ventajas que transforman la forma de gestionar transacciones económicas
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {benefits.map((benefit, index) => (
            <div
              key={index}
              className="group p-6 rounded-xl bg-card border border-border hover:border-primary/50 transition-all duration-300"
            >
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 group-hover:bg-primary/20 transition-colors">
                  <benefit.icon className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="text-lg font-bold mb-2">{benefit.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{benefit.description}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
