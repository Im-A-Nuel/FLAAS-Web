"use client";
import { useState, useEffect } from "react";
import { IoAddOutline, IoSearchOutline, IoCopyOutline, IoChevronForwardOutline, IoTimeOutline } from "react-icons/io5";
import { useAuditRecords, AuditRecord } from "../lib/audit-hooks";
import AuditRecordDetail from "./AuditRecordDetail";

export default function AuditRecords() {
  const { loading, error, records, getAllRecords } = useAuditRecords();
  const [searchId, setSearchId] = useState("");
  const [searchHash, setSearchHash] = useState("");
  const [filterAccount, setFilterAccount] = useState("");
  const [filterInstitution, setFilterInstitution] = useState("all");
  const [filteredRecords, setFilteredRecords] = useState<AuditRecord[]>([]);
  const [selectedRecord, setSelectedRecord] = useState<AuditRecord | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [currentBlock, setCurrentBlock] = useState<number | null>(null);

  useEffect(() => {
    getAllRecords();
    fetchCurrentBlock();
  }, [getAllRecords]);

  const fetchCurrentBlock = async () => {
    try {
      const { connectToPolkadot } = await import("../lib/polkadot");
      const api = await connectToPolkadot();
      const header = await api.rpc.chain.getHeader();
      setCurrentBlock(header.number.toNumber());
    } catch (err) {
      console.error("Failed to fetch current block:", err);
    }
  };

  useEffect(() => {
    let filtered = [...records];

    // Filter by ID
    if (searchId) {
      filtered = filtered.filter(r => r.id.toString().includes(searchId));
    }

    // Filter by hash
    if (searchHash) {
      filtered = filtered.filter(r =>
        r.modelHash.toLowerCase().includes(searchHash.toLowerCase())
      );
    }

    // Filter by account
    if (filterAccount) {
      filtered = filtered.filter(r =>
        r.who.toLowerCase().includes(filterAccount.toLowerCase())
      );
    }

    // Filter by institution
    if (filterInstitution && filterInstitution !== "all") {
      filtered = filtered.filter(r => r.institution === filterInstitution);
    }

    setFilteredRecords(filtered);
  }, [records, searchId, searchHash, filterAccount, filterInstitution]);

  const truncateAddress = (addr: string, start = 6, end = 4) => {
    if (!addr) return "";
    return `${addr.slice(0, start)}...${addr.slice(-end)}`;
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
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

  // Get unique institutions for filter
  const institutions = Array.from(new Set(records.map(r => r.institution))).filter(Boolean);

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Audit Records</h2>
          <p className="text-sm text-gray-500 mt-1">
            Browse and search all audit records ({filteredRecords.length} total)
          </p>
        </div>
        <button
          type="button"
          onClick={() => alert("Submit New - Coming soon!")}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 cursor-pointer flex items-center gap-2 transition-colors"
        >
          <IoAddOutline className="text-lg" />
          Submit New
        </button>
      </div>

      {/* Search and Filter */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Search by ID
          </label>
          <input
            type="text"
            value={searchId}
            onChange={(e) => setSearchId(e.target.value)}
            placeholder="Enter ID..."
            className="w-full p-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Search by Hash
          </label>
          <input
            type="text"
            value={searchHash}
            onChange={(e) => setSearchHash(e.target.value)}
            placeholder="0x..."
            className="w-full p-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Filter by Account
          </label>
          <input
            type="text"
            value={filterAccount}
            onChange={(e) => setFilterAccount(e.target.value)}
            placeholder="Account address..."
            className="w-full p-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Filter by Institution
          </label>
          <select
            value={filterInstitution}
            onChange={(e) => setFilterInstitution(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900"
          >
            <option value="all">All Institutions</option>
            {institutions.map((inst) => (
              <option key={inst} value={inst}>
                {inst}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          <p className="mt-2 text-sm text-gray-500">Loading records...</p>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          Error: {error}
        </div>
      )}

      {/* Table */}
      {!loading && !error && (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ID
                </th>
                <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Submitter
                </th>
                <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Institution
                </th>
                <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Model Hash
                </th>
                <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Block
                </th>
                <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-gray-500">
                    No audit records found
                  </td>
                </tr>
              ) : (
                filteredRecords.map((record) => (
                  <tr
                    key={record.id}
                    className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                  >
                    {/* ID */}
                    <td className="py-4 px-4">
                      <span className="text-indigo-600 font-semibold">
                        #{record.id}
                      </span>
                    </td>

                    {/* Submitter */}
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-900 font-mono bg-gray-100 px-2 py-1 rounded">
                          {truncateAddress(record.who)}
                        </span>
                        <button
                          onClick={() => copyToClipboard(record.who)}
                          className="text-gray-400 hover:text-gray-600"
                          title="Copy address"
                        >
                          <IoCopyOutline className="text-sm" />
                        </button>
                      </div>
                    </td>

                    {/* Institution */}
                    <td className="py-4 px-4">
                      <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-medium">
                        {record.institution}
                      </span>
                    </td>

                    {/* Model Hash */}
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-900 font-mono bg-gray-100 px-2 py-1 rounded">
                          {truncateAddress(record.modelHash, 6, 4)}
                        </span>
                        <button
                          onClick={() => copyToClipboard(record.modelHash)}
                          className="text-gray-400 hover:text-gray-600"
                          title="Copy hash"
                        >
                          <IoCopyOutline className="text-sm" />
                        </button>
                      </div>
                    </td>

                    {/* Block */}
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-2 text-sm">
                        <IoTimeOutline className="text-gray-400" />
                        <span className="text-red-700 font-medium">
                          Block #{record.atBlock}
                        </span>
                        <span className="text-blue-600">
                          ({getTimeAgo(record.atBlock)})
                        </span>
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="py-4 px-4">
                      <button
                        onClick={() => {
                          setSelectedRecord(record);
                          setIsDetailOpen(true);
                        }}
                        className="text-indigo-600 hover:text-indigo-700 font-medium flex items-center gap-1 text-sm"
                      >
                        View
                        <IoChevronForwardOutline />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Detail Modal */}
      <AuditRecordDetail
        record={selectedRecord}
        isOpen={isDetailOpen}
        onClose={() => {
          setIsDetailOpen(false);
          setSelectedRecord(null);
        }}
      />
    </div>
  );
}
