# Web3 Protocols & Standards

## Ethereum & EVM

**Ethereum**: A decentralized platform that enables smart contracts and decentralized applications through its own blockchain.

**Ethereum Virtual Machine (EVM)**:

- **Definition**: A runtime environment for executing smart contracts on Ethereum
- **Turing Complete**: Can execute any computable function
- **Deterministic**: Same input produces same output across all nodes
- **Isolated**: Smart contracts run in a sandboxed environment

**Key Features**:

- **Smart Contract Platform**: First major blockchain to support smart contracts
- **Developer Ecosystem**: Largest community of blockchain developers
- **Standards**: ERC-20, ERC-721, ERC-1155 token standards
- **Upgrade Path**: Transitioning to Ethereum 2.0 with Proof of Stake

**EVM-Compatible Chains**: Polygon, Binance Smart Chain, Avalanche, Fantom

---

## Bitcoin

**Definition**: The first and most well-known cryptocurrency, created by Satoshi Nakamoto in 2009.

**Key Properties**:

- **Digital Gold**: Store of value with limited supply (21 million BTC)
- **Proof of Work**: Secured by computational mining
- **Decentralized**: No central authority or control
- **Peer-to-Peer**: Direct transactions without intermediaries

**Technical Features**:

- **UTXO Model**: Unspent Transaction Output accounting system
- **Script Language**: Limited programming language for transaction conditions
- **Block Time**: Approximately 10 minutes per block
- **Difficulty Adjustment**: Mining difficulty adjusts every 2016 blocks

**Use Cases**: Store of value, medium of exchange, hedge against inflation, remittances

**Scaling Solutions**: Lightning Network, Liquid Network, Taproot upgrade

---

## Solana

**Definition**: High-performance blockchain designed for decentralized applications and cryptocurrency payments.

**Key Innovations**:

- **Proof of History**: Novel consensus mechanism for ordering transactions
- **High Throughput**: Capable of 65,000+ transactions per second
- **Low Fees**: Sub-cent transaction costs
- **Fast Finality**: Transactions confirmed in seconds

**Technical Architecture**:

- **Parallel Processing**: Multiple transactions processed simultaneously
- **Optimistic Concurrency Control**: Assumes transactions won't conflict
- **Gulf Stream**: Mempool-less transaction forwarding
- **Cloudbreak**: Horizontally scaled state architecture

**Ecosystem**: DeFi protocols, NFT marketplaces, gaming applications, Web3 infrastructure

**Programming Languages**: Rust, C, C++

---

## Polkadot

**Definition**: Multi-chain blockchain platform that enables interoperability between different blockchains.

**Architecture**:

- **Relay Chain**: Main chain providing security and consensus
- **Parachains**: Independent blockchains connected to the relay chain
- **Bridges**: Connect to external blockchains like Bitcoin and Ethereum
- **Collators**: Nodes that maintain parachains and produce candidate blocks

**Key Features**:

- **Interoperability**: Seamless communication between chains
- **Scalability**: Parallel processing across multiple chains
- **Shared Security**: All parachains benefit from relay chain security
- **Governance**: On-chain governance system for protocol updates

**Consensus Mechanism**: Nominated Proof of Stake (NPoS)
**Development Framework**: Substrate blockchain development framework

---

## Binance Smart Chain (BSC)

**Definition**: Blockchain network created by Binance that runs parallel to Binance Chain, supporting smart contracts and DeFi applications.

**Key Features**:

- **EVM Compatibility**: Compatible with Ethereum tools and dApps
- **Fast Transactions**: 3-second block times
- **Low Fees**: Significantly cheaper than Ethereum
- **Dual Chain Architecture**: Works alongside Binance Chain

**Consensus Mechanism**: Proof of Staked Authority (PoSA)

- **21 Validators**: Selected based on staking and voting
- **Delegated Staking**: BNB holders can delegate to validators
- **Slashing**: Penalties for malicious behavior

**Ecosystem**: PancakeSwap, Venus Protocol, Alpaca Finance, various DeFi protocols

**Token Standard**: BEP-20 (similar to ERC-20)

---

## IPFS & Filecoin

### IPFS (InterPlanetary File System)

**Definition**: Decentralized, peer-to-peer file storage system that creates a distributed web.

**Key Concepts**:

- **Content Addressing**: Files identified by cryptographic hashes
- **Deduplication**: Identical files stored only once across the network
- **Versioning**: Built-in version control for files
- **Peer-to-Peer**: No central servers, files distributed across nodes

**Benefits**: Censorship resistance, faster content delivery, reduced bandwidth costs

### Filecoin

**Definition**: Blockchain-based storage network that incentivizes file storage on IPFS.

**How It Works**:

- **Storage Miners**: Provide storage space and earn FIL tokens
- **Retrieval Miners**: Serve files to users and earn FIL tokens
- **Clients**: Pay to store and retrieve files
- **Proof Systems**: Cryptographic proofs ensure files are stored correctly

