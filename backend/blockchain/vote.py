import hashlib
import json

class Vote:
    def __init__(self, voter_id, candidate, timestamp):
        self.voter_id = voter_id
        self.candidate = candidate
        self.timestamp = timestamp
        self.hash = self.calculate_hash()

    def calculate_hash(self):
        vote_string = json.dumps({
            "voter_id": self.voter_id,
            "candidate": self.candidate,
            "timestamp": self.timestamp
        }, sort_keys=True)
        return hashlib.sha256(vote_string.encode()).hexdigest()

    def to_dict(self):
        return {
            "voter_id": self.voter_id,
            "candidate": self.candidate,
            "timestamp": self.timestamp,
            "hash": self.hash
        }