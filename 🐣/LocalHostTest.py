# Import the necessary library
from openai import OpenAI

# Point to the local server
client = OpenAI(base_url="http://localhost:1234/v1", api_key="not-needed")

def send_message(system_message, user_message):
    completion = client.chat.completions.create(
        model="local-model",  # this field is currently unused but included for compatibility
        messages=[
            {"role": "system", "content": system_message},
            {"role": "user", "content": user_message}
        ],
        temperature=0.5,
        top_p=.9,
    )
    return completion.choices[0].message.content


# Example interaction
system_instructions = "You are Rodney the AI Chatbot Extension."
user_input = "Introduce yourself."

# Sending message and receiving response
chatbot_response = send_message(system_instructions, user_input)

# Print the chatbot's response
print(f"\nRodney: {chatbot_response}")

while True:
    user_input = input("\nYou: ")
    if user_input.lower() in ['exit', 'quit']:
        print("Chatbot session ended.")
        break
    chatbot_response = send_message("You are Rodney the AI Chatbot Extension. Identify the task below and help the user find the information you're looking for", user_input)  # Assuming send_message handles the interaction
    print(f"\nRodney: {chatbot_response}")  # Focus on .content to exclude PREFIX/SUFFIX

