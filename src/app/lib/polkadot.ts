import { ApiPromise, WsProvider } from '@polkadot/api';
import { decodeAddress } from '@polkadot/keyring';
import { u8aToHex } from '@polkadot/util';

// Local development node
// const RPC_URL = 'ws://127.0.0.1:9946';

// Production RPC (commented out)
const RPC_URL = 'wss://ukdw-rpc.baliola.dev';

let api: ApiPromise | null = null;

// Convert SS58 address to Ethereum format (0x...)
export const convertToEthereumAddress = (address: string): string => {
  try {
    // If already in Ethereum format (0x...), return as is WITHOUT modification
    if (address.startsWith('0x') && address.length === 42) {
      // Valid Ethereum address, return as-is (case-sensitive to preserve original)
      return address;
    }

    // Only convert if it's a valid SS58 address (NOT starting with 0x)
    if (!address.startsWith('0x')) {
      // Decode SS58 address to raw bytes
      const decoded = decodeAddress(address);

      // For Ethereum H160 addresses, take first 20 bytes and convert to hex
      if (decoded.length >= 20) {
        return u8aToHex(decoded.slice(0, 20));
      }
    }

    return address;
  } catch (error) {
    console.error('Address conversion error:', error);
    return address;
  }
};

export const connectToPolkadot = async (): Promise<ApiPromise> => {
  if (api && api.isConnected) {
    return api;
  }

  const provider = new WsProvider(RPC_URL);
  api = await ApiPromise.create({ provider });

  return api;
};

export const enablePolkadotExtension = async () => {
  // Dynamically import browser-only extension functions
  const { web3Enable } = await import('@polkadot/extension-dapp');
  const extensions = await web3Enable('FL Blockchain Sim');

  if (extensions.length === 0) {
    throw new Error('No Polkadot extension found. Please install a wallet extension.');
  }

  return extensions;
};

// Get list of available wallet extensions
export const getAvailableWallets = async () => {
  const wallets: { id: string; name: string }[] = [];

  // Check for Polkadot extensions
  try {
    await enablePolkadotExtension();
    const { web3Accounts } = await import('@polkadot/extension-dapp');
    const allAccounts = await web3Accounts();

    // Get unique wallet sources
    const walletSources = new Set<string>();
    allAccounts.forEach(account => {
      walletSources.add(account.meta.source);
    });

    walletSources.forEach(source => {
      wallets.push({
        id: source,
        name: formatWalletName(source),
      });
    });
  } catch (err) {
    console.log('No Polkadot extensions found');
  }

  // Check for MetaMask
  if (typeof window !== 'undefined' && (window as any).ethereum) {
    const ethereum = (window as any).ethereum;

    // Check if it's MetaMask
    if (ethereum.isMetaMask) {
      wallets.push({
        id: 'metamask',
        name: 'MetaMask',
      });
    }
  }

  return wallets;
};

// Format wallet source name for display
const formatWalletName = (source: string): string => {
  const nameMap: { [key: string]: string } = {
    'polkadot-js': 'Polkadot.js',
    'subwallet-js': 'SubWallet',
    'talisman': 'Talisman',
    'fearless-wallet': 'Fearless Wallet',
    'enkrypt': 'Enkrypt',
    'nova-wallet': 'Nova Wallet',
  };

  return nameMap[source] || source.charAt(0).toUpperCase() + source.slice(1);
};

