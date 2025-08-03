// app.js - Frontend JavaScript for QuantumChat

class QuantumChatApp {
    constructor() {
        this.ws = null;
        this.clientId = null;
        this.publicKey = null;
        this.peerPublicKey = null;
        this.isReady = false;
        this.crypto = new ClientQuantumCrypto();
        
        // DOM elements
        this.elements = {
            status: document.getElementById('connectionStatus'),
            keyStatus: document.getElementById('keyStatus'),
            encryptionType: document.getElementById('encryptionType'),
            messagesContainer: document.getElementById('messagesContainer'),
            messageInput: document.getElementById('messageInput'),
            sendButton: document.getElementById('sendButton')
        };
        
        this.initializeApp();
    }

    /**
     * Initialize the application
     */
    initializeApp() {
        console.log('🚀 Initializing QuantumChat...');
        
        this.connectToServer();
        this.setupEventListeners();
        this.updateUI();
        
        // Show initial educational message
        this.addSystemMessage('Welcome to QuantumChat! This application demonstrates post-quantum cryptography in action.');
    }

    /**
     * Connect to WebSocket server
     */
    connectToServer() {
        // Allow specifying server address via ?server=ws://IP:PORT or prompt if not localhost
        let wsUrl;
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.has('server')) {
            wsUrl = urlParams.get('server');
        } else {
            const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
            // If running on localhost, use default
            if (['localhost', '127.0.0.1'].includes(window.location.hostname)) {
                wsUrl = `${protocol}//${window.location.host}`;
            } else {
                // Prompt user for server address if not on localhost
                wsUrl = prompt('Enter QuantumChat server WebSocket address (e.g. ws://192.168.1.100:3000):', `${protocol}//${window.location.host}`);
                if (!wsUrl) {
                    this.addSystemMessage('❌ No server address provided. Cannot connect.', 'error');
                    return;
                }
            }
        }
        // Ensure the URL has the correct protocol prefix
        if (!wsUrl.startsWith('ws://') && !wsUrl.startsWith('wss://')) {
            const protocol = window.location.protocol === 'https:' ? 'wss://' : 'ws://';
            wsUrl = protocol + wsUrl.replace(/^https?:\/\//, '');
        }
        console.log(`🔗 Connecting to ${wsUrl}...`);
        this.ws = new WebSocket(wsUrl);
        
        this.ws.onopen = () => {
            console.log('✅ Connected to QuantumChat server');
            this.updateStatus('connected', 'Connected');
        };
        
        this.ws.onmessage = (event) => {
            const message = JSON.parse(event.data);
            this.handleServerMessage(message);
        };
        
        this.ws.onclose = () => {
            console.log('❌ Disconnected from server');
            this.updateStatus('disconnected', 'Disconnected');
            this.isReady = false;
            this.updateUI();
            
            // Attempt to reconnect after 3 seconds
            setTimeout(() => {
                console.log('🔄 Attempting to reconnect...');
                this.connectToServer();
            }, 3000);
        };
        
        this.ws.onerror = (error) => {
            console.error('❌ WebSocket error:', error);
            this.updateStatus('disconnected', 'Connection Error');
        };
    }

