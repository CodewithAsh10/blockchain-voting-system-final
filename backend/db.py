import mysql.connector

# MySQL connection config for the project user
DB_CONFIG = {
    'host': 'localhost',
    'user': 'project',
    'password': 'mohit',
    'database': 'voting_system'
}

def get_db_connection():
    return mysql.connector.connect(**DB_CONFIG)
