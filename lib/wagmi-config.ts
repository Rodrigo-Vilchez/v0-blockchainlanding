/**
 * CONFIGURACIÓN DE WAGMI
 * ======================
 * Configuración de Wagmi para conectar con Ethereum Sepolia.
 * Incluye configuración de chains, transports y conectores.
 */

import { http, createConfig } from "wagmi"
import { sepolia } from "wagmi/chains"
import { injected } from "wagmi/connectors"

// Configuración de Wagmi para Sepolia
export const config = createConfig({
  chains: [sepolia],
  connectors: [
    injected(), // MetaMask y otros wallets inyectados
  ],
  transports: {
    [sepolia.id]: http(),
  },
})
