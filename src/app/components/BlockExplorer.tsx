"use client";
import { useState, useEffect } from "react";
import { IoOpenOutline, IoCubeOutline } from "react-icons/io5";
import { ApiPromise, WsProvider } from '@polkadot/api';

interface Block {
  number: number;
  hash: string;
  timestamp: string;
}

export default function BlockExplorer() {
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [latestBlock, setLatestBlock] = useState<number>(0);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;
    let api: ApiPromise | undefined;

    const connectAndSubscribe = async () => {
      try {
        // Local development node
        // const provider = new WsProvider('ws://127.0.0.1:9946');

        // Production RPC (commented out)
        const provider = new WsProvider('wss://ukdw-rpc.baliola.dev');

        api = await ApiPromise.create({ provider });
        setIsConnected(true);

        // Subscribe to new blocks
        unsubscribe = await api.rpc.chain.subscribeNewHeads(async (header) => {
          const blockNumber = header.number.toNumber();
          const blockHash = header.hash.toHex();

          setLatestBlock(blockNumber);

          // Get timestamp
          const timestamp = new Date().toLocaleTimeString();

          // Add new block to the list (keep last 3 blocks only)
          setBlocks((prev) => {
            const newBlocks = [
              { number: blockNumber, hash: blockHash, timestamp },
              ...prev.slice(0, 2)
            ];
            return newBlocks;
          });
        });
      } catch (error) {
        console.error('Failed to connect to blockchain:', error);
        setIsConnected(false);
      }
    };

    connectAndSubscribe();

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
      if (api) {
        api.disconnect();
      }
    };
  }, []);

  return (
    <div className="bg-gray-900 rounded-xl p-5 text-white">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-6 h-6 bg-gray-700 rounded-lg flex items-center justify-center">
            <IoCubeOutline className="text-gray-300 text-sm" />
          </div>
          <div>
            <span className="text-sm font-medium">Block Explorer</span>
            <p className="text-xs text-gray-400">Real-time Blockchain</p>
          </div>
        </div>
        {isConnected && (
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-xs text-gray-400">Live</span>
          </div>
        )}
      </div>

      <div className="space-y-3 text-xs mb-4">
        <div className="flex justify-between items-center">
          <span className="text-gray-400">Latest Block</span>
          <span className="text-gray-200 font-mono">#{latestBlock.toLocaleString()}</span>
        </div>
      </div>

      {/* Recent Blocks */}
      <div className="mt-4 pt-4 border-t border-gray-700">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs text-gray-400">Recent Blocks</span>
          <a
            href="https://polkadot.js.org/apps/?rpc=wss://ukdw-rpc.baliola.dev#/explorer"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
          >
            <IoOpenOutline className="text-xs" />
            <span>Open Explorer</span>
          </a>
        </div>

        <div className="space-y-2">
          {blocks.length > 0 ? (
            blocks.map((block, index) => (
              <div
                key={`${block.number}-${index}`}
                className="flex items-center justify-between p-2 bg-gray-800 rounded-lg transition-all duration-300"
              >
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full"></div>
                  <span className="text-indigo-400 font-mono text-xs">
                    #{block.number}
                  </span>
                </div>
                <div className="text-gray-500 font-mono text-xs">
                  {block.hash.slice(0, 8)}...{block.hash.slice(-4)}
                </div>
              </div>
            ))
          ) : (
            <div className="text-center text-gray-500 text-xs py-3">
              Waiting for blocks...
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
