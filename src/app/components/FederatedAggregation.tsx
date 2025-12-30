"use client";
import { useState } from "react";
import { IoStatsChartOutline, IoPlayOutline, IoWarningOutline, IoShieldCheckmarkOutline, IoLockClosedOutline } from "react-icons/io5";

interface Account {
  address: string;
  meta: {
    name?: string;
    source: string;
  };
}

interface FederatedAggregationProps {
  onAggregate: () => Promise<any>;
  loading: boolean;
  error: string | null;
  blockchainStatus?: string | null;
  isAdmin: boolean;
  adminCheckLoading: boolean;
  adminChecked: boolean;
  selectedAccount: Account | null;
}

export default function FederatedAggregation({
  onAggregate,
  loading,
  error,
  blockchainStatus,
  isAdmin,
  adminCheckLoading,
  adminChecked,
  selectedAccount
}: FederatedAggregationProps) {
  const [aggregateResult, setAggregateResult] = useState<string | null>(null);

  const handleAggregate = async () => {
    setAggregateResult(null);
    const result = await onAggregate();
    if (result) {
      console.log("Aggregate result:", result);

      if (result.status === "success") {
        // Success response: show method, num_clients, num_layers, saved path
        const parts = [
          `✅ Aggregation completed using ${result.method || "FedAvg"}`,
          `${result.num_clients || 0} clients`,
          `${result.num_layers || 0} layers`
        ];
        if (result.saved) {
          const filename = result.saved.split(/[/\\]/).pop();
          parts.push(`Saved: ${filename}`);
        }
        setAggregateResult(parts.join(" • "));
      } else {
        // Error response: show error message
        setAggregateResult(`❌ Error: ${result.message || "Aggregation failed"}`);
      }
    }
  };

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
      <div className="flex items-center gap-3 mb-6">
        <IoStatsChartOutline className="text-indigo-500 text-xl" />
        <h3 className="text-lg font-semibold text-gray-900">
          Federated Aggregation Control
        </h3>
      </div>

      <div className="space-y-4">
        {/* Admin Status Indicator */}
        {selectedAccount && (
          <div className={`p-3 rounded-lg border ${
            adminCheckLoading
              ? 'bg-blue-50 border-blue-200'
              : isAdmin
              ? 'bg-green-50 border-green-200'
              : 'bg-red-50 border-red-200'
          }`}>
            <div className="flex items-center gap-2">
              {adminCheckLoading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-blue-600 border-t-transparent"></div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-blue-900">Memeriksa Status Admin...</p>
                    <p className="text-xs text-blue-700 mt-0.5">
                      Mengecek akses akun di blockchain
                    </p>
                  </div>
                </>
              ) : isAdmin ? (
                <>
                  <IoShieldCheckmarkOutline className="text-green-600 text-lg" />
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-green-900">Akun Terdaftar (Admin Sah)</p>
                    <p className="text-xs text-green-700 mt-0.5">
                      Anda memiliki akses untuk melakukan agregasi
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <IoLockClosedOutline className="text-red-600 text-lg" />
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-red-900">Akun Tidak Terdaftar</p>
                    <p className="text-xs text-red-700 mt-0.5">
                      Hanya admin yang dapat melakukan agregasi
                    </p>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        <button
          type="button"
          onClick={handleAggregate}
          disabled={loading || !selectedAccount || !isAdmin || adminCheckLoading}
          className="w-full py-3 px-4 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-2 transition-colors"
        >
          <IoPlayOutline className="text-lg" />
          {loading ? "Aggregating..." : adminCheckLoading ? "Checking Access..." : "Start Global Aggregation"}
        </button>

        {error && (
          <div className="bg-red-50 border-2 border-red-400 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <IoWarningOutline className="text-red-600 text-xl mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-bold text-red-900 mb-1.5">Gagal Melakukan Agregasi</p>
                <p className="text-sm font-medium text-red-800 leading-relaxed">
                  {error}
                </p>
              </div>
            </div>
          </div>
        )}

        {aggregateResult && (
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
            {aggregateResult}
          </div>
        )}

        {blockchainStatus && (
          <div className={`p-4 border rounded-lg text-sm font-medium ${
            blockchainStatus.includes('✅') ? 'bg-green-50 border-green-200 text-green-700' :
            blockchainStatus.includes('❌') ? 'bg-red-50 border-red-200 text-red-700' :
            blockchainStatus.includes('⚠️') ? 'bg-yellow-50 border-yellow-200 text-yellow-700' :
            'bg-blue-50 border-blue-200 text-blue-700'
          }`}>
            <div className="flex items-center gap-2">
              <div className={blockchainStatus.includes('✅') || blockchainStatus.includes('❌') || blockchainStatus.includes('⚠️') ? '' : 'animate-pulse'}>
                {blockchainStatus}
              </div>
            </div>
          </div>
        )}

        {!loading && !error && !aggregateResult && !blockchainStatus && !selectedAccount && (
          <div className="text-center text-gray-500 text-sm py-6">
            <IoLockClosedOutline className="text-gray-400 text-3xl mx-auto mb-2" />
            <p className="font-medium">Connect wallet terlebih dahulu</p>
            <p className="text-xs mt-1">Pilih wallet admin untuk melakukan agregasi</p>
          </div>
        )}
      </div>
    </div>
  );
}
