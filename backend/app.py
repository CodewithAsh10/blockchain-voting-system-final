from flask import Flask, request, jsonify
from flask_cors import CORS
import time
import hashlib
import json
from datetime import datetime

app = Flask(__name__)
CORS(app)

# Global storage
elections = {}
admin_key = "admin123"
registered_voters = {}

class Block:
    def __init__(self, index, transactions, timestamp, previous_hash, nonce=0):
        self.index = index
        self.transactions = transactions
        self.timestamp = timestamp
        self.previous_hash = previous_hash
        self.nonce = nonce
        self.hash = self.calculate_hash()

    def calculate_hash(self):
        block_string = json.dumps({
            "index": self.index,
            "transactions": [tx.to_dict() if hasattr(tx, 'to_dict') else tx for tx in self.transactions],
            "timestamp": self.timestamp,
            "previous_hash": self.previous_hash,
            "nonce": self.nonce
        }, sort_keys=True)
        return hashlib.sha256(block_string.encode()).hexdigest()

    def mine_block(self, difficulty):
        target = "0" * difficulty
        while self.hash[:difficulty] != target:
            self.nonce += 1
            self.hash = self.calculate_hash()
        return self.hash

    def to_dict(self):
        return {
            "index": self.index,
            "transactions": [tx.to_dict() if hasattr(tx, 'to_dict') else tx for tx in self.transactions],
            "timestamp": self.timestamp,
            "previous_hash": self.previous_hash,
            "hash": self.hash,
            "nonce": self.nonce
        }

class Vote:
    def __init__(self, voter_id, candidate, election_id, timestamp):
        self.voter_id = voter_id
        self.candidate = candidate
        self.election_id = election_id
        self.timestamp = timestamp
        self.hash = self.calculate_hash()

    def calculate_hash(self):
        vote_string = json.dumps({
            "voter_id": self.voter_id,
            "candidate": self.candidate,
            "election_id": self.election_id,
            "timestamp": self.timestamp
        }, sort_keys=True)
        return hashlib.sha256(vote_string.encode()).hexdigest()

    def to_dict(self):
        return {
            "voter_id": self.voter_id,
            "candidate": self.candidate,
            "election_id": self.election_id,
            "timestamp": self.timestamp,
            "hash": self.hash
        }

class Blockchain:
    def __init__(self, election_id):
        self.election_id = election_id
        self.chain = [self.create_genesis_block()]
        self.difficulty = 2
        self.pending_transactions = []

    def create_genesis_block(self):
        return Block(0, [], time.time(), "0")

    def get_latest_block(self):
        return self.chain[-1]

    def mine_pending_transactions(self):
        if self.pending_transactions:
            block = Block(len(self.chain), self.pending_transactions, time.time(), self.get_latest_block().hash)
            block.mine_block(self.difficulty)
            self.chain.append(block)
            self.pending_transactions = []
            return True
        return False

    def add_vote(self, vote):
        # Check if voter has already voted in this election
        for block in self.chain:
            for transaction in block.transactions:
                if hasattr(transaction, 'voter_id') and transaction.voter_id == vote.voter_id:
                    return False
        self.pending_transactions.append(vote)
        return True

    def is_chain_valid(self):
        for i in range(1, len(self.chain)):
            current_block = self.chain[i]
            previous_block = self.chain[i-1]

            if current_block.hash != current_block.calculate_hash():
                return False

            if current_block.previous_hash != previous_block.hash:
                return False
        return True

    def get_all_votes(self):
        votes = []
        for block in self.chain:
            for transaction in block.transactions:
                if hasattr(transaction, 'to_dict'):
                    votes.append(transaction.to_dict())
                else:
                    votes.append(transaction)
        return votes

    def get_votes_by_candidate(self):
        votes = self.get_all_votes()
        result = {}
        for vote in votes:
            if isinstance(vote, dict) and 'candidate' in vote:
                candidate = vote['candidate']
                if candidate in result:
                    result[candidate] += 1
                else:
                    result[candidate] = 1
        return result

class Election:
    def __init__(self, election_id, name, candidates, start_time, end_time, status="upcoming"):
        self.election_id = election_id
        self.name = name
        self.candidates = candidates
        self.start_time = start_time
        self.end_time = end_time
        self.status = status
        self.blockchain = Blockchain(election_id)
        self.approved_voters = set()

