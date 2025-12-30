"use client";
import { IoServerOutline, IoWalletOutline, IoTimeOutline, IoCheckmarkCircleOutline, IoAlertCircleOutline } from "react-icons/io5";

interface Account {
  address: string;
  meta: {
    name?: string;
    source: string;
  };
}

interface Bank {
  id: string;
  name: string;
  address: string;
  status: string;
  kpg: number;
  accuracy: number;
  contribution: number;
  meanWeight: number;
  meanWeightPercentage: number;
  modelStatus: 'first-time' | 'updated' | 'outdated';
  submissionCount: number;
  globalVersion: number;
}

interface BankCardsProps {
  banks: Bank[];
  selectedAccount: Account | null;
  onSelectBank: (bank: Bank, account: Account) => void;
  onViewHistory: (accountAddress: string, accountName: string) => void;
  accounts: Account[];
}

export default function BankCards({ banks, selectedAccount, onSelectBank, onViewHistory, accounts }: BankCardsProps) {
  return (
    <div className="grid grid-cols-3 gap-6">
      {banks.length > 0 ? (
        banks.map((bank) => (
          <div
            key={bank.address}
            onClick={() => {
              const account = accounts.find(acc => acc.address === bank.address);
              if (account) {
                onSelectBank(bank, account);
              }
            }}
            className={`bg-white rounded-xl p-5 shadow-sm border cursor-pointer transition-all hover:shadow-md ${
              selectedAccount?.address === bank.address
                ? 'border-indigo-500 ring-2 ring-indigo-200'
                : 'border-gray-100'
            }`}
          >
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                  bank.status === "Online" ? 'bg-green-100' : 'bg-gray-100'
                }`}>
                  <IoServerOutline className={`text-lg ${
                    bank.status === "Online" ? 'text-green-600' : 'text-gray-600'
                  }`} />
                </div>
                <div>
                  <span className="font-semibold text-gray-900">{bank.name}</span>
                  <p className="text-xs text-gray-500">{bank.status}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 bg-orange-50 px-3 py-1.5 rounded-lg">
                <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                <span className="text-sm font-medium text-orange-700">
                  {bank.kpg.toFixed(4)} KPGD
                </span>
              </div>
            </div>

            {/* Model Status Indicator - Only show for updated or outdated */}
            {bank.modelStatus !== 'first-time' && (
              <div className={`mt-3 p-2 rounded-lg border ${
                bank.modelStatus === 'updated'
                  ? 'bg-green-50 border-green-200'
                  : 'bg-red-50 border-red-200'
              }`}>
                <div className="flex items-center gap-2">
                  {bank.modelStatus === 'updated' ? (
                    <>
                      <IoCheckmarkCircleOutline className="text-green-600 text-base flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-green-900">Model Updated</p>
                        <p className="text-xs text-green-700">
                          {bank.submissionCount} submit • v{bank.globalVersion}
                        </p>
                      </div>
                    </>
                  ) : (
                    <>
                      <IoAlertCircleOutline className="text-red-600 text-base flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-red-900">Model Outdated</p>
                        <p className="text-xs text-red-700">
                          {bank.submissionCount} submit • v{bank.globalVersion} tersedia
                        </p>
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}

            <div className="space-y-3 text-sm">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Wallet Address</span>
              </div>
              <div className="text-xs font-mono text-indigo-600 bg-indigo-50 p-2 rounded break-all">
                {bank.address}
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Akurasi Model Lokal</span>
                <span className="text-orange-600 font-semibold">
                  {Math.floor(bank.accuracy / 100)}%
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Mean Weight</span>
                <span className="font-medium text-gray-900">
                  {bank.meanWeight.toFixed(6)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Mean Weight %</span>
                <span className="font-medium text-blue-600">
                  {bank.meanWeightPercentage.toFixed(2)}%
                </span>
              </div>
            </div>

            {selectedAccount?.address === bank.address && (
              <div className="mt-3 text-xs text-indigo-600 font-medium flex items-center gap-1">
                <div className="w-2 h-2 bg-indigo-500 rounded-full"></div>
                Selected for upload
              </div>
            )}

            {/* View History Button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onViewHistory(bank.address, bank.name);
              }}
              className="mt-4 w-full py-2 px-3 bg-gray-50 hover:bg-indigo-50 border border-gray-200 hover:border-indigo-300 rounded-lg text-xs font-medium text-gray-700 hover:text-indigo-700 flex items-center justify-center gap-2 transition-all"
            >
              <IoTimeOutline className="text-sm" />
              View Transaction History
            </button>
          </div>
        ))
      ) : (
        <div className="col-span-3 bg-white rounded-xl p-8 shadow-sm border border-gray-100 text-center">
          <IoWalletOutline className="text-gray-400 text-4xl mx-auto mb-3" />
          <p className="text-gray-600 mb-2">No wallets connected</p>
          <p className="text-sm text-gray-500">
            Connect your Polkadot wallet to register as a bank and upload models
          </p>
        </div>
      )}
    </div>
  );
}
