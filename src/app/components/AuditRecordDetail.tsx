"use client";
import { useState, useEffect } from "react";
import { IoCloseCircle, IoCopyOutline, IoDownloadOutline, IoTimeOutline } from "react-icons/io5";
import { AuditRecord } from "../lib/audit-hooks";
import { connectToPolkadot } from "../lib/polkadot";

interface AuditRecordDetailProps {
  record: AuditRecord | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function AuditRecordDetail({ record, isOpen, onClose }: AuditRecordDetailProps) {
  const [currentBlock, setCurrentBlock] = useState<number | null>(null);
  const [blockTimestamp, setBlockTimestamp] = useState<Date | null>(null);

  useEffect(() => {
    if (isOpen && record) {
      const loadBlockData = async () => {
        await fetchCurrentBlock(); // Fetch current block first
        await fetchBlockTimestamp(record.atBlock); // Then fetch timestamp
      };
      loadBlockData();
    }
  }, [isOpen, record]);

  const fetchCurrentBlock = async () => {
    try {
      const api = await connectToPolkadot();
      const header = await api.rpc.chain.getHeader();
      setCurrentBlock(header.number.toNumber());
    } catch (err) {
      console.error("Failed to fetch current block:", err);
    }
  };

  const fetchBlockTimestamp = async (blockNumber: number) => {
    try {
      // If block is too old (more than 256 blocks ago), use approximate calculation
      // This avoids RPC errors for pruned/discarded block states
      if (currentBlock && currentBlock - blockNumber > 256) {
        const blockDiff = currentBlock - blockNumber;
        const secondsAgo = blockDiff * 6; // 6 seconds per block
        const approximateDate = new Date(Date.now() - (secondsAgo * 1000));
        setBlockTimestamp(approximateDate);
        return;
      }

      // For recent blocks, try to get exact timestamp from blockchain
      const api = await connectToPolkadot();
      const blockHash = await api.rpc.chain.getBlockHash(blockNumber);
      const timestamp = await api.query.timestamp.now.at(blockHash);
      const date = new Date(Number(timestamp.toString()));
      setBlockTimestamp(date);
    } catch (err) {
      // If block state is pruned/discarded, calculate approximate time
      console.warn("Block state pruned, using approximate time:", err);

      // Fallback: calculate based on current time and block difference
      if (currentBlock) {
        const blockDiff = currentBlock - blockNumber;
        const secondsAgo = blockDiff * 6; // 6 seconds per block
        const approximateDate = new Date(Date.now() - (secondsAgo * 1000));
        setBlockTimestamp(approximateDate);
      }
    }
  };

  if (!isOpen || !record) return null;

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const exportJSON = () => {
    const json = JSON.stringify(record, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `audit_record_${record.id}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const getTimeAgo = (blockNumber: number) => {
    if (!currentBlock) return "...";

    const blockDiff = currentBlock - blockNumber;
    const minutes = Math.floor((blockDiff * 6) / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days} hari lalu`;
    if (hours > 0) return `${hours} jam lalu`;
    if (minutes > 0) return `${minutes} menit lalu`;
    return "Baru saja";
  };

  const getBlockDate = () => {
    if (!blockTimestamp) return "Loading...";

    return blockTimestamp.toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      {/* Modal */}
      <div className="relative bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              Audit Record #{record.id}
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              Detailed information for this audit record
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={exportJSON}
              className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 cursor-pointer flex items-center gap-2 transition-colors"
            >
              <IoDownloadOutline />
              Export JSON
            </button>
            <button
              type="button"
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <IoCloseCircle className="text-3xl" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          {/* Top Row - 3 Columns */}
          <div className="grid grid-cols-3 gap-6 mb-6">
            {/* Record ID */}
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-2">
                Record ID
              </label>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold text-indigo-600">
                  #{record.id}
                </span>
                <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-medium">
                  On-Chain
                </span>
              </div>
            </div>

            {/* Institution */}
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-2">
                Institution
              </label>
              <div className="flex items-center gap-2">
                <span className="text-lg font-mono text-purple-600 bg-purple-50 px-3 py-2 rounded-lg">
                  {record.institution}
                </span>
              </div>
            </div>

            {/* Accuracy */}
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-2">
                Accuracy
              </label>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold text-emerald-600">
                  {Math.floor(record.accuracy / 100)}%
                </span>
              </div>
            </div>
          </div>

          {/* Submitted By */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-500 mb-2">
              Submitted By
            </label>
            <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
              <span className="text-sm font-mono text-gray-900 flex-1 break-all">
                {record.who}
              </span>
              <button
                onClick={() => copyToClipboard(record.who)}
                className="text-gray-400 hover:text-gray-600 flex-shrink-0"
                title="Copy address"
              >
                <IoCopyOutline className="text-lg" />
              </button>
            </div>
          </div>

          {/* Model Hash */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-500 mb-2">
              Model Hash
            </label>
            <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg mb-1">
              <span className="text-sm font-mono text-gray-900 flex-1 break-all">
                {record.modelHash}
              </span>
              <button
                onClick={() => copyToClipboard(record.modelHash)}
                className="text-gray-400 hover:text-gray-600 flex-shrink-0"
                title="Copy hash"
              >
                <IoCopyOutline className="text-lg" />
              </button>
            </div>
            <p className="text-xs text-gray-500">
              kzk6 hash identifier for the audited model
            </p>
          </div>

          {/* Block Information */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-500 mb-2">
              Block Information
            </label>
            <div className="flex items-center gap-2 text-gray-700">
              <IoTimeOutline className="text-gray-500" />
              <span className="font-medium">
                Block #{record.atBlock}
              </span>
              <span className="text-gray-600">
                ({getTimeAgo(record.atBlock)})
              </span>
              <span className="text-gray-500">
                ({getBlockDate()})
              </span>
            </div>
          </div>

          {/* IPFS CID (if available) */}
          {record.ipfsCid && (
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-500 mb-2">
                IPFS CID
              </label>
              <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                <span className="text-sm font-mono text-gray-900 flex-1 break-all">
                  {record.ipfsCid}
                </span>
                <button
                  onClick={() => copyToClipboard(record.ipfsCid || '')}
                  className="text-gray-400 hover:text-gray-600 flex-shrink-0"
                  title="Copy IPFS CID"
                >
                  <IoCopyOutline className="text-lg" />
                </button>
              </div>
            </div>
          )}

          {/* Note */}
          {record.note && (
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-500 mb-2">
                Note
              </label>
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-900 font-mono break-all">
                  {record.note}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
