# Decentralized Blockchain Voting System
<img src="https://img.shields.io/badge/React-18.2.0-blue"> <img src="https://img.shields.io/badge/Python-3.8%252B-green"> <img src="https://img.shields.io/badge/Blockchain-Custom-orange"><p></p>
A secure, transparent voting platform built on blockchain technology.

## File Structure
<img src="https://github.com/CodewithAsh10/blockchain-voting-system-final/blob/main/frontend-new/public/WhatsApp%20Image%202025-08-31%20at%2016.12.46_e1687213.jpg">

## Features
- Voter registration with admin authentication
- Secure vote casting with cryptographic hashing
- Real-time block mining and chain validation
- Interactive blockchain explorer
- Live election results dashboard
- Double-voting prevention
- Tamper-proof audit trail

## Technology Stack
- **Frontend**: React, Bootstrap, Chart.js
- **Backend**: Python, Flask, WebSockets
- **Database**: MYSQL
- **Blockchain**: Custom Python implementation
- **Tools**: GitHub, Postman, VS Code, Figma

## Installation

### Prerequisites
- Python 3.8+
- Node.js 14+
- npm or yarn
- MySQL Server (local or cloud)

### MySQL Database Setup (For First Time Only)

This project now uses MySQL for persistent storage of all elections, voters, votes, and blockchain data.

#### MySQL Setup Steps
1. Log in to MySQL as root:
   ```
   mysql -u root -p
   ```
2. Create a database and user for the project using the main user credentials:
   ```sql
   CREATE DATABASE voting_system;
   CREATE USER 'project'@'localhost' IDENTIFIED BY 'mohit';
   GRANT ALL PRIVILEGES ON voting_system.* TO 'project'@'localhost';
   FLUSH PRIVILEGES;
   ```
3. The backend will automatically create all required tables on first run.


### Quick Start (One-Click)

After completing the MySQL setup steps above, you can start the entire project (backend servers and frontend) with a single click:

1. Double-click the `start_all.bat` file in the project root.
2. This will automatically:
   - Set up the Python virtual environment (if needed)
   - Install backend dependencies
   - Start the backend Flask server and WebSocket server
   - Install frontend dependencies and start the React app

You will see new command windows open for each server. The app will be available at [http://localhost:3000](http://localhost:3000).


### Backend Setup (Updated)
1. Navigate to the backend directory: `cd backend`
2. Create a virtual environment: `python -m venv venv`
3. Activate the virtual environment:
   - Windows: `venv\Scripts\activate`
   - macOS/Linux: `source venv/bin/activate`
4. Install dependencies: `pip install -r requirements.txt`
5. Run the DB initialization script (creates tables):
   ```
   python init_db.py
   ```
6. Run the Flask server: `python app.py`
7. In a new terminal, run the WebSocket server: `python ws_server.py`

### Frontend Setup
1. Navigate to the frontend directory: `cd frontend-new`
2. Install dependencies: `npm install`
3. Start the development server: `npm start`

## Usage
1. Access the application at `http://localhost:3000`
2. Register voters using the Admin tab (admin key: admin123)
3. Cast votes using the Vote tab
4. View results on the Dashboard
5. Explore the blockchain using the Blockchain Explorer

## Security Features
- Voter identity anonymization through cryptographic hashing
- Double-voting prevention mechanisms
- Blockchain tampering detection
- Immutable audit trail

## Project Team

- Neel Pandey : 24BCE10303
- Yash Tripathi : 24BCE10603
- Mohit Bankar : 24BCE11104
- Arsh Bakshi : 24BCE10568
- Ayush Man Singh Bhadauria : 24BCE10404


## Supervisor
Dr. Nilesh Kunhare

## Reviewer
Dr.Gaurav Soni
<p></p>
Dr.Ravi Verma

## License
This project is for educational purposes.
