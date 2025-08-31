from flask import Flask
from flask_socketio import SocketIO, emit
from blockchain.blockchain import Blockchain
import threading
import time

app = Flask(__name__)
app.config['SECRET_KEY'] = 'your_secret_key'
socketio = SocketIO(app, cors_allowed_origins="*")

blockchain = Blockchain()

def mine_blocks_periodically():
    while True:
        time.sleep(10)  # Mine every 10 seconds if there are pending transactions
        if len(blockchain.pending_transactions) > 0:
            blockchain.mine_pending_transactions()
            socketio.emit('block_mined', {
                'message': 'New block mined',
                'block_count': len(blockchain.chain)
            })

@socketio.on('connect')
def handle_connect():
    print('Client connected')
    emit('connection_response', {'data': 'Connected to voting system'})

if __name__ == '__main__':
    # Start the mining thread
    mining_thread = threading.Thread(target=mine_blocks_periodically)
    mining_thread.daemon = True
    mining_thread.start()
    
    socketio.run(app, host='0.0.0.0', port=5001, debug=True)