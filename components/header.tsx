"use client"
import { Menu, X } from "lucide-react"
import { useState } from "react"
import { ConnectButton } from "@/components/connect-button"

/**
 * COMPONENTE HEADER
 * =================
 * Barra de navegación principal con conexión de wallet.
 *
 * FUNCIONALIDADES:
 * - Logo y nombre del proyecto
 * - Navegación a secciones de la página
 * - Botón de conexión de wallet
 * - Menú responsive para móviles
 */
export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  const handleLinkClick = () => {
    setIsMenuOpen(false)
  }

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
      <div className="container mx-auto px-6 py-5">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="Blockchain Logo" className="w-10 h-10 object-contain" />
            <span className="text-xl font-bold text-foreground">SmartPay</span>
          </div>

          <nav className="hidden lg:flex items-center gap-10">
            <a
              href="#hero"
              onClick={handleLinkClick}
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Inicio
            </a>
            <a
              href="#features"
              onClick={handleLinkClick}
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Características
            </a>
            <a
              href="#contracts"
              onClick={handleLinkClick}
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Contratos
            </a>
            <a
              href="#how-it-works"
              onClick={handleLinkClick}
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Cómo Funciona
            </a>
            <a
              href="#benefits"
              onClick={handleLinkClick}
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Beneficios
            </a>
          </nav>

          <div className="hidden lg:block">
            <ConnectButton
              size="default"
              variant="outline"
              className="border-purple-900 text-purple-900 hover:bg-purple-900 hover:text-white"
            />
          </div>

          <button
            className="lg:hidden text-foreground"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label="Toggle menu"
          >
            {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {isMenuOpen && (
          <nav className="lg:hidden mt-6 pb-4 flex flex-col gap-4">
            <a
              href="#hero"
              onClick={handleLinkClick}
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Inicio
            </a>
            <a
              href="#features"
              onClick={handleLinkClick}
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Características
            </a>
            <a
              href="#contracts"
              onClick={handleLinkClick}
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Contratos
            </a>
            <a
              href="#how-it-works"
              onClick={handleLinkClick}
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Cómo Funciona
            </a>
            <a
              href="#benefits"
              onClick={handleLinkClick}
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Beneficios
            </a>
            <div className="pt-4 border-t border-border">
              <ConnectButton
                size="default"
                variant="outline"
                className="w-full border-purple-900 text-purple-900 hover:bg-purple-900 hover:text-white"
              />
            </div>
          </nav>
        )}
      </div>
    </header>
  )
}