export const getAccounts = async (walletSource?: string) => {
  // Handle MetaMask separately
  if (walletSource === 'metamask') {
    if (typeof window === 'undefined' || !(window as any).ethereum) {
      throw new Error('MetaMask not found. Please install MetaMask extension.');
    }

    const ethereum = (window as any).ethereum;

    try {
      // Request account access
      const accounts = await ethereum.request({ method: 'eth_requestAccounts' });

      if (accounts.length === 0) {
        throw new Error('No accounts found in MetaMask. Please create an account first.');
      }

      // Convert MetaMask accounts to the format expected by the app
      return accounts.map((address: string) => ({
        address: address.toLowerCase(), // Ethereum addresses are lowercase
        originalAddress: address.toLowerCase(), // Same for MetaMask
        meta: {
          name: 'MetaMask Account',
          source: 'metamask',
        },
      }));
    } catch (err) {
      if ((err as any).code === 4001) {
        throw new Error('User rejected the connection request.');
      }
      throw err;
    }
  }

  // Handle Polkadot extensions
  await enablePolkadotExtension();
  const { web3Accounts } = await import('@polkadot/extension-dapp');
  const allAccounts = await web3Accounts();

  console.log('🔍 Raw accounts from extension:', allAccounts.map(acc => ({
    name: acc.meta.name,
    address: acc.address,
    type: acc.type,
    source: acc.meta.source
  })));

  // Filter by wallet source if specified
  const accounts = walletSource
    ? allAccounts.filter(account => account.meta.source === walletSource)
    : allAccounts;

  if (accounts.length === 0) {
    throw new Error(
      walletSource
        ? `No accounts found in ${formatWalletName(walletSource)}. Please create an account first.`
        : 'No accounts found. Please create an account in your wallet extension.'
    );
  }

  // Keep both original address (for wallet) and converted/detected H160 (for blockchain)
  return accounts.map(account => {
    const isEthereumAccount = account.address.startsWith('0x') && account.address.length === 42;

    console.log(`📌 Processing account "${account.meta.name}":`, {
      original: account.address,
      isEthereum: isEthereumAccount,
      type: account.type
    });

    if (isEthereumAccount) {
      // Already Ethereum format - use as is
      return {
        ...account,
        originalAddress: account.address, // Same for Ethereum accounts
        address: account.address, // No conversion needed
      };
    } else {
      // SS58 format - convert to H160 (but this may not be correct for AccountId20 chains!)
      return {
        ...account,
        originalAddress: account.address, // Store original SS58 address for wallet interaction
        address: convertToEthereumAddress(account.address), // H160 conversion (may be incorrect)
      };
    }
  });
};

export const getInjector = async (address: string, walletSource?: string) => {
  console.log('🔍 getInjector called with address:', address, 'wallet source:', walletSource);

  // If wallet source is explicitly 'metamask' or 'manual', use MetaMask
  if (walletSource === 'metamask' || walletSource === 'manual') {
    console.log('📌 Wallet source is MetaMask - Using MetaMask directly...');

    if (typeof window === 'undefined' || !(window as any).ethereum) {
      throw new Error('MetaMask not found. Please install MetaMask extension.');
    }

    const ethereum = (window as any).ethereum;
    console.log('🦊 MetaMask detected! Creating injector...');

    // Auto-connect MetaMask
    try {
      const accounts = await ethereum.request({ method: 'eth_accounts' });
      console.log('📋 MetaMask accounts:', accounts);

      if (!accounts.includes(address.toLowerCase())) {
        console.log('🔗 Requesting MetaMask connection...');
        await ethereum.request({ method: 'eth_requestAccounts' });
      }
    } catch (err) {
      console.error('❌ Failed to connect to MetaMask:', err);
      throw new Error('Failed to connect to MetaMask. Please unlock MetaMask and try again.');
    }

    console.log('✅ MetaMask injector created successfully!');
    return {
      signer: {
        signPayload: async (payload: any) => {
          try {
            console.log('🖊️ Requesting signature from MetaMask...');
            console.log('📦 Payload to sign:', payload);

            const { u8aToHex } = await import('@polkadot/util');
            const { blake2AsU8a } = await import('@polkadot/util-crypto');
            const { TypeRegistry } = await import('@polkadot/types');
            const registry = new TypeRegistry();

            const signingPayload = registry.createType('ExtrinsicPayload', payload, {
              version: payload.version,
            });

            const dataToSign = signingPayload.toU8a({ method: true });
            const message = dataToSign.length > 256 ? blake2AsU8a(dataToSign) : dataToSign;
            const hexMessage = u8aToHex(message);

            console.log('📝 Hex message to sign:', hexMessage);

            const signature = await ethereum.request({
              method: 'personal_sign',
              params: [hexMessage, address],
            });

            console.log('✅ Signature received from MetaMask:', signature);
            console.log('🔐 Using signature as-is (65 bytes):', signature);
            console.log('📏 Signature length:', signature.length - 2, 'hex chars =', (signature.length - 2) / 2, 'bytes');

            return {
              id: payload.id || 1,
              signature: signature,
            };
          } catch (err: any) {
            console.error('❌ MetaMask signing error:', err);
            throw new Error(err.message || 'User rejected the signing request in MetaMask.');
          }
        },

        signRaw: async (payload: any) => {
          try {
            console.log('🖊️ Requesting raw signature from MetaMask...');
            const signature = await ethereum.request({
              method: 'personal_sign',
              params: [payload.data, address],
            });
            console.log('✅ Raw signature received from MetaMask!');
            return { id: 1, signature };
          } catch (err: any) {
            console.error('❌ MetaMask raw signing error:', err);
            throw new Error(err.message || 'User rejected the signing request in MetaMask.');
          }
        },
      },
    } as any;
  }

  // For Polkadot extensions (Talisman, SubWallet, Polkadot.js, etc.)
  // Try to use web3FromAddress with the SS58 address
  if (walletSource && walletSource !== 'metamask' && walletSource !== 'manual') {
    console.log('📌 Using Polkadot extension:', walletSource);
    console.log('🔑 Trying to get injector from extension for address:', address);

    try {
      const { web3Enable, web3FromAddress } = await import('@polkadot/extension-dapp');
      await web3Enable('FL Blockchain Sim');

      const injector = await web3FromAddress(address);
      console.log('✅ Injector found from', walletSource, 'successfully!');
      return injector;
    } catch (err) {
      console.error('❌ Failed to get injector from', walletSource, ':', err);
      console.log('💡 Extension signing might not work for H160 addresses');
      throw new Error(`Failed to get injector from ${walletSource}. For H160 addresses, consider using MetaMask.`);
    }
  }

  console.log('📌 Address is SS58 format, using web3FromAddress...');

  // Handle Polkadot extensions with SS58 addresses
  const { web3FromAddress } = await import('@polkadot/extension-dapp');

  try {
    const injector = await web3FromAddress(address);
    console.log('✅ SS58 Injector found successfully!');
    return injector;
  } catch (err) {
    console.error('❌ Failed to get SS58 injector:', err);
    throw new Error(
      `Blockchain Error: Address not found on SubWallet. Re-check the address information in the extension then try again`
    );
  }
};

