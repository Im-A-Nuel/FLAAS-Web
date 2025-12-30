# FLAAS-Web: Federated Learning with Blockchain Integration

## 📋 Deskripsi Proyek

**FLAAS-Web** adalah aplikasi web yang mengintegrasikan **Federated Learning (FL)** dengan teknologi **Blockchain Substrate/Polkadot**. Sistem ini memungkinkan multiple bank/institusi untuk melakukan collaborative machine learning tanpa harus berbagi data sensitif, dengan seluruh proses tercatat secara transparan dan immutable di blockchain.

---

## 🏗️ Arsitektur Sistem

```
┌─────────────────────────────────────────────────────────────────────┐
│                          FLAAS-WEB UI                                │
│                    (Next.js 16 + React 19)                          │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌───────────────┐  ┌───────────────┐  ┌────────────────────────┐  │
│  │  Dashboard    │  │  Admin Panel  │  │  Federated Learning    │  │
│  │  - Bank Cards │  │  - Register   │  │  - Model Upload        │  │
│  │  - Balances   │  │  - Unregister │  │  - Aggregation (FedAvg)│  │
│  │  - Stats      │  │               │  │  - Global Model        │  │
│  └───────────────┘  └───────────────┘  └────────────────────────┘  │
│                                                                      │
│  ┌───────────────┐  ┌───────────────┐  ┌────────────────────────┐  │
│  │  Blockchain   │  │  Audit Trail  │  │  Block Explorer        │  │
│  │  Integration  │  │  - Records    │  │  - Live Blocks         │  │
│  │  - Submit     │  │  - Search     │  │  - Transaction Logs    │  │
│  │  - Logs       │  │  - Filter     │  │                        │  │
│  └───────────────┘  └───────────────┘  └────────────────────────┘  │
│                                                                      │
├─────────────────────────────────────────────────────────────────────┤
│                        EXTERNAL SERVICES                             │
│                                                                      │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐  │
│  │  Federated       │  │  Polkadot/       │  │  Pinata IPFS     │  │
│  │  Learning Server │  │  Substrate Node  │  │  Gateway         │  │
│  │  (Railway)       │  │  (Custom Pallet) │  │                  │  │
│  └──────────────────┘  └──────────────────┘  └──────────────────┘  │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 🛠️ Technology Stack

### Frontend
| Teknologi | Versi | Deskripsi |
|-----------|-------|-----------|
| **Next.js** | 16.0.6 | React framework dengan App Router |
| **React** | 19.2.0 | UI library dengan React Compiler |
| **TypeScript** | 5.x | Static typing |
| **TailwindCSS** | 4.x | Utility-first CSS framework |
| **Biome** | 2.2.0 | Linter dan formatter |
| **React Icons** | 5.5.0 | Icon library (Ionicons) |

### Blockchain Integration
| Teknologi | Versi | Deskripsi |
|-----------|-------|-----------|
| **@polkadot/api** | 16.5.3 | Substrate/Polkadot API client |
| **@polkadot/extension-dapp** | 0.62.6 | Wallet extension integration |
| **@polkadot/util** | 13.5.9 | Utility functions |
| **@polkadot/util-crypto** | 13.5.9 | Cryptographic utilities |

### External Services
| Service | URL | Deskripsi |
|---------|-----|-----------|
| **Federated Server** | `https://federatedserver.up.railway.app` | FL aggregation server |
| **Blockchain RPC** | `wss://ukdw-rpc.baliola.dev` | Custom Substrate node |
| **Pinata IPFS** | `https://api.pinata.cloud` | Decentralized storage |

---

## 📁 Struktur Proyek

```
flaas-web/
├── src/
│   └── app/
│       ├── page.tsx                    # Main application page
│       ├── layout.tsx                  # Root layout
│       ├── globals.css                 # Global styles
│       │
│       ├── components/
│       │   ├── AdminRegister.tsx       # Registrasi institusi
│       │   ├── AdminUnregister.tsx     # Unregistrasi institusi
│       │   ├── AggregationResult.tsx   # Hasil agregasi FL
│       │   ├── AuditRecordDetail.tsx   # Detail audit record
│       │   ├── AuditRecords.tsx        # List audit records
│       │   ├── BankCards.tsx           # Card display per bank
│       │   ├── BlockchainIntegration.tsx # Submit ke blockchain
│       │   ├── BlockchainLogs.tsx      # Log transaksi blockchain
│       │   ├── BlockExplorer.tsx       # Real-time block viewer
│       │   ├── FederatedAggregation.tsx # Control agregasi FL
│       │   ├── FederatedLogs.tsx       # Log server FL
│       │   ├── GlobalModel.tsx         # Download global model
│       │   ├── LogModal.tsx            # Modal untuk logs
│       │   ├── ModelUpload.tsx         # Upload model lokal
│       │   └── TabNavigation.tsx       # Tab navigation
│       │
│       └── lib/
│           ├── audit-hooks.ts          # Hooks untuk audit records
│           ├── blockchain-hooks.ts     # Hooks untuk blockchain ops
│           ├── blockchain-queries.ts   # Query utilities
│           ├── events-hooks.ts         # Event subscription hooks
│           ├── hash.ts                 # SHA-256 hashing utilities
│           ├── hooks.ts                # FL API hooks
│           ├── pinata.ts               # IPFS upload utilities
│           └── polkadot.ts             # Polkadot/Substrate client
│
├── public/                             # Static assets
├── biome.json                          # Biome configuration
├── next.config.ts                      # Next.js configuration
├── package.json                        # Dependencies
├── postcss.config.mjs                  # PostCSS configuration
├── tsconfig.json                       # TypeScript configuration
└── tailwind.config.ts                  # Tailwind configuration
```