    /**
     * Handle messages from server
     */
    handleServerMessage(message) {
        console.log(`📨 Received: ${message.type}`, message);
        
        // Extract peerId if available in the message
        const peerId = message.fromPeer || message.clientId || null;
        
        switch (message.type) {
            case 'connected':
                this.clientId = message.clientId;
                this.addSystemMessage(`Connected with ID: ${this.clientId.substring(0, 8)}...`);
                break;
                
            case 'key_generation_start':
                this.updateKeyStatus('Generating quantum-safe keys...');
                this.addSystemMessage('🔑 Generating post-quantum cryptographic keys...');
                break;
                
            case 'keys_generated':
                this.publicKey = message.publicKey;
                // Set the publicKey in the crypto instance for key exchange
                this.crypto.publicKey = message.publicKey;
                this.updateKeyStatus('Keys generated ✅');
                this.addSystemMessage(`🔐 Keys generated using ${message.algorithm}`);
                break;
                
            case 'peer_public_key':
                if (message.clientId !== this.clientId) {
                    this.handlePeerPublicKey(message);
                }
                break;
                
            case 'key_exchange_complete':
                this.isReady = true;
                this.updateKeyStatus('Secure channel established ✅');
                this.updateUI();
                const peerInfo = message.peerId ? ` with peer ${message.peerId.substring(0, 8)}...` : '';
                this.addSystemMessage(`🤝 Quantum-safe communication channel established${peerInfo}!`);
                this.showSecurityInfo(message.securityInfo);
                break;
                
            case 'peer_ready':
                // A peer is ready to communicate with us
                const peerId = message.peerId;
                if (peerId) {
                    this.addSystemMessage(`🔒 Secure connection established with peer ${peerId.substring(0, 8)}...`);
                }
                break;
                
            case 'message_received':
                this.handleReceivedMessage(message);
                break;
                
            case 'message_sent':
                // Message was sent successfully
                break;
                
            case 'user_left':
                this.addSystemMessage('👋 A user left the chat');
                break;
                
            case 'error':
                this.addSystemMessage(`❌ Error: ${message.message}`, 'error');
                break;
                
            default:
                console.log(`❓ Unknown message type: ${message.type}`);
        }
    }

    /**
     * Handle peer public key and perform key exchange
     */
    handlePeerPublicKey(message) {
        const peerId = message.clientId;
        const peerPublicKey = message.publicKey;
        
        // Store the most recent peer's public key for backward compatibility
        this.peerPublicKey = peerPublicKey;
        
        // Store the peer's public key in the peers map
        if (!this.crypto.peers) {
            this.crypto.peers = new Map();
        }
        this.crypto.peers.set(peerId, peerPublicKey);
        
        // Check if we already have a shared secret with this peer
        const alreadyHasSharedSecret = this.crypto.sharedSecrets && this.crypto.sharedSecrets.has(peerId);
        
        if (!alreadyHasSharedSecret) {
            this.addSystemMessage(`🔗 Peer ${peerId.substring(0, 8)}... connected with ${message.algorithm}`);
            
            // Perform key exchange with this peer only if we don't already have a shared secret
            if (this.publicKey && peerPublicKey) {
                this.performKeyExchange(peerPublicKey, peerId);
            }
        } else {
            console.log(`Already have shared secret with peer ${peerId}, skipping key exchange`);
        }
    }

    /**
     * Perform key exchange with peer
     */
    performKeyExchange(peerPublicKey, peerId) {
        console.log('🤝 Performing key exchange with peer:', peerId);
        
        // Use provided peer public key or the stored one
        const publicKeyToUse = peerPublicKey || this.peerPublicKey;
        const peerIdToUse = peerId || 'unknown';
        
        if (!publicKeyToUse) {
            console.error('❌ No peer public key available for exchange');
            return;
        }
        
        // Simulate client-side key exchange
        this.crypto.performKeyExchange(publicKeyToUse, peerIdToUse).then(() => {
            // Send our public key to server for key exchange
            this.ws.send(JSON.stringify({
                type: 'public_key',
                peerPublicKey: publicKeyToUse,
                peerId: peerIdToUse,
                timestamp: new Date().toISOString()
            }));
        }).catch(error => {
            console.error('❌ Key exchange failed:', error);
            this.addSystemMessage('❌ Key exchange failed', 'error');
        });
    }

