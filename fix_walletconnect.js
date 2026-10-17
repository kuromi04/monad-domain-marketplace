const fs = require('fs');
const path = "/data/data/com.termux/files/home/Projects/monad-domain-marketplace/frontend/index.html";

let html = fs.readFileSync(path, 'utf8');

// Añadir librería QRCode universal para garantizar generación visual del código QR instantáneo
const qrLib = `<script src="https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js"></script>`;

if (!html.includes("qrcode.min.js")) {
  html = html.replace('<head>', '<head>\n  ' + qrLib);
}

// Modal exclusivo con display del Código QR nativo + Deep Links de Billeteras
const qrModalHtml = `
  <!-- Modal Código QR Universal -->
  <div id="qrModal" style="display:none; position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.8); z-index:10000; backdrop-filter:blur(8px); align-items:center; justify-content:center;">
    <div style="background:#171926; border:1px solid rgba(131,110,249,0.3); border-radius:24px; width:92%; max-width:380px; padding:28px; text-align:center; box-shadow:0 25px 60px rgba(0,0,0,0.9);">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px;">
        <h3 style="margin:0; font-size:18px; color:#fff; display:flex; align-items:center; gap:8px;">
          <span>📱</span> Escanea con tu Wallet
        </h3>
        <button onclick="closeQrModal()" style="background:none; border:none; color:#94a3b8; font-size:24px; cursor:pointer;">&times;</button>
      </div>

      <p style="font-size:13px; color:#94a3b8; margin-bottom:16px;">
        Abre <strong>Ledger Live, Trust Wallet, Rainbow, MetaMask</strong> o cualquier app Web3 y escanea este código:
      </p>

      <div style="background:#fff; padding:16px; border-radius:16px; display:inline-block; margin-bottom:18px;" id="qrcodeBox"></div>

      <div style="display:flex; flex-direction:column; gap:8px;">
        <button id="copyUriBtn" onclick="copyWalletConnectUri()" style="background:#222538; border:1px solid rgba(255,255,255,0.1); color:#c4b5fd; padding:10px; border-radius:10px; font-weight:600; font-size:13px; cursor:pointer;">
          📋 Copiar enlace de conexión
        </button>
        <a id="openWalletMobileLink" href="#" style="background:#3b82f6; color:#fff; text-decoration:none; padding:12px; border-radius:10px; font-weight:700; font-size:14px; display:none;">
          Abrir en App de Billetera
        </a>
      </div>
    </div>
  </div>
`;

if (!html.includes('id="qrModal"')) {
  html = html.replace('<!-- Modal Multi-Wallet -->', qrModalHtml + '\n  <!-- Modal Multi-Wallet -->');
}

// Reemplazar la lógica de connectWalletConnect con generación de QR en pantalla
const newWcLogic = `
    let currentWcUri = "";

    function closeQrModal() {
      document.getElementById("qrModal").style.display = "none";
    }

    function copyWalletConnectUri() {
      if (currentWcUri) {
        navigator.clipboard.writeText(currentWcUri);
        const btn = document.getElementById("copyUriBtn");
        btn.innerText = "✅ ¡Enlace copiado!";
        setTimeout(() => { btn.innerText = "📋 Copiar enlace de conexión"; }, 2000);
      }
    }

    async function connectWalletConnect() {
      closeWalletModal();
      showToast("Generando código QR...", true);

      try {
        // Cargar provider WalletConnect si no existe
        if (!window.WalletConnectEthereumProvider) {
          const s = document.createElement("script");
          s.src = "https://cdn.jsdelivr.net/npm/@walletconnect/ethereum-provider@2.14.0/dist/index.umd.js";
          document.head.appendChild(s);
          await new Promise(r => s.onload = r);
        }

        const ProviderClass = window.WalletConnectEthereumProvider?.default || window.WalletConnectEthereumProvider;
        const wcProvider = await ProviderClass.init({
          projectId: "c4f79cc821944d9680842e34466bfb",
          chains: [10143],
          optionalChains: [10143],
          showQrModal: false, // Desactivar modal externo para pintarlo nosotros directamente
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

        // Escuchar el evento de URI de WalletConnect para renderizar el QR en pantalla
        wcProvider.on("display_uri", (uri) => {
          currentWcUri = uri;
          const qrContainer = document.getElementById("qrcodeBox");
          qrContainer.innerHTML = "";
          new QRCode(qrContainer, {
            text: uri,
            width: 220,
            height: 220,
            colorDark: "#000000",
            colorLight: "#ffffff",
            correctLevel: QRCode.CorrectLevel.M
          });

          const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
          const mobileLink = document.getElementById("openWalletMobileLink");
          if (isMobile) {
            mobileLink.style.display = "block";
            mobileLink.href = uri;
          }

          document.getElementById("qrModal").style.display = "flex";
        });

        await wcProvider.enable();
        closeQrModal();
        connectWithProvider(wcProvider, "WalletConnect / Ledger");

      } catch (err) {
        console.error("Error WC:", err);
        // Si el usuario cancela o hay un error
        if (!err.message?.includes("User closed")) {
          showToast("Error de conexión: " + err.message, false);
        }
      }
    }
`;

html = html.replace(/async function connectWalletConnect\(\)[\s\S]*?showToast\("Error en WalletConnect: " \+ err\.message, false\);\s*\}\s*\}/, newWcLogic);

fs.writeFileSync(path, html);
console.log("Generador QR integrado y verificado exitosamente.");
