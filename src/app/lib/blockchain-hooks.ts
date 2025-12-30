import { useState, useCallback, useEffect } from 'react';
import {
  connectToPolkadot,
  getAccounts,
  getAvailableWallets,
  submitLocalModel,
  updateGlobalModel,
  forceAuthorize,
  forceUnauthorize,
  getAuthorizedInstitution,
  getGlobalModel,
  getNextId,
  getPalletVersion,
  getRecords,
  checkIsAdmin
} from './polkadot';

interface Account {
  address: string; // H160 Ethereum format for blockchain transactions
  originalAddress?: string; // Original SS58 format for wallet interaction
  meta: {
    name?: string;
    source: string;
  };
}

interface Wallet {
  id: string;
  name: string;
}

export const usePolkadotConnection = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const connect = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      await connectToPolkadot();
      setIsConnected(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Connection failed');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    connect();
  }, [connect]);

  return { isConnected, loading, error, connect };
};

export const useAccounts = () => {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);
  const [selectedWallet, setSelectedWallet] = useState<string | null>(null);
  const [availableWallets, setAvailableWallets] = useState<Wallet[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch available wallets
  const fetchWallets = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const wallets = await getAvailableWallets();
      setAvailableWallets(wallets);
      return wallets;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch wallets');
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch accounts from selected wallet
  const fetchAccounts = useCallback(async (walletSource?: string) => {
    setLoading(true);
    setError(null);

    try {
      const accountsList = await getAccounts(walletSource);
      setAccounts(accountsList);
      if (accountsList.length > 0 && !selectedAccount) {
        setSelectedAccount(accountsList[0]);
      }
      if (walletSource) {
        setSelectedWallet(walletSource);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch accounts');
    } finally {
      setLoading(false);
    }
  }, [selectedAccount]);

  const disconnectAccounts = useCallback(() => {
    setAccounts([]);
    setSelectedAccount(null);
    setSelectedWallet(null);
    setError(null);
  }, []);

  return {
    accounts,
    selectedAccount,
    selectedWallet,
    availableWallets,
    setSelectedAccount,
    loading,
    error,
    fetchWallets,
    fetchAccounts,
    disconnectAccounts
  };
};

export const useSubmitModel = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<any>(null);

  const submit = useCallback(async (
    address: string,
    modelHash: string,
    accuracy: number,
    ipfsCid: string,
    note?: string,
    originalAddress?: string,
    walletSource?: string
  ) => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const txResult = await submitLocalModel(address, modelHash, accuracy, ipfsCid, note, originalAddress, walletSource);
      setResult(txResult);
      return txResult;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Transaction failed');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return { submit, loading, error, result };
};

export const useUpdateGlobalModel = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<any>(null);

  const update = useCallback(async (
    address: string,
    newHash: string,
    newCid: string,
    weightChange: number,
    originalAddress?: string,
    walletSource?: string
  ) => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const txResult = await updateGlobalModel(address, newHash, newCid, weightChange, originalAddress, walletSource);
      setResult(txResult);
      return txResult;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Transaction failed');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return { update, loading, error, result };
};

export const useForceAuthorize = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<any>(null);

  const authorize = useCallback(async (
    address: string,
    account: string,
    institution: string,
    originalAddress?: string,
    walletSource?: string
  ) => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const txResult = await forceAuthorize(address, account, institution, originalAddress, walletSource);
      setResult(txResult);
      return txResult;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Transaction failed');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return { authorize, loading, error, result };
};

export const useForceUnauthorize = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<any>(null);

  const unauthorize = useCallback(async (
    address: string,
    account: string,
    originalAddress?: string,
    walletSource?: string
  ) => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const txResult = await forceUnauthorize(address, account, originalAddress, walletSource);
      setResult(txResult);
      return txResult;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Transaction failed');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return { unauthorize, loading, error, result };
};

export const useAccountBalances = () => {
  const [balances, setBalances] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const fetchBalance = useCallback(async (address: string) => {
    try {
      const api = await connectToPolkadot();
      const accountInfo: any = await api.query.system.account(address);
      const balance = accountInfo.data.free.toString();
      const balanceFormatted = (Number(balance) / 1e12).toFixed(4);
      return balanceFormatted;
    } catch (err) {
      console.error(`Failed to fetch balance for ${address}:`, err);
      return '0.0000';
    }
  }, []);

  const fetchBalances = useCallback(async (addresses: string[]) => {
    setLoading(true);
    const newBalances: Record<string, string> = {};

    for (const address of addresses) {
      const balance = await fetchBalance(address);
      newBalances[address] = balance;
    }

    setBalances(newBalances);
    setLoading(false);
    return newBalances;
  }, [fetchBalance]);

  return { balances, loading, fetchBalances };
};

export const useBlockchainQueries = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const queryAuthorizedInstitution = useCallback(async (accountId: string) => {
    setLoading(true);
    setError(null);

    try {
      const result = await getAuthorizedInstitution(accountId);
      return result;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Query failed');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const queryGlobalModel = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await getGlobalModel();
      return result;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Query failed');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const queryNextId = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await getNextId();
      return result;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Query failed');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const queryPalletVersion = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await getPalletVersion();
      return result;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Query failed');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const queryRecords = useCallback(async (id: number) => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await getRecords(id);
      return result;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Query failed');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    error,
    queryAuthorizedInstitution,
    queryGlobalModel,
    queryNextId,
    queryPalletVersion,
    queryRecords
  };
};

export const useCheckAdmin = () => {
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [checked, setChecked] = useState<boolean>(false);

  const checkAdmin = useCallback(async (accountId: string) => {
    if (!accountId) {
      setIsAdmin(false);
      setChecked(false);
      return false;
    }

    // Reset state immediately when checking new account
    setIsAdmin(false);
    setLoading(true);
    setError(null);
    setChecked(false);

    try {
      const result = await checkIsAdmin(accountId);
      setIsAdmin(result);
      setChecked(true);
      return result;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Admin check failed');
      setIsAdmin(false);
      setChecked(true);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const resetAdmin = useCallback(() => {
    setIsAdmin(false);
    setLoading(false);
    setError(null);
    setChecked(false);
  }, []);

  return { isAdmin, loading, error, checked, checkAdmin, resetAdmin };
};