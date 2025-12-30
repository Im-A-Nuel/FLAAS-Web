"use client";
import { useState, useEffect } from "react";
import { IoDocumentOutline, IoCloudUploadOutline } from "react-icons/io5";
import { ModelMetrics } from "../lib/hooks";
import { hashFile } from "../lib/hash";
import { uploadToPinata, isPinataConfigured } from "../lib/pinata";

interface Account {
  address: string;
  originalAddress?: string;
  meta: {
    name?: string;
    source: string;
  };
}

interface ModelUploadProps {
  selectedAccount: Account | null;
  onUpload: (file: File, clientName: string, uploadMethod: "json" | "multipart" | "auto", metrics?: ModelMetrics) => Promise<any>;
  onBlockchainSubmit?: (modelHash: string, accuracy: number, ipfsCid: string, note: string, signingAccount: Account) => Promise<any>;
  uploadLoading: boolean;
  uploadError: string | null;
}

export default function ModelUpload({
  selectedAccount,
  onUpload,
  onBlockchainSubmit,
  uploadLoading,
  uploadError
}: ModelUploadProps) {
  const [selectedFiles, setSelectedFiles] = useState<FileList | null>(null);
  const [modelFile, setModelFile] = useState<File | null>(null);
  const [uploadResult, setUploadResult] = useState<string | null>(null);
  const [clientName, setClientName] = useState<string>("BANK_A");
  const [uploadMethod, setUploadMethod] = useState<"json" | "multipart" | "auto">("json");
  const [blockchainSubmitting, setBlockchainSubmitting] = useState(false);
  const [blockchainResult, setBlockchainResult] = useState<string | null>(null);
  const [blockchainError, setBlockchainError] = useState<string | null>(null);

  // Metrics state
  const [bestAccuracy, setBestAccuracy] = useState<string>("");
  const [historyText, setHistoryText] = useState<string>("");
  const [note, setNote] = useState<string>("");

  // Auto-set client name based on selected account
  useEffect(() => {
    if (selectedAccount && selectedAccount.meta.name) {
      setClientName(selectedAccount.meta.name);
    }
  }, [selectedAccount]);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    setSelectedFiles(files);
    setUploadResult(null);

    if (!files || files.length === 0) return;

    const fileArray = Array.from(files);

    // 1. Find model file (.npz has priority)
    const npzFile = fileArray.find(f => f.name.endsWith('.npz'));
    if (npzFile) {
      setModelFile(npzFile);
      console.log(`Found .npz file: ${npzFile.name}`);
    } else {
      const modelFile = fileArray.find(f =>
        f.name.endsWith('.bin') ||
        f.name.endsWith('.pkl') ||
        f.name.endsWith('.pt') ||
        f.name.endsWith('.pth') ||
        f.name.endsWith('.h5') ||
        f.name.endsWith('.weights')
      );
      setModelFile(modelFile || files[0]);
    }

    // 2. Auto-read metrics files (matching Python script behavior)
    await readMetricsFromFiles(fileArray);
  };

  // Read best_accuracy and history from files in folder
  const readMetricsFromFiles = async (files: File[]) => {
    // Candidates for best_accuracy file
    const bestAccuracyFiles = [
      'best_accuracy.txt',
      'best_acc.txt',
      'BEST_ACCURACY.txt'
    ];

    // Candidates for history file
    const historyFiles = [
      'accuracy_history.txt',
      'accuracy_history.log',
      'history.txt',
      'history_accuracy.txt'
    ];

    // Try to find and read best_accuracy
    for (const fileName of bestAccuracyFiles) {
      const file = files.find(f => f.name === fileName);
      if (file) {
        try {
          const content = await file.text();
          const lines = content.trim().split('\n');
          if (lines.length > 0) {
            const firstLine = lines[0].trim();
            const accuracy = parseFloat(firstLine);
            if (!isNaN(accuracy)) {
              setBestAccuracy(accuracy.toString());
              console.log(`Auto-loaded best_accuracy: ${accuracy} from ${fileName}`);
              break;
            }
          }
        } catch (err) {
          console.error(`Failed to read ${fileName}:`, err);
        }
      }
    }

    // Try to find and read history
    for (const fileName of historyFiles) {
      const file = files.find(f => f.name === fileName);
      if (file) {
        try {
          const content = await file.text();
          const lines = content.trim().split('\n').filter(line => line.trim().length > 0);
          if (lines.length > 0) {
            // Take last 200 lines (matching Python script)
            const historyLines = lines.slice(-200);
            setHistoryText(historyLines.join('\n'));
            console.log(`Auto-loaded history: ${historyLines.length} lines from ${fileName}`);
            break;
          }
        } catch (err) {
          console.error(`Failed to read ${fileName}:`, err);
        }
      }
    }
  };

  const handleUpload = async () => {
    if (!modelFile || !clientName) return;
    setUploadResult(null);
    setBlockchainResult(null);
    setBlockchainError(null);

    // Build metrics object if any metrics provided
    let metrics: ModelMetrics | undefined = undefined;
    if (bestAccuracy || historyText) {
      metrics = {
        best_accuracy: bestAccuracy ? parseFloat(bestAccuracy) : null,
        history: historyText
          ? historyText.split('\n').filter(line => line.trim().length > 0)
          : []
      };
    }

    // Step 1: Upload to Federated Server
    console.log('📤 Step 1: Uploading to Federated Server...');
    const result = await onUpload(modelFile, clientName, uploadMethod, metrics);
    if (!result) {
      console.error('❌ Federated server upload failed');
      return;
    }

    setUploadResult(`✅ ${result.message} - Client: ${clientName}`);
    console.log('✅ Step 1 Complete: Federated server upload successful');

    // Step 2: Blockchain submission (if callback provided and account connected)
    if (onBlockchainSubmit && selectedAccount && modelFile.name.endsWith('.npz')) {
      try {
        setBlockchainSubmitting(true);
        console.log('🔗 Step 2: Starting blockchain submission...');

        // 2a. Hash the .npz file
        console.log('🔐 Step 2a: Hashing model file...');
        const modelHash = await hashFile(modelFile);
        console.log('✅ Model hash:', modelHash);

        // 2b. Upload to Pinata IPFS
        console.log('📤 Step 2b: Uploading to Pinata IPFS...');
        if (!isPinataConfigured()) {
          throw new Error('Pinata not configured. Please add NEXT_PUBLIC_PINATA_JWT to .env.local');
        }
        const ipfsCid = await uploadToPinata(modelFile, `${clientName}_${modelFile.name}`);
        console.log('✅ IPFS CID:', ipfsCid);

        // 2c. Get accuracy from bestAccuracy field (convert to u32 format - multiply by 10000)
        const accuracy = bestAccuracy ? Math.round(parseFloat(bestAccuracy) * 10000) : 0;
        console.log('📊 Accuracy (u32):', accuracy);

        // 2d. Submit to blockchain
        console.log('🔗 Step 2c: Submitting to blockchain...');
        await onBlockchainSubmit(modelHash, accuracy, ipfsCid, note, selectedAccount);

        setBlockchainResult('✅ Successfully submitted to blockchain!');
        console.log('✅ Step 2 Complete: Blockchain submission successful');

        // Clear form after successful submission
        setSelectedFiles(null);
        setModelFile(null);
        setBestAccuracy('');
        setHistoryText('');
        setNote('');
      } catch (err) {
        console.error('❌ Blockchain submission failed:', err);

        // Parse error message for better user feedback
        let errorMessage = err instanceof Error ? err.message : 'Blockchain submission failed';

        // Add specific context based on error type
        if (errorMessage.includes('NotAuthorized')) {
          errorMessage = `${errorMessage}\n\n⚠️ Your account is not authorized. Please register your account in the Admin tab first.`;
        } else if (errorMessage.includes('InsufficientBalance') || errorMessage.includes('balance')) {
          errorMessage = `${errorMessage}\n\n⚠️ Insufficient balance in your wallet. Please add tokens to continue.`;
        } else if (errorMessage.includes('ModelHashExists') || errorMessage.includes('already exists')) {
          errorMessage = `${errorMessage}\n\n⚠️ This model has already been submitted to the blockchain.`;
        } else if (errorMessage.includes('InvalidAccuracy')) {
          errorMessage = `${errorMessage}\n\n⚠️ Accuracy value must be between 0 and 10000 (representing 0.00% to 100.00%).`;
        }

        setBlockchainError(errorMessage);
      } finally {
        setBlockchainSubmitting(false);
      }
    } else {
      console.log('ℹ️ Skipping blockchain submission (not configured or not .npz file)');
      // Still clear form if no blockchain submission
      setSelectedFiles(null);
      setModelFile(null);
    }
  };

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
      <div className="flex items-center gap-3 mb-6">
        <IoDocumentOutline className="text-emerald-500 text-xl" />
        <h3 className="text-lg font-semibold text-gray-900">
          Model Management
        </h3>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Bank / Client Name
          </label>
          <div className="relative">
            <input
              type="text"
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              placeholder="BANK_A"
              className="w-full p-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-gray-900"
            />
            {selectedAccount && (
              <div className="mt-2 text-xs text-gray-500 bg-gray-50 p-2 rounded">
                <span className="font-medium">Wallet:</span>{' '}
                {selectedAccount.address.slice(0, 10)}...{selectedAccount.address.slice(-8)}
              </div>
            )}
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Select a bank card above or enter custom name
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Upload Model File/Folder
          </label>
          <input
            type="file"
            onChange={handleFileSelect}
            {...({ webkitdirectory: "", directory: "" } as any)}
            multiple
            className="w-full p-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-gray-900 file:mr-3 file:py-2 file:px-3 file:rounded file:border-0 file:text-sm file:bg-gray-100 file:text-gray-700 hover:file:bg-gray-200"
          />
          <p className="text-xs text-gray-500 mt-1">
            Select folder containing model files. Priority: .npz → .bin → .pkl → .pt → .pth
          </p>
          {selectedFiles && selectedFiles.length > 0 && (
            <div className="text-xs text-gray-500 mt-2 space-y-1">
              <p className="font-medium">
                Selected folder: {selectedFiles[0].webkitRelativePath.split('/')[0]}
              </p>
              <p>
                {selectedFiles.length} file(s) in folder
              </p>
              {modelFile && (
                <div className="mt-2 p-2 bg-emerald-50 border border-emerald-200 rounded">
                  <p className="font-semibold text-emerald-700">
                    Model file to upload: {modelFile.name}
                  </p>
                  <p className="text-emerald-600">
                    Size: {(modelFile.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Upload Method
          </label>
          <select
            value={uploadMethod}
            onChange={(e) => setUploadMethod(e.target.value as "json" | "multipart" | "auto")}
            className="w-full p-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-gray-900"
          >
            <option value="json">JSON Base64 (Recommended)</option>
            <option value="auto">Auto (JSON with Multipart fallback)</option>
            <option value="multipart">Multipart Form-Data</option>
          </select>
          <p className="text-xs text-gray-500 mt-1">
            {uploadMethod === "json" && "Sends files as base64-encoded JSON payload"}
            {uploadMethod === "auto" && "Tries JSON first, falls back to multipart on error"}
            {uploadMethod === "multipart" && "Sends files as multipart/form-data"}
          </p>
        </div>

        {/* Model Metrics (Auto-loaded from folder) */}
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-4 rounded-lg border border-blue-200">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-medium text-gray-700">
              Model Metrics
            </h4>
            {(bestAccuracy || historyText) && (
              <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-medium">
                ✓ Auto-loaded from folder
              </span>
            )}
          </div>

          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Best Accuracy
              </label>
              <input
                type="number"
                step="0.0001"
                min="0"
                max="1"
                value={bestAccuracy}
                onChange={(e) => setBestAccuracy(e.target.value)}
                placeholder="Auto-detected from best_accuracy.txt"
                className="w-full p-2 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-gray-900"
              />
              <p className="text-xs text-gray-500 mt-1">
                Auto-loaded from: best_accuracy.txt, best_acc.txt, or BEST_ACCURACY.txt
              </p>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Training History
              </label>
              <textarea
                value={historyText}
                onChange={(e) => setHistoryText(e.target.value)}
                placeholder="Auto-detected from accuracy_history.txt"
                rows={4}
                className="w-full p-2 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-gray-900 font-mono"
              />
              <p className="text-xs text-gray-500 mt-1">
                Auto-loaded from: accuracy_history.txt, history.txt (last 200 lines)
              </p>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Note
              </label>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Optional note for blockchain submission (e.g., Model v1.0, Initial training, etc.)"
                rows={2}
                className="w-full p-2 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-gray-900"
              />
              <p className="text-xs text-gray-500 mt-1">
                Optional: Add notes about this model version for blockchain record
              </p>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={handleUpload}
          disabled={!modelFile || !clientName || uploadLoading || blockchainSubmitting}
          className="w-full py-3 px-4 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 disabled:bg-gray-400 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-2 transition-colors"
        >
          <IoCloudUploadOutline className="text-lg" />
          {uploadLoading ? "Uploading to Federated Server..." :
           blockchainSubmitting ? "Submitting to Blockchain..." :
           `Upload Model${modelFile ? ` (${modelFile.name})` : ''}`}
        </button>

        {uploadError && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            Upload Error: {uploadError}
          </div>
        )}

        {uploadResult && (
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
            {uploadResult}
          </div>
        )}

        {blockchainSubmitting && (
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg text-blue-700 text-sm">
            🔗 Submitting to blockchain (hashing, IPFS upload, transaction signing)...
          </div>
        )}

        {blockchainResult && (
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm font-medium">
            {blockchainResult}
          </div>
        )}

        {blockchainError && (
          <div className="bg-red-50 border-2 border-red-400 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <span className="text-red-600 text-xl flex-shrink-0">⚠️</span>
              <div className="flex-1">
                <p className="text-sm font-bold text-red-900 mb-2">Blockchain Submission Failed</p>
                <div className="bg-red-100 border border-red-300 rounded p-3 mb-2">
                  <p className="text-xs font-mono text-red-800 break-all">
                    {blockchainError}
                  </p>
                </div>
                <div className="text-xs text-red-700 space-y-1">
                  <p className="font-semibold">Common causes:</p>
                  <ul className="list-disc list-inside space-y-0.5 ml-2">
                    <li>Account not authorized - Register account in Admin tab first</li>
                    <li>Insufficient balance - Ensure wallet has enough tokens</li>
                    <li>Invalid accuracy value - Must be between 0-10000</li>
                    <li>Duplicate submission - Model hash already exists</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
