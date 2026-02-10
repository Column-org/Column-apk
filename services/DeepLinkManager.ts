import * as nacl from 'tweetnacl'
import bs58 from 'bs58'
import * as SecureStore from 'expo-secure-store'
import { Buffer } from 'buffer'
import { DeepLinkRequest } from '../components/deeplink/DeepLinkApprovalModal'

const COLUMN_PRIVATE_KEY_KEY = 'column_deeplink_private_key'
const COLUMN_PUBLIC_KEY_KEY = 'column_deeplink_public_key'

export interface ParsedDeepLink {
    method: string
    params: Record<string, string>
}

export class DeepLinkManager {
    private encryptionKeyPair: nacl.BoxKeyPair | null = null

    constructor() {
        this.initializeKeys()
    }

    private async initializeKeys() {
        try {
            const storedPrivKey = await SecureStore.getItemAsync(COLUMN_PRIVATE_KEY_KEY)
            const storedPubKey = await SecureStore.getItemAsync(COLUMN_PUBLIC_KEY_KEY)

            if (storedPrivKey && storedPubKey) {
                this.encryptionKeyPair = {
                    secretKey: bs58.decode(storedPrivKey),
                    publicKey: bs58.decode(storedPubKey)
                }
            } else {
                const newKeyPair = nacl.box.keyPair()
                await SecureStore.setItemAsync(COLUMN_PRIVATE_KEY_KEY, bs58.encode(newKeyPair.secretKey))
                await SecureStore.setItemAsync(COLUMN_PUBLIC_KEY_KEY, bs58.encode(newKeyPair.publicKey))
                this.encryptionKeyPair = newKeyPair
            }
        } catch (error) {
            console.error('DeepLinkManager: Failed to initialize encryption keys', error)
        }
    }

    public getPublicKeyBase58(): string {
        return this.encryptionKeyPair ? bs58.encode(this.encryptionKeyPair.publicKey) : ''
    }

    /**
     * Parses a column://v1/[method]?[params] URL
     */
    public parseUrl(url: string): ParsedDeepLink | null {
        try {
            // Handle Expo Go specific URLs (exp://host:port/--/path?query)
            let cleanUrl = url;
            if (url.includes('/--/')) {
                cleanUrl = 'column://' + url.split('/--/')[1];
            } else if (url.startsWith('exp://')) {
                // Handle exp://index?...
                const parts = url.split('://');
                if (parts[1]) {
                    const subParts = parts[1].split('/');
                    const path = subParts.slice(1).join('/'); // Remove host
                    cleanUrl = 'column://' + path;
                }
            }

            const [urlBase, queryString] = cleanUrl.split('?')
            const params: Record<string, string> = {}
            if (queryString) {
                const pairs = queryString.split('&')
                for (const pair of pairs) {
                    const [key, value] = pair.split('=')
                    // URLSearchParams encodes spaces as +, so we must swap them back
                    const k = decodeURIComponent(key.replace(/\+/g, ' '))
                    const v = decodeURIComponent(value.replace(/\+/g, ' '))
                    params[k] = v
                }
            }

            // Method can be in the path or in the query param
            let method = params.request || ''
            if (!method) {
                const path = urlBase.replace('column://', '').replace(/^\/+|\/+$/g, '')
                if (path) {
                    const pathParts = path.split('/')
                    method = pathParts[pathParts.length - 1]
                }
            }

            if (!method) return null
            return { method, params }
        } catch (error) {
            console.error('DeepLinkManager: Failed to parse URL', error)
            return null
        }
    }

    /**
     * Decrypts a payload from a dApp
     */
    public decryptPayload(
        encryptedDataB58: string,
        nonceB58: string,
        dappPublickeyB58: string
    ): any | null {
        if (!this.encryptionKeyPair) return null

        try {
            const sharedSecret = nacl.box.before(
                bs58.decode(dappPublickeyB58),
                this.encryptionKeyPair.secretKey
            )

            const decrypted = nacl.box.open.after(
                bs58.decode(encryptedDataB58),
                bs58.decode(nonceB58),
                sharedSecret
            )

            if (!decrypted) return null

            const jsonString = Buffer.from(decrypted).toString('utf8')
            return JSON.parse(jsonString)
        } catch (error) {
            console.error('DeepLinkManager: Decryption failed', error)
            return null
        }
    }

    /**
     * Encrypts a response for a dApp
     */
    public encryptPayload(
        payload: any,
        dappPublickeyB58: string
    ): { data: string; nonce: string } | null {
        if (!this.encryptionKeyPair) return null

        try {
            const sharedSecret = nacl.box.before(
                bs58.decode(dappPublickeyB58),
                this.encryptionKeyPair.secretKey
            )

            const nonce = nacl.randomBytes(nacl.box.nonceLength)
            const message = Buffer.from(JSON.stringify(payload), 'utf8')

            const encrypted = nacl.box.after(
                message,
                nonce,
                sharedSecret
            )

            return {
                data: bs58.encode(encrypted),
                nonce: bs58.encode(nonce)
            }
        } catch (error) {
            console.error('DeepLinkManager: Encryption failed', error)
            return null
        }
    }

    /**
     * Maps a parsed deep link to a UI request object
     */
    public async mapToRequest(parsed: ParsedDeepLink): Promise<DeepLinkRequest | null> {
        const { method, params } = parsed

        const appName = params.app_name || 'Handover Request'
        const appUrl = params.app_url || 'Unknown Origin'
        const appIcon = params.app_icon
        const appDescription = params.app_description
        const network = params.network

        // Basic Connect Request (Unencrypted Handshake Part)
        if (method === 'connect') {
            return {
                type: 'connect',
                appName,
                appUrl,
                appIcon,
                network,
                details: appDescription || 'Establish a secure connection with Column Wallet'
            }
        }

        // Methods that require decryption (Sign, Submit, etc.)
        if (params.data && params.nonce && params.dapp_encryption_public_key) {
            const decrypted = this.decryptPayload(params.data, params.nonce, params.dapp_encryption_public_key)
            if (!decrypted) return null

            switch (method) {
                case 'signAndSubmitTransaction':
                    return {
                        type: 'signAndSubmitTransaction',
                        appName,
                        appUrl,
                        appIcon,
                        network,
                        payload: decrypted,
                        details: appDescription || `Authorize a transaction broadcast to the Movement network.`
                    }
                case 'signTransaction':
                    return {
                        type: 'signTransaction',
                        appName,
                        appUrl,
                        appIcon,
                        network,
                        payload: decrypted,
                        details: appDescription || 'Sign a transaction without broadcasting it.'
                    }
                case 'signMessage':
                    return {
                        type: 'signMessage',
                        appName,
                        appUrl,
                        appIcon,
                        network,
                        payload: decrypted,
                        details: appDescription || `Sign message: ${decrypted.message?.substring(0, 50)}...`
                    }
            }
        }

        return null
    }
}