// Federated Learning extrinsics
export const submitLocalModel = async (
  address: string,
  modelHash: string,
  accuracy: number,
  ipfsCid: string,
  note?: string,
  originalAddress?: string,
  walletSource?: string
) => {
  const api = await connectToPolkadot();

  console.log('📤 submitLocalModel called with:');
  console.log('  - address (H160 for blockchain):', address);
  console.log('  - originalAddress (SS58 from wallet):', originalAddress);
  console.log('  - walletSource:', walletSource);

  // IMPORTANT: For AccountId20 pallet, we MUST use H160 address for both signing and transaction

  if (!address.startsWith('0x')) {
    throw new Error(
      '❌ Pallet ini menggunakan AccountId20 (H160/Ethereum format).\n\n' +
      'Address HARUS dalam format 0x... (Ethereum/H160).\n\n' +
      'Solusi:\n' +
      '1. Install MetaMask extension\n' +
      '2. Import private key account Anda ke MetaMask\n' +
      '3. Gunakan address H160 dari MetaMask\n\n' +
      'SubWallet/Polkadot.js TIDAK BISA digunakan untuk pallet AccountId20.'
    );
  }

  console.log('✅ Address is H160 format, getting injector...');
  // Pass wallet source to getInjector so it knows which extension to use
  const addressForInjector = originalAddress || address; // Use SS58 if available for Polkadot extensions
  const injector = await getInjector(addressForInjector, walletSource);

  const extrinsic = api.tx.federatedLearning.submitLocalModel(
    modelHash,
    accuracy,
    ipfsCid,
    note || ''
  );

  return new Promise((resolve, reject) => {
    extrinsic.signAndSend(
      address, // Use H160 address for blockchain transaction
      { signer: injector.signer },
      ({ status, events, dispatchError }) => {
        if (status.isInBlock) {
          console.log(`Transaction included in block ${status.asInBlock}`);
        }

        if (status.isFinalized) {
          if (dispatchError) {
            if (dispatchError.isModule) {
              const decoded = api.registry.findMetaError(dispatchError.asModule);
              reject(new Error(`${decoded.section}.${decoded.name}: ${decoded.docs.join(' ')}`));
            } else {
              reject(new Error(dispatchError.toString()));
            }
          } else {
            console.log(`Transaction finalized in block ${status.asFinalized}`);
            resolve({ blockHash: status.asFinalized, events });
          }
        }
      }
    ).catch(reject);
  });
};

