"use client";
import { useState } from "react";
import { IoCloudDownloadOutline, IoCheckmarkCircle, IoWarningOutline } from "react-icons/io5";

interface GlobalModelProps {
  onDownload: () => Promise<void>;
  loading: boolean;
  error: string | null;
  modelFileName?: string;
}

export default function GlobalModel({ onDownload, loading, error, modelFileName }: GlobalModelProps) {
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  const handleDownload = async () => {
    setDownloadSuccess(false);
    await onDownload();
    if (!error) {
      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 3000);
    }
  };

  return (
    <div className="bg-gradient-to-br from-violet-600 to-purple-700 rounded-lg p-3 text-white relative overflow-hidden">
      <div className="flex items-center gap-2 mb-2">
        <div className="w-6 h-6 bg-white/20 rounded-lg flex items-center justify-center">
          <IoCloudDownloadOutline className="text-white text-sm" />
        </div>
        <div className="flex-1">
          <span className="text-sm font-medium">Global Model</span>
          <p className="text-xs text-purple-100">FedAvg Result</p>
        </div>
      </div>

      <div className="space-y-2 relative z-10">
        <div className="bg-white/10 rounded p-2">
          <div className="text-xs text-purple-100 mb-1">Model File:</div>
          <div className="text-xs font-mono text-white break-all">
            {modelFileName || "global_model_fedavg.npz"}
          </div>
        </div>

        <button
          type="button"
          onClick={handleDownload}
          disabled={loading}
          className="w-full py-2 px-3 bg-white text-purple-700 rounded-lg text-xs font-medium hover:bg-purple-50 disabled:bg-gray-300 disabled:text-gray-500 cursor-pointer flex items-center justify-center gap-2 transition-colors"
        >
          {downloadSuccess ? (
            <>
              <IoCheckmarkCircle className="text-sm" />
              Downloaded!
            </>
          ) : (
            <>
              <IoCloudDownloadOutline className="text-sm" />
              {loading ? "Downloading..." : "Download Model"}
            </>
          )}
        </button>

        {error && (
          <div className="bg-red-900/70 border border-red-400/80 rounded-lg p-2.5">
            <div className="flex items-start gap-2">
              <IoWarningOutline className="text-red-200 text-sm mt-0.5 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-white mb-0.5">Gagal Mengunduh</p>
                <p className="text-xs text-red-100 leading-relaxed break-words">
                  {error}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