---

## 🔧 Fitur Utama

### 1. **Wallet Connection**
Sistem mendukung multiple wallet provider:

```typescript
// Supported Wallets
- MetaMask (Ethereum H160 format)
- Polkadot.js Extension
- SubWallet
- Talisman
- Fearless Wallet
- Enkrypt
- Nova Wallet
```

**Address Format:**
- Blockchain pallet menggunakan **AccountId20 (H160/Ethereum format)**
- SS58 addresses dikonversi ke H160 menggunakan `convertToEthereumAddress()`

```typescript
export const convertToEthereumAddress = (address: string): string => {
  // Decode SS58 address to raw bytes
  const decoded = decodeAddress(address);
  // Take first 20 bytes and convert to hex
  return u8aToHex(decoded.slice(0, 20));
};
```

### 2. **Model Upload ke Federated Server**

```typescript
// API Endpoint
POST https://federatedserver.up.railway.app/upload-model

// Request Body (JSON)
{
  "client": "BANK_A",
  "compressed_weights": "<base64_encoded_model>",
  "timestamp": "2024-12-16T10:00:00Z",
  "metrics": {
    "best_accuracy": 95.5,
    "history": ["90.0", "92.5", "95.5"]
  }
}
```

**Supported Model Formats:**
- `.npz` (NumPy compressed - **prioritas**)
- `.bin`, `.pkl`, `.pt`, `.pth`, `.h5`, `.weights`

### 3. **Federated Aggregation (FedAvg)**

```typescript
// API Endpoint
POST https://federatedserver.up.railway.app/aggregate

// Response
{
  "status": "success",
  "method": "FedAvg",
  "num_clients": 3,
  "num_layers": 10,
  "avg_global_weight": 0.0234,
  "avg_global_weight_change_percent": 2.5,
  "client_mean_weight": {
    "BANK_A_model.npz": 0.0245,
    "BANK_B_model.npz": 0.0228,
    "BANK_C_model.npz": 0.0229
  },
  "client_mean_weight_percentage": {
    "BANK_A_model.npz": 34.89,
    "BANK_B_model.npz": 32.48,
    "BANK_C_model.npz": 32.63
  },
  "saved": "models/global_model_fedavg.npz"
}
```

### 4. **Blockchain Integration**

#### Custom Pallet: `federatedLearning`

**Extrinsics (Transactions):**

| Extrinsic | Parameter | Deskripsi |
|-----------|-----------|-----------|
| `submitLocalModel` | `modelHash`, `accuracy`, `ipfsCid`, `note` | Submit model lokal ke blockchain |
| `updateGlobalModel` | `newHash`, `newCid`, `weightChange` | Update global model setelah agregasi |
| `forceAuthorize` | `account`, `institution` | Register institusi (admin only) |
| `forceUnauthorize` | `account` | Unregister institusi (admin only) |

**Storage Queries:**

| Query | Deskripsi |
|-------|-----------|
| `getRecords(id)` | Ambil audit record by ID |
| `getNextId()` | Ambil ID berikutnya |
| `getAuthorizedInstitution(address)` | Cek status otorisasi institusi |
| `getGlobalModel()` | Ambil info global model |
| `getPalletVersion()` | Ambil versi pallet |

#### Submit Model ke Blockchain

```typescript
export const submitLocalModel = async (
  address: string,        // H160 address
  modelHash: string,      // SHA-256 hash (0x...)
  accuracy: number,       // Akurasi model (scaled)
  ipfsCid: string,        // IPFS Content ID
  note?: string,          // Catatan opsional
  originalAddress?: string,
  walletSource?: string
) => {
  const api = await connectToPolkadot();
  const injector = await getInjector(addressForInjector, walletSource);
  
  const extrinsic = api.tx.federatedLearning.submitLocalModel(
    modelHash,
    accuracy,
    ipfsCid,
    note || ''
  );
  
  return extrinsic.signAndSend(address, { signer: injector.signer }, callback);
};
```

