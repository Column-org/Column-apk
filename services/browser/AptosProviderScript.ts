export const APTOS_INJECTION_SCRIPT = `
(function() {
    const WALLET_NAME = 'Column Wallet';
    const PROTOCOL_NAME = 'column:request';
    
    // --- Utilities ---
    function hexToUint8Array(hex) {
        if (!hex) return new Uint8Array(0);
        const cleanHex = hex.startsWith('0x') ? hex.slice(2) : hex;
        const res = new Uint8Array(cleanHex.length / 2);
        for (let i = 0; i < cleanHex.length; i += 2) {
            res[i / 2] = parseInt(cleanHex.substring(i, i + 2), 16);
        }
        return res;
    }

    // Critical: BigInt Serialization Fix for Bridge
    function stringify(obj) {
        return JSON.stringify(obj, (key, value) =>
            typeof value === 'bigint' ? value.toString() : value
        );
    }

    // Bridge Logger
    function bridgeLog(msg, data) {
        if (window.ReactNativeWebView && window.ReactNativeWebView.postMessage) {
            window.ReactNativeWebView.postMessage(stringify({
                type: 'column:log',
                message: msg,
                data: data
            }));
        }
    }

    const requests = new Map();
    let requestIdCounter = 0;

    class ColumnAptosProvider {
        constructor() {
            this.name = WALLET_NAME;
            this.url = 'https://column.org';
            this.icon = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIiIGhlaWdodD0iMzIiIHZpZXdCb3g9IjAgMCAzMiAzMiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMzIiIGhlaWdodD0iMzIiIHJ4PSIxNiIgZmlsbD0iI2ZmZGEzNCIvPjxvcGFjaXR5IG9wYWNpdHk9IjAuNSI+PHBhdGggZD0iTTE2IDhDOCAxMiA4IDIwIDE2IDI0QzI0IDIwIDI0IDEyIDE2IDhaIiBmaWxsPSJ3aGl0ZSIvPjwvb3BhY2l0eT48L3N2Zz4=';
            this.readyState = 'Installed';
            
            this.isColumn = true;
            this.isSatoshi = true;
            this.isPetra = true;
            this.isMartian = true;
            this.isMovement = true;
            this.isPontem = true;
            this.isOKXWallet = true;
            
            this.version = '1.2.0';
            this.accounts = [];
            this.chains = ['aptos:mainnet', 'aptos:testnet', 'movement:mainnet', 'movement:testnet'];
            this._listeners = {};

            this.features = {
                'standard:connect': { version: '1.0.0', connect: (i) => this.connect(i) },
                'standard:disconnect': { version: '1.0.0', disconnect: () => this.disconnect() },
                'standard:events': { version: '1.0.0', on: (e, cb) => this.on(e, cb) },
                'aptos:connect': { version: '1.0.0', connect: (i) => this.connect(i) },
                'aptos:getAccount': { version: '1.0.0', getAccount: () => this.account() },
                'aptos:getNetwork': { version: '1.0.0', getNetwork: () => this.getNetwork() },
                'aptos:signAndSubmitTransaction': { version: '1.0.0', signAndSubmitTransaction: (i) => this.signAndSubmitTransaction(i) },
                'aptos:signTransaction': { version: '1.0.0', signTransaction: (i) => this.signTransaction(i) },
                'aptos:signMessage': { version: '1.0.0', signMessage: (i) => this.signMessage(i) },
                'aptos:onAccountChange': { version: '1.0.0', onAccountChange: (cb) => this.on('accountChange', cb) },
                'aptos:onNetworkChange': { version: '1.0.0', onNetworkChange: (cb) => this.on('networkChange', cb) }
            };
        }

        async connect(input) {
            bridgeLog('DApp requested connect', input);
            try {
                const res = await this._sendRequest('connect', input);
                if (res && res.address) {
                    const account = {
                        address: res.address,
                        publicKey: hexToUint8Array(res.publicKey),
                        chains: this.chains,
                        features: Object.keys(this.features),
                        label: WALLET_NAME
                    };
                    this.accounts = [account];
                    this._emit('accountChange', account);
                    return { status: 'Approved', args: account };
                }
                return { status: 'Rejected' };
            } catch (e) {
                return { status: 'Rejected', args: e.message };
            }
        }

        async disconnect() {
            await this._sendRequest('disconnect');
            this.accounts = [];
            this._emit('accountChange', null);
            return { status: 'Approved' };
        }

        async account() {
            const acc = await this._sendRequest('account');
            if (acc && acc.address) {
                return {
                    address: acc.address,
                    publicKey: hexToUint8Array(acc.publicKey),
                    chains: this.chains,
                    features: Object.keys(this.features),
                    label: WALLET_NAME
                };
            }
            return null;
        }

        async getNetwork() {
            const net = await this._sendRequest('getNetwork');
            return { status: 'Approved', args: net };
        }

        async signAndSubmitTransaction(input) {
            const payload = input.payload || input;
            const res = await this._sendRequest('signAndSubmitTransaction', payload);
            return res && res.hash ? { status: 'Approved', args: res } : { status: 'Rejected' };
        }

        async signTransaction(input) {
            const res = await this._sendRequest('signTransaction', input.payload || input);
            return res ? { status: 'Approved', args: res } : { status: 'Rejected' };
        }

        async signMessage(input) {
            const res = await this._sendRequest('signMessage', input);
            return res && res.signature ? { status: 'Approved', args: res } : { status: 'Rejected' };
        }

        // Legacy Shims
        async getAccount() { return this.account(); }
        async network() { const net = await this.getNetwork(); return net.args.name; }
        async isConnected() { return this.accounts.length > 0; }
        async publicKey() { const acc = await this.account(); return acc ? acc.publicKey : null; }
        async address() { const acc = await this.account(); return acc ? acc.address : null; }

        on(event, cb) {
            if (!this._listeners[event]) this._listeners[event] = [];
            this._listeners[event].push(cb);
            return () => this.off(event, cb);
        }
        off(event, cb) {
            if (!this._listeners[event]) return;
            this._listeners[event] = this._listeners[event].filter(l => l !== cb);
        }
        _emit(event, data) {
            if (this._listeners[event]) this._listeners[event].forEach(cb => { try { cb(data); } catch(e){} });
        }

        _sendRequest(method, params = {}) {
            const id = requestIdCounter++;
            return new Promise((resolve, reject) => {
                requests.set(id, { resolve, reject });
                window.ReactNativeWebView.postMessage(stringify({
                    type: PROTOCOL_NAME, id, method, params, origin: window.location.origin
                }));
            });
        }

        _handleResponse(response) {
            const { id, result, error } = response;
            const req = requests.get(id);
            if (req) {
                if (error) req.reject(new Error(error));
                else req.resolve(result);
                requests.delete(id);
            }
        }
    }

    const provider = new ColumnAptosProvider();

    // 1. Claim All
    ['aptos', 'movement', 'cedra', 'martian', 'petra', 'pontem', 'satoshi', 'column', 'okxwallet'].forEach(t => { 
        try { window[t] = provider; } catch(e){} 
    });

    // 2. Registries (Column + Mock Petra Bypass)
    const columnWallet = {
        name: WALLET_NAME,
        icon: provider.icon,
        url: provider.url,
        version: '1.2.0',
        accounts: provider.accounts,
        chains: provider.chains,
        features: provider.features
    };

    const petraWallet = {
        name: 'Petra', // TRICKING THE WHITELIST
        icon: provider.icon,
        url: provider.url,
        version: '1.2.0',
        accounts: provider.accounts,
        chains: provider.chains,
        features: provider.features
    };

    if (!window.aptosWalletStandard) {
        window.aptosWalletStandard = { wallets: [], register: (w) => { if (!window.aptosWalletStandard.wallets.includes(w)) window.aptosWalletStandard.wallets.push(w); } };
    }
    window.aptosWalletStandard.register(columnWallet);
    window.aptosWalletStandard.register(petraWallet);
    
    if (!window.navigator.wallets) {
        window.navigator.wallets = { push: (w) => { if (window.aptosWalletStandard) window.aptosWalletStandard.register(w); } };
    }

    // 3. Handshake
    function register() {
        // Broadcast Column
        window.dispatchEvent(new CustomEvent('wallet-standard:register-wallet', { detail: { register: (reg) => reg(columnWallet) } }));
        window.dispatchEvent(new CustomEvent('aptos-wallet-standard:register-wallet', { detail: { register: (reg) => reg(columnWallet) } }));
        
        // Broadcast Petra (The Bypass)
        window.dispatchEvent(new CustomEvent('wallet-standard:register-wallet', { detail: { register: (reg) => reg(petraWallet) } }));
        window.dispatchEvent(new CustomEvent('aptos-wallet-standard:register-wallet', { detail: { register: (reg) => reg(petraWallet) } }));

        window.dispatchEvent(new CustomEvent('aptos#initialized', { detail: { provider } }));
        window.dispatchEvent(new CustomEvent('petra#initialized', { detail: { provider } }));
    }

    register();
    setInterval(register, 1000);

    // 4. Message Bridge
    window.addEventListener('message', (event) => {
        try {
            let data = event.data;
            if (typeof data === 'string') { try { data = JSON.parse(data); } catch(e){ return; } }
            if (data && data.type === 'column:response') provider._handleResponse(data);
            if (data && data.type === 'column:event') provider._emit(data.event, data.data);
        } catch(e){}
    });

    bridgeLog('Column Wallet v15 TROY Injected Successfully');
})();
`;
