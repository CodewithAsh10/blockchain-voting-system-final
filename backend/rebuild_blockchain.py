import time
import hashlib
import json
from db import get_db_connection

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
            "transactions": [tx for tx in self.transactions],
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

def reconstruct_blockchain():
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute('SELECT election_id FROM elections')
    elections = [row['election_id'] for row in cursor.fetchall()]
    for election_id in elections:
        # Remove existing blocks and block_transactions for a clean rebuild
        cursor.execute('DELETE FROM block_transactions WHERE block_id IN (SELECT id FROM blocks WHERE election_id=%s)', (election_id,))
        cursor.execute('DELETE FROM blocks WHERE election_id=%s', (election_id,))
        # Get all votes for this election, ordered by timestamp
        cursor.execute('SELECT * FROM votes WHERE election_id=%s ORDER BY timestamp', (election_id,))
        votes = cursor.fetchall()
        chain = []
        difficulty = 2
        # Genesis block
        genesis_block = Block(0, [], time.time(), "0")
        chain.append(genesis_block)
        # Save genesis block
        cursor.execute('''INSERT INTO blocks (election_id, block_index, timestamp, previous_hash, hash, nonce) VALUES (%s, %s, %s, %s, %s, %s)''',
            (election_id, genesis_block.index, genesis_block.timestamp, genesis_block.previous_hash, genesis_block.hash, genesis_block.nonce))
        genesis_block_id = cursor.lastrowid
        # For each vote, create a block
        for i, vote in enumerate(votes):
            block = Block(i+1, [vote], vote['timestamp'], chain[-1].hash)
            block.mine_block(difficulty)
            chain.append(block)
            # Save block
            cursor.execute('''INSERT INTO blocks (election_id, block_index, timestamp, previous_hash, hash, nonce) VALUES (%s, %s, %s, %s, %s, %s)''',
                (election_id, block.index, block.timestamp, block.previous_hash, block.hash, block.nonce))
            block_id = cursor.lastrowid
            # Save block_transactions
            cursor.execute('INSERT INTO block_transactions (block_id, vote_id) VALUES (%s, %s)', (block_id, vote['id']))
    conn.commit()
    cursor.close()
    conn.close()
    print("Blockchain reconstructed and saved for all elections.")

if __name__ == "__main__":
    reconstruct_blockchain()
