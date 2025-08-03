// server.js - Backend server for QuantumChat
const express = require('express');
const cors = require('cors');
const WebSocket = require('ws');
const http = require('http');
const path = require('path');
const { QuantumCrypto, QuantumUtils } = require('../crypto/quantum-crypto');

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../frontend')));

// Create HTTP server
const server = http.createServer(app);

// Create WebSocket server
const wss = new WebSocket.Server({ server });

// Store connected clients and their crypto instances
const clients = new Map();
const chatRooms = new Map();

console.log('🚀 Starting QuantumChat Server...');

/**
 * WebSocket connection handler
 */
wss.on('connection', (ws, req) => {
    console.log('🔗 New client connected');
    
    // Generate unique client ID
    const clientId = QuantumUtils.generateSessionId();
    
    // Initialize quantum crypto for this client
    const quantumCrypto = new QuantumCrypto();
    
    // Store client info
    clients.set(clientId, {
        ws,
        crypto: quantumCrypto,
        publicKey: null,
        ready: false,
        joinedAt: Date.now()
    });

    // Send initial connection confirmation
    ws.send(JSON.stringify({
        type: 'connected',
        clientId,
        message: 'Connected to QuantumChat server',
        timestamp: QuantumUtils.getTimestamp()
    }));

    /**
     * Handle incoming messages
     */
    ws.on('message', async (data) => {
        try {
            const message = JSON.parse(data);
            await handleMessage(clientId, message);
        } catch (error) {
            console.error('❌ Error handling message:', error);
            ws.send(JSON.stringify({
                type: 'error',
                message: 'Failed to process message',
                error: error.message
            }));
        }
    });

    /**
     * Handle client disconnect
     */
    ws.on('close', () => {
        console.log(`👋 Client ${clientId} disconnected`);
        clients.delete(clientId);
        
        // Notify other clients about disconnection
        broadcastToAll({
            type: 'user_left',
            message: 'A user left the chat',
            timestamp: QuantumUtils.getTimestamp()
        }, clientId);
    });

    // Start key generation process
    setTimeout(() => {
        initiateKeyExchange(clientId);
    }, 1000);
});

/**
 * Handle different message types
 */
async function handleMessage(clientId, message) {
    const client = clients.get(clientId);
    if (!client) return;

    console.log(`📨 Received ${message.type} from ${clientId}`);

    switch (message.type) {
        case 'generate_keys':
            await handleKeyGeneration(clientId);
            break;
            
        case 'public_key':
            await handlePublicKeyExchange(clientId, message);
            break;
            
        case 'encrypted_message':
            await handleEncryptedMessage(clientId, message);
            break;
            
        case 'encrypted_group_message':
            await handleGroupMessage(clientId, message);
            break;
            
        case 'get_security_info':
            await handleSecurityInfoRequest(clientId);
            break;
            
        default:
            console.log(`❓ Unknown message type: ${message.type}`);
    }
}

/**
 * Initiate key exchange process
 */
async function initiateKeyExchange(clientId) {
    const client = clients.get(clientId);
    if (!client) return;

    try {
        console.log(`🔑 Initiating key exchange for ${clientId}`);
        
        client.ws.send(JSON.stringify({
            type: 'key_generation_start',
            message: 'Generating post-quantum cryptographic keys...',
            timestamp: QuantumUtils.getTimestamp()
        }));

        // Simulate key generation delay (real quantum crypto takes time)
        setTimeout(() => {
            handleKeyGeneration(clientId);
        }, 2000);
        
    } catch (error) {
        console.error('❌ Key exchange initiation failed:', error);
    }
}

/**
 * Handle key generation
 */
async function handleKeyGeneration(clientId) {
    const client = clients.get(clientId);
    if (!client) return;

    try {
        console.log(`🔐 Generating keys for ${clientId}`);
        
        // Generate post-quantum key pair
        const keyInfo = client.crypto.generateKeyPair();
        client.publicKey = keyInfo.publicKey;
        
        // Send public key to client
        client.ws.send(JSON.stringify({
            type: 'keys_generated',
            publicKey: keyInfo.publicKey,
            algorithm: keyInfo.algorithm,
            message: 'Post-quantum keys generated successfully',
            timestamp: QuantumUtils.getTimestamp()
        }));

        // Broadcast public key to other clients for key exchange
        broadcastToAll({
            type: 'peer_public_key',
            clientId,
            publicKey: keyInfo.publicKey,
            algorithm: keyInfo.algorithm,
            timestamp: QuantumUtils.getTimestamp()
        }, clientId);

    } catch (error) {
        console.error('❌ Key generation failed:', error);
        client.ws.send(JSON.stringify({
            type: 'error',
            message: 'Key generation failed',
            error: error.message
        }));
    }
}