export const updateGlobalModel = async (
  address: string,
  newHash: string,
  newCid: string,
  weightChange: number,
  originalAddress?: string,
  walletSource?: string
) => {
  console.log('🔗 updateGlobalModel called with:', {
    address,
    originalAddress,
    walletSource,
    hashPreview: newHash.slice(0, 10) + '...',
    cidPreview: newCid.slice(0, 10) + '...',
    weightChange
  });

  const api = await connectToPolkadot();
  const walletAddress = originalAddress || address;

  console.log('📡 Getting wallet injector for:', walletAddress);
  const injector = await getInjector(walletAddress, walletSource);

  console.log('📝 Creating extrinsic: updateGlobalModel');
  const extrinsic = api.tx.federatedLearning.updateGlobalModel(newHash, newCid, weightChange);

  console.log('✍️ Requesting signature from wallet...');
  console.log('⚠️ PLEASE CHECK YOUR WALLET FOR CONFIRMATION POPUP!');

  return new Promise((resolve, reject) => {
    extrinsic.signAndSend(
      address,
      { signer: injector.signer },
      ({ status, events, dispatchError }) => {
        if (status.isInBlock) {
          console.log(`✅ Transaction included in block ${status.asInBlock}`);
        }

        if (status.isFinalized) {
          if (dispatchError) {
            if (dispatchError.isModule) {
              const decoded = api.registry.findMetaError(dispatchError.asModule);
              const errorMsg = `${decoded.section}.${decoded.name}: ${decoded.docs.join(' ')}`;
              console.error('❌ Transaction failed:', errorMsg);
              reject(new Error(errorMsg));
            } else {
              console.error('❌ Transaction error:', dispatchError.toString());
              reject(new Error(dispatchError.toString()));
            }
          } else {
            console.log(`✅ Transaction finalized in block ${status.asFinalized}`);
            resolve({ blockHash: status.asFinalized, events });
          }
        }
      }
    ).catch((err) => {
      console.error('❌ signAndSend error:', err);
      reject(err);
    });
  });
};

export const forceAuthorize = async (
  address: string,
  account: string,
  institution: string,
  originalAddress?: string,
  walletSource?: string
) => {
  const api = await connectToPolkadot();

  console.log('📤 forceAuthorize called with:');
  console.log('  - admin address (for signing):', address);
  console.log('  - account to register:', account);
  console.log('  - institution name:', institution);
  console.log('  - originalAddress:', originalAddress);
  console.log('  - walletSource:', walletSource);

  // For AccountId20, ensure address is H160 format
  if (!address.startsWith('0x')) {
    throw new Error('Admin address must be H160 format (0x...)');
  }

  const addressForInjector = originalAddress || address;
  const injector = await getInjector(addressForInjector, walletSource);

  // Create the call: federatedLearning.forceAuthorize(account, institution)
  const forceAuthorizeCall = api.tx.federatedLearning.forceAuthorize(account, institution);

  console.log('🔐 Created federatedLearning.forceAuthorize extrinsic');

  return new Promise((resolve, reject) => {
    forceAuthorizeCall.signAndSend(
      address,
      { signer: injector.signer },
      ({ status, events, dispatchError }) => {
        if (status.isInBlock) {
          console.log(`✅ Transaction included in block ${status.asInBlock}`);
        }

        if (status.isFinalized) {
          if (dispatchError) {
            if (dispatchError.isModule) {
              const decoded = api.registry.findMetaError(dispatchError.asModule);
              console.error('❌ Dispatch error:', decoded);
              reject(new Error(`${decoded.section}.${decoded.name}: ${decoded.docs.join(' ')}`));
            } else {
              console.error('❌ Dispatch error:', dispatchError.toString());
              reject(new Error(dispatchError.toString()));
            }
          } else {
            console.log(`🎉 Transaction finalized in block ${status.asFinalized}`);
            console.log('📋 Events:', events.map(e => e.event.method));
            resolve({ blockHash: status.asFinalized, events });
          }
        }
      }
    ).catch(reject);
  });
};