### 5. **IPFS Storage (Pinata)**

Model files disimpan di IPFS via Pinata untuk decentralized storage:

```typescript
export async function uploadToPinata(file: File, name?: string): Promise<string> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('pinataMetadata', JSON.stringify({
    name: name || file.name,
    keyvalues: {
      uploadedAt: new Date().toISOString(),
      fileType: file.type,
      fileName: file.name
    }
  }));
  
  const response = await fetch('https://api.pinata.cloud/pinning/pinFileToIPFS', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${jwt}` },
    body: formData
  });
  
  const result = await response.json();
  return result.IpfsHash; // CID
}
```

**Gateway URL:** `https://gateway.pinata.cloud/ipfs/{CID}`

### 6. **File Hashing (SHA-256)**

```typescript
export async function hashFile(file: File): Promise<string> {
  const buffer = await file.arrayBuffer();
  const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = '0x' + hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex; // Format: 0x + 64 hex chars (H256)
}
```

### 7. **Audit Records**

Setiap submission model tercatat sebagai audit record:

```typescript
interface AuditRecord {
  id: number;              // Sequential ID
  who: string;             // H160 address
  modelHash: string;       // SHA-256 hash
  institution: string;     // Nama institusi
  atBlock: number;         // Block number
  accuracy: number;        // Model accuracy
  ipfsCid?: string;        // IPFS CID
  note?: string;           // Optional note
}
```

### 8. **Real-time Block Explorer**

Komponen `BlockExplorer` subscribe ke new blocks:

```typescript
const unsubscribe = await api.rpc.chain.subscribeNewHeads(async (header) => {
  const blockNumber = header.number.toNumber();
  const blockHash = header.hash.toHex();
  // Update UI dengan block baru
});
```

---

## 🔐 Security Considerations

### Address Handling
- **AccountId20 (H160)**: Pallet menggunakan format Ethereum
- **SS58 ↔ H160 Conversion**: Dilakukan secara otomatis
- **MetaMask Signing**: Menggunakan `personal_sign` untuk transaksi

### Wallet Integration
```typescript
// MetaMask signing
const signature = await ethereum.request({
  method: 'personal_sign',
  params: [hexMessage, address],
});

// Polkadot extension signing
const injector = await web3FromAddress(address);
extrinsic.signAndSend(address, { signer: injector.signer }, callback);
```

---

## 📊 Data Flow

### Model Training & Aggregation Flow

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Bank A    │     │   Bank B    │     │   Bank C    │
│  (Client)   │     │  (Client)   │     │  (Client)   │
└──────┬──────┘     └──────┬──────┘     └──────┬──────┘
       │                   │                   │
       │    Train Local Model on Private Data  │
       │                   │                   │
       ▼                   ▼                   ▼
┌──────────────────────────────────────────────────────┐
│              Upload Local Models (.npz)               │
│           POST /upload-model (FL Server)              │
└──────────────────────────────────────────────────────┘
                           │
                           ▼
┌──────────────────────────────────────────────────────┐
│              Federated Aggregation (FedAvg)           │
│              POST /aggregate (FL Server)              │
│                                                       │
│   global_weights = Σ(local_weights) / num_clients    │
└──────────────────────────────────────────────────────┘
                           │
                           ▼
┌──────────────────────────────────────────────────────┐
│                 Upload to IPFS (Pinata)               │
│                 Returns: IPFS CID                     │
└──────────────────────────────────────────────────────┘
                           │
                           ▼
┌──────────────────────────────────────────────────────┐
│              Record on Blockchain                     │
│   submitLocalModel(hash, accuracy, ipfsCid, note)    │
│                                                       │
│   Storage: AuditRecord {                              │
│     id, who, modelHash, institution,                  │
│     atBlock, accuracy, ipfsCid, note                  │
│   }                                                   │
└──────────────────────────────────────────────────────┘
                           │
                           ▼
┌──────────────────────────────────────────────────────┐
│              Update Global Model                      │
│   updateGlobalModel(newHash, newCid, weightChange)   │
└──────────────────────────────────────────────────────┘
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- pnpm (recommended)
- Browser wallet extension (MetaMask/SubWallet/Talisman)
- Pinata API Key (untuk IPFS)

### Installation

```bash
# Clone repository
git clone <repository-url>
cd flaas-web

# Install dependencies
pnpm install

# Setup environment variables
cp .env.example .env.local
# Edit .env.local dan tambahkan:
# NEXT_PUBLIC_PINATA_JWT=<your_pinata_jwt>

# Run development server
pnpm dev
```

### Environment Variables

| Variable | Deskripsi |
|----------|-----------|
| `NEXT_PUBLIC_PINATA_JWT` | Pinata API JWT token untuk IPFS upload |

### Scripts

