// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/// @title OrderEscrow - Sistema de pagos escalonados SIMPLIFICADO (Didáctico)
/// @notice Versión simplificada para aprendizaje: struct mínimo, sin deadlines, bajo consumo de gas
contract OrderEscrow {
    // Custom Errors
    error InvalidAmount();
    error InvalidProvider();
    error OrderNotFound();
    error Unauthorized();
    error InvalidOrderState();
    error TransferFailed();

    // Enums
    enum OrderStatus {
        Created, // Orden creada, fondos depositados
        Shipped, // Proveedor marcó como enviado, 70% liberado
        Delivered, // Cliente confirmó entrega, 30% liberado
        Disputed, // Orden en disputa
        Refunded // Fondos devueltos al cliente
    }

    // Structs - ULTRA SIMPLIFICADO: solo lo esencial
    struct Order {
        address customer;
        address provider;
        uint256 totalAmount;
        OrderStatus status;
    }

    // State variables
    IERC20 public paymentToken;
    uint256 public orderCounter;

    // Mappings
    mapping(uint256 => Order) public orders;
    mapping(address => uint256[]) public customerOrders;
    mapping(address => uint256[]) public providerOrders;

    // Events - Simplificados
    event OrderCreated(
        uint256 indexed orderId,
        address customer,
        address provider,
        uint256 totalAmount
    );
    event OrderShipped(uint256 indexed orderId, uint256 paymentReleased);
    event OrderDelivered(uint256 indexed orderId, uint256 paymentReleased);
    event OrderRefunded(uint256 indexed orderId, uint256 refundAmount);
    event OrderDisputed(uint256 indexed orderId);

    constructor(address _paymentToken) {
        if (_paymentToken == address(0)) revert InvalidProvider();
        paymentToken = IERC20(_paymentToken);
    }

    /// @notice Crear una nueva orden - SIMPLIFICADO
    function createOrder(
        address provider,
        uint256 amount
    ) external returns (uint256 orderId) {
        if (provider == address(0)) revert InvalidProvider();
        if (amount == 0) revert InvalidAmount();

        orderId = ++orderCounter;

        orders[orderId] = Order({
            customer: msg.sender,
            provider: provider,
            totalAmount: amount,
            status: OrderStatus.Created
        });

        customerOrders[msg.sender].push(orderId);
        providerOrders[provider].push(orderId);

        emit OrderCreated(orderId, msg.sender, provider, amount);

        if (!paymentToken.transferFrom(msg.sender, address(this), amount))
            revert TransferFailed();
    }

    /// @notice Marcar como enviada - Libera 70%
    function markAsShipped(uint256 orderId) external {
        Order storage order = orders[orderId];

        if (order.customer == address(0)) revert OrderNotFound();
        if (msg.sender != order.provider) revert Unauthorized();
        if (order.status != OrderStatus.Created) revert InvalidOrderState();

        order.status = OrderStatus.Shipped;

        uint256 firstPayment = (order.totalAmount * 70) / 100;

        emit OrderShipped(orderId, firstPayment);

        if (!paymentToken.transfer(order.provider, firstPayment))
            revert TransferFailed();
    }

    /// @notice Confirmar entrega - Libera 30% restante
    function confirmDelivery(uint256 orderId) external {
        Order storage order = orders[orderId];

        if (order.customer == address(0)) revert OrderNotFound();
        if (msg.sender != order.customer) revert Unauthorized();
        if (order.status != OrderStatus.Shipped) revert InvalidOrderState();

        order.status = OrderStatus.Delivered;

        uint256 firstPayment = (order.totalAmount * 70) / 100;
        uint256 secondPayment = order.totalAmount - firstPayment;

        emit OrderDelivered(orderId, secondPayment);

        if (!paymentToken.transfer(order.provider, secondPayment))
            revert TransferFailed();
    }

    /// @notice Solicitar reembolso completo
    function requestRefund(uint256 orderId) external {
        Order storage order = orders[orderId];

        if (order.customer == address(0)) revert OrderNotFound();
        if (msg.sender != order.customer) revert Unauthorized();
        if (order.status != OrderStatus.Created) revert InvalidOrderState();

        order.status = OrderStatus.Refunded;

        emit OrderRefunded(orderId, order.totalAmount);

        if (!paymentToken.transfer(order.customer, order.totalAmount))
            revert TransferFailed();
    }

    /// @notice Disputar orden
    function disputeOrder(uint256 orderId) external {
        Order storage order = orders[orderId];

        if (order.customer == address(0)) revert OrderNotFound();
        if (msg.sender != order.customer) revert Unauthorized();
        if (order.status != OrderStatus.Shipped) revert InvalidOrderState();

        order.status = OrderStatus.Disputed;

        emit OrderDisputed(orderId);
    }

    /// @notice Obtener orden - Solo datos almacenados y calculados
    function getOrder(
        uint256 orderId
    )
        external
        view
        returns (
            uint256 _orderId,
            address customer,
            address provider,
            uint256 totalAmount,
            uint256 firstPayment,
            uint256 secondPayment,
            OrderStatus status,
            bool firstPaymentReleased,
            bool secondPaymentReleased
        )
    {
        Order memory order = orders[orderId];

        if (order.customer == address(0)) revert OrderNotFound();

        _orderId = orderId;
        customer = order.customer;
        provider = order.provider;
        totalAmount = order.totalAmount;
        firstPayment = (order.totalAmount * 70) / 100;
        secondPayment = order.totalAmount - firstPayment;
        status = order.status;
        firstPaymentReleased = (order.status == OrderStatus.Shipped ||
            order.status == OrderStatus.Delivered);
        secondPaymentReleased = (order.status == OrderStatus.Delivered);
    }

    // FUNCIONES OPCIONALES - Compatibilidad con frontend existente

    /// @notice Obtener órdenes de cliente
    function getCustomerOrders(
        address customer
    ) external view returns (uint256[] memory) {
        return customerOrders[customer];
    }

    /// @notice Obtener órdenes de proveedor
    function getProviderOrders(
        address provider
    ) external view returns (uint256[] memory) {
        return providerOrders[provider];
    }
}
