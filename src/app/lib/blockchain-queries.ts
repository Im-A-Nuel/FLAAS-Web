import { ApiPromise, WsProvider } from '@polkadot/api';
import { useEffect, useState, useCallback } from 'react';

// Local development node
// const RPC_URL = 'ws://127.0.0.1:9946';

// Production RPC (commented out)
const RPC_URL = 'wss://ukdw-rpc.baliola.dev';

// Known dev account seeds - will check which ones exist on chain
const KNOWN_DEV_SEEDS = [
  '//Alice',
  '//Bob',
  '//Charlie',
  '//Dave',
  '//Eve',
  '//Ferdie',
];

// Moonbeam-style dev seeds
const MOONBEAM_DEV_SEEDS = [
  '//Alith',
  '//Baltathar',
  '//Charleth',
  '//Dorothy',
  '//Ethan',
  '//Faith',
];

export interface DevAccount {
  name: string;
  address: string;
  balance: string;
  balanceFormatted: string;
}

export const useDevAccounts = () => {
  const [devAccounts, setDevAccounts] = useState<DevAccount[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDevAccounts = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const provider = new WsProvider(RPC_URL);
      const api = await ApiPromise.create({ provider });

      // Get keyring to derive addresses
      const { Keyring } = await import('@polkadot/keyring');
      const keyring = new Keyring({ type: 'ethereum' });

      const accounts: DevAccount[] = [];

      // Try standard Substrate dev accounts
      for (const seed of KNOWN_DEV_SEEDS) {
        try {
          const account = keyring.addFromUri(seed);
          const name = seed.replace('//', '').toUpperCase();

          // Query balance
          const accountInfo: any = await api.query.system.account(account.address);
          const balance = accountInfo.data.free.toString();

          // Only include if has balance (exists on chain)
          if (BigInt(balance) > BigInt(0)) {
            const balanceFormatted = (Number(balance) / 1e12).toFixed(4); // Assuming 12 decimals

            accounts.push({
              name,
              address: account.address,
              balance,
              balanceFormatted: `${balanceFormatted} KPGD`,
            });
          }
        } catch (err) {
          console.log(`Failed to check ${seed}:`, err);
        }
      }

      // Try Moonbeam-style dev accounts if standard ones not found
      if (accounts.length === 0) {
        for (const seed of MOONBEAM_DEV_SEEDS) {
          try {
            const account = keyring.addFromUri(seed);
            const name = seed.replace('//', '').toUpperCase();

            const accountInfo: any = await api.query.system.account(account.address);
            const balance = accountInfo.data.free.toString();

            if (BigInt(balance) > BigInt(0)) {
              const balanceFormatted = (Number(balance) / 1e12).toFixed(4);

              accounts.push({
                name,
                address: account.address,
                balance,
                balanceFormatted: `${balanceFormatted} KPGD`,
              });
            }
          } catch (err) {
            console.log(`Failed to check ${seed}:`, err);
          }
        }
      }

      setDevAccounts(accounts);

      // Disconnect gracefully, suppress disconnect warnings
      try {
        await api.disconnect();
      } catch (err) {
        // Ignore disconnect errors (normal closure warnings)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch dev accounts');
      console.error('Error fetching dev accounts:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDevAccounts();
  }, [fetchDevAccounts]);

  return { devAccounts, loading, error, refetch: fetchDevAccounts };
};
