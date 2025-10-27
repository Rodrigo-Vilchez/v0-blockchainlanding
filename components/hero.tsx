import { ConnectButton } from "@/components/connect-button"

/**
 * COMPONENTE HERO
 * ===============
 * Sección principal de la landing page.
 * Ocupa toda la altura de la pantalla (min-h-screen) para scroll perfecto.
 * Diseño compacto con contenido alineado a la izquierda.
 * Fondo animado con efecto parallax y flotación sutil.
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
        }}
      />

      <div className="absolute inset-0 bg-gradient-to-r from-blue-900/30 via-purple-900/20 to-transparent animate-pulse-slow" />

      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute w-2 h-2 bg-cyan-400/30 rounded-full animate-float-1"
          style={{ left: "10%", animationDelay: "0s", animationDuration: "15s" }}
        />
        <div
          className="absolute w-3 h-3 bg-purple-400/20 rounded-full animate-float-2"
          style={{ left: "30%", animationDelay: "2s", animationDuration: "18s" }}
        />
        <div
          className="absolute w-2 h-2 bg-fuchsia-400/25 rounded-full animate-float-3"
          style={{ left: "50%", animationDelay: "4s", animationDuration: "20s" }}
        />
        <div
          className="absolute w-3 h-3 bg-cyan-400/20 rounded-full animate-float-1"
          style={{ left: "70%", animationDelay: "1s", animationDuration: "16s" }}
        />
        <div
          className="absolute w-2 h-2 bg-purple-400/30 rounded-full animate-float-2"
          style={{ left: "85%", animationDelay: "3s", animationDuration: "19s" }}
        />
      </div>

      <div className="container mx-auto max-w-6xl relative z-10">
        <div className="flex flex-col items-start text-left gap-6 max-w-3xl">
          <h1 className="text-4xl md:text-6xl font-bold text-balance leading-tight text-white drop-shadow-[0_4px_20px_rgba(0,0,0,0.9)]">
            Dinero Programable con <span className="text-sky-400">Smart Contracts</span>
          </h1>

          <p className="text-lg md:text-xl text-white/90 text-pretty leading-relaxed drop-shadow-[0_2px_15px_rgba(0,0,0,0.9)]">
            Pagos automáticos, seguros y sin intermediarios.
          </p>

          <ConnectButton
            size="lg"
            className="gap-2 mt-2 bg-sky-600 hover:bg-purple-950 text-white shadow-lg hover:shadow-xl transition-all"
          />
        </div>
      </div>
    </section>
  )
}
