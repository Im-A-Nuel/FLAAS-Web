"use client";
import { useState, useRef } from "react";
import { IoLinkOutline, IoPersonOutline, IoDocumentAttachOutline } from "react-icons/io5";

interface Account {
  address: string;
  originalAddress?: string;
  meta: {
    name?: string;
    source: string;
  };
}

interface BlockchainIntegrationProps {
  selectedAccount: Account | null;
  accounts: Account[];
  onSubmit: (modelHash: string, accuracy: number, ipfsCid: string, note: string, signingAccount: Account) => Promise<void>;
  loading: boolean;
  error: string | null;
}

export default function BlockchainIntegration({
  selectedAccount,
  accounts,
  onSubmit,
  loading,
  error
}: BlockchainIntegrationProps) {
  const [modelHash, setModelHash] = useState('');
  const [accuracy, setAccuracy] = useState(0);
  const [ipfsCid, setIpfsCid] = useState('');
  const [note, setNote] = useState('');
  const [signingAccountAddress, setSigningAccountAddress] = useState('');
  const [useManualAddress, setUseManualAddress] = useState(false);
  const [manualAddress, setManualAddress] = useState('');

  // New states for enhanced features
  const [includeIpfsCid, setIncludeIpfsCid] = useState(false);
  const [includeNote, setIncludeNote] = useState(false);
  const [hashingFile, setHashingFile] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Helper to convert SS58 to H160
  const convertSS58toH160 = async (ss58Address: string): Promise<string> => {
    try {
      const { decodeAddress } = await import('@polkadot/keyring');
      const { u8aToHex } = await import('@polkadot/util');

      const decoded = decodeAddress(ss58Address);
      if (decoded.length >= 20) {
        return u8aToHex(decoded.slice(0, 20));
      }
      return ss58Address;
    } catch (err) {
      console.error('Failed to convert SS58 to H160:', err);
      return ss58Address;
    }
  };

  // Hash a file using SHA-256
  const hashFile = async (file: File): Promise<string> => {
    setHashingFile(true);
    try {
      const buffer = await file.arrayBuffer();
      const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const hashHex = '0x' + hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
      setModelHash(hashHex);
      setHashingFile(false);
      return hashHex;
    } catch (err) {
      console.error('Failed to hash file:', err);
      setHashingFile(false);
      return '';
    }
  };

  // Handle file selection for hashing
  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      await hashFile(file);
    }
  };


  const handleSubmit = async () => {
    if (!modelHash) return;

    let signingAccount;

    if (useManualAddress && manualAddress) {
      // IMPORTANT: Pallet uses AccountId20 (H160), so we ONLY accept Ethereum addresses
      if (!manualAddress.startsWith('0x') || manualAddress.length !== 42) {
        alert('❌ Pallet ini menggunakan AccountId20 (H160/Ethereum format)!\n\n' +
              'Format yang benar: 0x... (42 karakter)\n\n' +
              'SOLUSI:\n' +
              '1. Install MetaMask extension\n' +
              '2. Import private key Anda ke MetaMask\n' +
              '3. Copy address H160 dari MetaMask (format: 0x...)\n\n' +
              '⚠️ SubWallet/Polkadot.js TIDAK BISA digunakan untuk AccountId20!');
        return;
      }

      console.log('✅ H160 address entered:', manualAddress);

      signingAccount = {
        address: manualAddress,        // H160 for blockchain transaction
        originalAddress: undefined,    // No SS58 conversion needed
        meta: {
          name: 'MetaMask Account',
          source: 'metamask'
        }
      };

      console.log('✅ MetaMask account prepared:', signingAccount);
    } else {
      // Find the signing account from dropdown
      signingAccount = accounts.find(acc => acc.address === signingAccountAddress) || selectedAccount;

      // Validate that the selected account is H160 format
      if (signingAccount && !signingAccount.address.startsWith('0x')) {
        alert('❌ Account yang dipilih bukan format H160!\n\n' +
              'Pallet ini menggunakan AccountId20 (H160/Ethereum format).\n\n' +
              'Gunakan MetaMask atau import account ke MetaMask terlebih dahulu.');
        return;
      }
    }

    if (!signingAccount) {
      alert('Please select an account or enter a manual address');
      return;
    }

    // Only pass optional fields if they're enabled
    const finalIpfsCid = includeIpfsCid ? ipfsCid : '';
    const finalNote = includeNote ? note : '';

    await onSubmit(modelHash, accuracy, finalIpfsCid, finalNote, signingAccount);
  };

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
      <div className="flex items-center gap-3 mb-6">
        <IoLinkOutline className="text-violet-500 text-xl" />
        <h3 className="text-lg font-semibold text-gray-900">
          Submit Extrinsic: federatedLearning.submitLocalModel
        </h3>
      </div>

      <div className="space-y-4">
        {/* Account Selector for Signing */}
        <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <label className="text-sm font-medium text-indigo-900 flex items-center gap-2">
              <IoPersonOutline className="text-lg" />
              using the selected account
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={useManualAddress}
                onChange={(e) => setUseManualAddress(e.target.checked)}
                className="w-4 h-4 text-indigo-600 rounded focus:ring-2 focus:ring-indigo-500"
              />
              <span className="text-sm text-indigo-900 font-medium">Manual Input</span>
            </label>
          </div>

          {!useManualAddress ? (
            <>
              <select
                value={signingAccountAddress}
                onChange={(e) => setSigningAccountAddress(e.target.value)}
                className="w-full p-3 border border-indigo-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900 bg-white"
              >
                <option value="">Use Default ({selectedAccount?.meta.name || 'No account selected'})</option>
                {accounts.map((account) => (
                  <option key={account.address} value={account.address}>
                    {account.meta.name || 'Unknown'} ({account.address.slice(0, 10)}...{account.address.slice(-8)})
                  </option>
                ))}
              </select>
              <p className="text-xs text-indigo-700 mt-2">
                Pilih account yang akan digunakan untuk sign transaksi.
              </p>
              {signingAccountAddress && (
                <div className="mt-2 p-2 bg-white rounded border border-indigo-200">
                  <p className="text-xs text-gray-600 font-medium mb-1">Selected Address:</p>
                  <p className="text-xs font-mono text-indigo-600 break-all">
                    {accounts.find(acc => acc.address === signingAccountAddress)?.address}
                  </p>
                  {accounts.find(acc => acc.address === signingAccountAddress)?.originalAddress && (
                    <>
                      <p className="text-xs text-gray-600 font-medium mb-1 mt-2">Original SS58 Address:</p>
                      <p className="text-xs font-mono text-green-600 break-all">
                        {accounts.find(acc => acc.address === signingAccountAddress)?.originalAddress}
                      </p>
                    </>
                  )}
                </div>
              )}
            </>
          ) : (
            <>
              <input
                type="text"
                value={manualAddress}
                onChange={(e) => setManualAddress(e.target.value)}
                placeholder="Paste H160 address dari MetaMask (contoh: 0x8dA3A3E4ed7142d3C99Ee9f4E25137Da2dB1D4EC)"
                className="w-full p-3 border border-indigo-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900 bg-white font-mono"
              />
              <div className="mt-2 space-y-1 bg-orange-50 border border-orange-200 rounded p-2">
                <p className="text-xs text-orange-800 font-semibold">
                  🦊 Pallet ini menggunakan AccountId20 (H160/Ethereum format)
                </p>
                <p className="text-xs text-orange-700">
                  <strong>LANGKAH:</strong>
                </p>
                <ol className="text-xs text-orange-700 ml-4 list-decimal space-y-1">
                  <li>Install <strong>MetaMask</strong> extension</li>
                  <li>Import private key account Anda ke MetaMask</li>
                  <li>Copy address H160 dari MetaMask (format: 0x...)</li>
                  <li>Paste di field ini</li>
                </ol>
                <p className="text-xs text-red-600 font-semibold mt-2">
                  ⚠️ SubWallet/Polkadot.js TIDAK BISA digunakan!
                </p>
              </div>
              {manualAddress && (
                <div className={`mt-2 p-2 bg-white rounded border ${
                  manualAddress.startsWith('0x') && manualAddress.length === 42
                    ? 'border-green-200'
                    : 'border-red-200'
                }`}>
                  <p className={`text-xs font-medium mb-1 ${
                    manualAddress.startsWith('0x') && manualAddress.length === 42
                      ? 'text-green-700'
                      : 'text-red-700'
                  }`}>
                    {manualAddress.startsWith('0x') && manualAddress.length === 42
                      ? '✅ H160 Address Detected (MetaMask)'
                      : '❌ Format Tidak Valid'}
                  </p>
                  <p className={`text-xs font-mono break-all ${
                    manualAddress.startsWith('0x') && manualAddress.length === 42
                      ? 'text-green-600'
                      : 'text-red-600'
                  }`}>
                    {manualAddress}
                  </p>
                  <p className="text-xs text-gray-600 mt-1">
                    {manualAddress.startsWith('0x') && manualAddress.length === 42
                      ? '✅ Valid H160 - MetaMask akan diminta untuk sign transaksi'
                      : '❌ Harus format Ethereum: 0x... (42 karakter)'}
                  </p>
                </div>
              )}
            </>
          )}
        </div>

        {/* Extrinsic Method Info */}
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <p className="text-sm text-gray-700 mb-2">
            <span className="font-medium">submit the following extrinsic</span>
          </p>
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 bg-orange-100 text-orange-700 rounded text-sm font-medium">
              federatedLearning
            </span>
            <span className="text-gray-500">→</span>
            <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded text-sm font-mono">
              submitLocalModel(modelHash, accuracy, ipfsCid, note)
            </span>
          </div>
        </div>

        {/* Model Hash with File Upload */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            modelHash: H256 (ModelHash)
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={modelHash}
              onChange={(e) => setModelHash(e.target.value)}
              placeholder="0x9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08"
              className="flex-1 p-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-violet-500 focus:border-transparent text-gray-900 font-mono"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={hashingFile}
              className="px-4 py-2 bg-orange-500 text-white rounded-lg text-sm font-medium hover:bg-orange-600 disabled:bg-gray-400 flex items-center gap-2 whitespace-nowrap"
            >
              <IoDocumentAttachOutline className="text-lg" />
              {hashingFile ? 'Hashing...' : 'hash a file'}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              onChange={handleFileSelect}
              className="hidden"
              accept="*/*"
            />
          </div>
        </div>

        {/* Accuracy */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            accuracy: u32
          </label>
          <input
            type="number"
            value={accuracy}
            onChange={(e) => setAccuracy(Number(e.target.value))}
            placeholder="88"
            min="0"
            max="100"
            className="w-full p-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-violet-500 focus:border-transparent text-gray-900"
          />
        </div>

        {/* IPFS CID (Optional) */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium text-gray-700">
              ipfsCid: Option&lt;Bytes&gt; (Option&lt;CidOf&gt;)
            </label>
            <button
              type="button"
              onClick={() => setIncludeIpfsCid(!includeIpfsCid)}
              className="px-3 py-1 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded text-xs font-medium"
            >
              {includeIpfsCid ? 'Remove option' : 'include option'}
            </button>
          </div>
          {includeIpfsCid ? (
            <input
              type="text"
              value={ipfsCid}
              onChange={(e) => setIpfsCid(e.target.value)}
              placeholder="QmXxXxXxX..."
              className="w-full p-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-violet-500 focus:border-transparent text-gray-900"
            />
          ) : (
            <div className="w-full p-3 bg-gray-100 border border-gray-300 rounded-lg text-sm text-gray-500">
              None
            </div>
          )}
        </div>

        {/* Note (Optional) */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium text-gray-700">
              note: Option&lt;Bytes&gt; (Option&lt;NoteOf&gt;)
            </label>
            <button
              type="button"
              onClick={() => setIncludeNote(!includeNote)}
              className="px-3 py-1 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded text-xs font-medium"
            >
              {includeNote ? 'Remove option' : 'include option'}
            </button>
          </div>
          {includeNote ? (
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Model training notes..."
              className="w-full p-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-violet-500 focus:border-transparent text-gray-900"
            />
          ) : (
            <div className="w-full p-3 bg-gray-100 border border-gray-300 rounded-lg text-sm text-gray-500">
              None
            </div>
          )}
        </div>

        {/* Submit Button */}
        <button
          type="button"
          onClick={handleSubmit}
          disabled={
            !modelHash ||
            loading ||
            (useManualAddress && (!manualAddress || !manualAddress.startsWith('0x') || manualAddress.length !== 42)) ||
            (!useManualAddress && !selectedAccount && !signingAccountAddress)
          }
          className="w-full py-3 px-4 bg-violet-600 text-white rounded-lg font-medium hover:bg-violet-700 disabled:bg-gray-400 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-2 transition-colors"
        >
          <IoLinkOutline className="text-lg" />
          {loading ? "Submitting..." : "Submit Transaction"}
        </button>

        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}
      </div>
    </div>
  );
}
