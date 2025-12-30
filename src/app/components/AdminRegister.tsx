"use client";
import { useState } from "react";
import { IoSettingsOutline, IoLinkOutline } from "react-icons/io5";

interface Account {
  address: string;
  meta: {
    name?: string;
    source: string;
  };
}

interface AdminRegisterProps {
  accounts: Account[];
  onRegister: (adminAccount: string, accountToRegister: string, institutionName: string) => Promise<void>;
  loading: boolean;
  error: string | null;
  result: any;
}

export default function AdminRegister({ accounts, onRegister, loading, error, result }: AdminRegisterProps) {
  const [adminAccount, setAdminAccount] = useState<string>('');
  const [accountToRegister, setAccountToRegister] = useState<string>('');
  const [institutionName, setInstitutionName] = useState<string>('');

  const handleRegister = async () => {
    if (!adminAccount || !accountToRegister || !institutionName) return;
    await onRegister(adminAccount, accountToRegister, institutionName);
    // Clear form on success
    if (!error) {
      setAccountToRegister('');
      setInstitutionName('');
    }
  };

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
      <div className="flex items-center gap-3 mb-6">
        <IoSettingsOutline className="text-violet-500 text-xl" />
        <h3 className="text-lg font-semibold text-gray-900">
          Admin - Register Bank Account
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
              className="w-full p-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-violet-500 focus:border-transparent text-gray-900"
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
              className="w-full p-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-violet-500 focus:border-transparent text-gray-900 font-mono"
            />
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Use your wallet account as admin to register bank accounts
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Account to Register
          </label>
          <select
            value={accountToRegister}
            onChange={(e) => setAccountToRegister(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-violet-500 focus:border-transparent text-gray-900"
          >
            <option value="">Select account to register...</option>
            {accounts.map((account) => (
              <option key={account.address} value={account.address}>
                {account.meta.name || account.address.slice(0, 10) + '...'} - {account.address.slice(0, 10)}...{account.address.slice(-8)}
              </option>
            ))}
          </select>
          <p className="text-xs text-gray-500 mt-1">
            Select wallet account to register as a bank
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Institution Name
          </label>
          <input
            type="text"
            value={institutionName}
            onChange={(e) => setInstitutionName(e.target.value)}
            placeholder="Bank A"
            className="w-full p-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-violet-500 focus:border-transparent text-gray-900"
          />
          <p className="text-xs text-gray-500 mt-1">
            Enter institution name (e.g., Bank A, Bank B, Bank C)
          </p>
        </div>

        <button
          type="button"
          onClick={handleRegister}
          disabled={!adminAccount || !accountToRegister || !institutionName || loading}
          className="w-full py-3 px-4 bg-violet-600 text-white rounded-lg font-medium hover:bg-violet-700 disabled:bg-gray-400 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-2 transition-colors"
        >
          <IoLinkOutline className="text-lg" />
          {loading ? "Registering..." : "Register Account"}
        </button>

        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            Error: {error}
          </div>
        )}

        {result && (
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
            Account registered successfully! Transaction finalized.
          </div>
        )}
      </div>
    </div>
  );
}
