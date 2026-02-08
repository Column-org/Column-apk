import {
    Account,
    Aptos,
    AptosConfig,
    Network,
    InputGenerateTransactionPayloadData,
} from '@aptos-labs/ts-sdk'
import * as NotificationService from '../NotificationService'

import { DEFAULT_NETWORK, NETWORK_CONFIGS } from '../../constants/networkConfig'

export class TransactionService {
    private aptosClient: Aptos
    private currentRpc: string = NETWORK_CONFIGS[DEFAULT_NETWORK].rpcUrl

    constructor() {
        this.aptosClient = this.createClient(this.currentRpc)
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
        payload: InputGenerateTransactionPayloadData
    ): Promise<string> {
        const transaction = await this.aptosClient.transaction.build.simple({
            sender: account.accountAddress,
            data: payload,
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

    // Get account balance
    async getBalance(address: string, coinType: string = '0x1::aptos_coin::AptosCoin'): Promise<bigint> {
        try {
            const resources = await this.aptosClient.getAccountResources({
                accountAddress: address,
            })

            const coinResource = resources.find(
                (r: any) => r.type === `0x1::coin::CoinStore<${coinType}>`
            )

            return coinResource ? BigInt((coinResource.data as any).coin.value) : BigInt(0)
        } catch (error) {
            console.error('Error fetching balance:', error)
            return BigInt(0)
        }
    }
}
