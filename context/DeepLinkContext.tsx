import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import * as Linking from 'expo-linking'
import * as WebBrowser from 'expo-web-browser';
import { DeepLinkManager, ParsedDeepLink } from '../services/DeepLinkManager'
import { DeepLinkRequest, DeepLinkApprovalModal } from '../components/deeplink/DeepLinkApprovalModal'
import { useWallet } from './WalletContext'
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
    const { address, publicKey, signAndSubmitTransaction, signMessage, signRawHash, switchNetwork: walletSwitchNetwork } = useWallet()
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
            const separator = finalRedirect.includes('#') ? '&' : '#'
            finalRedirect += `${separator}${responseParams.toString()}`

            console.log('DeepLink: Redirecting to:', finalRedirect)
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
        }
    }

    const handleDecline = () => {
        if (originalParsed?.params.redirect_link) {
            const redirect = originalParsed.params.redirect_link
            const errorRedirect = `${redirect}${redirect.includes('?') ? '&' : '?'}error=USER_DECLINED`
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
            />
        </DeepLinkContext.Provider>
    )
}

export const useDeepLink = () => {
    const context = useContext(DeepLinkContext)
    if (!context) throw new Error('useDeepLink must be used within a DeepLinkProvider')
    return context
}
