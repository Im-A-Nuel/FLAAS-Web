"use client";
import { useState } from "react";
import { IoTerminalOutline, IoRefresh } from "react-icons/io5";
import LogModal from "./LogModal";

interface FederatedLogsProps {
  onRefresh: () => Promise<any>;
  loading: boolean;
  error: string | null;
}

export default function FederatedLogs({ onRefresh, loading, error }: FederatedLogsProps) {
  const [logs, setLogs] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleRefresh = async () => {
    const result = await onRefresh();
    if (result) {
      setLogs(result);
    }
  };

  const handleOpenModal = async () => {
    if (!logs) {
      await handleRefresh();
    }
    setIsModalOpen(true);
  };

  return (
    <>
      {/* Compact View with Preview */}
      <button
        type="button"
        onClick={handleOpenModal}
        className="w-full bg-gray-900 hover:bg-gray-800 rounded-lg p-3 shadow-sm transition-colors cursor-pointer text-left"
      >
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <IoTerminalOutline className="text-emerald-400 text-lg" />
            <span className="text-emerald-400 font-medium text-sm">Federated Logs</span>
            {logs && (
              <span className="text-xs text-gray-400">
                ({logs.files?.length || 0} files)
              </span>
            )}
          </div>
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-xs text-gray-400">Click for details</span>
          </div>
        </div>

        {/* Latest Log Preview */}
        <div className="font-mono text-xs">
          {logs && logs.message ? (
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-emerald-400">
                <span className="text-gray-500">{new Date().toLocaleTimeString()}</span>
                <span className="truncate">{logs.message}</span>
              </div>
              {logs.files && logs.files.length > 0 && (
                <div className="flex items-center gap-2 text-xs text-gray-400">
                  <span>Latest:</span>
                  <span className="text-yellow-400 truncate">
                    {logs.files[logs.files.length - 1]?.name || 'N/A'}
                  </span>
                  <span className="text-blue-400">
                    ({logs.files[logs.files.length - 1]?.client || 'N/A'})
                  </span>
                </div>
              )}
            </div>
          ) : (
            <div className="text-gray-500">
              Click refresh to load logs...
            </div>
          )}
        </div>
      </button>

      {/* Modal */}
      <LogModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Federated Logs"
        titleColor="text-emerald-400"
        icon={<IoTerminalOutline className="text-emerald-400 text-xl" />}
      >
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-sm text-gray-400">Live Connection</span>
            </div>
            <button
              type="button"
              onClick={handleRefresh}
              disabled={loading}
              className="px-4 py-2 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700 disabled:bg-gray-600 cursor-pointer flex items-center gap-2 transition-colors"
            >
              <IoRefresh className="text-sm" />
              {loading ? "Loading..." : "Refresh"}
            </button>
          </div>

          {error && (
            <div className="text-red-400 text-sm p-3 bg-red-900/20 rounded-lg">
              Error: {error}
            </div>
          )}

          <div className="space-y-3 font-mono text-sm">
            {logs && logs.message ? (
              <div className="space-y-3">
                <div className="flex items-start gap-3 p-3 bg-gray-800 rounded-lg">
                  <span className="text-gray-400 text-xs">
                    {new Date().toLocaleTimeString()}
                  </span>
                  <span className="text-emerald-400 flex-1">{logs.message}</span>
                </div>
                {logs.files && logs.files.length > 0 && (
                  <div className="space-y-2">
                    <div className="text-xs text-gray-400 font-semibold">
                      Files on Server ({logs.files.length}):
                    </div>
                    <div className="grid grid-cols-1 gap-2">
                      {logs.files.map((file: any, fileIndex: number) => (
                        <div
                          key={fileIndex}
                          className="p-3 bg-gray-800 rounded-lg hover:bg-gray-750 transition-colors"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <span className="w-2 h-2 bg-yellow-400 rounded-full"></span>
                              <span className="text-yellow-400 text-xs font-semibold">
                                {file.name}
                              </span>
                            </div>
                            <span className="text-xs text-blue-400 bg-blue-900/30 px-2 py-0.5 rounded">
                              {file.client}
                            </span>
                          </div>
                          <div className="ml-4 space-y-1">
                            <div className="text-xs text-gray-400">
                              {file.message}
                            </div>
                            <div className="text-xs text-gray-500">
                              {new Date(file.timestamp).toLocaleString()}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-gray-500 text-sm py-12 text-center">
                Click refresh to load federation logs...
              </div>
            )}
          </div>
        </div>
      </LogModal>
    </>
  );
}
