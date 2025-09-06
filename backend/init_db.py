import mysql.connector
from db import get_db_connection

def initialize_db():
    conn = get_db_connection()
    cursor = conn.cursor()
    # Create elections table with election_id as VARCHAR(255) PRIMARY KEY
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS elections (
            election_id VARCHAR(255) PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            candidates TEXT NOT NULL,
            start_time DOUBLE NOT NULL,
            end_time DOUBLE NOT NULL,
            status VARCHAR(50) NOT NULL
        )
    ''')
    # Create voters table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS voters (
            hashed_id VARCHAR(255) PRIMARY KEY,
            original_id VARCHAR(255) NOT NULL,
            name VARCHAR(255) NOT NULL,
            email VARCHAR(255) NOT NULL,
            place VARCHAR(255) NOT NULL,
            age INT NOT NULL,
            status VARCHAR(50) NOT NULL
        )
    ''')
    # Create votes table with election_id as VARCHAR(255)
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS votes (
            id INT AUTO_INCREMENT PRIMARY KEY,
            voter_id VARCHAR(255) NOT NULL,
            candidate VARCHAR(255) NOT NULL,
            election_id VARCHAR(255) NOT NULL,
            timestamp DOUBLE NOT NULL,
            hash VARCHAR(255) NOT NULL,
            FOREIGN KEY (election_id) REFERENCES elections(election_id),
            FOREIGN KEY (voter_id) REFERENCES voters(hashed_id)
        )
    ''')
    # Create blocks table with election_id as VARCHAR(255)
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS blocks (
            id INT AUTO_INCREMENT PRIMARY KEY,
            election_id VARCHAR(255) NOT NULL,
            block_index INT NOT NULL,
            timestamp DOUBLE NOT NULL,
            previous_hash VARCHAR(255) NOT NULL,
            hash VARCHAR(255) NOT NULL,
            nonce INT NOT NULL,
            FOREIGN KEY (election_id) REFERENCES elections(election_id)
        )
    ''')
    # Create block_transactions table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS block_transactions (
            block_id INT NOT NULL,
            vote_id INT NOT NULL,
            FOREIGN KEY (block_id) REFERENCES blocks(id),
            FOREIGN KEY (vote_id) REFERENCES votes(id)
        )
    ''')
    conn.commit()
    cursor.close()
    conn.close()

if __name__ == "__main__":
    initialize_db()
    print("Database initialized.")
