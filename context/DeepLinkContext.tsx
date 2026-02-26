import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import * as Linking from 'expo-linking'
import * as WebBrowser from 'expo-web-browser';
import { DeepLinkManager, ParsedDeepLink } from '../services/DeepLinkManager'
import { DeepLinkRequest, DeepLinkApprovalModal } from '../components/deeplink/DeepLinkApprovalModal'
import { useWallet } from './WalletContext'
import { DEFAULT_NETWORK, NETWORK_CONFIGS } from '../constants/networkConfig'
import BACKEND_CONFIG from '../config/backend'
import { useToast } from './ToastContext'
import { useNetwork } from './NetworkContext'

interface DeepLinkContextType {
    isHandlingLink: boolean
    activeRequest: DeepLinkRequest | null
}

const DeepLinkContext = createContext<DeepLinkContextType | undefined>(undefined)

import { getTokenMetadata } from '../services/movement_service/transactionHistory'

export const DeepLinkProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [manager] = useState(() => new DeepLinkManager())
    const [activeRequest, setActiveRequest] = useState<DeepLinkRequest | null>(null)
    const [originalParsed, setOriginalParsed] = useState<ParsedDeepLink | null>(null)
    const [simulationResult, setSimulationResult] = useState<any>(null)
    const { address, publicKey, signAndSubmitTransaction, signMessage, signRawHash, switchNetwork: walletSwitchNetwork, simulateTransaction } = useWallet()
    const { network: currentNetwork } = useNetwork()
    const toast = useToast()

    const handleIncomingUrl = useCallback(async (url: string) => {
        console.log('DeepLink: Received URL:', url)
        const parsed = manager.parseUrl(url)
        if (!parsed) return

        const request = await manager.mapToRequest(parsed)
        if (request) {
            // Augment with Asset Metadata if it's a transaction
            if (request.type === 'signAndSubmitTransaction' && request.payload?.transaction) {
                const tx = request.payload.transaction;
                let tokenAddress = '0x1::aptos_coin::AptosCoin'; // Default MOVE

                if (tx.function?.includes('::coin::transfer')) {
                    tokenAddress = tx.typeArguments?.[0] || tokenAddress;
                }

                try {
                    const metadata = await getTokenMetadata(tokenAddress);
                    if (metadata) {
                        request.assetMetadata = {
                            symbol: metadata.symbol,
                            logoURI: metadata.logoURI,
                            decimals: metadata.decimals
                        };
                    }
                } catch (e) {
                    console.error('DeepLink: Metadata fetch failed', e);
                }
            }

            setOriginalParsed(parsed);
            setActiveRequest(request);
        }
    }, [manager])

    useEffect(() => {
        const runSimulation = async () => {
            if (!activeRequest || (activeRequest.type !== 'signAndSubmitTransaction' && activeRequest.type !== 'signTransaction')) {
                setSimulationResult(null)
                return
            }

            setSimulationResult({ loading: true })
            try {
                const payload = activeRequest.payload.transaction
                const result = await simulateTransaction(payload)

                // Helper to normalize addresses for comparison
                const normalizeAddr = (addr: string) => {
                    if (!addr) return '';
                    let clean = addr.toLowerCase();
                    if (clean.startsWith('0x')) clean = clean.slice(2);
                    return clean.padStart(64, '0');
                };

                const normalizedUserAddr = normalizeAddr(address || '');
                console.log('[DeepLink Sim] Normalized User Addr:', normalizedUserAddr);

                // Consolidate balance changes by asset (summing net amounts)
                const changeMap = new Map<string, { asset: string, amount: number, logoURI?: string, isNFT?: boolean }>();

                if (result.success && result.events) {
                    console.log(`[DeepLink Sim] Processing ${result.events.length} events...`);

                    for (const [idx, event] of result.events.entries()) {
                        const type = (event.type as string).toLowerCase();
                        console.log(`[DeepLink Sim] Event ${idx} type: ${type}`);

                        const isWithdraw = type.includes('::withdraw');
                        const isDeposit = type.includes('::deposit');
                        const isTransfer = type.includes('::transfer');

                        const possibleAddrs = [
                            event.guid?.account_address,
                            (event as any).address,
                            (event as any).account_address,
                            event.data?.owner,
                            event.data?.owner_address,
                            event.data?.account,
                            event.data?.account_address,
                            event.data?.addr,
                            event.data?.from,
                            event.data?.to,
                            event.data?.to_address,
                            event.data?.sender,
                            event.data?.receiver,
                            event.data?.store,
                            event.data?.buyer,
                            event.data?.payer,
                            event.data?.user,
                            event.data?.payor,
                            event.data?.recipient,
                            event.data?.dst
                        ];

                        const isFaucetCall = activeRequest?.payload?.transaction?.function?.toLowerCase().includes('faucet') ||
                            activeRequest?.payload?.transaction?.function?.toLowerCase().includes('mint') ||
                            activeRequest?.payload?.transaction?.function?.toLowerCase().includes('claim');

                        const matchedAddr = possibleAddrs.find(a => a && normalizeAddr(a) === normalizedUserAddr);
                        let isMatch = !!matchedAddr;

                        // Support Faucet/Mint/Claim deposits where address field is 0x0
                        if (!isMatch && isFaucetCall && type.includes('::deposit')) {
                            console.log(`[DeepLink Sim] Faucet call detected, allowing deposit: ${type}`);
                            isMatch = true;
                        }

                        if (isMatch) {
                            console.log(`[DeepLink Sim] Event ${idx} MATCHED: ${type}`);

                            if (isWithdraw || isDeposit || isTransfer) {
                                const amountRaw = event.data?.amount || event.data?.value || event.data?.balance || event.data?.price || event.data?.cost;
                                if (amountRaw !== undefined) {
                                    let assetName = 'MOVE';
                                    let decimals = 8;
                                    let tokenAddress = '';

                                    if (type.includes('<')) {
                                        const match = type.match(/<(.*)>/);
                                        if (match && match[1]) {
                                            tokenAddress = match[1];
                                        }
                                    } else if (type.includes('fungible_asset')) {
                                        // V2 Fungible Asset: Try to find metadata address
                                        tokenAddress = event.data?.asset || event.data?.metadata;

                                        // Check simulation changes for the store's metadata
                                        if (!tokenAddress && event.data?.store && result.changes) {
                                            const storeAddr = normalizeAddr(event.data.store);
                                            const storeChange = result.changes.find((c: any) =>
                                                c.type === 'write_resource' &&
                                                normalizeAddr(c.address) === storeAddr &&
                                                c.data?.type === '0x1::fungible_asset::FungibleStore'
                                            );
                                            if (storeChange?.data?.data?.metadata?.inner) {
                                                tokenAddress = storeChange.data.data.metadata.inner;
                                            }
                                        }

                                        // Fallback to payload arguments
                                        const payloadArgs = activeRequest?.payload?.transaction?.functionArguments ||
                                            activeRequest?.payload?.transaction?.arguments || [];
                                        if (!tokenAddress && payloadArgs.length > 0) {
                                            for (const arg of payloadArgs) {
                                                if (typeof arg === 'string' && arg.startsWith('0x') && normalizeAddr(arg) !== normalizedUserAddr) {
                                                    tokenAddress = arg;
                                                    break;
                                                }
                                            }
                                        }

                                        if (!tokenAddress) tokenAddress = '0x1::aptos_coin::AptosCoin';
                                        console.log(`[DeepLink Sim] Event ${idx} resolved token address: ${tokenAddress}`);
                                    }

                                    // Resolve metadata
                                    let resolvedLogo: string | undefined;
                                    try {
                                        const metadata = await getTokenMetadata(tokenAddress);
                                        if (metadata) {
                                            assetName = metadata.symbol;
                                            decimals = metadata.decimals;
                                            resolvedLogo = metadata.logoURI;
                                        } else if (tokenAddress.includes('::')) {
                                            assetName = tokenAddress.split('::').pop()?.toUpperCase() || 'Asset';
                                        }
                                    } catch (e) {
                                        console.warn('[DeepLink Sim] Metadata lookup failed:', e);
                                    }

                                    const amountVal = Number(amountRaw) / Math.pow(10, decimals);

                                    if (amountVal > 0) {
                                        let finalIsPositive = isDeposit;
                                        if (isTransfer) {
                                            const addrTo = normalizeAddr(event.data?.to || event.data?.receiver || event.data?.recipient);
                                            const addrFrom = normalizeAddr(event.data?.from || event.data?.sender || event.data?.payor);

                                            const isToUser = addrTo === normalizedUserAddr;
                                            const isFromUser = addrFrom === normalizedUserAddr;

                                            if (isToUser && !isFromUser) finalIsPositive = true;
                                            else if (isFromUser && !isToUser) finalIsPositive = false;
                                            else continue;
                                        }

                                        console.log(`[DeepLink Sim] Found change: ${finalIsPositive ? '+' : '-'}${amountVal} ${assetName}`);

                                        const signedAmount = finalIsPositive ? amountVal : -amountVal;
                                        const existing = changeMap.get(assetName);

                                        if (existing) {
                                            existing.amount += signedAmount;
                                            if (!existing.logoURI && resolvedLogo) existing.logoURI = resolvedLogo;
                                        } else {
                                            changeMap.set(assetName, {
                                                asset: assetName,
                                                amount: signedAmount,
                                                logoURI: resolvedLogo
                                            });
                                        }
                                        continue;
                                    }
                                }
                            }

                            const isNFTEvent = type.includes('token') || type.includes('object');
                            if (isNFTEvent && (isWithdraw || isDeposit || isTransfer)) {
                                const nftName = event.data?.token_name || event.data?.name || event.data?.metadata?.name || 'NFT';
                                const isNFTDeposit = isDeposit || (isTransfer && normalizeAddr(event.data?.to || event.data?.receiver) === normalizedUserAddr);

                                const signedAmount = isNFTDeposit ? 1 : -1;
                                const existing = changeMap.get(nftName);
                                if (existing) {
                                    existing.amount += signedAmount;
                                } else {
                                    changeMap.set(nftName, {
                                        asset: nftName,
                                        amount: signedAmount,
                                        isNFT: true
                                    });
                                }
                            }
                        }
                    }
                }

                const balanceChanges = Array.from(changeMap.values())
                    .filter(c => Math.abs(c.amount) > 1e-10) // Filter out zero/negligible net changes
                    .map(c => ({
                        asset: c.asset,
                        amount: Math.abs(c.amount).toString(),
                        isPositive: c.amount > 0,
                        logoURI: c.logoURI
                    }));

                // Extract Gas
                const gasPrice = Number(result.gas_unit_price || 0)
                const gasUsed = Number(result.gas_used || 0)
                const gasFeeValue = (gasPrice * gasUsed) / 100000000
                const gasFeeStr = gasFeeValue.toFixed(6) + ' MOVE'

                setSimulationResult({
                    loading: false,
                    success: result.success,
                    error: result.success ? undefined : (result as any).vm_status,
                    balanceChanges,
                    gasFee: gasFeeStr
                })
            } catch (e: any) {
                setSimulationResult({
                    loading: false,
                    error: e.message || 'Simulation failed'
                })
            }
        }

        runSimulation()
    }, [activeRequest, simulateTransaction, address])

    useEffect(() => {
        // Handle URL that opened the app
        Linking.getInitialURL().then((url) => {
            if (url) handleIncomingUrl(url)
        })

        // Listen for internal URL changes
        const subscription = Linking.addEventListener('url', (event) => {
            if (event.url) handleIncomingUrl(event.url)
        })

        return () => subscription.remove()
    }, [handleIncomingUrl])

    const handleApprove = async () => {
        if (!activeRequest || !originalParsed || !originalParsed.params.redirect_link) return

        let responsePayload: any = {}
        const dappPublicKey = originalParsed.params.dapp_encryption_public_key

        try {
            // SYNC NETWORK: Ensure wallet engine is on the correct network before signing
            if (activeRequest.network) {
                const targetNet = activeRequest.network.toLowerCase() as 'mainnet' | 'testnet';
                console.log(`DeepLink: Syncing wallet engine to ${targetNet} for transaction execution`);
                walletSwitchNetwork(targetNet);
            }

            switch (activeRequest.type) {
                case 'connect':
                    responsePayload = {
                        address: address,
                        public_key: publicKey,
                        column_encryption_public_key: manager.getPublicKeyBase58()
                    }
                    break

                case 'signAndSubmitTransaction':
                    if (activeRequest.payload?.transaction) {
                        let txPayload = activeRequest.payload.transaction
                        // Handle cases where the payload might be double-encoded as a string
                        if (typeof txPayload === 'string') {
                            try {
                                txPayload = JSON.parse(txPayload)
                            } catch (e) {
                                // Probably not JSON, continue as is
                            }
                        }

                        console.log('DeepLink: Submitting transaction to engine...', JSON.stringify(txPayload));
                        const hash = await signAndSubmitTransaction(txPayload)
                        responsePayload = { transaction_hash: hash }
                    }
                    break;

                case 'signMessage':
                    if (activeRequest.payload?.message) {
                        const signature = await signMessage(activeRequest.payload.message)
                        responsePayload = { signature }
                    }
                    break

                case 'signTransaction':
                    if (activeRequest.payload?.transaction) {
                        // For Aptos, signRawHash is often used for transaction signing
                        const result = await signRawHash(activeRequest.payload.transaction)
                        responsePayload = { signature: result.signature }
                    }
                    break
            }

            // Build redirect response using Hash Fragment (#) instead of Query (?)
            // This encourages mobile browsers (Chrome/Safari) to focus the existing tab
            const responseParams = new URLSearchParams()

            if (activeRequest.type === 'connect') {
                Object.keys(responsePayload).forEach(key => {
                    responseParams.set(key, (responsePayload as any)[key])
                })
            } else if (dappPublicKey) {
                const encrypted = manager.encryptPayload(responsePayload, dappPublicKey)
                if (encrypted) {
                    responseParams.set('data', encrypted.data)
                    responseParams.set('nonce', encrypted.nonce)
                }
            }

            // Always append status, network, and logs
            const logMsg = activeRequest.type === 'connect' ? 'Wallet Connected Successfully' : 'Transaction Submitted';
            responseParams.set('network', currentNetwork)
            responseParams.set('status', 'success')
            responseParams.set('log', logMsg)

            let finalRedirect = originalParsed.params.redirect_link
            const separator = finalRedirect.includes('?') ? '&' : '?'
            finalRedirect += `${separator}${responseParams.toString()}`

            console.log('DeepLink: Redirecting to:', finalRedirect)

            // RELAY: If there is a session ID, report the result to the Public Relay (Nostr)
            /*
            const sessionId = originalParsed.params.session_id;
            if (sessionId) {
                try {
                    console.log(`DeepLink: Reporting to Public Relay for session: ${sessionId}`);
                    await sdk.publishToRelay(sessionId, Object.fromEntries(responseParams.entries()));
                } catch (e) {
                    console.error('DeepLink: Relay report failed', e);
                }
            }
            */

            // Use Linking.openURL to encourage standard browser navigation instead of a modal session
            Linking.openURL(finalRedirect);
            toast.show('Success', { type: 'success' })
        } catch (error: any) {
            console.error('DeepLink: Approval failed:', error)

            // TRANSMIT ERROR LOG: Send the error back to the dApp so it can show a toast
            if (originalParsed?.params.redirect_link) {
                const redirect = originalParsed.params.redirect_link
                const errorLog = error.message || 'Action failed';
                const errorRedirect = `${redirect}${redirect.includes('?') ? '&' : '?'}status=error&log=${encodeURIComponent(errorLog)}`
                Linking.openURL(errorRedirect)
            } else {
                toast.show(`Error: ${error.message || 'Action failed'}`, { type: 'error' })
            }
        } finally {
            setActiveRequest(null)
            setOriginalParsed(null)
            setSimulationResult(null)
        }
    }

    const handleDecline = async () => {
        if (originalParsed?.params.redirect_link) {
            const redirect = originalParsed.params.redirect_link
            const errorRedirect = `${redirect}${redirect.includes('?') ? '&' : '?'}error=USER_DECLINED`

            // RELAY: Report decline
            const sessionId = originalParsed.params.session_id;
            if (sessionId) {
                try {
                    await fetch(`${BACKEND_CONFIG.BASE_URL}/session/approve`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            sessionId,
                            data: { error: 'USER_DECLINED', status: 'error' }
                        })
                    });
                } catch (e) { }
            }

            Linking.openURL(errorRedirect)
        }
        setActiveRequest(null)
        setOriginalParsed(null)
        toast.show('Request Declined', { type: 'info' })
    }

    return (
        <DeepLinkContext.Provider value={{ isHandlingLink: !!activeRequest, activeRequest }}>
            {children}
            <DeepLinkApprovalModal
                visible={!!activeRequest}
                request={activeRequest}
                onApprove={handleApprove}
                onDecline={handleDecline}
                simulation={simulationResult}
            />
        </DeepLinkContext.Provider>
    )
}

export const useDeepLink = () => {
    const context = useContext(DeepLinkContext)
    if (!context) throw new Error('useDeepLink must be used within a DeepLinkProvider')
    return context
}
