# 🟣 Monad Web3 Domain Service & Marketplace (.monad)

Plataforma descentralizada de registro, resolución de nombres y marketplace de dominios Web3 (.monad) desplegada y operativa en **Monad Testnet**.

[![GitHub Pages](https://img.shields.io/badge/Demo-Live%20on%20GitHub%20Pages-brightgreen)](https://kuromi04.github.io/monad-domain-marketplace/)
[![Monad Testnet](https://img.shields.io/badge/Network-Monad%20Testnet%20(10143)-purple)](https://testnet.monadscan.com/)

---

## 🌐 Aplicación en Vivo (Producción)

* 🚀 **Web Oficial:** [https://kuromi04.github.io/monad-domain-marketplace/](https://kuromi04.github.io/monad-domain-marketplace/)
* 🦊 **Abrir directo en MetaMask App:** [Deep Link MetaMask Mobile](https://metamask.app.link/dapp/kuromi04.github.io/monad-domain-marketplace/)

---

## 📍 Smart Contracts Desplegados y Verificados en Monad

Los contratos fueron compilados con `Solidity 0.8.24` y están activos en la red Monad Testnet (Chain ID `10143`):

| Smart Contract | Archivo en Repositorio | Dirección On-Chain | Explorador Monadscan |
| :--- | :--- | :--- | :--- |
| **`MonadDomainRegistry`** | [`contracts/MonadDomainRegistry.sol`](./contracts/MonadDomainRegistry.sol) | `0x37502BC21D386eC8Eded562DD1626E767F1361b4` | [Ver Contrato](https://testnet.monadscan.com/address/0x37502BC21D386eC8Eded562DD1626E767F1361b4) |
| **`MonadDomainMarketplace`** | [`contracts/MonadDomainMarketplace.sol`](./contracts/MonadDomainMarketplace.sol) | `0x3A14D76195F6B8357F7e971dD7a9dDAAd89Cfb9D` | [Ver Contrato](https://testnet.monadscan.com/address/0x3A14D76195F6B8357F7e971dD7a9dDAAd89Cfb9D) |

---

## 📁 Estructura del Repositorio

```text
├── contracts/                        # Smart Contracts principales
│   ├── MonadDomainRegistry.sol       # Registro ERC-721 de dominios .monad, resolución y renovación
│   └── MonadDomainMarketplace.sol    # Marketplace descentralizado (compra, venta y ofertas en MON)
├── src/                              # Código fuente enlazado para Foundry
│   ├── MonadDomainRegistry.sol
│   └── MonadDomainMarketplace.sol
├── test/                             # Tests unitarios en Foundry
│   └── MonadDomainTest.t.sol         # Pruebas automatizadas (registro, compra y venta)
├── script/                           # Scripts de despliegue
│   └── Deploy.s.sol                  # Script de despliegue con Foundry
├── frontend/                         # Frontend Web3 interactivo
│   ├── index.html                    # Interfaz web con buscador, marketplace y "Mis Dominios"
│   └── contractsData.json            # ABIs y configuración de contratos
├── index.html                        # Punto de entrada para GitHub Pages
├── foundry.toml                      # Configuración de compilador y RPC de Monad
└── deployedContracts.json            # Metadatos del despliegue on-chain
```

---

## ⚙️ Características Implementadas

1. **Servicio de Nombres de Dominio (.monad)**:
   * Emisión bajo estándar ERC-721 (NFT).
   * Identificador único determinista `tokenId = keccak256(nombre)`.
   * Período de renovación y resolución inversa (`address` $\to$ `primaryDomain`).
2. **Marketplace Descentralizado**:
   * Publicación con aprobación previa de transferencia ERC-721.
   * Compraventa directa protegida contra reentrancy (`ReentrancyGuard`).
   * Sistema de ofertas (*bids*) con depósito en custodia.
3. **Compatibilidad Multi-Billetera**:
   * Detección automática en navegadores Web3 (MetaMask Mobile, Phantom, Rabby, Trust Wallet).
   * Soporte para estándar EIP-6963 y WalletConnect / QR para hardware wallets (Ledger).
