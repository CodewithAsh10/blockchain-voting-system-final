from .block import Block
from .vote import Vote
import time

class Blockchain:
    def __init__(self):
        self.chain = [self.create_genesis_block()]
        self.difficulty = 2
        self.pending_transactions = []
        self.mining_reward = 0  # No cryptocurrency involved

    def create_genesis_block(self):
        return Block(0, [], time.time(), "0")

    def get_latest_block(self):
        return self.chain[-1]

    def mine_pending_transactions(self):
        block = Block(len(self.chain), self.pending_transactions, time.time(), self.get_latest_block().hash)
        block.mine_block(self.difficulty)
        self.chain.append(block)
        self.pending_transactions = []

    def add_vote(self, vote):
        # Check if voter has already voted
        for block in self.chain:
            for transaction in block.transactions:
                if transaction.voter_id == vote.voter_id:
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
                votes.append(transaction)
        return votes

    def get_votes_by_candidate(self):
        votes = self.get_all_votes()
        result = {}
        for vote in votes:
            if vote.candidate in result:
                result[vote.candidate] += 1
            else:
                result[vote.candidate] = 1
        return result