import { AnimatedBackground } from "@/components/animated-background"
import { Header } from "@/components/header"
import { Hero } from "@/components/hero"
import { Features } from "@/components/features"
import { SmartContracts } from "@/components/smart-contracts"
import { HowItWorks } from "@/components/how-it-works"
import { Benefits } from "@/components/benefits"
import { Footer } from "@/components/footer"

/**
 * PÁGINA PRINCIPAL
 * ================
 * Landing page del proyecto de Dinero Programable.
 *
 * ESTRUCTURA:
 * - AnimatedBackground: Fondo animado futurista
 * - Header: Navegación con botón de wallet
 * - Hero: Sección principal con título y CTA
 * - Features: Características principales (solo recuadros)
 * - SmartContracts: Tipos de contratos disponibles
 * - HowItWorks: Proceso de funcionamiento
 * - Benefits: Beneficios del sistema
 * - Footer: Pie de página simple
 *
 * CÓMO EDITAR:
 * - Para cambiar el orden: reordena los componentes
 * - Para ocultar secciones: comenta o elimina el componente
 * - Para agregar secciones: crea un nuevo componente e impórtalo
 */
export default function Home() {
  return (
    <main className="min-h-screen relative scroll-smooth">
      {/* Fondo animado - siempre visible detrás de todo */}
      <AnimatedBackground />

      {/* Contenido principal */}
      <Header className="min-h-screen" />
      <Hero className="min-h-screen" />
      <Features className="min-h-screen" />
      <SmartContracts className="min-h-screen" />
      <HowItWorks className="min-h-screen" />
      <Benefits className="min-h-screen" />
      <Footer />
    </main>
  )
}