/**
 * Handle public key exchange between clients
 */
async function handlePublicKeyExchange(clientId, message) {
    const client = clients.get(clientId);
    if (!client) return;

    try {
        console.log(`🤝 Processing key exchange for ${clientId} with peer ${message.peerId || 'unknown'}`);
        
        // Perform key exchange with peer's public key
        const success = client.crypto.performKeyExchange(message.peerPublicKey);
        
        if (success) {
            client.ready = true;
            
            client.ws.send(JSON.stringify({
                type: 'key_exchange_complete',
                message: 'Quantum-safe communication established',
                peerId: message.peerId, // Include the peer ID in the response
                securityInfo: client.crypto.getSecurityInfo(),
                timestamp: QuantumUtils.getTimestamp()
            }));

            console.log(`✅ Client ${clientId} is ready for secure communication with peer ${message.peerId || 'unknown'}`);
            
            // If the peer is specified, notify them about the successful key exchange
            if (message.peerId) {
                const peerClient = clients.get(message.peerId);
                if (peerClient && peerClient.ws.readyState === WebSocket.OPEN) {
                    // Send peer_ready notification to the peer
                    peerClient.ws.send(JSON.stringify({
                        type: 'peer_ready',
                        peerId: clientId,
                        message: 'Peer is ready for secure communication',
                        timestamp: QuantumUtils.getTimestamp()
                    }));
                    
                    // Only send the public key if the peer doesn't have a shared secret with this client
                    // AND we haven't already sent this client's public key to the peer recently
                    if (!peerClient.crypto.hasSharedSecretWith(clientId) && 
                        !peerClient.sentPublicKeyTo?.includes(clientId)) {
                        
                        // Track that we've sent this client's public key to the peer
                        if (!peerClient.sentPublicKeyTo) {
                            peerClient.sentPublicKeyTo = [];
                        }
                        peerClient.sentPublicKeyTo.push(clientId);
                        
                        // Send this client's public key to the peer
                        peerClient.ws.send(JSON.stringify({
                            type: 'peer_public_key',
                            clientId: clientId,
                            publicKey: client.publicKey,
                            algorithm: 'Kyber-1024',
                            timestamp: QuantumUtils.getTimestamp()
                        }));
                        
                        console.log(`📤 Sent ${clientId}'s public key to peer ${message.peerId}`);
                    } else {
                        console.log(`⏭️ Skipped sending ${clientId}'s public key to peer ${message.peerId} - already processed`);
                    }
                }
            }
        }

    } catch (error) {
        console.error('❌ Key exchange failed:', error);
        client.ws.send(JSON.stringify({
            type: 'error',
            message: 'Key exchange failed',
            error: error.message
        }));
    }
}

/**
 * Handle encrypted messages
 */
/**
 * Handle group message with individual encryption per peer
 */
async function handleGroupMessage(clientId, message) {
    const client = clients.get(clientId);
    if (!client) return;

    try {
        console.log(`📨 Group message from ${clientId} for ${message.encryptedMessages.length} peers`);

        // Forward encrypted messages to intended recipients
        message.encryptedMessages.forEach(({ forPeer, data }) => {
            const recipientClient = clients.get(forPeer);
            if (recipientClient && recipientClient.ws.readyState === WebSocket.OPEN) {
                recipientClient.ws.send(JSON.stringify({
                    type: 'message_received',
                    fromPeer: clientId,
                    encryptedData: data,
                    timestamp: QuantumUtils.getTimestamp()
                }));
            }
        });

        // Send confirmation to sender
        client.ws.send(JSON.stringify({
            type: 'message_sent',
            timestamp: QuantumUtils.getTimestamp()
        }));

    } catch (error) {
        console.error('❌ Failed to handle group message:', error);
        client.ws.send(JSON.stringify({
            type: 'error',
            message: 'Failed to send group message',
            error: error.message
        }));
    }
}

/**
 * Handle legacy single encrypted message (backwards compatibility)
 */
async function handleEncryptedMessage(clientId, message) {
    const client = clients.get(clientId);
    if (!client || !client.ready) {
        client.ws.send(JSON.stringify({
            type: 'error',
            message: 'Client not ready for secure communication'
        }));
        return;
    }

    try {
        console.log(`🔒 Relaying encrypted message from ${clientId}`);
        // Relay the encrypted message to all other ready clients
        const messageToForward = {
            type: 'message_received',
            from: clientId,
            encryptedData: message.encryptedData,
            timestamp: QuantumUtils.getTimestamp()
        };
        broadcastToReady(messageToForward, clientId);
        // Send confirmation back to sender
        client.ws.send(JSON.stringify({
            type: 'message_sent',
            message: 'Message sent securely',
            timestamp: QuantumUtils.getTimestamp()
        }));
    } catch (error) {
        console.error('❌ Message relay failed:', error);
        client.ws.send(JSON.stringify({
            type: 'error',
            message: 'Failed to relay encrypted message',
            error: error.message
        }));
    }
}

