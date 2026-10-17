const fs = require('fs');
const path = "/data/data/com.termux/files/home/Projects/monad-domain-marketplace/frontend/index.html";

let html = fs.readFileSync(path, 'utf8');

const initialCard = `
      <!-- Dominio Real Listado en Monad Blockchain -->
      <div class="domain-card" id="card-monadgod">
        <div>
          <div class="card-top">
            <div class="domain-avatar">⚡</div>
            <div>
              <div class="domain-name">monadgod.monad</div>
              <small style="color: var(--text-muted)">Estado: On-Chain Activo</small>
            </div>
          </div>
          <div class="card-price-box">
            <span class="card-price-label">Precio</span>
            <span class="card-price-val">0.1 MON</span>
          </div>
        </div>
        <button class="btn-buy" style="background:#7b57ff; color:#fff;" onclick="buyRealDomain('103357684781104778633691223821500739502033301330586961472315038294477424998766', '0.1', 'monadgod')">
          Comprar por 0.1 MON
        </button>
      </div>
`;

if (!html.includes('id="card-monadgod"')) {
  html = html.replace('<div class="grid" id="marketplaceGrid">', '<div class="grid" id="marketplaceGrid">\n' + initialCard);
  fs.writeFileSync(path, html);
  console.log("Card de monadgod.monad inyectada correctamente.");
} else {
  console.log("Card ya presente.");
}
