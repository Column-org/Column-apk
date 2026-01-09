import { DEFAULT_NETWORK, MovementNetwork, NETWORK_CONFIGS } from '../../constants/networkConfig'
import { MODULE_ADDRESS, BACKEND_URL } from './constants'
import { extractCodeFromEvents, moveToOctas } from './helpers'

type SignHashFn = (address: string, hash: string) => Promise<any>

export type MoveTransferWithCodeParams = {
  senderAddress: string
  amount: string
  expirationSeconds: number
}

export type FATransferWithCodeParams = {
  senderAddress: string
  assetType: string
  amount: string
  decimals: number
  expirationSeconds: number
}

export type ClaimTransferParams = {
  senderAddress: string
  code: string
}

export type CancelTransferParams = {
  senderAddress: string
  code: string
}

export type SendWithCodeResult = {
  success: boolean
  transactionHash?: string
  code?: string | null
  error?: string
}

type SubmitOptions = {
  fetchCode?: boolean
}

async function submitTransaction(
  payload: {
    sender: string
    function: string
    typeArguments?: string[]
    functionArguments: any[]
  },
  signHash: SignHashFn,
  network: MovementNetwork,
  options: SubmitOptions = {}
): Promise<SendWithCodeResult> {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 30000)

  try {
    const hashResponse = await fetch(`${BACKEND_URL}/generate-hash`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sender: payload.sender,
        function: payload.function,
        typeArguments: payload.typeArguments ?? [],
        functionArguments: payload.functionArguments,
        network,
      }),
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

    if (!hashResponse.ok) {
      const error = await hashResponse.json()
      throw new Error(error.error || 'Failed to generate transaction hash')
    }

    const { hash, rawTxnHex } = await hashResponse.json()

    const signatureResponse = await signHash(payload.sender, hash)

    if (!signatureResponse?.data?.signature || !signatureResponse?.data?.public_key) {
      throw new Error('Invalid signature response from Privy')
    }

    const submitResponse = await fetch(`${BACKEND_URL}/submit-transaction`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        rawTxnHex,
        publicKey: signatureResponse.data.public_key,
        signature: signatureResponse.data.signature,
        network,
      }),
    })

    if (!submitResponse.ok) {
      const error = await submitResponse.json()
      throw new Error(error.error || 'Failed to submit transaction')
    }

    const result = await submitResponse.json()

    if (!result.success) {
      throw new Error(result.vmStatus || 'Transaction failed')
    }

    let code: string | null | undefined = null
    if (options.fetchCode ?? true) {
      code = await fetchTransferCode(result.transactionHash, payload.sender, network)
    }

    return {
      success: true,
      transactionHash: result.transactionHash,
      code,
    }
  } catch (error) {
    console.error('Send with code failed:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    }
  }
}

async function fetchTransferCode(
  transactionHash: string,
  senderAddress: string,
  network: MovementNetwork
): Promise<string | null> {
  try {
    const rpcUrl = NETWORK_CONFIGS[network].rpcUrl
    const response = await fetch(`${rpcUrl}/transactions/by_hash/${transactionHash}`)
    if (!response.ok) {
      return null
    }

    const txn = await response.json()
    if (!txn?.events) {
      return null
    }

    return extractCodeFromEvents(txn.events, senderAddress)
  } catch (error) {
    console.warn('Failed to retrieve transfer code from transaction', error)
    return null
  }
}

export async function createMoveTransferWithCode(
  params: MoveTransferWithCodeParams,
  signHash: SignHashFn,
  network: MovementNetwork = DEFAULT_NETWORK
): Promise<SendWithCodeResult> {
  const amountInOctas = moveToOctas(parseFloat(params.amount))

  return submitTransaction(
    {
      sender: params.senderAddress,
      function: `${MODULE_ADDRESS}::sendmove::create_transfer`,
      functionArguments: [amountInOctas, params.expirationSeconds],
    },
    signHash,
    network
  )
}

