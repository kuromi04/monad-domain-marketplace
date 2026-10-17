import React, { useState } from 'react';
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { parseEther, stringToHex, keccak256, encodePacked } from 'viem';

// Direcciones de contratos en Monad Testnet (reemplazar tras el deploy)
const REGISTRY_ADDRESS = (process.env.NEXT_PUBLIC_REGISTRY_ADDRESS || '0x0000000000000000000000000000000000000000') as `0x${string}`;
const MARKETPLACE_ADDRESS = (process.env.NEXT_PUBLIC_MARKETPLACE_ADDRESS || '0x0000000000000000000000000000000000000000') as `0x${string}`;

export const DomainApp = () => {
  const { address, isConnected } = useAccount();
  const [searchTerm, setSearchTerm] = useState('');
  const [listPrice, setListPrice] = useState('');
  const [selectedTokenId, setSelectedTokenId] = useState('');

  const { writeContractAsync } = useWriteContract();

  // Función para registrar dominio en Monad
  const handleRegister = async () => {
    if (!searchTerm) return;
    try {
      await writeContractAsync({
        address: REGISTRY_ADDRESS,
        abi: [
          {
            name: 'register',
            type: 'function',
            stateMutability: 'payable',
            inputs: [{ name: 'name', type: 'string' }],
            outputs: [],
          },
        ],
        functionName: 'register',
        args: [searchTerm],
        value: parseEther('1'), // 1 MON
      });
      alert(`¡Registro iniciado para ${searchTerm}.monad!`);
    } catch (err) {
      console.error(err);
      alert('Error al registrar dominio');
    }
  };

  // Función para listar dominio en Marketplace
  const handleListForSale = async () => {
    if (!selectedTokenId || !listPrice) return;
    try {
      // 1. Aprobar al marketplace
      await writeContractAsync({
        address: REGISTRY_ADDRESS,
        abi: [
          {
            name: 'approve',
            type: 'function',
            stateMutability: 'nonpayable',
            inputs: [
              { name: 'to', type: 'address' },
              { name: 'tokenId', type: 'uint256' },
            ],
            outputs: [],
          },
        ],
        functionName: 'approve',
        args: [MARKETPLACE_ADDRESS, BigInt(selectedTokenId)],
      });

      // 2. Listar en el contrato de marketplace
      await writeContractAsync({
        address: MARKETPLACE_ADDRESS,
        abi: [
          {
            name: 'listDomain',
            type: 'function',
            stateMutability: 'nonpayable',
            inputs: [
              { name: 'tokenId', type: 'uint256' },
              { name: 'price', type: 'uint256' },
            ],
            outputs: [],
          },
        ],
        functionName: 'listDomain',
        args: [BigInt(selectedTokenId), parseEther(listPrice)],
      });

      alert(`¡Dominio #${selectedTokenId} listado por ${listPrice} MON!`);
    } catch (err) {
      console.error(err);
      alert('Error al listar dominio');
    }
  };

  return (
    <div style={{ maxWidth: '900px', margin: '40px auto', fontFamily: 'sans-serif', color: '#111' }}>
      <header style={{ borderBottom: '2px solid #6c5ce7', paddingBottom: '20px', marginBottom: '30px' }}>
        <h1 style={{ color: '#5f27cd' }}>🟣 Monad Name Service & Marketplace (.monad)</h1>
        <p>Red: Monad Testnet (Chain ID 10143) | Transacciones ultra-rápidas a 10k TPS</p>
        <p>Estado billetera: <strong>{isConnected ? `Conectado: ${address}` : 'Desconectado'}</strong></p>
      </header>

      {/* Registro de Dominios */}
      <section style={{ background: '#f5f6fa', padding: '24px', borderRadius: '12px', marginBottom: '25px' }}>
        <h2>🔍 Registrar Dominio Web3</h2>
        <div style={{ display: 'flex', gap: '10px' }}>
          <input
            type="text"
            placeholder="Ejemplo: satoshi"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value.toLowerCase())}
            style={{ flex: 1, padding: '12px', fontSize: '16px', borderRadius: '6px', border: '1px solid #ccc' }}
          />
          <span style={{ alignSelf: 'center', fontWeight: 'bold' }}>.monad</span>
          <button
            onClick={handleRegister}
            disabled={!isConnected}
            style={{ background: '#5f27cd', color: '#fff', border: 'none', padding: '12px 24px', borderRadius: '6px', cursor: 'pointer' }}
          >
            Registrar (1 MON)
          </button>
        </div>
      </section>

      {/* Publicar en Marketplace */}
      <section style={{ background: '#f5f6fa', padding: '24px', borderRadius: '12px' }}>
        <h2>🏷️ Vender Dominio en el Marketplace</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <input
            type="text"
            placeholder="Token ID del Dominio"
            value={selectedTokenId}
            onChange={(e) => setSelectedTokenId(e.target.value)}
            style={{ padding: '12px', fontSize: '16px', borderRadius: '6px', border: '1px solid #ccc' }}
          />
          <input
            type="number"
            placeholder="Precio de venta en MON (ej. 15)"
            value={listPrice}
            onChange={(e) => setListPrice(e.target.value)}
            style={{ padding: '12px', fontSize: '16px', borderRadius: '6px', border: '1px solid #ccc' }}
          />
          <button
            onClick={handleListForSale}
            disabled={!isConnected}
            style={{ background: '#10ac84', color: '#fff', border: 'none', padding: '14px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}
          >
            Aprobar y Publicar en Venta
          </button>
        </div>
      </section>
    </div>
  );
};