```bash
pnpm dev      # Start development server
pnpm build    # Build for production
pnpm start    # Start production server
pnpm lint     # Run Biome linter
pnpm format   # Format code with Biome
```

---

## 🎯 Use Cases

### 1. Admin Mendaftarkan Wallet Institusi (Authorization)
Sebelum institusi/bank dapat berpartisipasi dalam federated learning, admin harus mendaftarkan wallet mereka terlebih dahulu.

**Langkah-langkah:**
1. Admin login dengan wallet yang memiliki hak akses admin (contoh: account "Admin" atau "Dev")
2. Buka tab **Admin** pada aplikasi
3. Pada panel **Register Institution**:
   - Masukkan **Account Address** (H160 format: `0x...`) dari institusi yang akan didaftarkan
   - Masukkan **Institution Name** (contoh: "Bank A", "Bank BCA", dll)
4. Klik **Register Institution**
5. Konfirmasi transaksi di wallet (MetaMask/SubWallet)
6. Tunggu transaksi ter-finalized di blockchain

**Blockchain Call:**
```typescript
api.tx.federatedLearning.forceAuthorize(accountAddress, institutionName)
```

**Catatan Penting:**
- Hanya akun dengan role admin yang dapat melakukan registrasi
- Address HARUS dalam format H160/Ethereum (`0x` + 40 hex characters)
- Institusi yang belum terdaftar TIDAK BISA submit model ke blockchain

### 2. Admin Membatalkan Registrasi Institusi (Unauthorization)
Admin dapat mencabut akses institusi yang sudah terdaftar.

**Langkah-langkah:**
1. Admin login dengan wallet admin
2. Buka tab **Admin**
3. Pada panel **Unregister Institution**:
   - Masukkan **Account Address** yang akan di-unregister
4. Klik **Unregister Institution**
5. Konfirmasi transaksi di wallet

**Blockchain Call:**
```typescript
api.tx.federatedLearning.forceUnauthorize(accountAddress)
```

### 3. Bank/Institusi Melakukan Training & Upload Model
**Prasyarat:** Wallet institusi sudah didaftarkan oleh admin (Use Case #1)

1. Bank melatih model ML di data lokal (private)
2. Export model weights ke format `.npz`
3. Upload ke aplikasi FLAAS-Web
4. Model di-hash (SHA-256) dan diupload ke IPFS
5. Submit record ke blockchain

### 4. Admin Melakukan Agregasi Global
1. Admin melihat semua model yang sudah diupload
2. Trigger agregasi FedAvg di server
3. Server menghitung weighted average dari semua model
4. Global model diupload ke IPFS
5. Update global model record di blockchain

### 5. Audit & Compliance
1. Semua submission tercatat di blockchain
2. Audit records bisa di-query berdasarkan:
   - ID
   - Model Hash
   - Institution
   - Address
3. IPFS CID memungkinkan verifikasi model asli

---

## 📝 API Reference

### Federated Learning Server

| Endpoint | Method | Deskripsi |
|----------|--------|-----------|
| `/upload-model` | POST | Upload model lokal |
| `/aggregate` | POST | Trigger FedAvg aggregation |
| `/logs` | GET | Get server logs |
| `/download-global` | GET | Download global model |

### Blockchain Queries

| Query | Return Type | Deskripsi |
|-------|-------------|-----------|
| `federatedLearning.records(id)` | `AuditRecord` | Get record by ID |
| `federatedLearning.nextId()` | `u32` | Next available ID |
| `federatedLearning.authorizedInstitutions(address)` | `Option<String>` | Get institution name |
| `federatedLearning.globalModel()` | `GlobalModelInfo` | Global model info |
| `federatedLearning.palletVersion()` | `u16` | Pallet version |

---

## 🔍 Troubleshooting

### Common Issues

| Issue | Solusi |
|-------|--------|
| "No Polkadot extension found" | Install MetaMask/SubWallet/Talisman extension |
| "Address must be H160 format" | Gunakan MetaMask untuk signing transaksi |
| "PINATA_JWT not found" | Tambahkan `NEXT_PUBLIC_PINATA_JWT` di `.env.local` |
| "Minimal 2 model untuk agregasi" | Upload minimal 2 model dari client berbeda |
| "Not authorized" | Minta admin untuk register institusi Anda |

---

## 📚 References

- [Next.js Documentation](https://nextjs.org/docs)
- [Polkadot.js API](https://polkadot.js.org/docs/)
- [Pinata IPFS](https://docs.pinata.cloud/)
- [Federated Averaging (FedAvg)](https://arxiv.org/abs/1602.05629)
- [Substrate Documentation](https://docs.substrate.io/)

---

## 📄 License

This project is developed for academic purposes at UKDW (Universitas Kristen Duta Wacana).

---

*Documentation generated: December 2024*