export async function createFATransferWithCode(
  params: FATransferWithCodeParams,
  signHash: SignHashFn,
  network: MovementNetwork = DEFAULT_NETWORK
): Promise<SendWithCodeResult> {
  const amountInUnits = Math.floor(parseFloat(params.amount) * Math.pow(10, params.decimals))

  return submitTransaction(
    {
      sender: params.senderAddress,
      function: `${MODULE_ADDRESS}::sendmove::create_fa_transfer`,
      functionArguments: [params.assetType, amountInUnits, params.expirationSeconds],
    },
    signHash,
    network
  )
}

export type TransferDetails = {
  type: 'move' | 'fa'
  sender: string
  assetMetadata?: string | null
  amount: string
  createdAt: string
  expiration: string
  isClaimable: boolean
}

export type ViewTransferResult = {
  success: boolean
  details?: TransferDetails
  error?: string
}

export async function viewTransferDetails(
  code: string,
  network: MovementNetwork = DEFAULT_NETWORK
): Promise<ViewTransferResult> {
  try {
    const url = `${BACKEND_URL}/view-transfer`

    // Add timeout to prevent hanging indefinitely
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 10000) // 10 second timeout

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: code.toLowerCase().replace('0x', ''), network }),
      signal: controller.signal,
    })

    clearTimeout(timeoutId)
    console.log(`View Transfer Response [${code}]:`, response.status, response.ok)

    const contentType = response.headers.get('content-type')
    if (!contentType || !contentType.includes('application/json')) {
      const text = await response.text()
      console.error('Non-JSON response for', code, ':', text.substring(0, 200))
      return {
        success: false,
        error: `Backend returned invalid response (${response.status}).`,
      }
    }

    if (!response.ok) {
      try {
        const error = await response.json()
        console.warn(`View Transfer Error [${code}]:`, error)
        return {
          success: false,
          error: error.error || error.details || 'Failed to view transfer details',
        }
      } catch (parseError) {
        return {
          success: false,
          error: `Failed to view transfer details (${response.status})`,
        }
      }
    }

    const details = await response.json()
    console.log(`View Transfer Success [${code}]:`, details.type, details.amount)
    return {
      success: true,
      details,
    }
  } catch (error) {
    console.error('View transfer failed for', code, ':', error)
    if (error instanceof Error && error.name === 'AbortError') {
      return {
        success: false,
        error: 'Request timed out. The blockchain network may be slow. Please try again.',
      }
    }
    if (error instanceof TypeError && error.message.includes('fetch')) {
      return {
        success: false,
        error: 'Cannot connect to backend. Please ensure the backend server is running.',
      }
    }
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    }
  }
}

export async function claimTransferWithCode(
  params: ClaimTransferParams,
  signHash: SignHashFn,
  network: MovementNetwork = DEFAULT_NETWORK,
  transferType: 'move' | 'fa' = 'move'
): Promise<SendWithCodeResult> {
  const functionName =
    transferType.toLowerCase() === 'fa'
      ? `${MODULE_ADDRESS}::sendmove::claim_fa_transfer`
      : `${MODULE_ADDRESS}::sendmove::claim_transfer`

  return submitTransaction(
    {
      sender: params.senderAddress,
      function: functionName,
      functionArguments: [params.code],
    },
    signHash,
    network,
    { fetchCode: false }
  )
}

export async function cancelTransferWithCode(
  params: CancelTransferParams,
  signHash: SignHashFn,
  network: MovementNetwork = DEFAULT_NETWORK,
  transferType: 'move' | 'fa' = 'move'
): Promise<SendWithCodeResult> {
  const functionName =
    transferType.toLowerCase() === 'fa'
      ? `${MODULE_ADDRESS}::sendmove::cancel_fa_transfer`
      : `${MODULE_ADDRESS}::sendmove::cancel_transfer`

  return submitTransaction(
    {
      sender: params.senderAddress,
      function: functionName,
      functionArguments: [params.code],
    },
    signHash,
    network,
    { fetchCode: false }
  )
}

