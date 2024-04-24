from flask import Flask, request, jsonify
import requests
import threading

app = Flask(__name__)

@app.route('/v1/chat/completions', methods=['POST'])
def chat_completions():
    data = request.json
    messages = data['messages']
    
    response = requests.post('http://localhost:1234/v1/chat/completions', json=data)
    
    if response.status_code == 200:
        return jsonify(response.json())
    else:
        return jsonify({"error": "Failed to communicate with the local LLM server"}), 500

def start_server():
    app.run(host='0.0.0.0', port=5000)

if __name__ == '__main__':
    # Start the Flask server in a separate thread
    server_thread = threading.Thread(target=start_server)
    server_thread.start()