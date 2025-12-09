import { MODULE_ADDRESS } from './constants';

export const ABI ={
  "address": "0xeb30f24eab56506b8abaea431fb0c6f6aa64622018298b54b1c3d40006fc75",
  "name": "saving_cycle",
  "friends": [],
  "exposed_functions": [
    {
      "name": "close_cycle",
      "visibility": "public",
      "is_entry": true,
      "is_view": false,
      "generic_type_params": [],
      "params": [
        "&signer",
        "u64"
      ],
      "return": []
    },
    {
      "name": "create_cycle",
      "visibility": "public",
      "is_entry": true,
      "is_view": false,
      "generic_type_params": [],
      "params": [
        "&signer",
        "0x1::string::String",
        "0x1::string::String",
        "u64",
        "u64",
        "address",
        "u64",
        "u64"
      ],
      "return": []
    },
    {
      "name": "early_withdraw",
      "visibility": "public",
      "is_entry": true,
      "is_view": false,
      "generic_type_params": [],
      "params": [
        "&signer",
        "u64"
      ],
      "return": []
    },
    {
      "name": "emergency_pause",
      "visibility": "public",
      "is_entry": true,
      "is_view": false,
      "generic_type_params": [],
      "params": [
        "&signer"
      ],
      "return": []
    },
    {
      "name": "get_active_cycle_ids",
      "visibility": "public",
      "is_entry": false,
      "is_view": true,
      "generic_type_params": [],
      "params": [
        "address"
      ],
      "return": [
        "vector<u64>"
      ]
    },
    {
      "name": "get_all_cycle_ids",
      "visibility": "public",
      "is_entry": false,
      "is_view": true,
      "generic_type_params": [],
      "params": [
        "address"
      ],
      "return": [
        "vector<u64>"
      ]
    },
    {
      "name": "get_contract_version",
      "visibility": "public",
      "is_entry": false,
      "is_view": true,
      "generic_type_params": [],
      "params": [],
      "return": [
        "u8"
      ]
    },
    {
      "name": "get_cycle",
      "visibility": "public",
      "is_entry": false,
      "is_view": true,
      "generic_type_params": [],
      "params": [
        "address",
        "u64"
      ],
      "return": [
        "u8",
        "0x1::string::String",
        "0x1::string::String",
        "u64",
        "u64",
        "address",
        "u64",
        "u64",
        "u64"
      ]
    },
    {
      "name": "get_cycle_version",
      "visibility": "public",
      "is_entry": false,
      "is_view": true,
      "generic_type_params": [],
      "params": [
        "address",
        "u64"
      ],
      "return": [
        "u8"
      ]
    },
    {
      "name": "get_goal_progress",
      "visibility": "public",
      "is_entry": false,
      "is_view": true,
      "generic_type_params": [],
      "params": [
        "address",
        "u64"
      ],
      "return": [
        "u64"
      ]
    },
    {
      "name": "get_total_saved_all_assets",
      "visibility": "public",
      "is_entry": false,
      "is_view": true,
      "generic_type_params": [],
      "params": [
        "address"
      ],
      "return": [
        "u64"
      ]
    },
    {
      "name": "get_total_saved_by_asset",
      "visibility": "public",
      "is_entry": false,
      "is_view": true,
      "generic_type_params": [],
      "params": [
        "address",
        "address"
      ],
      "return": [
        "u64"
      ]
    },
    {
      "name": "is_cycle_expired",
      "visibility": "public",
      "is_entry": false,
      "is_view": true,
      "generic_type_params": [],
      "params": [
        "address",
        "u64"
      ],
      "return": [
        "bool"
      ]
    },
    {
      "name": "is_goal_based",
      "visibility": "public",
      "is_entry": false,
      "is_view": true,
      "generic_type_params": [],
      "params": [
        "address",
        "u64"
      ],
      "return": [
        "bool"
      ]
    },
    {
      "name": "is_goal_reached",
      "visibility": "public",
      "is_entry": false,
      "is_view": true,
      "generic_type_params": [],
      "params": [
        "address",
        "u64"
      ],
      "return": [
        "bool"
      ]
    },
    {
      "name": "is_paused",
      "visibility": "public",
      "is_entry": false,
      "is_view": true,
      "generic_type_params": [],
      "params": [],
      "return": [
        "bool"
      ]
    },
    {
      "name": "top_up",
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
      "name": "unpause",
      "visibility": "public",
      "is_entry": true,
      "is_view": false,
      "generic_type_params": [],
      "params": [
        "&signer"
      ],
      "return": []
    }
  ],
  "structs": [
    {
      "name": "ContractPaused",
      "is_native": false,
      "is_event": true,
      "abilities": [
        "drop",
        "store"
      ],
      "generic_type_params": [],
      "fields": [
        {
          "name": "admin",
          "type": "address"
        },
        {
          "name": "timestamp",
          "type": "u64"
        }
      ]
    },
    {
      "name": "ContractUnpaused",
      "is_native": false,
      "is_event": true,
      "abilities": [
        "drop",
        "store"
      ],
      "generic_type_params": [],
      "fields": [
        {
          "name": "admin",
          "type": "address"
        },
        {
          "name": "timestamp",
          "type": "u64"
        }
      ]
    },
    {
      "name": "CycleClosed",
      "is_native": false,
      "is_event": true,
      "abilities": [
        "drop",
        "store"
      ],
      "generic_type_params": [],
      "fields": [
        {
          "name": "user",
          "type": "address"
        },
        {
          "name": "cycle_id",
          "type": "u64"
        },
        {
          "name": "final_amount",
          "type": "u64"
        },
        {
          "name": "completed",
          "type": "bool"
        }
      ]
    },
    {
      "name": "CycleCreated",
      "is_native": false,
      "is_event": true,
      "abilities": [
        "drop",
        "store"
      ],
      "generic_type_params": [],
      "fields": [
        {
          "name": "user",
          "type": "address"
        },
        {
          "name": "cycle_id",
          "type": "u64"
        },
        {
          "name": "asset_address",
          "type": "address"
        },
        {
          "name": "initial_amount",
          "type": "u64"
        },
        {
          "name": "goal_amount",
          "type": "u64"
        },
        {
          "name": "duration_days",
          "type": "u64"
        }
      ]
    },
    {
      "name": "CycleTopUp",
      "is_native": false,
      "is_event": true,
      "abilities": [
        "drop",
        "store"
      ],
      "generic_type_params": [],
      "fields": [
        {
          "name": "user",
          "type": "address"
        },
        {
          "name": "cycle_id",
          "type": "u64"
        },
        {
          "name": "amount",
          "type": "u64"
        },
        {
          "name": "new_total",
          "type": "u64"
        }
      ]
    },
    {
      "name": "EarlyWithdrawal",
      "is_native": false,
      "is_event": true,
      "abilities": [
        "drop",
        "store"
      ],
      "generic_type_params": [],
      "fields": [
        {
          "name": "user",
          "type": "address"
        },
        {
          "name": "cycle_id",
          "type": "u64"
        },
        {
          "name": "amount_withdrawn",
          "type": "u64"
        },
        {
          "name": "penalty_amount",
          "type": "u64"
        }
      ]
    },
    {
      "name": "PauseState",
      "is_native": false,
      "is_event": false,
      "abilities": [
        "key"
      ],
      "generic_type_params": [],
      "fields": [
        {
          "name": "paused",
          "type": "bool"
        },
        {
          "name": "admin",
          "type": "address"
        }
      ]
    },
    {
      "name": "SavingCycle",
      "is_native": false,
      "is_event": false,
      "abilities": [
        "drop",
        "store"
      ],
      "generic_type_params": [],
      "fields": [
        {
          "name": "version",
          "type": "u8"
        },
        {
          "name": "name",
          "type": "0x1::string::String"
        },
        {
          "name": "description",
          "type": "0x1::string::String"
        },
        {
          "name": "start_time",
          "type": "u64"
        },
        {
          "name": "end_time",
          "type": "u64"
        },
        {
          "name": "asset_address",
          "type": "address"
        },
        {
          "name": "amount",
          "type": "u64"
        },
        {
          "name": "goal_amount",
          "type": "u64"
        },
        {
          "name": "penalty_percentage",
          "type": "u64"
        }
      ]
    },
    {
      "name": "UserCycles",
      "is_native": false,
      "is_event": false,
      "abilities": [
        "key"
      ],
      "generic_type_params": [],
      "fields": [
        {
          "name": "cycles",
          "type": "0x1::table::Table<u64, 0xeb30f24eab56506b8abaea431fb0c6f6aa64622018298b54b1c3d40006fc75::saving_cycle::SavingCycle>"
        },
        {
          "name": "next_id",
          "type": "u64"
        },
        {
          "name": "active_count",
          "type": "u64"
        }
      ]
    }
  ]
}