const fs = require('fs');
const path = "/data/data/com.termux/files/home/Projects/monad-domain-marketplace/frontend/index.html";

let html = fs.readFileSync(path, 'utf8');

// 1. Quitar la card estática hardcodeada del HTML para que dependa exclusivamente del estado on-chain
html = html.replace(/<!-- Dominio Real Listado en Monad Blockchain -->[\s\S]*?<\/div>\s*<\/div>/, '');

// 2. Mejorar loadActiveListings para que verifique si el listing sigue activo y renderice dinámicamente
const improvedMarketplaceLogic = `
    async function loadActiveListings() {
      const grid = document.getElementById("marketplaceGrid");
      if (!grid) return;

      try {
        const rpc = new ethers.JsonRpcProvider("https://testnet-rpc.monad.xyz");
        const marketplace = new ethers.Contract(MARKETPLACE_ADDRESS, [
          "function listings(uint256) view returns (address seller, uint256 price, bool isActive)"
        ], rpc);

        const registry = new ethers.Contract(REGISTRY_ADDRESS, [
          "function domains(uint256) view returns (string name, address resolvedAddress, uint256 registeredAt, uint256 expiresAt, string textRecord)",
          "function computeTokenId(string memory name) view returns (uint256)"
        ], rpc);

        grid.innerHTML = "<p style='color:var(--text-muted); text-align:center; grid-column:1/-1;'>Consultando blockchain de Monad...</p>";

        // Dominios conocidos a chequear estado
        const knownDomains = ["monadgod", "satoshilover", "alpha", "defi"];
        let activeFound = 0;
        let htmlCards = "";

        for (const name of knownDomains) {
          try {
            const tokenId = await registry.computeTokenId(name);
            const listing = await marketplace.listings(tokenId);
            if (listing.isActive) {
              activeFound++;
              const priceInMon = ethers.formatEther(listing.price);
              htmlCards += \`
                <div class="domain-card" id="card-\${name}">
                  <div>
                    <div class="card-top">
                      <div class="domain-avatar">⚡</div>
                      <div>
                        <div class="domain-name">\${name}.monad</div>
                        <small style="color: var(--text-muted)">Vendedor: \${listing.seller.slice(0,6)}...\${listing.seller.slice(38)}</small>
                      </div>
                    </div>
                    <div class="card-price-box">
                      <span class="card-price-label">Precio</span>
                      <span class="card-price-val">\${priceInMon} MON</span>
                    </div>
                  </div>
                  <button class="btn-buy" style="background:#7b57ff; color:#fff;" onclick="buyRealDomain('\${tokenId.toString()}', '\${priceInMon}', '\${name}')">
                    Comprar por \${priceInMon} MON
                  </button>
                </div>
              \`;
            }
          } catch(e) {}
        }

        if (activeFound === 0) {
          grid.innerHTML = \`
            <div style="grid-column: 1 / -1; text-align: center; padding: 40px; background: var(--card-bg); border-radius: 16px; border: 1px dashed var(--card-border);">
              <p style="font-size: 18px; color: #fff; margin-bottom: 8px;">🎉 ¡No hay dominios activos a la venta en este momento!</p>
              <p style="color: var(--text-muted); font-size: 14px; margin-bottom: 16px;">El dominio anterior ya fue comprado exitosamente.</p>
              <button class="btn-action-primary" style="max-width: 240px; margin: 0 auto; display: block;" onclick="switchTab('sell')">Poner un dominio en venta</button>
            </div>
          \`;
        } else {
          grid.innerHTML = htmlCards;
        }

      } catch (err) {
        console.error("Error cargando listados:", err);
      }
    }

    async function loadMyDomains() {
      const container = document.getElementById("tab-my-domains");
      if (!userAddress) {
        container.innerHTML = \`
          <div style="text-align: center; color: var(--text-muted); padding: 40px 0;">
            <p style="font-size: 16px;">Conecta tu billetera para ver y administrar tus dominios registrados.</p>
          </div>
        \`;
        return;
      }

      container.innerHTML = "<p style='color:var(--text-muted); text-align:center;'>Buscando tus dominios en Monad...</p>";

      try {
        const rpc = new ethers.JsonRpcProvider("https://testnet-rpc.monad.xyz");
        const registry = new ethers.Contract(REGISTRY_ADDRESS, [
          "function ownerOf(uint256) view returns (address)",
          "function computeTokenId(string memory name) view returns (uint256)",
          "function domains(uint256) view returns (string name, address resolvedAddress, uint256 registeredAt, uint256 expiresAt, string textRecord)"
        ], rpc);

        const checkList = ["monadgod", "satoshilover", "alpha", "defi", "crypto", "satoshi", "web3"];
        const owned = [];

        for (const name of checkList) {
          try {
            const tokenId = await registry.computeTokenId(name);
            const owner = await registry.ownerOf(tokenId);
            if (owner.toLowerCase() === userAddress.toLowerCase()) {
              const info = await registry.domains(tokenId);
              owned.push({ name, tokenId: tokenId.toString(), info });
            }
          } catch(e) {}
        }

        if (owned.length === 0) {
          container.innerHTML = \`
            <div style="text-align: center; padding: 40px; background: var(--card-bg); border-radius: 16px;">
              <p style="font-size: 16px; color: #fff;">Aún no tienes dominios registrados con esta billetera (\${userAddress.slice(0,6)}...\${userAddress.slice(38)}).</p>
            </div>
          \`;
          return;
        }

        let myHtml = \`<div class="grid">\`;
        owned.forEach(d => {
          myHtml += \`
            <div class="domain-card" style="border-color: #10b981;">
              <div>
                <div class="card-top">
                  <div class="domain-avatar" style="background:#10b981;">👑</div>
                  <div>
                    <div class="domain-name">\${d.name}.monad</div>
                    <small style="color: #34d399;">Propietario: Tú (En tu Wallet)</small>
                  </div>
                </div>
                <div style="background: rgba(0,0,0,0.3); padding: 12px; border-radius: 10px; font-size: 13px; color: var(--text-muted); margin-bottom: 14px;">
                  <div>Token ID: <span style="color:#fff; font-family:monospace;">#\${d.tokenId.slice(0,10)}...</span></div>
                  <div>Expira en: <span style="color:#fff;">1 año</span></div>
                </div>
              </div>
              <button class="btn-buy" style="background: rgba(16, 185, 129, 0.2); color: #34d399; border-color: #10b981;" onclick="prepareSell('\${d.name}')">
                Poner en Venta
              </button>
            </div>
          \`;
        });
        myHtml += \`</div>\`;
        container.innerHTML = myHtml;

      } catch (err) {
        console.error("Error buscando mis dominios:", err);
      }
    }

    function prepareSell(name) {
      document.getElementById("sellNameInput").value = name;
      switchTab('sell');
    }
`;

// Reemplazar la función loadActiveListings anterior con la nueva versión dinámica y sincronizada
html = html.replace(/async function loadActiveListings\(\)[\s\S]*?buyRealDomain\(BigInt\(tokenId\), \{ value: ethers\.parseEther\(price\) \}\);[\s\S]*?loadActiveListings\(\);\s*\}\s*catch \(e\) \{\s*console\.error\(e\);\s*showToast\("Error: " \+ \(e\.reason \|\| e\.message\), false\);\s*\}\s*\}/, improvedMarketplaceLogic);

// Sincronizar pestañas para cargar Mis Dominios al hacer click en la pestaña
html = html.replace("document.getElementById(\"tab-my-domains\").style.display = tabId === 'my-domains' ? 'block' : 'none';", 
  "document.getElementById(\"tab-my-domains\").style.display = tabId === 'my-domains' ? 'block' : 'none';\n      if(tabId === 'my-domains') loadMyDomains();");

fs.writeFileSync(path, html);
console.log("Pestaña Mis Dominios y estado activo del Marketplace actualizados.");
