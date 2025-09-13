from flask import Flask, request, jsonify
from flask_cors import CORS
import time
import hashlib
import json
from datetime import datetime
from db import get_db_connection
from otp_utils import generate_and_store_otp, verify_otp

app = Flask(__name__)
CORS(app)

# Global storage
elections = None
registered_voters = None
admin_key = "admin123"

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

# Helper functions for DB access

def get_elections_from_db():
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute('SELECT * FROM elections')
    rows = cursor.fetchall()
    cursor.close()
    conn.close()
    return rows

def get_voters_from_db():
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute('SELECT * FROM voters')
    rows = cursor.fetchall()
    cursor.close()
    conn.close()
    return rows

def save_block_to_db(election_id, block):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('''INSERT INTO blocks (election_id, block_index, timestamp, previous_hash, hash, nonce) VALUES (%s, %s, %s, %s, %s, %s)''',
        (election_id, block.index, block.timestamp, block.previous_hash, block.hash, block.nonce))
    block_id = cursor.lastrowid
    # Save transactions for this block
    for tx in block.transactions:
        # Find vote id by hash
        cursor.execute('SELECT id FROM votes WHERE hash=%s', (tx.hash,))
        vote_row = cursor.fetchone()
        if vote_row:
            vote_id = vote_row[0]
            cursor.execute('INSERT INTO block_transactions (block_id, vote_id) VALUES (%s, %s)', (block_id, vote_id))
    conn.commit()
    cursor.close()
    conn.close()

