// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title RoyaltyDistributor
 * @notice Contrato para la distribución automática de regalías entre múltiples beneficiarios
 * @dev Versión sin restricciones para fines didácticos - Cualquier usuario puede gestionar beneficiarios
 *
 * EJEMPLO DE USO:
 * 1. setBeneficiaries("song1", [0xAddr1, 0xAddr2], [7000, 3000]) // 70% y 30%
 * 2. Aprobar tokens al contrato: token.approve(contractAddr, amount)
 * 3. distributeRoyalties("song1", tokenAddr, amount)
 * 4. Los beneficiarios reciben automáticamente sus tokens
 */
contract RoyaltyDistributor is ReentrancyGuard {
    // Custom Errors
    error ArrayLengthMismatch();
    error InvalidAddress();
    error InvalidPercentage();
    error InvalidTotalPercentage(); // Debe ser exactamente 10000 (100%)
    error ETHNotSupported();
    error InvalidAmount();
    error NoBeneficiariesSet();
    error TokenTransferFailed();
    error NoTokenBalance();

    struct Beneficiary {
        address payable wallet;
        uint256 percentage; // En puntos base (10000 = 100%)
    }

    // Mapeo de ID de obra a lista de beneficiarios
    mapping(string => Beneficiary[]) public beneficiaries;

    /**
     * @dev Constructor que establece un beneficiario por defecto
     * @notice El deployer se configura como beneficiario único en "default"
     */
    constructor() {
        // Configurar beneficiario default con 100% para el deployer
        beneficiaries["default"].push(
            Beneficiary({wallet: payable(msg.sender), percentage: 10000})
        );

        address[] memory defaultAddr = new address[](1);
        defaultAddr[0] = msg.sender;
        uint256[] memory defaultPerc = new uint256[](1);
        defaultPerc[0] = 10000;

        emit BeneficiariesUpdated("default", defaultAddr, defaultPerc);
    }

    // Eventos
    event BeneficiariesUpdated(
        string indexed workId,
        address[] beneficiaries,
        uint256[] percentages
    );
    event RoyaltiesDistributed(
        string indexed workId,
        address token,
        uint256 totalAmount,
        address[] recipients,
        uint256[] amounts
    );

    /**
     * @notice Obtiene todos los beneficiarios de una obra
     * @param workId Identificador de la obra
     * @return addresses Lista de direcciones de beneficiarios
     * @return percentages Lista de porcentajes correspondientes
     */
    function getBeneficiaries(
        string calldata workId
    )
        external
        view
        returns (address[] memory addresses, uint256[] memory percentages)
    {
        Beneficiary[] storage workBeneficiaries = beneficiaries[workId];
        uint256 length = workBeneficiaries.length;

        addresses = new address[](length);
        percentages = new uint256[](length);

        for (uint256 i = 0; i < length; i++) {
            addresses[i] = workBeneficiaries[i].wallet;
            percentages[i] = workBeneficiaries[i].percentage;
        }

        return (addresses, percentages);
    }

    /**
     * @notice Obtiene el número de beneficiarios de una obra
     * @param workId Identificador de la obra
     * @return Cantidad de beneficiarios configurados
     */
    function getBeneficiariesCount(
        string calldata workId
    ) external view returns (uint256) {
        return beneficiaries[workId].length;
    }

    /**
     * @notice Verifica si hay beneficiarios configurados para una obra
     * @param workId Identificador de la obra
     * @return true si hay beneficiarios configurados
     */
    function hasBeneficiaries(
        string calldata workId
    ) external view returns (bool) {
        return beneficiaries[workId].length > 0;
    }

    /**
     * @notice Calcula cómo se distribuirán los fondos sin ejecutar la transacción
     * @dev Útil para preview antes de distribuir
     * @param workId Identificador de la obra
     * @param amount Cantidad a distribuir
     * @return recipients Lista de receptores
     * @return amounts Lista de cantidades que recibirá cada uno
     */
    function previewDistribution(
        string calldata workId,
        uint256 amount
    )
        external
        view
        returns (address[] memory recipients, uint256[] memory amounts)
    {
        Beneficiary[] storage workBeneficiaries = beneficiaries[workId];
        uint256 length = workBeneficiaries.length;

        if (length == 0) {
            return (new address[](0), new uint256[](0));
        }

        recipients = new address[](length);
        amounts = new uint256[](length);

        uint256 distributed = 0;
        for (uint256 i = 0; i < length; i++) {
            Beneficiary memory beneficiary = workBeneficiaries[i];
            uint256 share = (amount * beneficiary.percentage) / 10000;

            if (i == length - 1) {
                share = amount - distributed;
            } else {
                distributed += share;
            }

            recipients[i] = beneficiary.wallet;
            amounts[i] = share;
        }

        return (recipients, amounts);
    }

    /**
     * @dev Establece o actualiza los beneficiarios para una obra específica
     * @notice Cualquier usuario puede configurar beneficiarios para su propia obra
     * @param workId Identificador único de la obra
     * @param _beneficiaries Lista de direcciones de los beneficiarios
     * @param _percentages Porcentajes para cada beneficiario (en puntos base, 10000 = 100%)
     * @notice La suma de porcentajes debe ser exactamente 10000 (100%) para evitar fondos bloqueados
     */
    function setBeneficiaries(
        string calldata workId,
        address[] calldata _beneficiaries,
        uint256[] calldata _percentages
    ) external {
        if (_beneficiaries.length != _percentages.length) {
            revert ArrayLengthMismatch();
        }
        if (_beneficiaries.length == 0) {
            revert InvalidAddress();
        }

        // Eliminar beneficiarios existentes
        delete beneficiaries[workId];

        // Añadir nuevos beneficiarios y calcular total
        uint256 totalPercentage = 0;
        for (uint256 i = 0; i < _beneficiaries.length; i++) {
            if (_beneficiaries[i] == address(0)) {
                revert InvalidAddress();
            }
            if (_percentages[i] == 0) {
                revert InvalidPercentage();
            }

            beneficiaries[workId].push(
                Beneficiary({
                    wallet: payable(_beneficiaries[i]),
                    percentage: _percentages[i]
                })
            );

            totalPercentage += _percentages[i];
        }

        // Validar que la suma sea exactamente 100% para evitar fondos remanentes
        if (totalPercentage != 10000) {
            revert InvalidTotalPercentage();
        }

        emit BeneficiariesUpdated(workId, _beneficiaries, _percentages);
    }

    /**
     * @dev Distribuye los fondos entre los beneficiarios según los porcentajes establecidos
     * @notice Solo acepta tokens ERC20, no ETH
     * @param workId Identificador de la obra
     * @param tokenAddress Dirección del token ERC20
     * @param amount Cantidad total a distribuir
     * @notice Garantiza que el 100% de los fondos se distribuyan sin pérdidas por redondeo
     */
    function distributeRoyalties(
        string calldata workId,
        address tokenAddress,
        uint256 amount
    ) external nonReentrant {
        if (tokenAddress == address(0)) {
            revert ETHNotSupported();
        }
        if (amount == 0) {
            revert InvalidAmount();
        }

        Beneficiary[] storage workBeneficiaries = beneficiaries[workId];
        if (workBeneficiaries.length == 0) {
            revert NoBeneficiariesSet();
        }

        // Transferir tokens al contrato primero
        IERC20 token = IERC20(tokenAddress);
        if (!token.transferFrom(msg.sender, address(this), amount)) {
            revert TokenTransferFailed();
        }

        address[] memory recipients = new address[](workBeneficiaries.length);
        uint256[] memory amounts = new uint256[](workBeneficiaries.length);

        // Distribuir fondos con precisión mejorada
        uint256 totalDistributed = 0;

        for (uint256 i = 0; i < workBeneficiaries.length; i++) {
            Beneficiary memory beneficiary = workBeneficiaries[i];
            uint256 share;

            if (i == workBeneficiaries.length - 1) {
                // El último beneficiario recibe todo lo que queda
                // Esto garantiza que no queden fondos sin distribuir por redondeo
                share = amount - totalDistributed;
            } else {
                // Calcular la parte proporcional
                share = (amount * beneficiary.percentage) / 10000;
                totalDistributed += share;
            }

            // Transferir tokens al beneficiario
            if (!token.transfer(beneficiary.wallet, share)) {
                revert TokenTransferFailed();
            }

            // Guardar para el evento
            recipients[i] = beneficiary.wallet;
            amounts[i] = share;
        }

        emit RoyaltiesDistributed(
            workId,
            tokenAddress,
            amount,
            recipients,
            amounts
        );
    }

    /**
     * @dev Permite a cualquier usuario retirar tokens ERC20 del contrato
     * @notice Para fines didácticos - En producción esto debería estar restringido
     * @notice Solo soporta tokens ERC20
     * @param tokenAddress Dirección del token ERC20
     */
    function withdrawFunds(address tokenAddress) external {
        if (tokenAddress == address(0)) {
            revert ETHNotSupported();
        }

        IERC20 token = IERC20(tokenAddress);
        uint256 balance = token.balanceOf(address(this));
        if (balance == 0) {
            revert NoTokenBalance();
        }
        if (!token.transfer(msg.sender, balance)) {
            revert TokenTransferFailed();
        }
    }
}