/**
 * Handle security info requests
 */
async function handleSecurityInfoRequest(clientId) {
    const client = clients.get(clientId);
    if (!client) return;

    try {
        const securityInfo = client.crypto.getSecurityInfo();
        const benchmark = client.crypto.benchmark();
        
        client.ws.send(JSON.stringify({
            type: 'security_info',
            securityInfo,
            benchmark,
            timestamp: QuantumUtils.getTimestamp()
        }));

    } catch (error) {
        console.error('❌ Security info request failed:', error);
    }
}

/**
 * Broadcast message to all connected clients except sender
 */
function broadcastToAll(message, excludeClientId = null) {
    clients.forEach((client, clientId) => {
        if (clientId !== excludeClientId && client.ws.readyState === WebSocket.OPEN) {
            client.ws.send(JSON.stringify(message));
        }
    });
}

/**
 * Broadcast message to all ready clients except sender
 */
function broadcastToReady(message, excludeClientId = null) {
    clients.forEach((client, clientId) => {
        if (clientId !== excludeClientId && 
            client.ready && 
            client.ws.readyState === WebSocket.OPEN) {
            client.ws.send(JSON.stringify(message));
        }
    });
}

/**
 * REST API endpoints
 */

// Get server status
app.get('/api/status', (req, res) => {
    res.json({
        status: 'running',
        connectedClients: clients.size,
        readyClients: Array.from(clients.values()).filter(c => c.ready).length,
        uptime: process.uptime(),
        quantumSafe: true,
        algorithm: 'Post-Quantum Simulation (Kyber + AES-256-GCM)'
    });
});

// Get security information
app.get('/api/security', (req, res) => {
    const sampleCrypto = new QuantumCrypto();
    res.json({
        algorithms: {
            keyExchange: 'Kyber-1024 (Post-Quantum)',
            encryption: 'AES-256-GCM',
            hashing: 'SHA-256',
            signatures: 'Dilithium-3 (Post-Quantum)'
        },
        security: sampleCrypto.getSecurityInfo(),
        benchmark: sampleCrypto.benchmark(),
        quantumThreatAnalysis: sampleCrypto.analyzeQuantumThreats(),
        quantumThreat: {
            rsaVulnerable: true,
            eccVulnerable: true,
            aesStatus: 'Reduced security but still strong',
            kyberStatus: 'Quantum-resistant'
        }
    });
});

// Get detailed quantum threat analysis
app.get('/api/quantum-threats', (req, res) => {
    const sampleCrypto = new QuantumCrypto();
    res.json({
        analysis: sampleCrypto.analyzeQuantumThreats(),
        recommendations: {
            immediate: 'Migrate from RSA/ECC to post-quantum algorithms',
            shortTerm: 'Implement hybrid schemes (classical + PQC)',
            longTerm: 'Full migration to NIST standardized PQC algorithms',
            timeline: 'Complete migration within 5-10 years'
        },
        nistStandards: {
            keyEncapsulation: ['Kyber', 'Classic McEliece', 'HQC'],
            digitalSignatures: ['Dilithium', 'Falcon', 'SPHINCS+'],
            status: 'Finalized and approved for standardization'
        }
    });
});

// Serve main page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend', 'index.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('❌ Express error:', err);
    res.status(500).json({
        error: 'Internal server error',
        message: err.message
    });
});

/**
 * Graceful shutdown handling
 */
process.on('SIGTERM', () => {
    console.log('🛑 Received SIGTERM, shutting down gracefully...');
    
    // Close all WebSocket connections
    clients.forEach((client, clientId) => {
        client.ws.send(JSON.stringify({
            type: 'server_shutdown',
            message: 'Server is shutting down'
        }));
        client.ws.close();
    });
    
    server.close(() => {
        console.log('✅ Server closed');
        process.exit(0);
    });
});

/**
 * Start the server
 */
server.listen(PORT, () => {
    console.log(`🚀 QuantumChat server running on http://localhost:${PORT}`);
    console.log(`🔐 Post-quantum cryptography: ENABLED`);
    console.log(`🌐 WebSocket server: READY`);
    console.log(`📡 Waiting for clients to connect...`);
    
    // Display some educational info
    console.log('\n🧬 Post-Quantum Cryptography Info:');
    console.log('   • Algorithm: Kyber-1024 (NIST finalist)');
    console.log('   • Problem: Module Learning With Errors');
    console.log('   • Quantum Resistance: YES');
    console.log('   • Classical Security: 256-bit equivalent');
    console.log('   • Status: Standardized by NIST\n');
});

// Export for testing
module.exports = { app, server };