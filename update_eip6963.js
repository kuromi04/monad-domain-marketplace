const fs = require('fs');
const path = "/data/data/com.termux/files/home/Projects/monad-domain-marketplace/frontend/index.html";

let html = fs.readFileSync(path, 'utf8');

// Añadir modal de wallets y soporte EIP-6963 + EIP-1193 multi-wallet
const modalHtml = `
  <!-- Modal Multi-Wallet -->
  <div id="walletModal" style="display:none; position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.7); z-index:9999; backdrop-filter:blur(6px); align-items:center; justify-content:center;">
    <div style="background:#171926; border:1px solid rgba(131,110,249,0.3); border-radius:20px; width:90%; max-width:400px; padding:24px; box-shadow:0 20px 50px rgba(0,0,0,0.8);">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px;">
        <h3 style="margin:0; font-size:18px; color:#fff;">Conectar Billetera</h3>
        <button onclick="closeWalletModal()" style="background:none; border:none; color:#94a3b8; font-size:22px; cursor:pointer;">&times;</button>
      </div>
      <div id="walletList" style="display:flex; flex-direction:column; gap:10px;">
        <!-- Wallets detectadas dinamicamente -->
      </div>
      <p style="font-size:12px; color:#94a3b8; text-align:center; margin-top:16px;">
        Compatible con MetaMask, Rabby, Phantom, Coinbase Wallet, Trust, Rainbow y cualquier wallet EVM (EIP-6963).
      </p>
    </div>
  </div>
`;

html = html.replace('<!-- Barra de Navegación -->', modalHtml + '\n  <!-- Barra de Navegación -->');

const multiWalletScript = `
    let detectedWallets = [];
    let selectedProvider = null;

    // EIP-6963: Detección automática de todas las billeteras instaladas
    window.addEventListener("eip6963:announceProvider", (event) => {
      const exists = detectedWallets.some(w => w.info.uuid === event.detail.info.uuid);
      if (!exists) {
        detectedWallets.push(event.detail);
      }
    });
    window.dispatchEvent(new Event("eip6963:requestProvider"));

    function openWalletModal() {
      const modal = document.getElementById("walletModal");
      const list = document.getElementById("walletList");
      list.innerHTML = "";

      // Si detectó wallets vía EIP-6963 (Rabby, Phantom, Rainbow, MetaMask nueva, etc.)
      if (detectedWallets.length > 0) {
        detectedWallets.forEach(wallet => {
          const btn = document.createElement("button");
          btn.style.cssText = "display:flex; align-items:center; gap:12px; width:100%; padding:12px 16px; background:#222538; border:1px solid rgba(255,255,255,0.08); border-radius:12px; color:#fff; font-weight:700; cursor:pointer; font-size:15px; transition:0.2s;";
          btn.onmouseover = () => btn.style.borderColor = "#7b57ff";
          btn.onmouseout = () => btn.style.borderColor = "rgba(255,255,255,0.08)";
          btn.innerHTML = \`<img src="\${wallet.info.icon}" width="28" height="28" style="border-radius:6px;" /> \${wallet.info.name}\`;
          btn.onclick = () => connectWithProvider(wallet.provider, wallet.info.name);
          list.appendChild(btn);
        });
      }

      // Si window.ethereum existe pero no tiene EIP-6963
      if (window.ethereum) {
        const defaultBtn = document.createElement("button");
        defaultBtn.style.cssText = "display:flex; align-items:center; gap:12px; width:100%; padding:12px 16px; background:#222538; border:1px solid rgba(255,255,255,0.08); border-radius:12px; color:#fff; font-weight:700; cursor:pointer; font-size:15px;";
        defaultBtn.innerHTML = \`🦊 Billetera Detectada del Navegador (MetaMask / Default)\`;
        defaultBtn.onclick = () => connectWithProvider(window.ethereum, "Navegador");
        list.appendChild(defaultBtn);
      }

      // Enlace para móviles si no hay wallets en navegador de escritorio
      if (detectedWallets.length === 0 && !window.ethereum) {
        list.innerHTML = \`
          <div style="text-align:center; padding:10px; color:#cbd5e1; font-size:14px;">
            <p>No se detectó extensión web3 en este navegador.</p>
            <p style="margin-top:10px; color:#94a3b8; font-size:13px;">Si estás en teléfono, abre este link desde el navegador integrado dentro de tu app de billetera (MetaMask, Phantom, Trust o Rabby).</p>
          </div>
        \`;
      }

      modal.style.display = "flex";
    }

    function closeWalletModal() {
      document.getElementById("walletModal").style.display = "none";
    }

    async function connectWithProvider(ethProvider, walletName = "") {
      closeWalletModal();
      try {
        await ethProvider.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: "0x279F" }] // 10143
        }).catch(async (e) => {
          if (e.code === 4902) {
            await ethProvider.request({
              method: 'wallet_addEthereumChain',
              params: [{
                chainId: "0x279F",
                chainName: "Monad Testnet",
                nativeCurrency: { name: "MON", symbol: "MON", decimals: 18 },
                rpcUrls: ["https://testnet-rpc.monad.xyz"],
                blockExplorerUrls: ["https://testnet.monadscan.com"]
              }]
            });
          }
        });

        selectedProvider = ethProvider;
        provider = new ethers.BrowserProvider(ethProvider);
        signer = await provider.getSigner();
        userAddress = await signer.getAddress();

        const btn = document.getElementById("connectBtn");
        btn.innerText = userAddress.substring(0, 6) + "..." + userAddress.substring(38);
        btn.style.background = "rgba(16, 185, 129, 0.2)";
        btn.style.color = "#34d399";
        btn.style.border = "1px solid #10b981";

        showToast("Conectado con " + (walletName || "tu billetera") + "!");
      } catch (err) {
        console.error(err);
        showToast("Error al conectar: " + err.message, false);
      }
    }
`;

html = html.replace('onclick="connectWallet()"', 'onclick="openWalletModal()"');
html = html.replace('async function connectWallet() {', multiWalletScript + '\n    async function connectWalletLegacy() {');

fs.writeFileSync(path, html);
console.log("Multi-wallet EIP-6963 y selector modal instalados con éxito.");
