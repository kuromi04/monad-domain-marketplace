const fs = require('fs');
const path = "/data/data/com.termux/files/home/Projects/monad-domain-marketplace/frontend/index.html";

let html = fs.readFileSync(path, 'utf8');

// Añadir función de carga de listados reales en la blockchain
const dynamicMarketplaceScript = `
    async function loadActiveListings() {
      const grid = document.getElementById("marketplaceGrid");
      if (!grid) return;

      try {
        const rpc = new ethers.JsonRpcProvider("https://testnet-rpc.monad.xyz");
        const marketplace = new ethers.Contract(MARKETPLACE_ADDRESS, [
          "event ItemListed(uint256 indexed tokenId, address indexed seller, uint256 price)",
          "event ItemSold(uint256 indexed tokenId, address indexed buyer, address indexed seller, uint256 price)",
          "event ListingCancelled(uint256 indexed tokenId, address indexed seller)",
          "function listings(uint256) view returns (address seller, uint256 price, bool isActive)"
        ], rpc);

        const registry = new ethers.Contract(REGISTRY_ADDRESS, [
          "function domains(uint256) view returns (string name, address resolvedAddress, uint256 registeredAt, uint256 expiresAt, string textRecord)"
        ], rpc);

        // Consultar eventos de listado
        const filter = marketplace.filters.ItemListed();
        const events = await marketplace.queryFilter(filter, -5000); // últimos bloques

        if (events.length === 0) {
          grid.innerHTML = \`
            <div style="grid-column: 1 / -1; text-align: center; padding: 40px; background: var(--card-bg); border-radius: 16px; border: 1px dashed var(--card-border);">
              <p style="font-size: 18px; color: #fff; margin-bottom: 8px;">No hay dominios en venta en este momento</p>
              <p style="color: var(--text-muted); font-size: 14px; margin-bottom: 16px;">¡Sé el primero en registrar un dominio y ponerlo a la venta!</p>
              <button class="btn-action-primary" style="max-width: 240px; margin: 0 auto; display: block;" onclick="switchTab('sell')">Poner un dominio en venta</button>
            </div>
          \`;
          return;
        }

        grid.innerHTML = "";
        for (const ev of events) {
          const tokenId = ev.args.tokenId;
          const listing = await marketplace.listings(tokenId);
          if (listing.isActive) {
            const domainInfo = await registry.domains(tokenId);
            const domainName = domainInfo.name || "Dominio #" + tokenId.toString().slice(0, 6);
            const priceInMon = ethers.formatEther(listing.price);

            const card = document.createElement("div");
            card.className = "domain-card";
            card.innerHTML = \`
              <div>
                <div class="card-top">
                  <div class="domain-avatar">🟣</div>
                  <div>
                    <div class="domain-name">\${domainName}.monad</div>
                    <small style="color: var(--text-muted)">Vendedor: \${listing.seller.slice(0,6)}...\${listing.seller.slice(38)}</small>
                  </div>
                </div>
                <div class="card-price-box">
                  <span class="card-price-label">Precio</span>
                  <span class="card-price-val">\${priceInMon} MON</span>
                </div>
              </div>
              <button class="btn-buy" onclick="buyRealDomain('\${tokenId}', '\${priceInMon}', '\${domainName}')">Comprar Dominio</button>
            \`;
            grid.appendChild(card);
          }
        }
      } catch (err) {
        console.error("Error cargando listados reales:", err);
      }
    }

    async function buyRealDomain(tokenId, price, name) {
      if (!signer) {
        openWalletModal();
        return;
      }

      try {
        showToast(\`Comprando \${name}.monad por \${price} MON... Confirma en tu wallet\`, true);
        const marketplace = new ethers.Contract(MARKETPLACE_ADDRESS, contractsData.marketplace.abi, signer);
        const tx = await marketplace.buyDomain(BigInt(tokenId), { value: ethers.parseEther(price) });
        showToast("Transacción enviada, confirmando...", true);
        await tx.wait();
        showToast(\`🎉 ¡Compraste \${name}.monad exitosamente!\`, true);
        loadActiveListings();
      } catch (e) {
        console.error(e);
        showToast("Error: " + (e.reason || e.message), false);
      }
    }
`;

html = html.replace('async function quickBuy(name, price) {', dynamicMarketplaceScript + '\n    async function quickBuy(name, price) {');

// Ejecutar loadActiveListings al cargar
html = html.replace('loadData();', 'loadData();\n    loadActiveListings();');

// Recargar listados cuando se publique uno nuevo
html = html.replace('showToast(`¡${name}.monad listado por ${price} MON!`);', 'showToast(`¡${name}.monad listado por ${price} MON!`);\n        loadActiveListings();\n        switchTab("explore");');

fs.writeFileSync(path, html);
console.log("Marketplace actualizado para consultar listados reales on-chain.");