# Routes
@app.route('/elections', methods=['GET'])
def get_elections():
    try:
        elections_list = []
        for row in get_elections_from_db():
            candidates = json.loads(row['candidates']) if row['candidates'] else []
            elections_list.append({
                'election_id': row['election_id'],
                'name': row['name'],
                'candidates': candidates,
                'start_time': row['start_time'],
                'end_time': row['end_time'],
                'status': row['status'],
                'voter_count': 0  # Will update with real count later
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
        # Check if election exists in DB
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute('SELECT * FROM elections WHERE election_id=%s', (election_id,))
        if cursor.fetchone():
            cursor.close()
            conn.close()
            return jsonify({"message": "Election ID already exists"}), 400
        start_time = time.time()
        end_time = start_time + (data['duration_hours'] * 3600)
        candidates_json = json.dumps(data['candidates'])
        cursor.execute('''INSERT INTO elections (election_id, name, candidates, start_time, end_time, status) VALUES (%s, %s, %s, %s, %s, %s)''',
            (election_id, data['name'], candidates_json, start_time, end_time, "upcoming"))
        conn.commit()
        cursor.close()
        conn.close()
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
        action = data['action']
        # Fetch election from DB
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute('SELECT * FROM elections WHERE election_id=%s', (election_id,))
        election = cursor.fetchone()
        if not election:
            cursor.close()
            conn.close()
            return jsonify({"message": "Election not found"}), 404
        # Update status and times
        if action == 'start':
            new_status = "active"
            new_start_time = time.time()
            cursor.execute('UPDATE elections SET status=%s, start_time=%s WHERE election_id=%s', (new_status, new_start_time, election_id))
        elif action == 'stop':
            new_status = "completed"
            new_end_time = time.time()
            cursor.execute('UPDATE elections SET status=%s, end_time=%s WHERE election_id=%s', (new_status, new_end_time, election_id))
        elif action == 'suspend':
            new_status = "suspended"
            cursor.execute('UPDATE elections SET status=%s WHERE election_id=%s', (new_status, election_id))
        elif action == 'resume':
            new_status = "active"
            cursor.execute('UPDATE elections SET status=%s WHERE election_id=%s', (new_status, election_id))
        else:
            cursor.close()
            conn.close()
            return jsonify({"message": "Invalid action"}), 400
        conn.commit()
        cursor.close()
        conn.close()
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
        voter_hash = hashlib.sha256(voter_id.encode()).hexdigest()
        # Check if voter exists in DB
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute('SELECT * FROM voters WHERE hashed_id=%s', (voter_hash,))
        voter = cursor.fetchone()
        if not voter:
            cursor.close()
            conn.close()
            return jsonify({"message": "Voter not found. Please register first."}), 404
        # Update voter status to Active
        if voter['status'] == 'Pending':
            cursor.execute('UPDATE voters SET status=%s WHERE hashed_id=%s', ('Active', voter_hash))
            conn.commit()
        # Optionally, store approval in a new table if needed
        cursor.close()
        conn.close()
        return jsonify({
            "message": f"Voter approved for {election_id} successfully",
            "voter_hash": voter_hash,
            "status": 'Active',
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
        # Check if election exists in DB
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute('SELECT * FROM elections WHERE election_id=%s', (election_id,))
        election = cursor.fetchone()
        if not election:
            cursor.close()
            conn.close()
            return jsonify({"message": "Election not found"}), 404
        # Check election status
        now = time.time()
        if election['status'] == "suspended":
            status = "suspended"
        elif now < election['start_time']:
            status = "upcoming"
        elif now > election['end_time']:
            status = "completed"
        else:
            status = "active"
        if status != "active":
            cursor.close()
            conn.close()
            return jsonify({"message": f"Election is {status}. Cannot vote."}), 400
        # Check voter approval
        cursor.execute('SELECT * FROM voters WHERE hashed_id=%s AND status=%s', (voter_id_hash, 'Active'))
        voter = cursor.fetchone()
        if not voter:
            cursor.close()
            conn.close()
            return jsonify({"message": "Voter not approved for this election"}), 400
        # Check candidate validity
        candidates = json.loads(election['candidates']) if election['candidates'] else []
        if data['candidate'] not in candidates:
            cursor.close()
            conn.close()
            return jsonify({"message": "Invalid candidate"}), 400
        # Check if voter already voted in this election
        cursor.execute('SELECT * FROM votes WHERE voter_id=%s AND election_id=%s', (voter_id_hash, election_id))
        if cursor.fetchone():
            cursor.close()
            conn.close()
            return jsonify({"message": "Voter has already voted in this election"}), 400
        # Create and add vote
        vote_hash = hashlib.sha256(json.dumps({
            "voter_id": voter_id_hash,
            "candidate": data['candidate'],
            "election_id": election_id,
            "timestamp": time.time()
        }, sort_keys=True).encode()).hexdigest()
        cursor.execute('''INSERT INTO votes (voter_id, candidate, election_id, timestamp, hash) VALUES (%s, %s, %s, %s, %s)''',
            (voter_id_hash, data['candidate'], election_id, time.time(), vote_hash))
        conn.commit()
        cursor.close()
        conn.close()
        # --- Mine block and save to DB ---
        # Recreate blockchain for this election from DB
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute('SELECT * FROM blocks WHERE election_id=%s ORDER BY block_index', (election_id,))
        blocks = cursor.fetchall()
        chain = []
        for block in blocks:
            cursor.execute('''SELECT v.* FROM block_transactions bt JOIN votes v ON bt.vote_id = v.id WHERE bt.block_id=%s''', (block['id'],))
            transactions = [type('Vote', (), tx)() for tx in cursor.fetchall()]
            chain.append(Block(block['block_index'], transactions, block['timestamp'], block['previous_hash'], block['nonce']))
        # Add the new vote as a pending transaction and mine
        new_vote = Vote(voter_id_hash, data['candidate'], election_id, time.time())
        blockchain = Blockchain(election_id)
        blockchain.chain = chain if chain else [blockchain.create_genesis_block()]
        blockchain.pending_transactions = [new_vote]
        if blockchain.mine_pending_transactions():
            save_block_to_db(election_id, blockchain.chain[-1])
        cursor.close()
        conn.close()
        return jsonify({"message": "Vote added successfully"}), 201
    except Exception as e:
        return jsonify({"message": f"Server error: {str(e)}"}), 500

@app.route('/results/<election_id>', methods=['GET'])
def get_results(election_id):
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute('SELECT candidate, COUNT(*) as votes FROM votes WHERE election_id=%s GROUP BY candidate', (election_id,))
        results = {row['candidate']: row['votes'] for row in cursor.fetchall()}
        cursor.close()
        conn.close()
        return jsonify(results), 200
    except Exception as e:
        return jsonify({"message": f"Server error: {str(e)}"}), 500

@app.route('/chain/<election_id>', methods=['GET'])
def get_chain(election_id):
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute('SELECT * FROM blocks WHERE election_id=%s ORDER BY block_index', (election_id,))
        blocks = cursor.fetchall()
        chain_data = []
        for block in blocks:
            # Get transactions for this block
            cursor.execute('''SELECT v.* FROM block_transactions bt JOIN votes v ON bt.vote_id = v.id WHERE bt.block_id=%s''', (block['id'],))
            transactions = [dict(row) for row in cursor.fetchall()]
            chain_data.append({
                "index": block['block_index'],
                "transactions": transactions,
                "timestamp": block['timestamp'],
                "previous_hash": block['previous_hash'],
                "hash": block['hash'],
                "nonce": block['nonce']
            })
        cursor.close()
        conn.close()
        return jsonify({
            "chain": chain_data,
            "length": len(chain_data),
            "election_id": election_id
        }), 200
    except Exception as e:
        return jsonify({"message": f"Server error: {str(e)}"}), 500

@app.route('/voters', methods=['GET'])
def get_voters():
    try:
        voters_list = []
        for row in get_voters_from_db():
            voters_list.append({
                'hashed_id': row['hashed_id'],
                'original_id': row['original_id'],
                'name': row['name'],
                'email': row['email'],
                'place': row['place'],
                'age': row['age'],
                'status': row['status']
            })
        return jsonify(voters_list), 200
    except Exception as e:
        return jsonify({"message": f"Server error: {str(e)}"}), 500

@app.route('/register_voter', methods=['POST'])
def register_voter_self():
    try:
        data = request.get_json()
        required_fields = ['id', 'name', 'email', 'place', 'age', 'otp']
        missing_fields = [field for field in required_fields if field not in data or not data[field]]
        if missing_fields:
            return jsonify({"message": f"Missing required fields: {', '.join(missing_fields)}"}), 400
        # Verify OTP before registration
        from otp_utils import verify_otp
        if not verify_otp(data['email'], data['otp']):
            return jsonify({"message": "Invalid or expired OTP"}), 400
        voter_id_hash = hashlib.sha256(data['id'].encode()).hexdigest()
        # Check if voter exists in DB
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute('SELECT * FROM voters WHERE hashed_id=%s', (voter_id_hash,))
        if cursor.fetchone():
            cursor.close()
            conn.close()
            return jsonify({"message": "Voter ID already registered"}), 400
        cursor.execute('''INSERT INTO voters (hashed_id, original_id, name, email, place, age, status) VALUES (%s, %s, %s, %s, %s, %s, %s)''',
            (voter_id_hash, data['id'], data['name'], data['email'], data['place'], int(data['age']), 'Pending'))
        conn.commit()
        cursor.close()
        conn.close()
        return jsonify({
            "message": "Registration submitted successfully. Waiting for admin approval.",
            "hashed_id": voter_id_hash
        }), 201
    except Exception as e:
        return jsonify({"message": f"Server error: {str(e)}"}), 500

@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({"status": "healthy", "timestamp": time.time()}), 200

@app.route('/send_otp', methods=['POST'])
def send_otp():
    data = request.get_json()
    email = data.get('email')
    if not email:
        return jsonify({'message': 'Email is required'}), 400
    try:
        generate_and_store_otp(email)
        return jsonify({'message': 'OTP sent to email'}), 200
    except Exception as e:
        return jsonify({'message': f'Failed to send OTP: {str(e)}'}), 500

@app.route('/verify_otp', methods=['POST'])
def verify_otp_route():
    data = request.get_json()
    email = data.get('email')
    otp = data.get('otp')
    if not email or not otp:
        return jsonify({'message': 'Email and OTP are required'}), 400
    if verify_otp(email, otp):
        return jsonify({'message': 'OTP verified'}), 200
    else:
        return jsonify({'message': 'Invalid or expired OTP'}), 400

@app.route('/login_voter', methods=['POST'])
def login_voter():
    try:
        data = request.get_json()
        required_fields = ['id', 'otp']
        missing_fields = [field for field in required_fields if field not in data or not data[field]]
        if missing_fields:
            return jsonify({"message": f"Missing required fields: {', '.join(missing_fields)}"}), 400
        # Fetch voter by ID
        voter_id_hash = hashlib.sha256(data['id'].encode()).hexdigest()
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute('SELECT * FROM voters WHERE hashed_id=%s', (voter_id_hash,))
        voter = cursor.fetchone()
        cursor.close()
        conn.close()
        if not voter:
            return jsonify({"message": "Voter not found. Please register first."}), 404
        # Verify OTP
        from otp_utils import verify_otp
        if not verify_otp(voter['email'], data['otp']):
            return jsonify({"message": "Invalid or expired OTP"}), 400
        return jsonify({"message": "Login successful", "voter_id": voter_id_hash}), 200
    except Exception as e:
        return jsonify({"message": f"Server error: {str(e)}"}), 500

if __name__ == '__main__':
    # Automatically initialize the database tables before starting the server
    from init_db import initialize_db
    initialize_db()
    print("Database initialized.")
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
    print("  POST /send_otp - Send OTP to email")
    print("  POST /verify_otp - Verify OTP")
    print("  POST /login_voter - Login voter with OTP")
    
    app.run(host='0.0.0.0', port=5000, debug=True)