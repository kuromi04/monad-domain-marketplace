const fs = require('fs');
const path = require('path');

const indexHtmlPath = path.join(__dirname, 'frontend/index.html');
let html = fs.readFileSync(indexHtmlPath, 'utf8');

// Añadir soporte para deep link a MetaMask Mobile si window.ethereum no está presente
const scriptToAdd = `
    function getEthereumProvider() {
      if (window.ethereum) {
        if (window.ethereum.providers) {
          return window.ethereum.providers.find(p => p.isMetaMask) || window.ethereum;
        }
        return window.ethereum;
      }
      return null;
    }
`;

html = html.replace("let provider, signer, userAddress;", "let provider, signer, userAddress;\n" + scriptToAdd);

html = html.replace(`      if (!window.ethereum) {
        alert("Instala MetaMask para continuar");
        return;
      }`, `      const eth = getEthereumProvider();
      if (!eth) {
        const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
        if (isMobile) {
          const currentUrl = window.location.href.replace(/^https?:\\/\\//, '');
          window.location.href = "https://metamask.app.link/dapp/" + currentUrl;
          return;
        }
        alert("No se detectó MetaMask en este navegador.\\n\\nSi estás en móvil (Android): Abre esta página directamente desde el navegador integrado dentro de la app de MetaMask (pestaña Explorador / Browser).\\n\\nSi estás en PC: Asegúrate de tener la extensión de MetaMask instalada y activa en Chrome/Brave/Firefox.");
        return;
      }`);

html = html.replace(/window\.ethereum/g, "eth");

fs.writeFileSync(indexHtmlPath, html);
console.log("HTML actualizado con soporte para MetaMask mobile deep-link y multi-providers.");
