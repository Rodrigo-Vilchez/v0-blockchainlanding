import { FileText, Code2, Rocket } from "lucide-react"

const steps = [
  {
    icon: FileText,
    title: "Modelado Funcional",
    description: "Diseño del flujo de valor y las condiciones lógicas para cada distribución de pago.",
    step: "01",
  },
  {
    icon: Code2,
    title: "Desarrollo y Despliegue",
    description: "Programación de los Smart Contracts en Solidity y despliegue en la red de prueba seleccionada.",
    step: "02",
  },
  {
    icon: Rocket,
    title: "Interfaz DApp",
    description: "Creación de una aplicación descentralizada web para la interacción y simulación de transacciones.",
    step: "03",
  },
]

export function HowItWorks() {
  return (
    <section id="how-it-works" className="min-h-screen flex items-center justify-center py-20 px-4 bg-muted/30">
      <div className="container mx-auto max-w-6xl">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-4 text-balance">Metodología</h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto text-pretty">
            El proyecto se desarrolló en tres etapas principales
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
          {steps.map((step, index) => (
            <div key={index} className="relative">
              <div className="flex flex-col items-center text-center">
                <div className="relative mb-6">
                  <div className="w-20 h-20 rounded-2xl bg-primary flex items-center justify-center">
                    <step.icon className="w-10 h-10 text-primary-foreground" />
                  </div>
                  <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-sm font-bold text-secondary-foreground">
                    {step.step}
                  </div>
                </div>
                <h3 className="text-2xl font-bold mb-3">{step.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{step.description}</p>
              </div>
              {index < steps.length - 1 && (
                <div className="hidden md:block absolute top-10 left-[60%] w-[80%] h-0.5 bg-border" />
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