# Helper functions
def get_election_status(election):
    now = time.time()
    if election.status == "suspended":
        return "suspended"
    elif now < election.start_time:
        return "upcoming"
    elif now > election.end_time:
        return "completed"
    else:
        return "active"

# Routes
@app.route('/elections', methods=['GET'])
def get_elections():
    try:
        elections_list = []
        for election_id, election in elections.items():
            elections_list.append({
                'election_id': election.election_id,
                'name': election.name,
                'candidates': election.candidates,
                'start_time': election.start_time,
                'end_time': election.end_time,
                'status': get_election_status(election),
                'voter_count': len(election.approved_voters)
            })
        return jsonify(elections_list), 200
    except Exception as e:
        return jsonify({"message": f"Server error: {str(e)}"}), 500

@app.route('/create_election', methods=['POST'])
def create_election():
    try:
        data = request.get_json()
        
        if 'admin_key' not in data or data['admin_key'] != admin_key:
            return jsonify({"message": "Invalid admin key"}), 401
        
        required_fields = ['election_id', 'name', 'candidates', 'duration_hours']
        if not all(field in data for field in required_fields):
            return jsonify({"message": "Missing required fields"}), 400
        
        election_id = data['election_id']
        if election_id in elections:
            return jsonify({"message": "Election ID already exists"}), 400
        
        start_time = time.time()
        end_time = start_time + (data['duration_hours'] * 3600)
        
        election = Election(
            election_id=election_id,
            name=data['name'],
            candidates=data['candidates'],
            start_time=start_time,
            end_time=end_time,
            status="upcoming"
        )
        
        elections[election_id] = election
        return jsonify({"message": "Election created successfully"}), 201
        
    except Exception as e:
        return jsonify({"message": f"Server error: {str(e)}"}), 500

@app.route('/manage_election', methods=['POST'])
def manage_election():
    try:
        data = request.get_json()
        
        if 'admin_key' not in data or data['admin_key'] != admin_key:
            return jsonify({"message": "Invalid admin key"}), 401
        
        if 'election_id' not in data or 'action' not in data:
            return jsonify({"message": "Missing election_id or action"}), 400
        
        election_id = data['election_id']
        if election_id not in elections:
            return jsonify({"message": "Election not found"}), 404
        
        election = elections[election_id]
        action = data['action']
        
        if action == 'start':
            election.status = "active"
            election.start_time = time.time()
        elif action == 'stop':
            election.status = "completed"
            election.end_time = time.time()
        elif action == 'suspend':
            election.status = "suspended"
        elif action == 'resume':
            election.status = "active"
        else:
            return jsonify({"message": "Invalid action"}), 400
        
        return jsonify({"message": f"Election {action}ed successfully"}), 200
        
    except Exception as e:
        return jsonify({"message": f"Server error: {str(e)}"}), 500

@app.route('/approve_voter', methods=['POST'])
def approve_voter():
    try:
        data = request.get_json()
        
        if 'admin_key' not in data or data['admin_key'] != admin_key:
            return jsonify({"message": "Invalid admin key"}), 401
        
        if 'voter_id' not in data or 'election_id' not in data:
            return jsonify({"message": "Missing voter_id or election_id"}), 400
        
        voter_id = data['voter_id']
        election_id = data['election_id']
        
        # Hash the voter ID
        voter_hash = hashlib.sha256(voter_id.encode()).hexdigest()
        
        if election_id not in elections:
            return jsonify({"message": "Election not found"}), 404
        
        # Check if voter is registered
        if voter_hash not in registered_voters:
            return jsonify({"message": "Voter not found. Please register first."}), 404
        
        # Update voter status to Active (only if not already active)
        if registered_voters[voter_hash]['status'] == 'Pending':
            registered_voters[voter_hash]['status'] = 'Active'
        
        # Add voter to approved voters for the election
        elections[election_id].approved_voters.add(voter_hash)
        
        return jsonify({
            "message": f"Voter approved for {election_id} successfully",
            "voter_hash": voter_hash,
            "status": registered_voters[voter_hash]['status'],
            "approved_for": election_id
        }), 200
        
    except Exception as e:
        return jsonify({"message": f"Server error: {str(e)}"}), 500