export const forceUnauthorize = async (
  address: string,
  account: string,
  originalAddress?: string,
  walletSource?: string
) => {
  const api = await connectToPolkadot();

  console.log('📤 forceUnauthorize called with:');
  console.log('  - admin address (for signing):', address);
  console.log('  - account to unauthorize:', account);
  console.log('  - originalAddress:', originalAddress);
  console.log('  - walletSource:', walletSource);

  // For AccountId20, ensure address is H160 format
  if (!address.startsWith('0x')) {
    throw new Error('Admin address must be H160 format (0x...)');
  }

  const addressForInjector = originalAddress || address;
  const injector = await getInjector(addressForInjector, walletSource);

  // Create the call: federatedLearning.forceUnauthorize(account)
  const forceUnauthorizeCall = api.tx.federatedLearning.forceUnauthorize(account);

  console.log('🔐 Created federatedLearning.forceUnauthorize extrinsic');

  return new Promise((resolve, reject) => {
    forceUnauthorizeCall.signAndSend(
      address,
      { signer: injector.signer },
      ({ status, events, dispatchError }) => {
        if (status.isInBlock) {
          console.log(`✅ Transaction included in block ${status.asInBlock}`);
        }

        if (status.isFinalized) {
          if (dispatchError) {
            if (dispatchError.isModule) {
              const decoded = api.registry.findMetaError(dispatchError.asModule);
              console.error('❌ Dispatch error:', decoded);
              reject(new Error(`${decoded.section}.${decoded.name}: ${decoded.docs.join(' ')}`));
            } else {
              console.error('❌ Dispatch error:', dispatchError.toString());
              reject(new Error(dispatchError.toString()));
            }
          } else {
            console.log(`🎉 Transaction finalized in block ${status.asFinalized}`);
            console.log('📋 Events:', events.map(e => e.event.method));
            resolve({ blockHash: status.asFinalized, events });
          }
        }
      }
    ).catch(reject);
  });
};

// Query functions
export const getAuthorizedInstitution = async (accountId: string) => {
  const api = await connectToPolkadot();
  const result = await api.query.federatedLearning.authorizedInstitution(accountId);
  return result.toHuman();
};

export const getGlobalModel = async () => {
  const api = await connectToPolkadot();
  const result = await api.query.federatedLearning.globalModel();
  return result.toHuman();
};

export const getNextId = async () => {
  const api = await connectToPolkadot();
  const result = await api.query.federatedLearning.nextId();
  return Number(result.toString());
};

export const getPalletVersion = async () => {
  const api = await connectToPolkadot();
  const result = await api.query.federatedLearning.palletVersion();
  return Number(result.toString());
};

export const getRecords = async (id: number) => {
  const api = await connectToPolkadot();
  const result = await api.query.federatedLearning.records(id);
  return result.toHuman();
};

export const checkIsAdmin = async (accountId: string): Promise<boolean> => {
  try {
    const api = await connectToPolkadot();
    const result = await api.query.federatedLearning.admins(accountId);

    // Get multiple representations for debugging
    const adminDataHuman = result.toHuman();
    const adminDataJson = result.toJSON();
    const isEmpty = result.isEmpty;

    console.log(`🔐 Admin check for ${accountId}:`);
    console.log('  - toHuman():', adminDataHuman);
    console.log('  - toJSON():', adminDataJson);
    console.log('  - isEmpty:', isEmpty);

    // According to user specification:
    // - If storage returns null (entry exists with null value) = ADMIN ✅
    // - If storage returns None (no entry) = NOT ADMIN ❌

    // Check if result is None (no entry in storage)
    // In Polkadot, Option::None typically shows as:
    // - isEmpty = true
    // - toJSON() = null AND isEmpty = true

    // If isEmpty is true, it means Option::None (no entry)
    if (isEmpty) {
      console.log('  → Result: ❌ NOT ADMIN (None - no entry)');
      return false;
    }

    // If isEmpty is false, it means Option::Some (entry exists)
    // Even if the value inside is null, it's still Some(null)
    console.log('  → Result: ✅ ADMIN (entry exists)');
    return true;

  } catch (error) {
    console.error('Failed to check admin status:', error);
    return false;
  }
};