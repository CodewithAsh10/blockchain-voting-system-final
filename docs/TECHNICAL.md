# Blockchain Voting System - Technical Documentation

## Architecture
The system consists of:
- Frontend: React application with Bootstrap and Chart.js
- Backend: Flask API with WebSocket support
- Blockchain: Custom Python implementation

## Blockchain Implementation
- Uses SHA-256 hashing for cryptographic security
- Proof-of-Work consensus mechanism with adjustable difficulty
- Genesis block initialized at system startup
- Blocks contain multiple vote transactions

## API Endpoints
- `GET /chain` - Retrieve the entire blockchain
- `POST /vote` - Submit a new vote
- `GET /results` - Get election results
- `POST /register` - Register a new voter
- `GET /validate` - Validate blockchain integrity

## WebSocket Events
- `block_mined` - Notifies clients when a new block is mined
- `connection_response` - Confirms WebSocket connection

## Data Structures
### Block
- index: Position in the chain
- transactions: List of vote transactions
- timestamp: Creation time
- previous_hash: Hash of previous block
- nonce: Proof-of-Work value
- hash: Cryptographic hash of the block

### Vote
- voter_id: Hashed voter identifier
- candidate: Selected candidate
- timestamp: Vote creation time
- hash: Cryptographic hash of the vote

## Security Considerations
- Voter IDs are hashed to protect privacy
- Blockchain immutability prevents tampering
- Double-voting detection through voter ID checking
- Admin authentication required for voter registration

## Setup Instructions
### Backend
1. Install Python dependencies: `pip install -r requirements.txt`
2. Run the Flask server: `python app.py`
3. Run the WebSocket server: `python ws_server.py`

### Frontend
1. Install Node.js dependencies: `npm install`
2. Start the development server: `npm start`

## Future Enhancements
- Implement more advanced consensus algorithms
- Add zero-knowledge proofs for enhanced privacy
- Develop mobile application version
- Simulate distributed network with multiple nodes