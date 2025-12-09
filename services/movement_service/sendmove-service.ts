import { aptosClient } from "./movement-client";
import { MODULE_ADDRESS } from "./constants";
import { EXPIRATION_TIMES, extractCodeFromEvents, moveToOctas, octasToMove } from "./helpers";

export const SendMoveService = {
  /**
   * Create a transfer - contract auto-generates unique code
   * @param amount - Amount in octas (1 MOVE = 100000000 octas)
   * @param expirationSeconds - Expiration time in seconds from now
   */
  createTransfer: (amount: number, expirationSeconds: number) => {
    return {
      function: `${MODULE_ADDRESS}::sendmove::create_transfer`,
      functionArguments: [amount, expirationSeconds],
    };
  },

  /**
   * Claim a transfer using the auto-generated unique code
   * @param code - The unique code to claim
   */
  claimTransfer: (code: string) => {
    return {
      function: `${MODULE_ADDRESS}::sendmove::claim_transfer`,
      functionArguments: [code],
    };
  },

  /**
   * Cancel a transfer and refund the coins
   * @param code - The unique code of the transfer to cancel
   */
  cancelTransfer: (code: string) => {
    return {
      function: `${MODULE_ADDRESS}::sendmove::cancel_transfer`,
      functionArguments: [code],
    };
  },

  /**
   * View Functions
   */

  /**
   * Get transfer details by code
   * @param code - The unique code
   * @returns Promise<[address, u64, u64, u64]> - [sender, amount, created_at, expiration]
   */
  getTransfer: async (code: string) => {
    try {
      const result = await aptosClient.view({
        payload: {
          function: `${MODULE_ADDRESS}::sendmove::get_transfer`,
          functionArguments: [code],
        },
      });
      return result;
    } catch (error) {
      console.error("Error fetching transfer:", error);
      throw error;
    }
  },

  /**
   * Check if a code exists
   * @param code - The unique code
   * @returns Promise<boolean>
   */
  checkCodeExists: async (code: string): Promise<boolean> => {
    try {
      const result = await aptosClient.view({
        payload: {
          function: `${MODULE_ADDRESS}::sendmove::check_code_exists`,
          functionArguments: [code],
        },
      });
      return result[0] as boolean;
    } catch (error) {
      console.error("Error checking code:", error);
      return false;
    }
  },

  /**
   * Check if a transfer is claimable
   * @param code - The unique code
   * @returns Promise<boolean>
   */
  isTransferClaimable: async (code: string): Promise<boolean> => {
    try {
      const result = await aptosClient.view({
        payload: {
          function: `${MODULE_ADDRESS}::sendmove::is_transfer_claimable`,
          functionArguments: [code],
        },
      });
      return result[0] as boolean;
    } catch (error) {
      console.error("Error checking if transfer is claimable:", error);
      return false;
    }
  },
};

/**
 * Helper exports re-exported from helpers
 */

export { moveToOctas, octasToMove, extractCodeFromEvents, EXPIRATION_TIMES };
