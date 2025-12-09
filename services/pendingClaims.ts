import AsyncStorage from '@react-native-async-storage/async-storage'
import { MovementNetwork } from '../constants/networkConfig'
import { TransferDetails, viewTransferDetails } from './movement_service/sendWithCode'
import { octasToMove } from './movement_service/helpers'

const STORAGE_KEY = 'pending-claims:v1'

export type PendingClaimRecord = {
  code: string
  type: 'move' | 'fa'
  tokenSymbol: string
  tokenName?: string | null
  amountDisplay: string
  sender: string
  network: MovementNetwork
  assetMetadata?: string | null
  decimals?: number
  createdAt?: number
  expiration?: number
  savedAt: number
}

export type PendingClaimStatus = 'ready' | 'unknown' | 'unavailable'

export type PendingClaimWithStatus = PendingClaimRecord & {
  status: PendingClaimStatus
  chainCreatedAt?: number
  chainExpiration?: number
  chainAmountDisplay?: string
}

async function readRecords(): Promise<PendingClaimRecord[]> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed
  } catch (error) {
    console.warn('Failed to read pending claims from storage', error)
    return []
  }
}

async function writeRecords(records: PendingClaimRecord[]): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(records))
  } catch (error) {
    console.warn('Failed to persist pending claims', error)
  }
}

export async function addPendingClaim(record: PendingClaimRecord): Promise<void> {
  const existing = await readRecords()
  const filtered = existing.filter((entry) => entry.code !== record.code)
  filtered.unshift(record)
  await writeRecords(filtered)
}

export async function removePendingClaim(code: string): Promise<void> {
  const existing = await readRecords()
  const filtered = existing.filter((entry) => entry.code !== code)
  if (filtered.length !== existing.length) {
    await writeRecords(filtered)
  }
}

function formatChainAmount(details: TransferDetails, fallback: PendingClaimRecord): string | undefined {
  if (details.type === 'move') {
    const asNumber = parseInt(details.amount, 10)
    if (!Number.isNaN(asNumber)) {
      return `${octasToMove(asNumber).toFixed(4)} ${fallback.tokenSymbol}`
    }
  } else if (fallback.decimals !== undefined) {
    const asNumber = parseInt(details.amount, 10)
    if (!Number.isNaN(asNumber)) {
      const divisor = Math.pow(10, fallback.decimals)
      return `${(asNumber / divisor).toString()} ${fallback.tokenSymbol}`
    }
  }
  return undefined
}

async function resolveClaimStatus(
  record: PendingClaimRecord
): Promise<PendingClaimWithStatus> {
  try {
    const result = await viewTransferDetails(record.code, record.network)
    if (!result.success || !result.details) {
      const errorMessage = result.error?.toLowerCase() ?? ''
      const isNotFound = errorMessage.includes('transfer not found')
      return {
        ...record,
        status: isNotFound ? 'unavailable' : 'unknown',
      }
    }

    const details = result.details
    const chainCreatedAt = parseInt(details.createdAt, 10)
    const chainExpiration = parseInt(details.expiration, 10)
    const status: PendingClaimStatus = details.isClaimable ? 'ready' : 'unavailable'

    return {
      ...record,
      status,
      chainCreatedAt: Number.isNaN(chainCreatedAt) ? undefined : chainCreatedAt,
      chainExpiration: Number.isNaN(chainExpiration) ? undefined : chainExpiration,
      chainAmountDisplay: formatChainAmount(details, record),
    }
  } catch (error) {
    console.warn(`Failed to fetch transfer details for ${record.code}`, error)
    return {
      ...record,
      status: 'unknown',
    }
  }
}

export async function fetchPendingClaims(
  network: MovementNetwork
): Promise<PendingClaimWithStatus[]> {
  const allRecords = await readRecords()
  if (!allRecords.length) return []

  const refreshedClaims: PendingClaimWithStatus[] = []
  const updatedRecords: PendingClaimRecord[] = []

  for (const record of allRecords) {
    const status = await resolveClaimStatus(record)
    if (status.status === 'unavailable') {
      continue
    }

    updatedRecords.push({
      ...record,
      createdAt: status.chainCreatedAt ?? record.createdAt,
      expiration: status.chainExpiration ?? record.expiration,
    })

    if (record.network === network) {
      refreshedClaims.push(status)
    }
  }

  await writeRecords(updatedRecords)
  return refreshedClaims
}

export async function getPendingClaimsCount(network?: MovementNetwork): Promise<number> {
  const records = await readRecords()
  if (!network) {
    return records.length
  }
  return records.filter((record) => record.network === network).length
}



