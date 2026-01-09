import { decryptCode } from './encryption'

export const moveToOctas = (move: number): number => {
  return Math.floor(move * 100000000)
}

export const octasToMove = (octas: number): number => {
  return octas / 100000000
}

export const extractCodeFromEvents = (events: any[], senderAddress: string): string | null => {
  try {
    const transferEvent = events.find((event) =>
      event.type.includes('::sendmove::TransferCreatedEvent') ||
      event.type.includes('::sendmove::FATransferCreatedEvent')
    )
    if (transferEvent?.data?.code) {
      return decryptCode(transferEvent.data.code, senderAddress)
    }
    return null
  } catch (error) {
    console.error('Error extracting and decrypting code from events:', error)
    return null
  }
}

export const EXPIRATION_TIMES = {
  ONE_HOUR: 3600,
  SIX_HOURS: 21600,
  ONE_DAY: 86400,
  THREE_DAYS: 259200,
  ONE_WEEK: 604800,
  ONE_MONTH: 2592000,
}

