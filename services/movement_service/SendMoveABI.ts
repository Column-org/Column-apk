export const ABI ={
  "address": "0x00eb30f24eab56506b8abaea431fb0c6f6aa64622018298b54b1c3d40006fc75",
  "name": "sendmove",
  "friends": [],
  "exposed_functions": [
    {
      "name": "cancel_fa_transfer",
      "visibility": "public",
      "is_entry": true,
      "is_view": false,
      "generic_type_params": [],
      "params": [
        "&signer",
        "0x1::string::String"
      ],
      "return": []
    },
    {
      "name": "cancel_transfer",
      "visibility": "public",
      "is_entry": true,
      "is_view": false,
      "generic_type_params": [],
      "params": [
        "&signer",
        "0x1::string::String"
      ],
      "return": []
    },
    {
      "name": "check_code_exists",
      "visibility": "public",
      "is_entry": false,
      "is_view": true,
      "generic_type_params": [],
      "params": [
        "0x1::string::String"
      ],
      "return": [
        "bool"
      ]
    },
    {
      "name": "check_fa_code_exists",
      "visibility": "public",
      "is_entry": false,
      "is_view": true,
      "generic_type_params": [],
      "params": [
        "0x1::string::String"
      ],
      "return": [
        "bool"
      ]
    },
    {
      "name": "claim_fa_transfer",
      "visibility": "public",
      "is_entry": true,
      "is_view": false,
      "generic_type_params": [],
      "params": [
        "&signer",
        "0x1::string::String"
      ],
      "return": []
    },
    {
      "name": "claim_transfer",
      "visibility": "public",
      "is_entry": true,
      "is_view": false,
      "generic_type_params": [],
      "params": [
        "&signer",
        "0x1::string::String"
      ],
      "return": []
    },
    {
      "name": "create_fa_transfer",
      "visibility": "public",
      "is_entry": true,
      "is_view": false,
      "generic_type_params": [],
      "params": [
        "&signer",
        "0x1::object::Object<0x1::fungible_asset::Metadata>",
        "u64",
        "u64"
      ],
      "return": []
    },
    {
      "name": "create_transfer",
      "visibility": "public",
      "is_entry": true,
      "is_view": false,
      "generic_type_params": [],
      "params": [
        "&signer",
        "u64",
        "u64"
      ],
      "return": []
    },
    {
      "name": "get_fa_transfer",
      "visibility": "public",
      "is_entry": false,
      "is_view": true,
      "generic_type_params": [],
      "params": [
        "0x1::string::String"
      ],
      "return": [
        "address",
        "address",
        "u64",
        "u64",
        "u64"
      ]
    },
    {
      "name": "get_resource_escrow_address",
      "visibility": "public",
      "is_entry": false,
      "is_view": true,
      "generic_type_params": [],
      "params": [],
      "return": [
        "address"
      ]
    },
    {
      "name": "get_total_transfers",
      "visibility": "public",
      "is_entry": false,
      "is_view": true,
      "generic_type_params": [],
      "params": [],
      "return": [
        "u64"
      ]
    },
    {
      "name": "get_transfer",
      "visibility": "public",
      "is_entry": false,
      "is_view": true,
      "generic_type_params": [],
      "params": [
        "0x1::string::String"
      ],
      "return": [
        "address",
        "u64",
        "u64",
        "u64"
      ]
    },
    {
      "name": "is_fa_transfer_claimable",
      "visibility": "public",
      "is_entry": false,
      "is_view": true,
      "generic_type_params": [],
      "params": [
        "0x1::string::String"
      ],
      "return": [
        "bool"
      ]
    },
    {
      "name": "is_transfer_claimable",
      "visibility": "public",
      "is_entry": false,
      "is_view": true,
      "generic_type_params": [],
      "params": [
        "0x1::string::String"
      ],
      "return": [
        "bool"
      ]
    }
  ],
  "structs": [
    {
      "name": "ClaimHistory",
      "is_native": false,
      "is_event": false,
      "abilities": [
        "key"
      ],
      "generic_type_params": [],
      "fields": [
        {
          "name": "move_claims",
          "type": "vector<0xeb30f24eab56506b8abaea431fb0c6f6aa64622018298b54b1c3d40006fc75::sendmove::ClaimRecord>"
        },
        {
          "name": "fa_claims",
          "type": "vector<0xeb30f24eab56506b8abaea431fb0c6f6aa64622018298b54b1c3d40006fc75::sendmove::FAClaimRecord>"
        }
      ]
    },
    {
      "name": "ClaimRecord",
      "is_native": false,
      "is_event": false,
      "abilities": [
        "drop",
        "store"
      ],
      "generic_type_params": [],
      "fields": [
        {
          "name": "sender",
          "type": "address"
        },
        {
          "name": "amount",
          "type": "u64"
        },
        {
          "name": "claimed_at",
          "type": "u64"
        },
        {
          "name": "code_hash",
          "type": "vector<u8>"
        }
      ]
    },
    {
      "name": "FAClaimRecord",
      "is_native": false,
      "is_event": false,
      "abilities": [
        "drop",
        "store"
      ],
      "generic_type_params": [],
      "fields": [
        {
          "name": "sender",
          "type": "address"
        },
        {
          "name": "asset_metadata",
          "type": "address"
        },
        {
          "name": "amount",
          "type": "u64"
        },
        {
          "name": "claimed_at",
          "type": "u64"
        },
        {
          "name": "code_hash",
          "type": "vector<u8>"
        }
      ]
    },
    {
      "name": "FATransferCancelledEvent",
      "is_native": false,
      "is_event": true,
      "abilities": [
        "drop",
        "store"
      ],
      "generic_type_params": [],
      "fields": [
        {
          "name": "sender",
          "type": "address"
        },
        {
          "name": "asset_metadata",
          "type": "address"
        },
        {
          "name": "amount",
          "type": "u64"
        },
        {
          "name": "cancelled_at",
          "type": "u64"
        }
      ]
    },
    {
      "name": "FATransferClaimedEvent",
      "is_native": false,
      "is_event": true,
      "abilities": [
        "drop",
        "store"
      ],
      "generic_type_params": [],
      "fields": [
        {
          "name": "sender",
          "type": "address"
        },
        {
          "name": "recipient",
          "type": "address"
        },
        {
          "name": "asset_metadata",
          "type": "address"
        },
        {
          "name": "amount",
          "type": "u64"
        },
        {
          "name": "claimed_at",
          "type": "u64"
        }
      ]
    },
    {
      "name": "FATransferCreatedEvent",
      "is_native": false,
      "is_event": true,
      "abilities": [
        "drop",
        "store"
      ],
      "generic_type_params": [],
      "fields": [
        {
          "name": "sender",
          "type": "address"
        },
        {
          "name": "code",
          "type": "0x1::string::String"
        },
        {
          "name": "asset_metadata",
          "type": "address"
        },
        {
          "name": "amount",
          "type": "u64"
        },
        {
          "name": "created_at",
          "type": "u64"
        },
        {
          "name": "expiration",
          "type": "u64"
        }
      ]
    },
    {
      "name": "FATransferExpiredRefundEvent",
      "is_native": false,
      "is_event": true,
      "abilities": [
        "drop",
        "store"
      ],
      "generic_type_params": [],
      "fields": [
        {
          "name": "sender",
          "type": "address"
        },
        {
          "name": "asset_metadata",
          "type": "address"
        },
        {
          "name": "amount",
          "type": "u64"
        },
        {
          "name": "refunded_at",
          "type": "u64"
        }
      ]
    },
    {
      "name": "FATransferInfo",
      "is_native": false,
      "is_event": false,
      "abilities": [
        "store"
      ],
      "generic_type_params": [],
      "fields": [
        {
          "name": "sender",
          "type": "address"
        },
        {
          "name": "asset_metadata",
          "type": "address"
        },
        {
          "name": "amount",
          "type": "u64"
        },
        {
          "name": "created_at",
          "type": "u64"
        },
        {
          "name": "expiration",
          "type": "u64"
        }
      ]
    },
    {
      "name": "GlobalRegistry",
      "is_native": false,
      "is_event": false,
      "abilities": [
        "key"
      ],
      "generic_type_params": [],
      "fields": [
        {
          "name": "transfers",
          "type": "0x1::table::Table<vector<u8>, 0xeb30f24eab56506b8abaea431fb0c6f6aa64622018298b54b1c3d40006fc75::sendmove::TokenTransfer>"
        },
        {
          "name": "fa_transfers",
          "type": "0x1::table::Table<vector<u8>, 0xeb30f24eab56506b8abaea431fb0c6f6aa64622018298b54b1c3d40006fc75::sendmove::FATransferInfo>"
        },
        {
          "name": "sender_transfers",
          "type": "0x1::table::Table<address, vector<vector<u8>>>"
        },
        {
          "name": "counter",
          "type": "u64"
        }
      ]
    },
    {
      "name": "ResourceAccountCap",
      "is_native": false,
      "is_event": false,
      "abilities": [
        "key"
      ],
      "generic_type_params": [],
      "fields": [
        {
          "name": "signer_cap",
          "type": "0x1::account::SignerCapability"
        }
      ]
    },
    {
      "name": "TokenTransfer",
      "is_native": false,
      "is_event": false,
      "abilities": [
        "store"
      ],
      "generic_type_params": [],
      "fields": [
        {
          "name": "sender",
          "type": "address"
        },
        {
          "name": "coins",
          "type": "0x1::coin::Coin<0x1::aptos_coin::AptosCoin>"
        },
        {
          "name": "created_at",
          "type": "u64"
        },
        {
          "name": "expiration",
          "type": "u64"
        }
      ]
    },
    {
      "name": "TransferCancelledEvent",
      "is_native": false,
      "is_event": true,
      "abilities": [
        "drop",
        "store"
      ],
      "generic_type_params": [],
      "fields": [
        {
          "name": "sender",
          "type": "address"
        },
        {
          "name": "amount",
          "type": "u64"
        },
        {
          "name": "cancelled_at",
          "type": "u64"
        }
      ]
    },
    {
      "name": "TransferClaimedEvent",
      "is_native": false,
      "is_event": true,
      "abilities": [
        "drop",
        "store"
      ],
      "generic_type_params": [],
      "fields": [
        {
          "name": "sender",
          "type": "address"
        },
        {
          "name": "recipient",
          "type": "address"
        },
        {
          "name": "amount",
          "type": "u64"
        },
        {
          "name": "claimed_at",
          "type": "u64"
        }
      ]
    },
    {
      "name": "TransferCreatedEvent",
      "is_native": false,
      "is_event": true,
      "abilities": [
        "drop",
        "store"
      ],
      "generic_type_params": [],
      "fields": [
        {
          "name": "sender",
          "type": "address"
        },
        {
          "name": "code",
          "type": "0x1::string::String"
        },
        {
          "name": "amount",
          "type": "u64"
        },
        {
          "name": "created_at",
          "type": "u64"
        },
        {
          "name": "expiration",
          "type": "u64"
        }
      ]
    },
    {
      "name": "TransferExpiredRefundEvent",
      "is_native": false,
      "is_event": true,
      "abilities": [
        "drop",
        "store"
      ],
      "generic_type_params": [],
      "fields": [
        {
          "name": "sender",
          "type": "address"
        },
        {
          "name": "amount",
          "type": "u64"
        },
        {
          "name": "refunded_at",
          "type": "u64"
        }
      ]
    }
  ]
}