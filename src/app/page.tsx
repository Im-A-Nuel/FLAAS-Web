"use client";
import { useState, useEffect } from "react";
import { useAggregate, useLogs, useUploadModel, useDownloadGlobal } from "./lib/hooks";
import {
  IoFlash,
  IoRefresh,
  IoWalletOutline,
  IoLinkOutline,
  IoSettingsOutline,
  IoGridOutline,
  IoShieldCheckmarkOutline,
  IoStatsChartOutline,
  IoCloudUploadOutline,
  IoCodeSlashOutline,
  IoTerminalOutline,
  IoOpenOutline,
  IoCloseCircleOutline,
  IoDocumentTextOutline,
  IoTrashOutline
} from "react-icons/io5";
import {
  usePolkadotConnection,
  useAccounts,
  useSubmitModel,
  useForceAuthorize,
  useForceUnauthorize,
  useAccountBalances,
  useUpdateGlobalModel,
  useCheckAdmin
} from "./lib/blockchain-hooks";
import { hashFile } from "./lib/hash";
import { uploadToPinata } from "./lib/pinata";
import { useAuditRecords } from "./lib/audit-hooks";
import BankCards from "./components/BankCards";
import AdminRegister from "./components/AdminRegister";
import AdminUnregister from "./components/AdminUnregister";
import FederatedAggregation from "./components/FederatedAggregation";
import ModelUpload from "./components/ModelUpload";
import BlockchainIntegration from "./components/BlockchainIntegration";
import FederatedLogs from "./components/FederatedLogs";
import TabNavigation, { TabId } from "./components/TabNavigation";
import BlockExplorer from "./components/BlockExplorer";
import BlockchainLogs from "./components/BlockchainLogs";
import GlobalModel from "./components/GlobalModel";
import AuditRecords from "./components/AuditRecords";
import AggregationResult from "./components/AggregationResult";
import TransactionHistory from "./components/TransactionHistory";