@app.route('/vote', methods=['POST'])
def add_vote():
    try:
        data = request.get_json()
        required_fields = ['voter_id', 'candidate', 'election_id']
        
        if not all(field in data for field in required_fields):
            return jsonify({"message": "Missing fields"}), 400
        
        voter_id_hash = hashlib.sha256(data['voter_id'].encode()).hexdigest()
        election_id = data['election_id']
        
        if election_id not in elections:
            return jsonify({"message": "Election not found"}), 404
        
        election = elections[election_id]
        
        # Check election status
        status = get_election_status(election)
        if status != "active":
            return jsonify({"message": f"Election is {status}. Cannot vote."}), 400
        
        # Check voter approval
        if voter_id_hash not in election.approved_voters:
            return jsonify({"message": "Voter not approved for this election"}), 400
        
        # Check candidate validity
        if data['candidate'] not in election.candidates:
            return jsonify({"message": "Invalid candidate"}), 400
        
        # Create and add vote
        vote = Vote(voter_id_hash, data['candidate'], election_id, time.time())
        success = election.blockchain.add_vote(vote)
        
        if success:
            # Mine the block
            election.blockchain.mine_pending_transactions()
            return jsonify({"message": "Vote added successfully"}), 201
        else:
            return jsonify({"message": "Voter has already voted in this election"}), 400
            
    except Exception as e:
        return jsonify({"message": f"Server error: {str(e)}"}), 500

@app.route('/results/<election_id>', methods=['GET'])
def get_results(election_id):
    try:
        if election_id not in elections:
            return jsonify({"message": "Election not found"}), 404
        
        election = elections[election_id]
        results = election.blockchain.get_votes_by_candidate()
        return jsonify(results), 200
        
    except Exception as e:
        return jsonify({"message": f"Server error: {str(e)}"}), 500

@app.route('/chain/<election_id>', methods=['GET'])
def get_chain(election_id):
    try:
        if election_id not in elections:
            return jsonify({"message": "Election not found"}), 404
        
        election = elections[election_id]
        chain_data = [block.to_dict() for block in election.blockchain.chain]
        return jsonify({
            "chain": chain_data,
            "length": len(chain_data),
            "election_id": election_id,
            "election_name": election.name
        }), 200
        
    except Exception as e:
        return jsonify({"message": f"Server error: {str(e)}"}), 500

@app.route('/voters', methods=['GET'])
def get_voters():
    try:
        voters_list = []
        for voter_hash, voter_info in registered_voters.items():
            voters_list.append({
                'hashed_id': voter_hash,
                'original_id': voter_info['original_id'],
                'name': voter_info['name'],
                'email': voter_info['email'],
                'place': voter_info['place'],
                'age': voter_info['age'],
                'status': voter_info['status']
            })
        return jsonify(voters_list), 200
        
    except Exception as e:
        return jsonify({"message": f"Server error: {str(e)}"}), 500

@app.route('/register_voter', methods=['POST'])
def register_voter_self():
    try:
        data = request.get_json()
        required_fields = ['id', 'name', 'email', 'place', 'age']
        missing_fields = [field for field in required_fields if field not in data or not data[field]]
        
        if missing_fields:
            return jsonify({"message": f"Missing required fields: {', '.join(missing_fields)}"}), 400
        
        voter_id_hash = hashlib.sha256(data['id'].encode()).hexdigest()
        
        if voter_id_hash in registered_voters:
            return jsonify({"message": "Voter ID already registered"}), 400
        
        registered_voters[voter_id_hash] = {
            'original_id': data['id'],
            'name': data['name'],
            'email': data['email'],
            'place': data['place'],
            'age': data['age'],
            'status': 'Pending'
        }
        
        return jsonify({
            "message": "Registration submitted successfully. Waiting for admin approval.",
            "hashed_id": voter_id_hash
        }), 201
        
    except Exception as e:
        return jsonify({"message": f"Server error: {str(e)}"}), 500

@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({"status": "healthy", "timestamp": time.time()}), 200

if __name__ == '__main__':
    print("Starting Flask server on port 5000...")
    print("Available endpoints:")
    print("  GET  /health - Health check")
    print("  GET  /elections - List all elections")
    print("  POST /create_election - Create new election")
    print("  POST /manage_election - Manage election status")
    print("  POST /approve_voter - Approve voter for election")
    print("  POST /vote - Cast a vote")
    print("  GET  /results/<election_id> - Get election results")
    print("  GET  /chain/<election_id> - Get blockchain data")
    print("  GET  /voters - Get all registered voters")
    print("  POST /register_voter - Register new voter")
    
    app.run(host='0.0.0.0', port=5000, debug=True)