**Use Cases**: Website hosting, NFT metadata storage, backup solutions, content distribution

---

## Token Standards

### ERC-20 (Ethereum Request for Comment 20)

**Definition**: Standard for fungible tokens on Ethereum, defining a common interface for token contracts.

**Required Functions**:

- `totalSupply()`: Returns total token supply
- `balanceOf(address)`: Returns account balance
- `transfer(to, amount)`: Transfers tokens
- `approve(spender, amount)`: Approves spending allowance
- `transferFrom(from, to, amount)`: Transfers on behalf of another account

**Optional Functions**:

- `name()`: Token name
- `symbol()`: Token symbol
- `decimals()`: Number of decimal places

### ERC-721 (Non-Fungible Token Standard)

**Definition**: Standard for unique, non-fungible tokens on Ethereum.

**Key Functions**:

- `ownerOf(tokenId)`: Returns owner of specific token
- `safeTransferFrom()`: Safely transfers token ownership
- `approve()`: Approves another address to transfer token
- `tokenURI()`: Returns metadata URI for token

**Use Cases**: NFT collectibles, gaming assets, digital art, domain names

### ERC-1155 (Multi-Token Standard)

**Definition**: Standard that supports both fungible and non-fungible tokens in a single contract.

**Advantages**:

- **Efficiency**: Batch operations for multiple tokens
- **Flexibility**: Mix of fungible and non-fungible tokens
- **Gas Savings**: Reduced transaction costs
- **Atomic Swaps**: Exchange multiple tokens in single transaction

**Use Cases**: Gaming (items, currencies, characters), collectibles with editions

---

## Cross-Chain Bridges

**Definition**: Protocols that enable the transfer of assets and data between different blockchain networks.

**Types**:

- **Lock and Mint**: Lock tokens on source chain, mint equivalent on destination
- **Burn and Mint**: Burn tokens on source chain, mint on destination
- **Atomic Swaps**: Direct peer-to-peer exchanges
- **Liquidity Pools**: Use pools of tokens on both chains

**Popular Bridges**:

- **Ethereum ↔ Polygon**: Polygon Bridge
- **Ethereum ↔ BSC**: Binance Bridge
- **Multi-chain**: Multichain (formerly AnySwap), Wormhole
- **Bitcoin ↔ Ethereum**: Wrapped Bitcoin (WBTC)

**Risks**: Smart contract vulnerabilities, centralization, validator attacks

---

## Zero-Knowledge Proofs (ZKP)

**Definition**: Cryptographic methods that allow one party to prove knowledge of information without revealing the information itself.

**Properties**:

- **Completeness**: Valid proofs always verify
- **Soundness**: Invalid proofs are rejected
- **Zero-Knowledge**: No information revealed beyond validity

**Types**:

- **zk-SNARKs**: Zero-Knowledge Succinct Non-Interactive Arguments of Knowledge
- **zk-STARKs**: Zero-Knowledge Scalable Transparent Arguments of Knowledge
- **Bulletproofs**: Range proofs for confidential transactions

**Applications**:

- **Privacy**: Anonymous transactions and identity verification
- **Scalability**: Compress transaction data for Layer 2 solutions
- **Compliance**: Prove regulatory compliance without revealing details

---

## Rollups

### Optimistic Rollups

**Definition**: Layer 2 scaling solution that assumes transactions are valid and only checks them when challenged.

**Key Features**:

- **Optimistic Assumption**: Transactions assumed valid unless proven otherwise
- **Fraud Proofs**: Mechanism to challenge invalid transactions
- **Withdrawal Delays**: Security period for challenges (typically 7 days)
- **EVM Compatibility**: Full Ethereum Virtual Machine support

**Examples**: Arbitrum, Optimism, Metis

### ZK-Rollups

**Definition**: Layer 2 scaling solution that uses zero-knowledge proofs to validate transactions.

**Key Features**:

- **Cryptographic Proofs**: Mathematical proofs of transaction validity
- **Faster Finality**: No withdrawal delays
- **Higher Security**: Transactions proven valid before commitment
- **Limited EVM Compatibility**: Developing zkEVM solutions

**Examples**: StarkEx, zkSync, Polygon Hermez

---

## Decentralized Identity (DID)

**Definition**: Identity management system that gives individuals control over their digital identities without relying on centralized authorities.

**Components**:

- **DID Document**: Contains public keys, service endpoints, and verification methods
- **Verifiable Credentials**: Cryptographically signed claims about identity
- **DID Resolver**: Retrieves DID documents from various networks
- **Identity Wallet**: Stores and manages DIDs and credentials

**Benefits**:

- **Self-Sovereignty**: Users control their own identity data
- **Privacy**: Selective disclosure of information
- **Interoperability**: Works across different platforms and services
- **Security**: Cryptographic protection against tampering

**Standards**: W3C DID specification, Verifiable Credentials Data Model
