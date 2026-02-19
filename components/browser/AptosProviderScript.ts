export const APTOS_INJECTION_SCRIPT = `
(function() {
    'use strict';

    // Constants
    var WALLET_NAME = 'Column Wallet';
    var WALLET_VERSION = '1.0.0';
    var WALLET_URL = 'https://column.org';
    var WALLET_ICON = 'data:image/png;base64,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';

    // Utilities
    function hexToBytes(hex) {
        if (!hex) return new Uint8Array(0);
        var h = hex.startsWith('0x') ? hex.slice(2) : hex;
        var arr = new Uint8Array(h.length / 2);
        for (var i = 0; i < h.length; i += 2) arr[i / 2] = parseInt(h.substring(i, i + 2), 16);
        return arr;
    }

    function safeStringify(obj) {
        return JSON.stringify(obj, function(k, v) { return typeof v === 'bigint' ? v.toString() : v; });
    }

    function bridgeLog(msg, data) {
        try {
            if (window.ReactNativeWebView && window.ReactNativeWebView.postMessage) {
                window.ReactNativeWebView.postMessage(safeStringify({ type: 'column:log', message: msg, data: data || {} }));
            }
        } catch(e) {}
    }

    // Request Bridge
    var pendingRequests = new Map();
    var reqId = 0;

    function sendToNative(method, params) {
        return new Promise(function(resolve, reject) {
            var id = reqId++;
            pendingRequests.set(id, { resolve: resolve, reject: reject });
            try {
                window.ReactNativeWebView.postMessage(safeStringify({
                    type: 'column:request',
                    id: id,
                    method: method,
                    params: params || {},
                    origin: window.location.origin
                }));
            } catch(e) {
                pendingRequests.delete(id);
                reject(new Error('Bridge unavailable'));
            }
        });
    }

    // Listen for responses from React Native
    window.addEventListener('message', function(event) {
        try {
            var data = event.data;
            if (typeof data === 'string') { try { data = JSON.parse(data); } catch(e) { return; } }
            if (!data) return;

            if (data.type === 'column:response') {
                var req = pendingRequests.get(data.id);
                if (req) {
                    pendingRequests.delete(data.id);
                    if (data.error) req.reject(new Error(data.error));
                    else req.resolve(data.result);
                }
            }

            if (data.type === 'column:event') {
                columnWallet._emit(data.event, data.data);
            }
        } catch(e) {}
    });

    // AptosWalletError
    function AptosWalletError(code, message) {
        this.code = code;
        this.message = message || 'Wallet error';
        this.name = 'AptosWalletError';
        this.status = code === 4100 ? 'Unauthorized' : code === 4200 ? 'Unsupported' : 'Internal error';
    }
    AptosWalletError.prototype = Object.create(Error.prototype);

    // Column Wallet - AIP-62 compliant wallet object
    // Feature namespaces from @aptos-labs/wallet-standard source:
    // REQUIRED: aptos:account, aptos:connect, aptos:disconnect, aptos:network,
    //           aptos:onAccountChange, aptos:onNetworkChange, aptos:signMessage, aptos:signTransaction
    // OPTIONAL: aptos:signAndSubmitTransaction, aptos:changeNetwork, aptos:openInMobileApp, aptos:signIn
    var _accounts = [];
    var _listeners = {};
    var _connected = false;

    function buildAccount(res) {
        return {
            address: res.address,
            publicKey: hexToBytes(res.publicKey),
            ansName: undefined
        };
    }

    function emit(event, data) {
        var cbs = _listeners[event] || [];
        for (var i = 0; i < cbs.length; i++) {
            try { cbs[i](data); } catch(e) {}
        }
    }

    var columnWallet = {
        // AIP-62 Wallet Standard required fields
        name: WALLET_NAME,
        url: WALLET_URL,
        version: WALLET_VERSION,
        icon: WALLET_ICON,
        chains: ['aptos:mainnet', 'aptos:testnet', 'aptos:devnet', 'aptos:localnet', 'movement:mainnet', 'movement:testnet'],

        get accounts() { return _accounts; },

        features: {
            // --- REQUIRED FEATURES ---

            // aptos:connect
            'aptos:connect': {
                version: '1.0.0',
                connect: function(silent, networkInfo) {
                    return sendToNative('connect', { silent: silent, networkInfo: networkInfo }).then(function(res) {
                        if (res && res.address) {
                            var account = buildAccount(res);
                            _accounts = [account];
                            _connected = true;
                            emit('change', { accounts: _accounts });
                            return { status: 'Approved', args: account };
                        }
                        return { status: 'Rejected' };
                    });
                }
            },

            // aptos:disconnect
            'aptos:disconnect': {
                version: '1.0.0',
                disconnect: function() {
                    return sendToNative('disconnect', {}).then(function() {
                        _accounts = [];
                        _connected = false;
                        emit('change', { accounts: [] });
                    }).catch(function() {
                        _accounts = [];
                        _connected = false;
                    });
                }
            },

            // aptos:account (getAccount)
            'aptos:account': {
                version: '1.0.0',
                account: function() {
                    if (_accounts.length > 0) return Promise.resolve(_accounts[0]);
                    return sendToNative('account', {}).then(function(res) {
                        if (res && res.address) {
                            var account = buildAccount(res);
                            _accounts = [account];
                            return account;
                        }
                        return null;
                    });
                }
            },

            // aptos:network (getNetwork)
            'aptos:network': {
                version: '1.0.0',
                network: function() {
                    return sendToNative('getNetwork', {}).then(function(net) {
                        return net || { name: 'mainnet', chainId: 1, url: '' };
                    }).catch(function() {
                        return { name: 'mainnet', chainId: 1, url: '' };
                    });
                }
            },

            // aptos:onAccountChange
            'aptos:onAccountChange': {
                version: '1.0.0',
                onAccountChange: function(callback) {
                    if (!_listeners['accountChange']) _listeners['accountChange'] = [];
                    _listeners['accountChange'].push(callback);
                    return Promise.resolve();
                }
            },

            // aptos:onNetworkChange
            'aptos:onNetworkChange': {
                version: '1.0.0',
                onNetworkChange: function(callback) {
                    if (!_listeners['networkChange']) _listeners['networkChange'] = [];
                    _listeners['networkChange'].push(callback);
                    return Promise.resolve();
                }
            },

            // aptos:signMessage
            'aptos:signMessage': {
                version: '1.0.0',
                signMessage: function(input) {
                    return sendToNative('signMessage', input).then(function(res) {
                        if (res && res.signature) return { status: 'Approved', args: res };
                        return { status: 'Rejected' };
                    });
                }
            },

            // aptos:signTransaction (REQUIRED)
            'aptos:signTransaction': {
                version: '1.0.0',
                signTransaction: function(transaction, asFeePayer) {
                    var payload = transaction && transaction.payload ? transaction.payload : transaction;
                    return sendToNative('signTransaction', { payload: payload, asFeePayer: asFeePayer }).then(function(res) {
                        if (res) return { status: 'Approved', args: res };
                        return { status: 'Rejected' };
                    });
                }
            },

            // --- OPTIONAL FEATURES ---

            // aptos:signAndSubmitTransaction (optional but widely used)
            'aptos:signAndSubmitTransaction': {
                version: '1.1.0',
                signAndSubmitTransaction: function(input) {
                    var payload = input && input.payload ? input.payload : input;
                    return sendToNative('signAndSubmitTransaction', payload).then(function(res) {
                        if (res && res.hash) return { status: 'Approved', args: res };
                        return { status: 'Rejected' };
                    });
                }
            },

            // aptos:changeNetwork (optional)
            'aptos:changeNetwork': {
                version: '1.0.0',
                changeNetwork: function(network) {
                    return Promise.resolve({ status: 'Approved', args: network });
                }
            },

            // standard:connect (wallet-standard base)
            'standard:connect': {
                version: '1.0.0',
                connect: function(input) {
                    return columnWallet.features['aptos:connect'].connect(input && input.silent);
                }
            },

            // standard:disconnect (wallet-standard base)
            'standard:disconnect': {
                version: '1.0.0',
                disconnect: function() {
                    return columnWallet.features['aptos:disconnect'].disconnect();
                }
            },

            // standard:events (wallet-standard base)
            'standard:events': {
                version: '1.0.0',
                on: function(event, callback) {
                    if (!_listeners[event]) _listeners[event] = [];
                    _listeners[event].push(callback);
                    return function() {
                        _listeners[event] = (_listeners[event] || []).filter(function(cb) { return cb !== callback; });
                    };
                }
            }
        },

        // Internal helpers
        _emit: emit,

        // Legacy API shims for older dApps
        isColumn: true,
        isSatoshi: true,
        isPetra: true,
        isMartian: true,
        isMovement: true,

        connect: function() { return this.features['aptos:connect'].connect(); },
        disconnect: function() { return this.features['aptos:disconnect'].disconnect(); },
        account: function() { return this.features['aptos:account'].account(); },
        getAccount: function() { return this.features['aptos:account'].account(); },
        network: function() { return this.features['aptos:network'].network().then(function(n) { return n.name; }); },
        getNetwork: function() { return this.features['aptos:network'].network(); },
        isConnected: function() { return Promise.resolve(_connected); },
        signMessage: function(input) { return this.features['aptos:signMessage'].signMessage(input); },
        signAndSubmitTransaction: function(input) { return this.features['aptos:signAndSubmitTransaction'].signAndSubmitTransaction(input); },
        onAccountChange: function(cb) { return this.features['aptos:onAccountChange'].onAccountChange(cb); },
        onNetworkChange: function(cb) { return this.features['aptos:onNetworkChange'].onNetworkChange(cb); }
    };

    // =========================================================================
    // AIP-62 / wallet-standard Registration Protocol
    //
    // How @wallet-standard/core getWallets() works (from source):
    // 1. dApp calls getWallets() which dispatches 'wallet-standard:app-ready'
    // 2. Wallets listen for 'wallet-standard:app-ready' and respond by
    //    dispatching 'wallet-standard:register-wallet' with { detail: { register: callback } }
    // 3. getWallets() also listens for 'wallet-standard:register-wallet' events
    //    and calls event.detail(wallet) to register the wallet
    //
    // So we need BOTH:
    //   A) Listen for 'wallet-standard:app-ready' -> dispatch register-wallet event
    //   B) Listen for 'wallet-standard:register-wallet' -> call the register callback
    // =========================================================================

    function dispatchRegisterEvent() {
        try {
            // This is what wallets dispatch to register themselves
            // The dApp's getWallets() listener calls event.detail(wallet)
            var event = new CustomEvent('wallet-standard:register-wallet', {
                bubbles: false,
                cancelable: false,
                composed: false,
                detail: function(callback) {
                    // callback is the register function from getWallets()
                    if (typeof callback === 'function') {
                        callback(columnWallet);
                    }
                }
            });
            window.dispatchEvent(event);
        } catch(e) {}
    }

    // A) Listen for app-ready event (dApp signals it's ready to receive wallets)
    window.addEventListener('wallet-standard:app-ready', function(event) {
        try {
            // The event detail is the register function
            if (event && event.detail && typeof event.detail.register === 'function') {
                event.detail.register(columnWallet);
            } else if (event && typeof event.detail === 'function') {
                event.detail(columnWallet);
            }
            // Also dispatch our register event in response
            dispatchRegisterEvent();
        } catch(e) {}
    });

    // B) Also listen for register-wallet events (in case dApp fires it to discover wallets)
    window.addEventListener('wallet-standard:register-wallet', function(event) {
        try {
            if (event && event.detail && typeof event.detail.register === 'function') {
                event.detail.register(columnWallet);
            } else if (event && typeof event.detail === 'function') {
                event.detail(columnWallet);
            }
        } catch(e) {}
    });

    // Assign to global namespaces for legacy dApps
    var namespaces = ['aptos', 'petra', 'martian', 'pontem', 'column', 'satoshi', 'movement', 'okxwallet'];
    for (var i = 0; i < namespaces.length; i++) {
        try {
            Object.defineProperty(window, namespaces[i], {
                value: columnWallet,
                writable: true,
                configurable: true
            });
        } catch(e) {
            try { window[namespaces[i]] = columnWallet; } catch(e2) {}
        }
    }

    // Dispatch our register event immediately (catches dApps already listening)
    dispatchRegisterEvent();

    // Also dispatch after small delays to catch late-initializing dApps
    setTimeout(dispatchRegisterEvent, 0);
    setTimeout(dispatchRegisterEvent, 100);
    setTimeout(dispatchRegisterEvent, 500);
    setTimeout(dispatchRegisterEvent, 1000);

    // Legacy events
    try { window.dispatchEvent(new Event('aptos#initialized')); } catch(e) {}
    try { window.dispatchEvent(new CustomEvent('petra#initialized', { detail: columnWallet })); } catch(e) {}

    bridgeLog('Column Wallet Injected', { version: WALLET_VERSION, features: Object.keys(columnWallet.features) });
})();
`;