export default function Home() {
  const [activeTab, setActiveTab] = useState<TabId>("dashboard");
  const [showWalletDropdown, setShowWalletDropdown] = useState(false);
  const [aggregationResult, setAggregationResult] = useState<{
    method: string;
    num_clients: number;
    num_layers: number;
    avg_global_weight: number;
    avg_global_weight_change_percent: number;
    client_mean_weight: Record<string, number>;
    client_mean_weight_percentage: Record<string, number>;
    saved?: string;
  } | null>(null);

  // API hooks
  const { aggregate, loading, error } = useAggregate();
  const { getLogs, loading: logsLoading, error: logsError } = useLogs();
  const { uploadModel, loading: uploadLoading, error: uploadError } = useUploadModel();
  const { downloadGlobal, loading: downloadLoading, error: downloadError } = useDownloadGlobal();

  // Blockchain hooks
  const { isConnected } = usePolkadotConnection();
  const {
    accounts,
    selectedAccount,
    selectedWallet,
    availableWallets,
    setSelectedAccount,
    fetchWallets,
    fetchAccounts,
    disconnectAccounts
  } = useAccounts();
  const { submit: submitModel, loading: submitLoading, error: submitError } = useSubmitModel();
  const { update: updateGlobalModelBlockchain, loading: updateGlobalLoading, error: updateGlobalError, result: updateGlobalResult } = useUpdateGlobalModel();
  const { authorize, loading: authorizeLoading, error: authorizeError, result: authorizeResult } = useForceAuthorize();
  const { unauthorize, loading: unauthorizeLoading, error: unauthorizeError, result: unauthorizeResult } = useForceUnauthorize();
  const { balances, fetchBalances } = useAccountBalances();
  const { records, getAllRecords } = useAuditRecords();
  const { isAdmin, loading: adminCheckLoading, checked: adminChecked, checkAdmin, resetAdmin } = useCheckAdmin();

  // State for blockchain submission progress after aggregation
  const [blockchainSubmissionStatus, setBlockchainSubmissionStatus] = useState<string | null>(null);

  // State for transaction history modal
  const [showTransactionHistory, setShowTransactionHistory] = useState(false);
  const [selectedAccountForHistory, setSelectedAccountForHistory] = useState<{
    address: string;
    name: string;
  } | null>(null);

  // Fetch balances when accounts change
  useEffect(() => {
    if (accounts.length > 0) {
      const addresses = accounts.map(acc => acc.address);
      fetchBalances(addresses);
    }
  }, [accounts, fetchBalances]);

  // Fetch audit records when component mounts or accounts change
  useEffect(() => {
    getAllRecords();
  }, [getAllRecords]);

  // Load aggregation result from localStorage on mount
  useEffect(() => {
    const savedResult = localStorage.getItem('aggregationResult');
    if (savedResult) {
      try {
        const parsed = JSON.parse(savedResult);
        setAggregationResult(parsed);
        console.log('📦 Loaded aggregation result from localStorage');
      } catch (err) {
        console.error('Failed to parse saved aggregation result:', err);
        localStorage.removeItem('aggregationResult');
      }
    }
  }, []);

  // Save aggregation result to localStorage whenever it changes
  useEffect(() => {
    if (aggregationResult) {
      localStorage.setItem('aggregationResult', JSON.stringify(aggregationResult));
      console.log('💾 Saved aggregation result to localStorage');
    }
  }, [aggregationResult]);

  // Check admin status when selected account changes
  useEffect(() => {
    if (selectedAccount) {
      console.log('🔄 Checking admin status for:', selectedAccount.address);
      checkAdmin(selectedAccount.address);
    } else {
      console.log('🔄 No account selected, resetting admin status');
      resetAdmin();
    }
  }, [selectedAccount, checkAdmin, resetAdmin]);

  // Get latest accuracy from blockchain audit records for a given address
  const getLatestAccuracy = (address: string): number => {
    // Filter records by address (who field) and sort by id (newest first)
    const addressRecords = records
      .filter(record => record.who.toLowerCase() === address.toLowerCase())
      .sort((a, b) => b.id - a.id);

    // Return the latest accuracy, or 0 if no records found
    return addressRecords.length > 0 ? addressRecords[0].accuracy : 0;
  };

  // Count how many times an account has submitted models
  const getSubmissionCount = (address: string): number => {
    return records.filter(record => record.who.toLowerCase() === address.toLowerCase()).length;
  };

  // Get global model version (stored in localStorage from aggregations)
  const getGlobalVersion = (): number => {
    const savedVersion = localStorage.getItem('globalModelVersion');
    return savedVersion ? parseInt(savedVersion, 10) : 0;
  };

  // Get model status for an account
  const getModelStatus = (address: string): 'first-time' | 'updated' | 'outdated' => {
    const submissionCount = getSubmissionCount(address);
    const globalVersion = getGlobalVersion();

    if (submissionCount === 0) {
      return 'first-time'; // Belum pernah submit
    } else if (submissionCount === 1 && globalVersion === 0) {
      return 'first-time'; // Baru pertama kali submit, belum ada agregasi
    } else if (submissionCount > globalVersion) {
      return 'updated'; // Sudah submit setelah agregasi terakhir
    } else {
      return 'outdated'; // Belum update setelah agregasi
    }
  };

  // Get contribution data from aggregation result for a specific bank
  const getBankContribution = (bankName: string, bankIndex: number): { meanWeight: number; percentage: number } => {
    if (!aggregationResult) {
      return { meanWeight: 0, percentage: 0 };
    }

    // Try multiple matching strategies
    const normalizedBankName = bankName.toLowerCase().replace(/\s+/g, '');
    const clientKeys = Object.keys(aggregationResult.client_mean_weight);

    // Strategy 1: Direct match with bank name (case-insensitive, spaces removed)
    for (const filename of clientKeys) {
      const filenameLower = filename.toLowerCase().replace(/\s+/g, '');
      if (filenameLower.includes(normalizedBankName)) {
        const meanWeight = aggregationResult.client_mean_weight[filename];
        const percentage = aggregationResult.client_mean_weight_percentage[filename] || 0;
        return { meanWeight, percentage };
      }
    }

    // Strategy 2: Match by index (client1 -> Bank A/index 0, client2 -> Bank B/index 1, etc.)
    // Look for patterns like "client1", "client2", "client_1", etc.
    const clientNumber = bankIndex + 1; // Bank index 0 -> client1
    for (const filename of clientKeys) {
      const filenameLower = filename.toLowerCase();
      if (filenameLower.includes(`client${clientNumber}`) ||
          filenameLower.includes(`client_${clientNumber}`) ||
          filenameLower.includes(`client ${clientNumber}`)) {
        const meanWeight = aggregationResult.client_mean_weight[filename];
        const percentage = aggregationResult.client_mean_weight_percentage[filename] || 0;
        return { meanWeight, percentage };
      }
    }

    // Strategy 3: Match by position (if we have same number of banks and clients)
    if (clientKeys.length > bankIndex) {
      const filename = clientKeys[bankIndex];
      const meanWeight = aggregationResult.client_mean_weight[filename];
      const percentage = aggregationResult.client_mean_weight_percentage[filename] || 0;
      return { meanWeight, percentage };
    }

    return { meanWeight: 0, percentage: 0 };
  };

  // Banks based on connected Polkadot accounts
  // Exclude special accounts like Dev and Admin from bank list
  const excludedAccountNames = ['dev', 'admin'];

  // Filter to get only bank accounts
  const bankAccounts = accounts.filter((account) => {
    const accountName = (account.meta.name || '').toLowerCase();
    return !excludedAccountNames.includes(accountName);
  });

  const banks = accounts.map((account, originalIndex) => {
    const bankName = account.meta.name || `Bank ${String.fromCharCode(65 + originalIndex)}`;
    const accountNameLower = (account.meta.name || '').toLowerCase();
    const isExcludedAccount = excludedAccountNames.includes(accountNameLower);

    // Only calculate contribution for bank accounts, using their index among banks
    let contribution = { meanWeight: 0, percentage: 0 };
    if (!isExcludedAccount) {
      const bankIndex = bankAccounts.findIndex(acc => acc.address === account.address);
      contribution = getBankContribution(bankName, bankIndex);
    }

    return {
      id: String.fromCharCode(65 + originalIndex),
      name: bankName,
      address: account.address,
      status: selectedAccount?.address === account.address ? "Online" : "Offline",
      kpg: parseFloat(balances[account.address] || '0'),
      accuracy: getLatestAccuracy(account.address),
      contribution: contribution.percentage,
      meanWeight: contribution.meanWeight,
      meanWeightPercentage: contribution.percentage,
      modelStatus: getModelStatus(account.address),
      submissionCount: getSubmissionCount(account.address),
      globalVersion: getGlobalVersion(),
    };
  });


  // Tab configuration (Logs removed - will be fixed at bottom)
  const tabs = [
    { id: "dashboard" as TabId, label: "Dashboard", icon: <IoGridOutline /> },
    { id: "admin" as TabId, label: "Admin", icon: <IoShieldCheckmarkOutline /> },
    { id: "aggregation" as TabId, label: "Aggregation", icon: <IoStatsChartOutline /> },
    { id: "upload" as TabId, label: "Upload Model", icon: <IoCloudUploadOutline /> },
    { id: "blockchain" as TabId, label: "Blockchain", icon: <IoCodeSlashOutline /> },
    { id: "audit" as TabId, label: "Audit Records", icon: <IoDocumentTextOutline /> },
  ];

  // Handlers
  const handleConnectClick = async () => {
    setShowWalletDropdown(true);
    await fetchWallets();
  };

  const handleSelectWallet = async (walletId: string) => {
    await fetchAccounts(walletId);
    setShowWalletDropdown(false);
  };

  const handleRefreshAccounts = async () => {
    if (selectedWallet) {
      await fetchAccounts(selectedWallet);
    }
  };

  const handleDisconnectWallet = () => {
    disconnectAccounts();
  };

  const handleSelectBank = (bank: typeof banks[0], account: typeof accounts[0]) => {
    setSelectedAccount(account);
  };

  const handleViewHistory = (accountAddress: string, accountName: string) => {
    setSelectedAccountForHistory({ address: accountAddress, name: accountName });
    setShowTransactionHistory(true);
  };

  const handleCloseHistory = () => {
    setShowTransactionHistory(false);
    setSelectedAccountForHistory(null);
  };

  // Get transaction history for a specific account
  const getAccountTransactions = (address: string) => {
    return records
      .filter(record => record.who.toLowerCase() === address.toLowerCase())
      .sort((a, b) => b.timestamp - a.timestamp);
  };

  const handleRegisterAccount = async (adminAccount: string, accountToRegister: string, institutionName: string) => {
    // Find the admin account to get its original SS58 address and wallet source
    const adminAcc = accounts.find(acc => acc.address === adminAccount);
    const result = await authorize(adminAccount, accountToRegister, institutionName, adminAcc?.originalAddress, adminAcc?.meta?.source);
    if (result) {
      console.log('Account registered successfully:', result);
    }
  };

  const handleUnregisterAccount = async (adminAccount: string, accountToUnregister: string) => {
    // Find the admin account to get its original SS58 address and wallet source
    const adminAcc = accounts.find(acc => acc.address === adminAccount);
    const result = await unauthorize(adminAccount, accountToUnregister, adminAcc?.originalAddress, adminAcc?.meta?.source);
    if (result) {
      console.log('Account unregistered successfully:', result);
    }
  };

  const handleUploadModel = async (file: File, clientName: string, uploadMethod: "json" | "multipart" | "auto", metrics?: any) => {
    return await uploadModel(file, clientName, uploadMethod, metrics);
  };

  const handleDownloadModel = async () => {
    const result = await downloadGlobal();
    if (result) {
      const url = URL.createObjectURL(result.model);
      const a = document.createElement('a');
      a.href = url;
      // Use dynamic filename from aggregation result, fallback to default
      const filename = aggregationResult?.saved || 'global_model_fedavg.npz';
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  const handleClearCache = () => {
    // Clear all localStorage data
    localStorage.removeItem('aggregationResult');
    localStorage.removeItem('globalModelVersion');

    // Reset state
    setAggregationResult(null);

    console.log('🗑️ Cache cleared successfully');
    alert('Cache berhasil dibersihkan!\n\nData yang dihapus:\n- Aggregation Result\n- Global Model Version');
  };

  const handleAggregate = async () => {
    setBlockchainSubmissionStatus(null);

    const result = await aggregate();
    if (result && result.status === 'success') {
      setAggregationResult({
        method: result.method,
        num_clients: result.num_clients,
        num_layers: result.num_layers,
        avg_global_weight: result.avg_global_weight,
        avg_global_weight_change_percent: result.avg_global_weight_change_percent,
        client_mean_weight: result.client_mean_weight || {},
        client_mean_weight_percentage: result.client_mean_weight_percentage || {},
        saved: result.saved,
      });

      // Increment global model version after successful aggregation
      const currentVersion = getGlobalVersion();
      const newVersion = currentVersion + 1;
      localStorage.setItem('globalModelVersion', newVersion.toString());
      console.log(`📈 Global model version updated: ${currentVersion} → ${newVersion}`);

      // Automatically submit to blockchain after successful aggregation
      if (selectedAccount) {
        try {
          console.log('🔗 Starting automatic blockchain submission after aggregation...');

          // Small delay to ensure aggregation is complete
          await new Promise(resolve => setTimeout(resolve, 500));

          setBlockchainSubmissionStatus('⏬ Downloading global model...');

          // Step 1: Download global model
          const downloadResult = await downloadGlobal();
          if (!downloadResult) {
            throw new Error('Failed to download global model');
          }
          console.log('✅ Global model downloaded');

          // Step 2: Hash the model
          setBlockchainSubmissionStatus('🔐 Hashing model file...');
          const modelFile = new File([downloadResult.model], result.saved || 'global_model.npz');
          const modelHash = await hashFile(modelFile);
          console.log('✅ Model hash:', modelHash);

          // Step 3: Upload to IPFS
          setBlockchainSubmissionStatus('📤 Uploading to IPFS...');
          const ipfsCid = await uploadToPinata(modelFile, result.saved || 'global_model.npz');
          console.log('✅ IPFS CID:', ipfsCid);

          // Step 4: Convert weight change to blockchain format (multiply by 10000 for precision)
          const weightChange = Math.round((result.avg_global_weight_change_percent || 0) * 10000);
          console.log('📊 Weight Change (u32):', weightChange);

          // Step 5: Submit to blockchain
          // Add delay before blockchain transaction to ensure wallet is ready
          setBlockchainSubmissionStatus('⏳ Menunggu konfirmasi wallet...');
          console.log('⏳ Waiting for wallet to be ready...');
          await new Promise(resolve => setTimeout(resolve, 1000));

          setBlockchainSubmissionStatus('🔗 Menunggu tanda tangan dari wallet...');
          console.log('🔗 Requesting blockchain transaction signature...');
          console.log('📝 Transaction details:', {
            account: selectedAccount.address,
            hash: modelHash.slice(0, 10) + '...',
            cid: ipfsCid.slice(0, 10) + '...',
            weightChange
          });

          const txResult = await updateGlobalModelBlockchain(
            selectedAccount.address,
            modelHash,
            ipfsCid,
            weightChange,
            selectedAccount.originalAddress,
            selectedAccount.meta?.source
          );

          if (txResult) {
            setBlockchainSubmissionStatus('✅ Successfully submitted to blockchain!');
            console.log('✅ Blockchain submission complete');
            console.log('✅ Transaction result:', txResult);
          } else {
            throw new Error('Transaction failed or was cancelled');
          }

          // Clear status after 5 seconds
          setTimeout(() => setBlockchainSubmissionStatus(null), 5000);
        } catch (err) {
          console.error('❌ Blockchain submission failed:', err);
          const errorMessage = err instanceof Error ? err.message : 'Unknown error';

          // Check if user cancelled the transaction
          if (errorMessage.includes('Cancelled') || errorMessage.includes('cancelled') || errorMessage.includes('rejected')) {
            setBlockchainSubmissionStatus('⚠️ Transaksi dibatalkan oleh pengguna');
            console.log('⚠️ User cancelled the transaction');
          } else {
            setBlockchainSubmissionStatus(`❌ Blockchain submission failed: ${errorMessage}`);
          }

          // Keep error message longer for user to read
          setTimeout(() => setBlockchainSubmissionStatus(null), 8000);
        }
      } else {
        console.log('ℹ️ No wallet selected, skipping blockchain submission');
        setBlockchainSubmissionStatus('⚠️ No wallet selected - blockchain submission skipped');
        setTimeout(() => setBlockchainSubmissionStatus(null), 5000);
      }
    }
    return result;
  };

  const handleSubmitToBlockchain = async (modelHash: string, accuracy: number, ipfsCid: string, note: string, signingAccount: any) => {
    if (!signingAccount) return;

    console.log('Submitting with account:', {
      name: signingAccount.meta?.name,
      h160Address: signingAccount.address,
      originalSS58: signingAccount.originalAddress,
      walletSource: signingAccount.meta?.source
    });

    const result = await submitModel(
      signingAccount.address,
      modelHash,
      accuracy,
      ipfsCid,
      note,
      signingAccount.originalAddress,
      signingAccount.meta?.source // Pass wallet source
    );

    if (result) {
      console.log('Model submitted to blockchain:', result);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4">
      <div className="flex gap-4 h-screen">
        {/* Sidebar */}
        <div className="w-72 bg-white rounded-xl shadow-sm border border-gray-100 flex flex-col max-h-[calc(100vh-2rem)]">
          <div className="flex items-center gap-2 p-4 pb-3 flex-shrink-0">
            <div className="w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center">
              <IoFlash className="text-white text-lg" />
            </div>
            <div>
              <h1 className="text-base font-semibold text-gray-900">
                FL Blockchain Simulation
              </h1>
              <p className="text-xs text-gray-500">Decentralized AI</p>
            </div>
          </div>

          {/* Server Connections - Scrollable */}
          <div className="flex-1 overflow-y-auto px-4 pb-4 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
            <div className="space-y-3">
            {/* Federated Server Connection */}
            <div className="bg-gradient-to-br from-emerald-600 to-emerald-700 rounded-lg p-3 text-white">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-6 h-6 bg-white/20 rounded-lg flex items-center justify-center">
                  <IoCloudUploadOutline className="text-white text-sm" />
                </div>
                <div>
                  <span className="text-sm font-medium">Federated Server</span>
                  <p className="text-xs text-emerald-100">Model Aggregation</p>
                </div>
              </div>

              <div className="flex items-center gap-2 mb-2">
                <div className="w-2 h-2 bg-white rounded-full animate-pulse shadow-lg"></div>
                <span className="text-xs text-emerald-100">Connected to Server</span>
              </div>

              <a
                href="https://federatedserver.up.railway.app"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-xs text-white hover:text-emerald-100 transition-colors"
              >
                <IoOpenOutline className="text-sm" />
                <span className="font-mono">federatedserver.up.railway.app</span>
              </a>
              <p className="text-xs text-emerald-200 mt-1">
                Upload & aggregation endpoint
              </p>
            </div>

            {/* Block Explorer - Real-time */}
            <BlockExplorer />

            {/* Aggregation Result */}
            <AggregationResult result={aggregationResult} />

            {/* Global Model - Download */}
            <GlobalModel
              onDownload={handleDownloadModel}
              loading={downloadLoading}
              error={downloadError}
              modelFileName={aggregationResult?.saved}
            />

            {/* Clear Cache Button */}
            <button
              onClick={handleClearCache}
              className="w-full mt-3 py-2 px-3 bg-red-50 hover:bg-red-100 border border-red-200 hover:border-red-300 rounded-lg text-xs font-medium text-red-700 hover:text-red-800 flex items-center justify-center gap-2 transition-all"
              title="Clear cached data (Aggregation Result & Model Version)"
            >
              <IoTrashOutline className="text-sm" />
              Clear Cache
            </button>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Header with Wallet Connection */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex-1">
              <TabNavigation
                tabs={tabs}
                activeTab={activeTab}
                onTabChange={setActiveTab}
              />
            </div>

            {/* Wallet Connection - Top Right (Compact) */}
            <div className="ml-3 relative">
              <div className="bg-white rounded-lg p-2 shadow-sm border border-gray-100 min-w-[200px]">
                {!selectedWallet ? (
                  <>
                    <button
                      type="button"
                      onClick={handleConnectClick}
                      className="w-full py-1.5 px-3 bg-indigo-600 text-white rounded text-xs font-medium hover:bg-indigo-700 cursor-pointer flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <IoLinkOutline className="text-sm" />
                      Connect Wallet
                    </button>
                    {isConnected && (
                      <div className="text-xs text-green-600 flex items-center justify-center gap-1 mt-1.5">
                        <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                        Local Node
                      </div>
                    )}
                  </>
                ) : (
                  <div className="space-y-1.5">
                    <div className="bg-indigo-50 border border-indigo-200 rounded p-1.5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <IoWalletOutline className="text-indigo-600 text-xs" />
                          <span className="text-xs font-medium text-indigo-900">
                            {availableWallets.find(w => w.id === selectedWallet)?.name}
                          </span>
                        </div>
                        <div className="flex gap-1">
                          <button
                            type="button"
                            onClick={handleRefreshAccounts}
                            className="p-0.5 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition-colors"
                            title="Refresh"
                          >
                            <IoRefresh className="text-xs" />
                          </button>
                          <button
                            type="button"
                            onClick={handleDisconnectWallet}
                            className="p-0.5 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                            title="Disconnect"
                          >
                            <IoCloseCircleOutline className="text-xs" />
                          </button>
                        </div>
                      </div>
                    </div>
                    {accounts.length > 0 && (
                      <select
                        value={selectedAccount?.address || ''}
                        onChange={(e) => {
                          const account = accounts.find(acc => acc.address === e.target.value);
                          if (account) setSelectedAccount(account);
                        }}
                        className="w-full p-1 border border-gray-300 rounded text-xs text-gray-900"
                      >
                        {accounts.map((account) => (
                          <option key={account.address} value={account.address}>
                            {account.meta.name || account.address.slice(0, 8) + '...'}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                )}
              </div>

              {/* Floating Wallet Dropdown */}
              {showWalletDropdown && !selectedWallet && availableWallets.length > 0 && (
                <>
                  {/* Backdrop */}
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setShowWalletDropdown(false)}
                  />

                  {/* Dropdown Menu */}
                  <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 p-3 z-50">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-semibold text-gray-900">Select Wallet</span>
                      <button
                        onClick={() => setShowWalletDropdown(false)}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        <IoCloseCircleOutline className="text-lg" />
                      </button>
                    </div>
                    <div className="space-y-2">
                      {availableWallets.map((wallet) => (
                        <button
                          key={wallet.id}
                          type="button"
                          onClick={() => handleSelectWallet(wallet.id)}
                          className="w-full py-2 px-3 bg-white border border-indigo-200 text-indigo-700 rounded text-sm font-medium hover:bg-indigo-50 hover:border-indigo-300 cursor-pointer flex items-center gap-2 transition-colors"
                        >
                          <IoWalletOutline className="text-base" />
                          {wallet.name}
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Content Area - Scrollable */}
          <div className="flex-1 overflow-auto">
            {activeTab === "dashboard" && (
              <BankCards
                banks={banks}
                selectedAccount={selectedAccount}
                onSelectBank={handleSelectBank}
                onViewHistory={handleViewHistory}
                accounts={accounts}
              />
            )}

            {activeTab === "admin" && (
              <div className="space-y-6">
                <AdminRegister
                  accounts={accounts}
                  onRegister={handleRegisterAccount}
                  loading={authorizeLoading}
                  error={authorizeError}
                  result={authorizeResult}
                />
                <AdminUnregister
                  accounts={accounts}
                  onUnregister={handleUnregisterAccount}
                  loading={unauthorizeLoading}
                  error={unauthorizeError}
                  result={unauthorizeResult}
                />
              </div>
            )}

            {activeTab === "aggregation" && (
              <FederatedAggregation
                onAggregate={handleAggregate}
                loading={loading}
                error={error}
                blockchainStatus={blockchainSubmissionStatus}
                isAdmin={isAdmin}
                adminCheckLoading={adminCheckLoading}
                adminChecked={adminChecked}
                selectedAccount={selectedAccount}
              />
            )}

            {activeTab === "upload" && (
              <ModelUpload
                selectedAccount={selectedAccount}
                onUpload={handleUploadModel}
                onBlockchainSubmit={handleSubmitToBlockchain}
                uploadLoading={uploadLoading}
                uploadError={uploadError}
              />
            )}

            {activeTab === "blockchain" && (
              <BlockchainIntegration
                selectedAccount={selectedAccount}
                accounts={accounts}
                onSubmit={handleSubmitToBlockchain}
                loading={submitLoading}
                error={submitError}
              />
            )}

            {activeTab === "audit" && (
              <AuditRecords />
            )}
          </div>

          {/* Compact Log Buttons - Click to View Details */}
          <div className="mt-3 grid grid-cols-2 gap-2">
            <FederatedLogs
              onRefresh={getLogs}
              loading={logsLoading}
              error={logsError}
            />
            <BlockchainLogs />
          </div>
        </div>
      </div>

      {/* Transaction History Modal */}
      {selectedAccountForHistory && (
        <TransactionHistory
          isOpen={showTransactionHistory}
          onClose={handleCloseHistory}
          accountAddress={selectedAccountForHistory.address}
          accountName={selectedAccountForHistory.name}
          transactions={getAccountTransactions(selectedAccountForHistory.address)}
        />
      )}
    </div>
  );
}
