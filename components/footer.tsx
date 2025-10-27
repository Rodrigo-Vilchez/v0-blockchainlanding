/**
 * COMPONENTE FOOTER
 * =================
 * Pie de página simple y directo.
 */
export function Footer() {
  return (
    <footer className="py-8 px-4 border-t border-border bg-muted/30">
      <div className="container mx-auto max-w-6xl text-center">
        <p className="text-sm text-muted-foreground mb-2">
          Implementación de Dinero Programable mediante Contratos Inteligentes en Blockchain
        </p>
        <p className="text-xs text-muted-foreground">© 2025 SmartPay. Todos los derechos reservados.</p>
      </div>
    </footer>
  )
}
