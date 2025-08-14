# 🔐 Quantum Crypto - Post-Quantum Secure Messaging

> **Note**: This repository is a fork of [Ayush3422/quantum_crypto](https://github.com/Ayush3422/quantum_crypto) with custom modifications and enhancements by Pavan Patel.

A real-time messaging application that demonstrates post-quantum cryptography in action. This educational project showcases how quantum-resistant algorithms like Kyber can protect communications against future quantum computer attacks.

## 🌟 Features

- **Post-Quantum Cryptography**: Uses simulated Kyber-1024 algorithm for quantum-resistant key exchange
- **Real-time Messaging**: WebSocket-based instant messaging with end-to-end encryption
- **Educational Interface**: Beautiful UI that shows security status and cryptographic processes
- **Quantum-Safe**: Protected against Shor's algorithm and other quantum attacks
- **Modern Web Technologies**: Built with Node.js, Express, and vanilla JavaScript
- **GitHub Pages Deployment**: Automated deployment via GitHub Actions

## 🧬 How It Works

### Post-Quantum Cryptography

Quantum Crypto uses a simulated implementation of the **Kyber** algorithm, which is:

- **Lattice-based**: Uses the Learning With Errors (LWE) problem
- **Quantum-resistant**: No known quantum algorithm can efficiently solve it
- **NIST Standardized**: Selected as a finalist in NIST's Post-Quantum Cryptography competition

### Security Flow

1. **Key Generation**: Each client generates a post-quantum key pair
2. **Key Exchange**: Clients exchange public keys and establish shared secrets
3. **Message Encryption**: Messages are encrypted using AES-256-GCM with quantum-safe keys
4. **Real-time Communication**: Encrypted messages are transmitted via WebSocket

## 🚀 Quick Start

### Prerequisites

- Node.js (version 16 or higher)
- npm (version 8 or higher)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/CODER7657/quantum_crypto.git
   cd quantum_crypto
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the server**
   ```bash
   npm start
   ```

4. **Open in browser**
   Navigate to http://localhost:3000

### Development Mode

For development with auto-restart:
```bash
npm run dev
```

For frontend development with live reload:
```bash
npm run dev-frontend
```

## 🌐 GitHub Pages Deployment

This repository is configured for automatic deployment to GitHub Pages:

- **Trigger**: Pushing to the main branch automatically triggers deployment
- **Workflow**: Uses .github/workflows/jekyll-gh-pages.yml for automated deployment
- **Live Site**: Available at [https://coder7657.github.io/quantum_crypto/](https://coder7657.github.io/quantum_crypto/)
- **Build Process**: GitHub Actions builds and deploys the site using Jekyll

### Manual Deployment

To manually trigger a deployment:

1. Navigate to the Actions tab
2. Select the "Jekyll" workflow
3. Click "Run workflow" to manually trigger deployment

## 📁 Project Structure

```
quantum_crypto/
├── .github/
│   └── workflows/
│       └── jekyll-gh-pages.yml  # GitHub Pages deployment workflow
├── src/
│   ├── backend/
│   │   └── server.js            # Express server with WebSocket support
│   ├── crypto/
│   │   └── quantum-crypto.js    # Post-quantum cryptography implementation
│   └── frontend/
│       ├── index.html           # Main HTML page
│       ├── app.js              # Frontend JavaScript application
│       └── style.css           # Modern CSS styling
├── package.json                 # Project configuration and dependencies
├── README.md                    # This file
├── DEPLOYMENT.md                # Deployment documentation
├── QUANTUM_THREAT_ANALYSIS.md   # Custom threat analysis document
└── LICENSE                      # MIT License
```

## 🔧 Configuration

### Environment Variables

- **PORT**: Server port (default: 3000)

### Security Settings

The application uses these cryptographic parameters:

- **Key Exchange**: Kyber-1024 (simulated)
- **Encryption**: AES-256-GCM
- **Hashing**: SHA-256
- **Key Size**: 256 bits

## 🧪 Educational Purpose

This project is designed for educational purposes to demonstrate:

1. **Quantum Computing Threats**: How current RSA/ECC cryptography will be vulnerable
2. **Post-Quantum Solutions**: How lattice-based cryptography provides quantum resistance
3. **Real-world Implementation**: How to integrate quantum-safe algorithms into applications
4. **Security Best Practices**: Proper key management and secure communication protocols

### Quantum Computing Timeline

- **Current**: RSA/ECC are secure against classical computers
- **10-20 years**: Cryptographically relevant quantum computers expected
- **Solution**: Post-quantum cryptography (like Kyber, Dilithium)
- **Status**: NIST has standardized several PQC algorithms

## 🔄 Fork Information & Custom Additions

### Original Repository

This is a fork of [Ayush3422/quantum_crypto](https://github.com/Ayush3422/quantum_crypto)

### Custom Modifications by Pavan Patel

The following enhancements have been added to this fork:

#### 📄 New Documentation

- **QUANTUM_THREAT_ANALYSIS.md**: Comprehensive analysis of quantum computing threats to current cryptographic systems
- **Enhanced README.md**: Improved documentation with GitHub Pages deployment instructions
- **DEPLOYMENT.md**: Detailed deployment and setup instructions

#### ⚙️ Workflow Enhancements

- **GitHub Actions Integration**: Added .github/workflows/jekyll-gh-pages.yml for automated deployment
- **Continuous Deployment**: Automated GitHub Pages deployment on main branch updates
- **Build Optimization**: Streamlined build process for faster deployments

#### 🔧 Technical Improvements

- **Repository Structure**: Reorganized file structure for better maintainability
- **Configuration Updates**: Enhanced package.json with additional scripts and metadata
- **Error Handling**: Improved error handling in cryptographic operations

#### 🌐 Deployment Features

- **GitHub Pages Setup**: Complete GitHub Pages configuration
- **Custom Domain Support**: Ready for custom domain configuration
- **SSL/TLS**: Automatic HTTPS via GitHub Pages

### Differences from Upstream

1. **Documentation**: More comprehensive documentation including threat analysis
2. **Deployment**: Full GitHub Pages integration with automated workflows
3. **Structure**: Better organized project structure
4. **CI/CD**: Complete continuous integration and deployment pipeline
5. **Educational Content**: Enhanced educational materials about quantum threats

## 🔒 Security Notes

⚠️ **Important**: This is an educational demonstration. For production use:

- Use actual NIST-standardized PQC libraries (like liboqs)
- Implement proper key management and rotation
- Add hardware security modules (HSM)
- Conduct professional security audits
- Follow industry best practices for secure communication

## 🛠️ API Endpoints

### WebSocket Messages

- `connected`: Initial connection confirmation
- `key_generation_start`: Key generation process started
- `keys_generated`: Keys successfully generated
- `peer_public_key`: Peer's public key received
- `key_exchange_complete`: Secure channel established
- `encrypted_message`: Encrypted message received
- `message_sent`: Message sent confirmation

### REST API

- `GET /api/status`: Server status and client information
- `GET /api/security`: Security information and benchmarks

## 🎯 Learning Resources

- [NIST Post-Quantum Cryptography](https://csrc.nist.gov/projects/post-quantum-cryptography)
- [Kyber Algorithm Specification](https://pq-crystals.org/kyber/)
- [Quantum Computing Basics](https://quantum-computing.ibm.com/)
- [WebSocket Protocol](https://developer.mozilla.org/en-US/docs/Web/API/WebSockets_API)

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request. For major changes, please open an issue first to discuss what you would like to change.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Ayush3422**: Original author of the base quantum_crypto repository
- **NIST**: For standardizing post-quantum cryptography
- **The Kyber team**: For developing the algorithm
- **The quantum computing community**: For advancing the field
- **Open source contributors**: Who make educational tools possible

---

**Remember**: The future of cryptography is quantum-safe! 🔐✨
