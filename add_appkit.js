const fs = require('fs');
const path = "/data/data/com.termux/files/home/Projects/monad-domain-marketplace/frontend/index.html";

let html = fs.readFileSync(path, 'utf8');

// Agregar las librerías oficiales de AppKit (WalletConnect Web3Modal) y soporte QR/Hardware
const appKitScript = `
  <!-- WalletConnect / AppKit CDN -->
  <script src="https://cdn.jsdelivr.net/npm/@walletconnect/modal@2.6.2/dist/index.umd.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/@walletconnect/ethereum-provider@2.14.0/dist/index.umd.js"></script>
`;

if (!html.includes("@walletconnect/modal")) {
  html = html.replace('<script src="https://cdnjs.cloudflare.com/ajax/libs/ethers/6.13.2/ethers.umd.min.js"></script>', 
    '<script src="https://cdnjs.cloudflare.com/ajax/libs/ethers/6.13.2/ethers.umd.min.js"></script>\n' + appKitScript);
}

// Inyectar el botón y la lógica de WalletConnect en el modal
const updatedModalFunction = `
    async function connectWalletConnect() {
      closeWalletModal();
      showToast("Iniciando WalletConnect...", true);
      try {
        if (!window.WalletConnectEthereumProvider) {
          // Fallback dinamico
          const wcScript = document.createElement("script");
          wcScript.src = "https://unpkg.com/@walletconnect/ethereum-provider@2.18.0/dist/index.umd.js";
          document.head.appendChild(wcScript);
          await new Promise(res => wcScript.onload = res);
        }

        const EthereumProvider = window.WalletConnectEthereumProvider?.default || window.WalletConnectEthereumProvider;
        const wcProvider = await EthereumProvider.init({
          projectId: "c4f79cc821944d9680842e34466bfb", // ID publico universal Web3
          chains: [10143],
          showQrModal: true,
          optionalChains: [10143],
          rpcMap: {
            10143: "https://testnet-rpc.monad.xyz"
          },
          metadata: {
            name: "Monad Domain Marketplace",
            description: "Marketplace de dominios .monad",
            url: window.location.origin,
            icons: ["https://docs.monad.xyz/favicon.ico"]
          }
        });

        await wcProvider.enable();
        connectWithProvider(wcProvider, "WalletConnect / Ledger");
      } catch (err) {
        console.error(err);
        showToast("Error en WalletConnect: " + err.message, false);
      }
    }

    function openWalletModal() {
      const modal = document.getElementById("walletModal");
      const list = document.getElementById("walletList");
      list.innerHTML = "";

      const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

      // 1. Opcion Universal: WalletConnect (Ledger, Trust, Rainbow, 300+ wallets con QR)
      const wcBtn = document.createElement("button");
      wcBtn.style.cssText = "display:flex; align-items:center; gap:12px; width:100%; padding:14px 16px; background:#1e293b; border:1px solid #3b82f6; border-radius:12px; color:#fff; font-weight:700; cursor:pointer; font-size:15px; margin-bottom:8px;";
      wcBtn.innerHTML = \`<img src="https://raw.githubusercontent.com/WalletConnect/walletconnect-assets/master/Logo/Blue%20(Default)/Logo.svg" width="28" height="28" /> WalletConnect / Ledger / QR\`;
      wcBtn.onclick = connectWalletConnect;
      list.appendChild(wcBtn);

      // 2. Opcion MetaMask
      const mmBtn = document.createElement("button");
      mmBtn.style.cssText = "display:flex; align-items:center; gap:12px; width:100%; padding:14px 16px; background:#222538; border:1px solid rgba(255,255,255,0.1); border-radius:12px; color:#fff; font-weight:700; cursor:pointer; font-size:15px;";
      mmBtn.innerHTML = \`<img src="https://upload.wikimedia.org/wikipedia/commons/3/36/MetaMask_Fox.svg" width="28" height="28" /> MetaMask App / Extensión\`;
      
      mmBtn.onclick = () => {
        if (window.ethereum) {
          connectWithProvider(window.ethereum, "MetaMask");
        } else if (isMobile) {
          const cleanUrl = window.location.href.replace(/^https?:\\/\\//, "");
          window.location.href = "https://metamask.app.link/dapp/" + cleanUrl;
        } else {
          connectWalletConnect();
        }
      };
      list.appendChild(mmBtn);

      // 3. Proveedores detectados (Phantom, Rabby, Coinbase, etc via EIP-6963)
      if (detectedWallets.length > 0) {
        detectedWallets.forEach(wallet => {
          if (wallet.info.name.toLowerCase().includes("metamask")) return;
          const btn = document.createElement("button");
          btn.style.cssText = "display:flex; align-items:center; gap:12px; width:100%; padding:14px 16px; background:#222538; border:1px solid rgba(255,255,255,0.08); border-radius:12px; color:#fff; font-weight:700; cursor:pointer; font-size:15px;";
          btn.innerHTML = \`<img src="\${wallet.info.icon}" width="28" height="28" style="border-radius:6px;" /> \${wallet.info.name}\`;
          btn.onclick = () => connectWithProvider(wallet.provider, wallet.info.name);
          list.appendChild(btn);
        });
      }

      // 4. Billetera inyectada generica
      if (window.ethereum && detectedWallets.length === 0) {
        const defaultBtn = document.createElement("button");
        defaultBtn.style.cssText = "display:flex; align-items:center; gap:12px; width:100%; padding:14px 16px; background:#222538; border:1px solid rgba(255,255,255,0.08); border-radius:12px; color:#fff; font-weight:700; cursor:pointer; font-size:15px;";
        defaultBtn.innerHTML = \`🌐 Billetera Inyectada del Navegador\`;
        defaultBtn.onclick = () => connectWithProvider(window.ethereum, "Navegador");
        list.appendChild(defaultBtn);
      }

      modal.style.display = "flex";
    }
`;

html = html.replace(/function openWalletModal\(\) {[\s\S]*?modal\.style\.display = "flex";\s*}/, updatedModalFunction);

fs.writeFileSync(path, html);
console.log("WalletConnect y soporte Ledger/Hardware integrado en la app.");
