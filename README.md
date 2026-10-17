# Monad Web3 Domain Service & Marketplace (.monad)

Plataforma descentralizada de registro y marketplace para dominios Web3 sobre la red **Monad Testnet**.

## 📁 Estructura del Proyecto

```
monad-domain-marketplace/
├── contracts/
│   ├── MonadDomainRegistry.sol      # Contrato ERC-721 para registro, resolución inversa y metadatos (.monad)
│   └── MonadDomainMarketplace.sol   # Contrato de Marketplace para venta fija, compras y ofertas (bids) en MON
├── scripts/
│   └── deploy.js                    # Script de despliegue automatizado en Monad Testnet
├── hardhat.config.js                # Configuración de compilador y red RPC de Monad
└── frontend/
    └── src/
        ├── config/monadChain.ts     # Configuración de red de Monad con Viem
        └── components/DomainApp.tsx # Interfaz para registro y publicación en marketplace
```

---

## ⚙️ Parámetros de Monad Testnet

| Parámetro | Valor |
| :--- | :--- |
| **Network Name** | Monad Testnet |
| **Chain ID** | `10143` |
| **Moneda** | `MON` |
| **RPC URL** | `https://testnet-rpc.monad.xyz` |
| **Explorador** | [https://testnet.monadscan.com](https://testnet.monadscan.com) |
| **Faucet** | [https://faucet.monad.xyz](https://faucet.monad.xyz) |

---

## 🚀 Despliegue de los Smart Contracts

1. **Instalar dependencias:**
   ```bash
   npm install --save-dev hardhat @nomicfoundation/hardhat-toolbox @openzeppelin/contracts dotenv
   ```

2. **Configurar tu clave privada en variables de entorno o `.env`:**
   ```bash
   export PRIVATE_KEY="0xTU_CLAVE_PRIVADA"
   export MONAD_TESTNET_RPC="https://testnet-rpc.monad.xyz"
   ```

3. **Compilar y desplegar en Monad Testnet:**
   ```bash
   npx hardhat run scripts/deploy.js --network monadTestnet
   ```

---

## 🔒 Consideraciones Específicas de Monad (EIP-7702)

* Monad implementa **EIP-7702** permitiendo a las cuentas EOA delegar código de smart wallets y patrocinar gas.
* Si el usuario usa una cuenta delegada con EIP-7702, las transacciones que dejen el saldo de la cuenta por debajo del umbral de reserva de **10 MON** revertirán automáticamente en la capa de ejecución de Monad.
