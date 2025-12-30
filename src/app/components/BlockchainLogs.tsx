"use client";
import { useState, useEffect } from "react";
import { IoCodeSlashOutline, IoRefresh } from "react-icons/io5";
import LogModal from "./LogModal";
import { useBlockchainEvents, BlockchainEvent } from "../lib/events-hooks";

interface BlockchainLog {
  timestamp: string;
  type: "transaction" | "block" | "event";
  message: string;
  blockNumber?: number;
  section?: string;
  method?: string;
}

interface BlockchainLogsProps {
  onRefresh?: () => Promise<any>;
}

export default function BlockchainLogs({ onRefresh }: BlockchainLogsProps) {
  const [logs, setLogs] = useState<BlockchainLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { events, fetchRecentEvents, subscribeToEvents } = useBlockchainEvents();

  // Filter unwanted events
  const shouldShowEvent = (event: BlockchainEvent): boolean => {
    const excludedEvents = [
      'system.ExtrinsicSuccess',
      'transactionPayment.',
      'system.NewAccount',
    ];

    const eventName = `${event.section}.${event.method}`;

    // Check if event should be excluded
    for (const excluded of excludedEvents) {
      if (excluded.endsWith('.')) {
        // Prefix match (e.g., "transactionPayment." matches all transactionPayment events)
        if (eventName.startsWith(excluded)) {
          return false;
        }
      } else {
        // Exact match
        if (eventName === excluded) {
          return false;
        }
      }
    }

    return true;
  };

  // Convert blockchain events to logs
  const eventToLog = (event: BlockchainEvent): BlockchainLog => {
    return {
      timestamp: event.timestamp.toLocaleTimeString(),
      type: "event",
      message: `${event.section}.${event.method} #${event.blockNumber}`,
      blockNumber: event.blockNumber,
      section: event.section,
      method: event.method,
    };
  };

  // Fetch initial events
  useEffect(() => {
    fetchRecentEvents(20); // Fetch more blocks to get more events
  }, [fetchRecentEvents]);

  // Convert events to logs whenever events change (with filtering)
  useEffect(() => {
    if (events.length > 0) {
      console.log('Total events fetched:', events.length);
      const filteredEvents = events.filter(shouldShowEvent);
      console.log('Filtered events:', filteredEvents.length);
      console.log('Sample events:', filteredEvents.slice(0, 5).map(e => `${e.section}.${e.method}`));
      const eventLogs = filteredEvents.map(eventToLog);
      setLogs(eventLogs.slice(0, 50)); // Keep max 50 events
    }
  }, [events]);

  // Subscribe to new events (with filtering)
  useEffect(() => {
    const unsubscribe = subscribeToEvents((newEvent) => {
      console.log('New event received:', `${newEvent.section}.${newEvent.method}`, 'Block:', newEvent.blockNumber);
      if (shouldShowEvent(newEvent)) {
        console.log('Event passed filter, adding to logs');
        const newLog = eventToLog(newEvent);
        setLogs(prev => [newLog, ...prev.slice(0, 49)]); // Keep max 50
      } else {
        console.log('Event filtered out');
      }
    });

    return unsubscribe;
  }, [subscribeToEvents]);

  const handleRefresh = async () => {
    setLoading(true);
    try {
      await fetchRecentEvents(20); // Fetch more blocks
      if (onRefresh) {
        await onRefresh();
      }
    } catch (error) {
      console.error("Error refreshing blockchain logs:", error);
    } finally {
      setLoading(false);
    }
  };

  const addLog = (type: "transaction" | "block" | "event", message: string) => {
    setLogs(prev => [
      {
        timestamp: new Date().toLocaleTimeString(),
        type,
        message
      },
      ...prev.slice(0, 9)
    ]);
  };

  const getLogColor = (type: string) => {
    switch (type) {
      case "transaction":
        return "text-blue-400";
      case "block":
        return "text-green-400";
      case "event":
        return "text-yellow-400";
      default:
        return "text-gray-400";
    }
  };

  const getLogIcon = (type: string) => {
    switch (type) {
      case "transaction":
        return "💳";
      case "block":
        return "📦";
      case "event":
        return "⚡";
      default:
        return "📝";
    }
  };

  return (
    <>
      {/* Compact View with Preview */}
      <button
        type="button"
        onClick={() => setIsModalOpen(true)}
        className="w-full bg-gray-900 hover:bg-gray-800 rounded-lg p-3 shadow-sm transition-colors cursor-pointer text-left"
      >
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <IoCodeSlashOutline className="text-indigo-400 text-lg" />
            <span className="text-indigo-400 font-medium text-sm">Blockchain Logs</span>
            <span className="text-xs text-gray-400">
              ({logs.length} {logs.length === 1 ? 'entry' : 'entries'})
            </span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse"></div>
            <span className="text-xs text-gray-400">Click for details</span>
          </div>
        </div>

        {/* Latest Log Preview */}
        <div className="font-mono text-xs">
          {logs.length > 0 ? (
            <div className="flex items-center gap-2">
              <span className="text-gray-500">{logs[0].timestamp}</span>
              <span>{getLogIcon(logs[0].type)}</span>
              <span className={`${getLogColor(logs[0].type)} truncate`}>
                {logs[0].message}
              </span>
            </div>
          ) : (
            <div className="text-gray-500">
              No blockchain activity yet...
            </div>
          )}
        </div>
      </button>

      {/* Modal */}
      <LogModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Blockchain Logs"
        titleColor="text-indigo-400"
        icon={<IoCodeSlashOutline className="text-indigo-400 text-xl" />}
      >
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse"></div>
              <span className="text-sm text-gray-400">
                {logs.length} {logs.length === 1 ? 'Log Entry' : 'Log Entries'}
              </span>
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

          <div className="space-y-2 font-mono text-sm">
            {logs.length > 0 ? (
              logs.map((log, index) => (
                <div
                  key={index}
                  className="flex items-start gap-3 p-3 bg-gray-800 rounded-lg hover:bg-gray-750 transition-colors"
                >
                  <span className="text-gray-400 text-xs min-w-[80px]">
                    {log.timestamp}
                  </span>
                  <span className="text-base">{getLogIcon(log.type)}</span>
                  <span className={`${getLogColor(log.type)} text-xs flex-1`}>
                    {log.message}
                  </span>
                  <div className="flex items-center gap-2">
                    {index === 0 && (
                      <span className="text-xs text-indigo-400 bg-indigo-900/30 px-2 py-0.5 rounded">
                        Latest
                      </span>
                    )}
                    <span className="text-xs text-gray-500 capitalize">
                      {log.type}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-gray-500 text-sm py-12 text-center">
                No blockchain activity yet...
              </div>
            )}
          </div>
        </div>
      </LogModal>
    </>
  );
}