    /**
     * Handle incoming messages from other users
     */
    handleReceivedMessage(message) {
        try {
            // Add fromPeer to the encryptedData if not already present
            if (!message.encryptedData.fromPeer && message.fromPeer) {
                message.encryptedData.fromPeer = message.fromPeer;
            }
            
            // Log the incoming encrypted data for debugging
            console.log(`📦 Received encrypted message from peer ${message.fromPeer?.substring(0, 8) || 'unknown'}:`, 
                typeof message.encryptedData.encrypted === 'string' ? 
                `${message.encryptedData.encrypted.substring(0, 20)}... (${message.encryptedData.encrypted.length} chars)` : 
                'Non-string format');
            
            // Log the full message structure for debugging
            console.log('📋 Full message structure:', JSON.stringify({
                type: message.type,
                fromPeer: message.fromPeer,
                encryptedData: {
                    algorithm: message.encryptedData.algorithm,
                    format: message.encryptedData.format,
                    timestamp: message.encryptedData.timestamp,
                    encrypted: typeof message.encryptedData.encrypted === 'string' ? 
                        `${message.encryptedData.encrypted.substring(0, 20)}... (${message.encryptedData.encrypted.length} chars)` : 
                        typeof message.encryptedData.encrypted
                }
            }));
            
            // Decrypt the message on the client (E2EE)
            const decryptedText = this.crypto.decrypt(message.encryptedData);
            
            // Verify the decrypted text is valid
            if (decryptedText && typeof decryptedText === 'string') {
                this.addMessage(decryptedText, 'received');
                console.log(`📨 Message successfully decrypted from peer ${message.fromPeer?.substring(0, 8) || 'unknown'}`);
            } else {
                throw new Error('Decryption produced invalid result: ' + (decryptedText === null ? 'null' : typeof decryptedText));
            }
        } catch (error) {
            console.error('❌ Failed to decrypt received message:', error);
            this.addSystemMessage(`❌ Failed to decrypt message from ${message.fromPeer?.substring(0, 8) || 'unknown'}: ${error.message}`, 'error');
            
            // Try to recover if possible
            if (message.encryptedData && typeof message.encryptedData.encrypted === 'string') {
                try {
                    // Try to detect if the message is already in plaintext
                    // This can happen if one client doesn't encrypt properly but sends valid text
                    const isPossiblyText = /^[\x20-\x7E\s]+$/.test(message.encryptedData.encrypted);
                    const hasCommonWords = /(hello|hi|hey|the|and|message|chat|quantum|secure)/i.test(message.encryptedData.encrypted);
                    
                    if (isPossiblyText && (hasCommonWords || message.encryptedData.encrypted.length < 100)) {
                        this.addSystemMessage('⚠️ Showing possibly unencrypted message', 'warning');
                        this.addMessage(`[Unencrypted from ${message.fromPeer?.substring(0, 8) || 'unknown'}]: ${message.encryptedData.encrypted}`, 'received');
                    } else if (message.encryptedData.format === 'hex' || /^[0-9a-fA-F]+$/.test(message.encryptedData.encrypted)) {
                        // Try manual decryption as a last resort
                        this.addSystemMessage('⚠️ Attempting manual decryption as fallback', 'warning');
                        
                        // Try to get the shared secret
                        const peerId = message.fromPeer;
                        const sharedSecret = this.crypto.sharedSecrets.get(peerId);
                        
                        if (sharedSecret) {
                            // Try manual hex decoding and XOR
                            try {
                                // Check if it's a valid hex string (must have even length)
                                let encryptedBytes;
                                if (/^[0-9a-fA-F]+$/.test(message.encryptedData.encrypted) && message.encryptedData.encrypted.length % 2 === 0) {
                                    // It's a hex string
                                    const hexChunks = message.encryptedData.encrypted.match(/.{1,2}/g) || [];
                                    encryptedBytes = new Uint8Array(hexChunks.map(byte => parseInt(byte, 16)));
                                    console.log(`🔄 Manual decryption: Parsed hex string to ${encryptedBytes.length} bytes`);
                                } else {
                                    // Try direct string encoding
                                    try {
                                        const encoder = new TextEncoder();
                                        encryptedBytes = encoder.encode(message.encryptedData.encrypted);
                                    } catch (e) {
                                        // Fallback encoding
                                        encryptedBytes = new Uint8Array(message.encryptedData.encrypted.length);
                                        for (let i = 0; i < message.encryptedData.encrypted.length; i++) {
                                            encryptedBytes[i] = message.encryptedData.encrypted.charCodeAt(i) & 0xFF;
                                        }
                                    }
                                    console.log(`🔄 Manual decryption: Encoded direct string to ${encryptedBytes.length} bytes`);
                                }
                                
                                // XOR decrypt
                                const decrypted = new Uint8Array(encryptedBytes.length);
                                for (let i = 0; i < encryptedBytes.length; i++) {
                                    decrypted[i] = encryptedBytes[i] ^ sharedSecret[i % sharedSecret.length];
                                }
                                
                                // Try multiple decoding methods
                                let manualText = '';
                                
                                // Method 1: TextDecoder
                                try {
                                    const decoder = new TextDecoder();
                                    manualText = decoder.decode(decrypted);
                                    console.log(`🔄 Manual decryption: Decoded with TextDecoder: ${manualText.substring(0, 20)}${manualText.length > 20 ? '...' : ''}`);
                                } catch (e) {
                                    console.warn(`⚠️ TextDecoder failed in manual decryption: ${e.message}`);
                                    
                                    // Method 2: String.fromCharCode.apply
                                    try {
                                        manualText = String.fromCharCode.apply(null, decrypted);
                                        console.log(`🔄 Manual decryption: Decoded with String.fromCharCode: ${manualText.substring(0, 20)}${manualText.length > 20 ? '...' : ''}`);
                                    } catch (e2) {
                                        console.warn(`⚠️ String.fromCharCode.apply failed in manual decryption: ${e2.message}`);
                                        
                                        // Method 3: Character by character
                                        try {
                                            manualText = '';
                                            for (let i = 0; i < decrypted.length; i++) {
                                                manualText += String.fromCharCode(decrypted[i]);
                                            }
                                            console.log(`🔄 Manual decryption: Decoded character by character: ${manualText.substring(0, 20)}${manualText.length > 20 ? '...' : ''}`);
                                        } catch (e3) {
                                            console.error(`❌ All decoding methods failed in manual decryption: ${e3.message}`);
                                        }
                                    }
                                }
                                
                                // Check if the result looks like valid text
                                if (manualText && /^[\x20-\x7E\s]+$/.test(manualText)) {
                                    this.addMessage(`[Manual Decryption from ${message.fromPeer?.substring(0, 8) || 'unknown'}]: ${manualText}`, 'received');
                                    console.log(`✅ Manual decryption succeeded: ${manualText.substring(0, 30)}...`);
                                } else if (manualText) {
                                    console.warn(`⚠️ Manual decryption produced non-text result: ${manualText.substring(0, 30)}...`);
                                    // Try to display it anyway as a last resort
                                    this.addMessage(`[Raw Decryption from ${message.fromPeer?.substring(0, 8) || 'unknown'}]: ${manualText}`, 'received');
                                }
                            } catch (manualError) {
                                console.error('❌ Manual decryption failed:', manualError);
                            }
                        }
                    }
                } catch (e) {
                    console.error('Recovery attempt failed:', e);
                }
            }
        }
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Send button click
        this.elements.sendButton.addEventListener('click', () => {
            this.sendMessage();
        });
        
        // Enter key in message input
        this.elements.messageInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.sendMessage();
            }
        });
        
        // Auto-resize message input
        this.elements.messageInput.addEventListener('input', () => {
            this.elements.messageInput.style.height = 'auto';
            this.elements.messageInput.style.height = this.elements.messageInput.scrollHeight + 'px';
        });
    }

    /**
     * Send encrypted message
     */
    sendMessage() {
        const messageText = this.elements.messageInput.value.trim();
        
        if (!messageText) return;
        if (!this.isReady) {
            this.addSystemMessage('❌ Please wait for secure connection to be established', 'error');
            return;
        }
        
        try {
            // Get all peer IDs from shared secrets and peers map
            const sharedSecretPeerIds = [...this.crypto.sharedSecrets.keys()];
            const allPeerIds = [...new Set([...sharedSecretPeerIds, ...this.crypto.peers.keys()])];
            
            if (allPeerIds.length === 0) {
                this.addSystemMessage('❌ No peers connected for secure messaging', 'error');
                return;
            }

            // Try to establish shared secrets for peers that don't have them yet
            allPeerIds.forEach(peerId => {
                if (!this.crypto.sharedSecrets.has(peerId) && this.crypto.peers.has(peerId)) {
                    try {
                        this.performKeyExchange(this.crypto.peers.get(peerId), peerId);
                    } catch (e) {
                        console.warn(`Could not establish shared secret with peer ${peerId}:`, e);
                    }
                }
            });

            // Only encrypt for peers with established shared secrets
            const readyPeerIds = [...this.crypto.sharedSecrets.keys()];
            
            if (readyPeerIds.length === 0) {
                this.addSystemMessage('⏳ Establishing secure connections with peers. Please try again in a moment.', 'info');
                return;
            }

            // Encrypt message for each peer
            const encryptedMessages = readyPeerIds.map(peerId => {
                return {
                    forPeer: peerId,
                    data: this.crypto.encrypt(messageText, peerId)
                };
            });
            
            // Send encrypted messages to server
            this.ws.send(JSON.stringify({
                type: 'encrypted_group_message',
                encryptedMessages: encryptedMessages,
                timestamp: new Date().toISOString()
            }));
            
            // Display message in UI
            this.addMessage(messageText, 'sent');
            
            // Clear input
            this.elements.messageInput.value = '';
            this.elements.messageInput.style.height = 'auto';
            
            console.log(`🔒 Message encrypted and sent to ${readyPeerIds.length} peers`);
            
        } catch (error) {
            console.error('❌ Failed to send message:', error);
            this.addSystemMessage('❌ Failed to send message', 'error');
        }
    }

    /**
     * Add message to chat
     */
    addMessage(text, type) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${type}`;
        
        const timestamp = new Date().toLocaleTimeString();
        messageDiv.innerHTML = `
            <div class="message-content">${this.escapeHtml(text)}</div>
            <div class="message-time">${timestamp}</div>
        `;
        
        this.elements.messagesContainer.appendChild(messageDiv);
        this.scrollToBottom();
    }

    /**
     * Add system message
     */
    addSystemMessage(text, type = 'info') {
        const messageDiv = document.createElement('div');
        messageDiv.className = `system-message ${type}`;
        messageDiv.textContent = text;
        
        this.elements.messagesContainer.appendChild(messageDiv);
        this.scrollToBottom();
    }

    /**
     * Show security information
     */
    showSecurityInfo(securityInfo) {
        const infoDiv = document.createElement('div');
        infoDiv.className = 'security-info-message';
        infoDiv.innerHTML = `
            <h4>🛡️ Security Information</h4>
            <ul>
                <li><strong>Algorithm:</strong> ${securityInfo.algorithm}</li>
                <li><strong>Key Size:</strong> ${securityInfo.keySize} bits</li>
                <li><strong>Quantum Safe:</strong> ${securityInfo.quantumSafe ? '✅ Yes' : '❌ No'}</li>
                <li><strong>Status:</strong> ${securityInfo.status}</li>
            </ul>
        `;
        
        this.elements.messagesContainer.appendChild(infoDiv);
        this.scrollToBottom();
    }

    /**
     * Update connection status
     */
    updateStatus(status, text) {
        this.elements.status.className = `status ${status}`;
        this.elements.status.textContent = text;
    }

    /**
     * Update key status
     */
    updateKeyStatus(status) {
        this.elements.keyStatus.textContent = status;
    }

    /**
     * Update UI based on connection state
     */
    updateUI() {
        const isConnected = this.ws && this.ws.readyState === WebSocket.OPEN;
        
        this.elements.messageInput.disabled = !this.isReady;
        this.elements.sendButton.disabled = !this.isReady;
        
        if (this.isReady) {
            this.elements.messageInput.placeholder = "Type your quantum-safe message...";
            this.elements.sendButton.textContent = "Send 🚀";
        } else {
            this.elements.messageInput.placeholder = "Establishing secure connection...";
            this.elements.sendButton.textContent = "Please wait...";
        }
    }

    /**
     * Scroll messages to bottom
     */
    scrollToBottom() {
        this.elements.messagesContainer.scrollTop = this.elements.messagesContainer.scrollHeight;
    }

    /**
     * Escape HTML to prevent XSS
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

/**
 * Client-side quantum cryptography simulation
 */
class ClientQuantumCrypto {
    constructor() {
        this.publicKey = null;
        this.sharedSecrets = new Map(); // Map of peer IDs to shared secrets
        this.peers = new Map(); // Map of peer IDs to their public keys
        console.log('🔐 Client quantum crypto initialized');
    }

    /**
     * Perform key exchange (client-side simulation)
     */
    performKeyExchange(peerPublicKey, peerId) {
        if (!this.publicKey) {
            throw new Error('No public key available');
        }
        if (!peerId) {
            throw new Error('Peer ID is required for key exchange');
        }
        
        // Store peer's public key
        this.peers.set(peerId, peerPublicKey);

        // Simulate generating a shared secret using deterministic method
        const encoder = new TextEncoder();
        
        // Use a deterministic approach - sort the keys to ensure same result
        const keys = [this.publicKey, peerPublicKey].sort();
        const data = encoder.encode(keys.join(''));
        
        // Use async digest with a simple fallback
        if (crypto.subtle && crypto.subtle.digest) {
            return crypto.subtle.digest('SHA-256', data).then(hashBuffer => {
                const sharedSecret = new Uint8Array(hashBuffer);
                this.sharedSecrets.set(peerId, sharedSecret);
                console.log(`🤝 Shared secret established with peer ${peerId} (client-side)`);
                return true;
            });
        } else {
            // Fallback for older browsers
            const sharedSecret = this.simpleHash(data);
            this.sharedSecrets.set(peerId, sharedSecret);
            console.log(`🤝 Shared secret established with peer ${peerId} (client-side, fallback)`);
            return Promise.resolve(true);
        }
    }
    
    /**
     * Simple hash function fallback
     */
    simpleHash(data) {
        let hash = 0;
        for (let i = 0; i < data.length; i++) {
            const char = data.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32-bit integer
        }
        // Convert to 32-byte array
        const result = new Uint8Array(32);
        for (let i = 0; i < 32; i++) {
            result[i] = (hash >> (i % 4 * 8)) & 0xFF;
        }
        return result;
    }

    /**
     * Encrypt message (simplified for demonstration)
     */
    encrypt(message, peerId) {
        const sharedSecret = this.sharedSecrets.get(peerId);
        if (!sharedSecret) {
            throw new Error(`No shared secret available for peer ${peerId}`);
        }

        try {
            // Ensure message is a string
            if (typeof message !== 'string') {
                message = String(message);
            }
            
            console.log(`🔒 Encrypting message for peer ${peerId.substring(0, 8)}: ${message.substring(0, 20)}${message.length > 20 ? '...' : ''}`);
            
            // Use try-catch for TextEncoder to handle potential encoding issues
            let messageBytes;
            try {
                // Simple XOR encryption for demonstration
                const encoder = new TextEncoder();
                messageBytes = encoder.encode(message);
                console.log(`📊 Encoded message with TextEncoder (${messageBytes.length} bytes)`);
            } catch (encodingError) {
                console.warn('⚠️ TextEncoder failed, using fallback encoding method:', encodingError);
                // Fallback method: manually convert string to bytes
                messageBytes = new Uint8Array(message.length);
                for (let i = 0; i < message.length; i++) {
                    messageBytes[i] = message.charCodeAt(i) & 0xFF;
                }
                console.log(`📊 Encoded message with fallback method (${messageBytes.length} bytes)`);
            }
            
            const encrypted = new Uint8Array(messageBytes.length);
            
            for (let i = 0; i < messageBytes.length; i++) {
                encrypted[i] = messageBytes[i] ^ sharedSecret[i % sharedSecret.length];
            }
            
            // Always use consistent hex string format for cross-platform compatibility
            const hexString = Array.from(encrypted).map(b => b.toString(16).padStart(2, '0')).join('');
            
            console.log(`🔒 Encrypted message to hex string (${hexString.length} chars): ${hexString.substring(0, 20)}...`);
            
            // Create encrypted data object with explicit format information
            const encryptedData = {
                encrypted: hexString,
                algorithm: 'XOR-Demo',
                timestamp: Date.now(),
                forPeer: peerId,
                format: 'hex' // Explicitly mark the format for better compatibility
            };
            
            // Log the encrypted data structure for debugging
            console.log('📋 Encrypted data structure:', JSON.stringify({
                algorithm: encryptedData.algorithm,
                format: encryptedData.format,
                forPeer: encryptedData.forPeer.substring(0, 8) + '...',
                timestamp: encryptedData.timestamp,
                encryptedLength: encryptedData.encrypted.length
            }));
            
            return encryptedData;
        } catch (error) {
            console.error('❌ Encryption error:', error);
            throw new Error(`Failed to encrypt message: ${error.message}`);
        }
    }

    /**
     * Decrypt message
     */
    decrypt(encryptedData) {
        const peerId = encryptedData.fromPeer || encryptedData.forPeer;
        if (!peerId) {
            throw new Error('No peer ID found in the encrypted data');
        }
        
        const sharedSecret = this.sharedSecrets.get(peerId);
        if (!sharedSecret) {
            console.warn(`⚠️ No shared secret found for peer ${peerId}, attempting to establish one...`);
            
            // Try to get the peer's public key
            const peerPublicKey = this.peers.get(peerId);
            if (peerPublicKey) {
                // Try to establish a shared secret on-the-fly
                this.performKeyExchange(peerPublicKey, peerId);
                throw new Error(`Shared secret not ready yet for peer ${peerId}. Message will be decrypted after key exchange.`);
            } else {
                throw new Error(`No public key available for peer ${peerId}`);
            }
        }

        try {
            // Log the incoming encrypted data format for debugging
            console.log(`🔍 Decrypting data from peer ${peerId.substring(0, 8)}:`, 
                typeof encryptedData.encrypted === 'string' ? 
                `${encryptedData.encrypted.substring(0, 20)}... (${encryptedData.encrypted.length} chars)` : 
                `Format: ${Array.isArray(encryptedData.encrypted) ? 'Array' : typeof encryptedData.encrypted}`);
            
            // Log the full message structure for better debugging
            console.log('📋 Full encrypted data structure:', JSON.stringify({
                format: encryptedData.format,
                algorithm: encryptedData.algorithm,
                timestamp: encryptedData.timestamp,
                fromPeer: peerId.substring(0, 8) + '...',
                encryptedType: typeof encryptedData.encrypted,
                encryptedLength: typeof encryptedData.encrypted === 'string' ? encryptedData.encrypted.length : 
                                Array.isArray(encryptedData.encrypted) ? encryptedData.encrypted.length : 'unknown'
            }));
            
            // Reverse the XOR encryption
            // First, handle the encrypted data properly - it might be in different formats
            let encryptedBytes;
            
            if (typeof encryptedData.encrypted === 'string') {
                // Check if it's explicitly marked as hex format
                if (encryptedData.format === 'hex') {
                    // It's explicitly marked as hex, parse it
                    const hexChunks = encryptedData.encrypted.match(/.{1,2}/g) || [];
                    encryptedBytes = new Uint8Array(hexChunks.map(byte => parseInt(byte, 16)));
                    console.log(`📊 Parsed hex string (${hexChunks.length} bytes)`);
                } else {
                    // Check if it looks like a hex string
                    const hexPattern = /^[0-9a-fA-F]+$/;
                    if (hexPattern.test(encryptedData.encrypted) && encryptedData.encrypted.length % 2 === 0) {
                        // It's a hex string, parse it
                        const hexChunks = encryptedData.encrypted.match(/.{1,2}/g) || [];
                        encryptedBytes = new Uint8Array(hexChunks.map(byte => parseInt(byte, 16)));
                        console.log(`📊 Detected and parsed hex string (${hexChunks.length} bytes)`);
                    } else {
                        // It might be a direct string representation from some clients
                        // Convert to byte array directly
                        try {
                            const encoder = new TextEncoder();
                            encryptedBytes = encoder.encode(encryptedData.encrypted);
                            console.log(`📊 Encoded direct string with TextEncoder (${encryptedBytes.length} bytes)`);
                        } catch (encodingError) {
                            console.warn('TextEncoder failed, using fallback encoding method:', encodingError);
                            // Fallback method: manually convert string to bytes
                            encryptedBytes = new Uint8Array(encryptedData.encrypted.length);
                            for (let i = 0; i < encryptedData.encrypted.length; i++) {
                                encryptedBytes[i] = encryptedData.encrypted.charCodeAt(i) & 0xFF;
                            }
                            console.log(`📊 Parsed direct string with fallback method (${encryptedBytes.length} bytes)`);
                        }
                    }
                }
            } else if (Array.isArray(encryptedData.encrypted)) {
                // Handle array format (might come from some clients)
                encryptedBytes = new Uint8Array(encryptedData.encrypted);
                console.log(`📊 Parsed array (${encryptedBytes.length} bytes)`);
            } else if (encryptedData.encrypted instanceof Uint8Array) {
                // Already a Uint8Array
                encryptedBytes = encryptedData.encrypted;
                console.log(`📊 Using provided Uint8Array (${encryptedBytes.length} bytes)`);
            } else {
                // Unknown format, try to convert to string first
                console.warn(`⚠️ Unsupported encrypted data format: ${typeof encryptedData.encrypted}, attempting conversion`);
                try {
                    const encoder = new TextEncoder();
                    encryptedBytes = encoder.encode(String(encryptedData.encrypted));
                    console.log(`📊 Converted unknown format to ${encryptedBytes.length} bytes`);
                } catch (conversionError) {
                    throw new Error(`Failed to convert unsupported format: ${conversionError.message}`);
                }
            }
            
            const decrypted = new Uint8Array(encryptedBytes.length);
            
            for (let i = 0; i < encryptedBytes.length; i++) {
                decrypted[i] = encryptedBytes[i] ^ sharedSecret[i % sharedSecret.length];
            }
            
            // Use try-catch for TextDecoder to handle potential encoding issues
            let result;
            try {
                const decoder = new TextDecoder('utf-8', { fatal: false });
                result = decoder.decode(decrypted);
                console.log(`🔓 Successfully decoded with TextDecoder (${result.length} chars)`);
            } catch (decodingError) {
                console.warn('⚠️ TextDecoder failed, using fallback decoding method:', decodingError);
                // Fallback method: manually convert bytes to string
                try {
                    result = String.fromCharCode.apply(null, decrypted);
                    console.log(`🔓 Used fallback String.fromCharCode (${result.length} chars)`);
                } catch (charError) {
                    console.warn('⚠️ String.fromCharCode.apply failed, trying character by character:', charError);
                    // If apply fails (can happen with very long arrays), do it character by character
                    result = '';
                    for (let i = 0; i < decrypted.length; i++) {
                        result += String.fromCharCode(decrypted[i]);
                    }
                    console.log(`🔓 Used character-by-character decoding (${result.length} chars)`);
                }
            }
            
            // Validate the result
            if (!result || typeof result !== 'string') {
                throw new Error('Decryption produced invalid result: ' + (result === null ? 'null' : typeof result));
            }
            
            // Check if the result looks like valid text
            const isPossiblyText = /^[\x20-\x7E\s]+$/.test(result);
            if (!isPossiblyText) {
                console.warn(`⚠️ Decrypted result doesn't look like valid text: ${result.substring(0, 30)}...`);
            }
            
            return result;
        } catch (error) {
            console.error('❌ Decryption error:', error);
            throw new Error(`Failed to decrypt message: ${error.message}`);
        }
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('🌐 DOM loaded, starting QuantumChat...');
    window.quantumChat = new QuantumChatApp();
});

// Add some educational information to the console
console.log(`
🧬 QuantumChat - Educational Post-Quantum Cryptography Demo

This application demonstrates:
• Post-quantum key exchange (Kyber simulation)
• Quantum-safe message encryption
• Real-time secure communication
• Modern web technologies

Educational Note:
This is a simplified demonstration for learning purposes.
Production systems should use:
• Actual NIST-standardized PQC algorithms
• Hardware security modules
• Proper key management
• Professional security audits

Quantum Computing Threat:
• Current RSA/ECC will be broken by quantum computers
• Timeline: 10-20 years for cryptographically relevant quantum computers
• Solution: Post-quantum cryptography (like Kyber, Dilithium)
• Status: NIST has standardized several PQC algorithms

Learn more at: https://csrc.nist.gov/projects/post-quantum-cryptography
`);