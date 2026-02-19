import {
    Account,
    Aptos,
    AptosConfig,
    Network,
    InputGenerateTransactionPayloadData,
} from '@aptos-labs/ts-sdk'


import { DEFAULT_NETWORK, MovementNetwork, NETWORK_CONFIGS } from '../../constants/networkConfig'

export class TransactionService {
    private aptosClient: Aptos
    private fallbackClient: Aptos | null = null
    private currentRpc: string = NETWORK_CONFIGS[DEFAULT_NETWORK].rpcUrl
    private fallbackRpc: string | undefined = NETWORK_CONFIGS[DEFAULT_NETWORK].fallbackRpcUrl

    constructor() {
        this.aptosClient = this.createClient(this.currentRpc)
        if (this.fallbackRpc) {
            this.fallbackClient = this.createClient(this.fallbackRpc)
        }
    }

    private createClient(rpcUrl: string): Aptos {
        const config = new AptosConfig({
            network: Network.CUSTOM,
            fullnode: rpcUrl,
        })
        return new Aptos(config)
    }

    public switchNetwork(rpcUrl: string) {
        this.currentRpc = rpcUrl
        this.aptosClient = this.createClient(rpcUrl)
        // Reset fallback for new network if available
        const networkKey = Object.keys(NETWORK_CONFIGS).find(
            key => NETWORK_CONFIGS[key as MovementNetwork].rpcUrl === rpcUrl
        ) as MovementNetwork | undefined

        if (networkKey && NETWORK_CONFIGS[networkKey].fallbackRpcUrl) {
            this.fallbackRpc = NETWORK_CONFIGS[networkKey].fallbackRpcUrl
            this.fallbackClient = this.createClient(this.fallbackRpc!)
        } else {
            this.fallbackClient = null
        }
    }

    // Simple transfer
    async transfer(
        account: Account,
        toAddress: string,
        amount: number,
        coinType: string = '0x1::aptos_coin::AptosCoin'
    ): Promise<string> {
        const transaction = await this.aptosClient.transaction.build.simple({
            sender: account.accountAddress,
            data: {
                function: '0x1::coin::transfer',
                typeArguments: [coinType],
                functionArguments: [toAddress, amount],
            },
        })

        const signedTransaction = await this.aptosClient.transaction.sign({
            signer: account,
            transaction,
        })

        const pendingTransaction = await this.aptosClient.transaction.submit.simple({
            transaction,
            senderAuthenticator: signedTransaction,
        })

        const committedTransaction = await this.aptosClient.waitForTransaction({
            transactionHash: pendingTransaction.hash,
        })

        return committedTransaction.hash
    }

    // Generic contract interaction
    async executeTransaction(
        account: Account,
        payload: any
    ): Promise<string> {
        const normalizedPayload = this._normalizePayload(payload)
        const transaction = await this.aptosClient.transaction.build.simple({
            sender: account.accountAddress,
            data: normalizedPayload,
        })

        const signedTransaction = await this.aptosClient.transaction.sign({
            signer: account,
            transaction,
        })

        const pendingTransaction = await this.aptosClient.transaction.submit.simple({
            transaction,
            senderAuthenticator: signedTransaction,
        })

        const committedTransaction = await this.aptosClient.waitForTransaction({
            transactionHash: pendingTransaction.hash,
        })

        return committedTransaction.hash
    }

    // Get account balance with fallback support
    async getBalance(address: string, coinType: string = '0x1::aptos_coin::AptosCoin'): Promise<bigint> {
        return this._getBalanceWithFallback(address, coinType, false)
    }

    private async _getBalanceWithFallback(address: string, coinType: string, isFallback: boolean): Promise<bigint> {
        const client = isFallback && this.fallbackClient ? this.fallbackClient : this.aptosClient
        try {
            const resources = await client.getAccountResources({
                accountAddress: address,
            })

            const normalizedCoinType = coinType.startsWith('0x') ? coinType : `0x${coinType}`
            const coinResource = resources.find(
                (r: any) => {
                    const type = r.type as string
                    return type === `0x1::coin::CoinStore<${coinType}>` ||
                        type.includes(`CoinStore<${normalizedCoinType}>`)
                }
            )

            return coinResource ? BigInt((coinResource.data as any).coin.value) : BigInt(0)
        } catch (error: any) {
            const isJsonError = error instanceof SyntaxError || error.message?.includes('JSON')

            if (!isFallback && this.fallbackClient) {
                if (isJsonError) {
                    console.warn(`[TransactionService] Primary RPC JSON error, trying fallback...`)
                } else {
                    console.warn(`[TransactionService] Primary RPC error, trying fallback:`, error.message)
                }
                return this._getBalanceWithFallback(address, coinType, true)
            }

            // If we're already on fallback or no fallback exists
            if (isJsonError) {
                console.warn('[TransactionService] Balance fetch failed: RPC returned non-JSON data (Node possibly down or rate-limited).')
            } else {
                console.warn('[TransactionService] Balance fetch failed:', error.message)
            }
            return BigInt(0)
        }
    }

    // Simulation
    async simulateTransaction(
        account: Account,
        payload: any
    ) {
        const normalizedPayload = this._normalizePayload(payload)
        const transaction = await this.aptosClient.transaction.build.simple({
            sender: account.accountAddress,
            data: normalizedPayload,
        })

        const [simulation] = await this.aptosClient.transaction.simulate.simple({
            signerPublicKey: account.publicKey,
            transaction,
            options: {
                estimateGasUnitPrice: true,
                estimateMaxGasAmount: true,
                estimatePrioritizedGasUnitPrice: false
            }
        })

        return simulation
    }

    // Helper to handle both legacy and new SDK payload formats, and wrapped payloads
    private _normalizePayload(payload: any): InputGenerateTransactionPayloadData {
        // Handle wrapped payload { payload: { ... }, asFeePayer: ... }
        const raw = payload.payload || payload

        return {
            function: raw.function,
            typeArguments: raw.typeArguments || raw.type_arguments || [],
            functionArguments: raw.functionArguments || raw.arguments || [],
        }
    }
}
