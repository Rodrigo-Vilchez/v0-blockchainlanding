/**
 * CONFIGURACIÓN DE CONTRATOS INTELIGENTES
 * ========================================
 * Direcciones y ABIs de los contratos desplegados en Sepolia.
 *
 * CONTRATOS:
 * 1. PaymentToken (ERC20) - Token de pago programable
 * 2. EscrowPayment - Sistema de pago escalonado
 */

// Dirección del token ERC20 en Sepolia
export const PAYMENT_TOKEN_ADDRESS = "0xf00eBCa89A14c4C9F5176A46394D965ee838E326" as const

// Dirección del contrato de pago escalonado en Sepolia
export const ESCROW_PAYMENT_ADDRESS = "0x52315181b261c4bf92f46C6B5B62f911e95A9Db1" as const

// ABI del token ERC20 (funciones principales)
export const PAYMENT_TOKEN_ABI = [
  {
    inputs: [],
    name: "name",
    outputs: [{ internalType: "string", name: "", type: "string" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "symbol",
    outputs: [{ internalType: "string", name: "", type: "string" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "decimals",
    outputs: [{ internalType: "uint8", name: "", type: "uint8" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "address", name: "account", type: "address" }],
    name: "balanceOf",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { internalType: "address", name: "to", type: "address" },
      { internalType: "uint256", name: "amount", type: "uint256" },
    ],
    name: "transfer",
    outputs: [{ internalType: "bool", name: "", type: "bool" }],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "address", name: "spender", type: "address" },
      { internalType: "uint256", name: "amount", type: "uint256" },
    ],
    name: "approve",
    outputs: [{ internalType: "bool", name: "", type: "bool" }],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "address", name: "owner", type: "address" },
      { internalType: "address", name: "spender", type: "address" },
    ],
    name: "allowance",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "faucet",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "FAUCET_AMOUNT",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: "address", name: "recipient", type: "address" },
      { indexed: false, internalType: "uint256", name: "amount", type: "uint256" },
    ],
    name: "FaucetUsed",
    type: "event",
  },
] as const

// ABI del contrato de pago escalonado (funciones principales)
// ABI del contrato de pago escalonado (OrderEscrow real en Sepolia)
export const ESCROW_PAYMENT_ABI = [
  {
    inputs: [
      { internalType: "address", name: "provider", type: "address" },
      { internalType: "uint256", name: "amount", type: "uint256" }
    ],
    name: "createOrder",
    outputs: [{ internalType: "uint256", name: "orderId", type: "uint256" }],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint256", name: "orderId", type: "uint256" }],
    name: "markAsShipped",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint256", name: "orderId", type: "uint256" }],
    name: "confirmDelivery",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint256", name: "orderId", type: "uint256" }],
    name: "requestRefund",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint256", name: "orderId", type: "uint256" }],
    name: "disputeOrder",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint256", name: "orderId", type: "uint256" }],
    name: "getOrder",
    outputs: [
      {
        components: [
          { internalType: "uint256", name: "orderId", type: "uint256" },
          { internalType: "address", name: "customer", type: "address" },
          { internalType: "address", name: "provider", type: "address" },
          { internalType: "uint256", name: "totalAmount", type: "uint256" },
          { internalType: "uint256", name: "firstPayment", type: "uint256" },
          { internalType: "uint256", name: "secondPayment", type: "uint256" },
          { internalType: "uint8", name: "status", type: "uint8" },
          { internalType: "uint256", name: "createdAt", type: "uint256" },
          { internalType: "uint256", name: "shippedAt", type: "uint256" },
          { internalType: "uint256", name: "deadline", type: "uint256" },
          { internalType: "bool", name: "firstPaymentReleased", type: "bool" },
          { internalType: "bool", name: "secondPaymentReleased", type: "bool" },
        ],
        internalType: "struct OrderEscrow.Order",
        name: "order",
        type: "tuple",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "orderCounter",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
] as const

// Estados de las órdenes
export enum OrderState {
  Created = 0,
  Delivered = 1,
  Disputed = 2,
  Refunded = 3,
}

// Tipo para las órdenes
export interface Order {
  orderId: bigint
  customer: string
  provider: string
  totalAmount: bigint
  deadline: bigint
  state: OrderState
  createdAt: bigint
}

export const TOKEN_CONTRACT = {
  address: PAYMENT_TOKEN_ADDRESS,
  abi: PAYMENT_TOKEN_ABI,
} as const

export const ESCROW_CONTRACT = {
  address: ESCROW_PAYMENT_ADDRESS,
  abi: ESCROW_PAYMENT_ABI,
} as const
