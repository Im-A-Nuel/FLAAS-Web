import { useState, useCallback, useEffect } from 'react';
import { connectToPolkadot } from './polkadot';

export interface BlockchainEvent {
  blockNumber: number;
  eventIndex: number;
  section: string;
  method: string;
  data: any[];
  timestamp: Date;
  phase: string;
}

export const useBlockchainEvents = () => {
  const [events, setEvents] = useState<BlockchainEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchRecentEvents = useCallback(async (blockCount: number = 10) => {
    setLoading(true);
    setError(null);

    try {
      const api = await connectToPolkadot();
      const currentHeader = await api.rpc.chain.getHeader();
      const currentBlockNumber = currentHeader.number.toNumber();

      const allEvents: BlockchainEvent[] = [];

      // Fetch events from last N blocks
      for (let i = 0; i < blockCount; i++) {
        const blockNum = currentBlockNumber - i;
        if (blockNum < 0) break;

        try {
          const blockHash = await api.rpc.chain.getBlockHash(blockNum);
          const apiAt = await api.at(blockHash);
          const eventsAtBlock = await apiAt.query.system.events();

          // Get block timestamp
          const timestamp = await apiAt.query.timestamp.now();
          const blockTime = new Date(Number(timestamp.toString()));

          eventsAtBlock.forEach((record, index) => {
            const { event, phase } = record;

            allEvents.push({
              blockNumber: blockNum,
              eventIndex: index,
              section: event.section,
              method: event.method,
              data: event.data.map(d => d.toString()),
              timestamp: blockTime,
              phase: phase.toString(),
            });
          });
        } catch (err) {
          console.warn(`Failed to fetch events for block ${blockNum}:`, err);
        }
      }

      setEvents(allEvents);
      return allEvents;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch events');
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  // Subscribe to new block events
  const subscribeToEvents = useCallback((callback: (event: BlockchainEvent) => void) => {
    let unsubscribe: (() => void) | null = null;

    (async () => {
      try {
        const api = await connectToPolkadot();

        const unsub = await api.rpc.chain.subscribeNewHeads(async (header) => {
          const blockNumber = header.number.toNumber();
          const blockHash = await api.rpc.chain.getBlockHash(blockNumber);
          const apiAt = await api.at(blockHash);
          const eventsAtBlock = await apiAt.query.system.events();
          const timestamp = await apiAt.query.timestamp.now();
          const blockTime = new Date(Number(timestamp.toString()));

          eventsAtBlock.forEach((record, index) => {
            const { event, phase } = record;

            const blockchainEvent: BlockchainEvent = {
              blockNumber,
              eventIndex: index,
              section: event.section,
              method: event.method,
              data: event.data.map(d => d.toString()),
              timestamp: blockTime,
              phase: phase.toString(),
            };

            callback(blockchainEvent);
          });
        });

        unsubscribe = unsub;
      } catch (err) {
        console.error('Failed to subscribe to events:', err);
      }
    })();

    // Return cleanup function
    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, []);

  return {
    events,
    loading,
    error,
    fetchRecentEvents,
    subscribeToEvents,
  };
};
