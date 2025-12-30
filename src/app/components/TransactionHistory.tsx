"use client";
import { useState, useEffect } from "react";
import { IoCloseOutline, IoTimeOutline, IoCheckmarkCircleOutline, IoDocumentTextOutline } from "react-icons/io5";

interface Transaction {
  id: number;
  who: string;
  modelHash: string;
  institution: string;
  atBlock: number;
  accuracy: number;
  ipfsCid?: string;
  note?: string;
}

interface TransactionHistoryProps {
  isOpen: boolean;
  onClose: () => void;
  accountAddress: string;
  accountName: string;
  transactions: Transaction[];
}

export default function TransactionHistory({
  isOpen,
  onClose,
  accountAddress,
  accountName,
  transactions
}: TransactionHistoryProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!isOpen || !mounted) return null;

  const formatBlockNumber = (blockNumber: number) => {
    return `Block #${blockNumber}`;
  };

  const formatAccuracy = (accuracy: number) => {
    return (accuracy / 10000).toFixed(2) + '%';
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-40 animate-fadeIn"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div
          className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col animate-slideUp"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Transaction History</h2>
              <p className="text-sm text-gray-600 mt-1">
                {accountName} • {accountAddress.slice(0, 8)}...{accountAddress.slice(-6)}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <IoCloseOutline className="text-2xl text-gray-500" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {transactions.length === 0 ? (
              <div className="text-center py-12">
                <IoDocumentTextOutline className="text-6xl text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 text-lg">No transaction history</p>
                <p className="text-gray-400 text-sm mt-2">
                  This account hasn't submitted any models to the blockchain yet.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {transactions.map((tx, index) => (
                  <div
                    key={tx.id}
                    className="bg-gradient-to-r from-gray-50 to-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                  >
                    {/* Transaction Header */}
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
                          <IoCheckmarkCircleOutline className="text-indigo-600 text-xl" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900">
                            Model Submission #{tx.id}
                          </h3>
                          <div className="flex items-center gap-2 text-sm text-gray-500 mt-0.5">
                            <IoTimeOutline className="text-xs" />
                            <span>{formatBlockNumber(tx.atBlock)}</span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-xs text-gray-500">Accuracy</span>
                        <div className="text-lg font-bold text-green-600">
                          {formatAccuracy(tx.accuracy)}
                        </div>
                      </div>
                    </div>

                    {/* Transaction Details */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
                      <div className="bg-white rounded-lg p-3 border border-gray-100">
                        <div className="text-xs text-gray-500 mb-1">Model Hash</div>
                        <div className="text-sm font-mono text-gray-900 break-all">
                          {tx.modelHash.slice(0, 20)}...{tx.modelHash.slice(-20)}
                        </div>
                      </div>

                      {tx.ipfsCid && (
                        <div className="bg-white rounded-lg p-3 border border-gray-100">
                          <div className="text-xs text-gray-500 mb-1">IPFS CID</div>
                          <div className="text-sm font-mono text-gray-900 break-all">
                            {tx.ipfsCid.slice(0, 20)}...{tx.ipfsCid.slice(-20)}
                          </div>
                        </div>
                      )}
                    </div>

                    {tx.note && (
                      <div className="mt-3 bg-blue-50 border border-blue-200 rounded-lg p-3">
                        <div className="text-xs text-blue-700 font-medium mb-1">Note</div>
                        <div className="text-sm text-blue-900">{tx.note}</div>
                      </div>
                    )}

                    {/* View Links */}
                    {tx.ipfsCid && (
                      <div className="flex gap-2 mt-3">
                        <a
                          href={`https://ipfs.io/ipfs/${tx.ipfsCid}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-indigo-600 hover:text-indigo-700 font-medium flex items-center gap-1"
                        >
                          View on IPFS →
                        </a>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-gray-200 p-4 bg-gray-50">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-600">
                Total Transactions: <span className="font-semibold">{transactions.length}</span>
              </p>
              <button
                onClick={onClose}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-fadeIn {
          animation: fadeIn 0.2s ease-out;
        }

        .animate-slideUp {
          animation: slideUp 0.3s ease-out;
        }
      `}</style>
    </>
  );
}
