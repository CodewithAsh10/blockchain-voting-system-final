import os

class Config:
    SECRET_KEY = os.environ.get('SECRET_KEY') or 'dev-key-for-blockchain-voting'
    BLOCKCHAIN_DIFFICULTY = 2
    MINING_INTERVAL = 10  # seconds
    ADMIN_KEY = os.environ.get('ADMIN_KEY') or 'admin123'