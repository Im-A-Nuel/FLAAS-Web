"use client";
import { useState } from "react";
import { IoTrashOutline, IoUnlinkOutline } from "react-icons/io5";

interface Account {
  address: string;
  meta: {
    name?: string;
    source: string;
  };
}

interface AdminUnregisterProps {
  accounts: Account[];
  onUnregister: (adminAccount: string, accountToUnregister: string) => Promise<void>;
  loading: boolean;
  error: string | null;
  result: any;
}

export default function AdminUnregister({ accounts, onUnregister, loading, error, result }: AdminUnregisterProps) {
  const [adminAccount, setAdminAccount] = useState<string>('');
  const [accountToUnregister, setAccountToUnregister] = useState<string>('');

  const handleUnregister = async () => {
    if (!adminAccount || !accountToUnregister) return;
    await onUnregister(adminAccount, accountToUnregister);
    // Clear form on success
    if (!error) {
      setAccountToUnregister('');
    }
  };

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
      <div className="flex items-center gap-3 mb-6">
        <IoTrashOutline className="text-red-500 text-xl" />
        <h3 className="text-lg font-semibold text-gray-900">
          Admin - Unregister Bank Account
        </h3>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Admin Account (Your Wallet)
          </label>

          <div className="space-y-2">
            <select
              value={adminAccount}
              onChange={(e) => setAdminAccount(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-red-500 focus:border-transparent text-gray-900"
            >
              <option value="">Select from connected wallet...</option>
              {accounts.map((account) => (
                <option key={account.address} value={account.address}>
                  {account.meta.name || account.address.slice(0, 10) + '...'} - {account.address.slice(0, 10)}...{account.address.slice(-8)}
                </option>
              ))}
            </select>
            <div className="flex items-center gap-2">
              <div className="flex-1 border-t border-gray-300"></div>
              <span className="text-xs text-gray-500">OR</span>
              <div className="flex-1 border-t border-gray-300"></div>
            </div>
            <input
              type="text"
              value={adminAccount}
              onChange={(e) => setAdminAccount(e.target.value)}
              placeholder="Manually enter address (e.g., 0x3Cd0A705a2...)"
              className="w-full p-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-red-500 focus:border-transparent text-gray-900 font-mono"
            />
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Use your wallet account as admin to unregister bank accounts
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Account to Unregister
          </label>
          <select
            value={accountToUnregister}
            onChange={(e) => setAccountToUnregister(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-red-500 focus:border-transparent text-gray-900"
          >
            <option value="">Select account to unregister...</option>
            {accounts.map((account) => (
              <option key={account.address} value={account.address}>
                {account.meta.name || account.address.slice(0, 10) + '...'} - {account.address.slice(0, 10)}...{account.address.slice(-8)}
              </option>
            ))}
          </select>
          <p className="text-xs text-gray-500 mt-1">
            Select wallet account to remove authorization
          </p>
        </div>

        <button
          type="button"
          onClick={handleUnregister}
          disabled={!adminAccount || !accountToUnregister || loading}
          className="w-full py-3 px-4 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-2 transition-colors"
        >
          <IoUnlinkOutline className="text-lg" />
          {loading ? "Unregistering..." : "Unregister Account"}
        </button>

        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            Error: {error}
          </div>
        )}

        {result && (
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
            Account unregistered successfully! Transaction finalized.
          </div>
        )}
      </div>
    </div>
  );
}
