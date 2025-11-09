(function() {
  const apiKey = '';
  const systemMessage = 'You are Donald Duck.';
  const style = document.createElement('style');
  style.textContent = `
    #chatbot-container { position: fixed; bottom: 20px; right: 20px; z-index: 1000; }
    #chatbot-button { background: #007bff; color: white; border: none; border-radius: 50%; width: 60px; height: 60px; cursor: pointer; font-size: 24px; box-shadow: 0 2px 10px rgba(0,0,0,0.2); display: flex; align-items: center; justify-content: center; }
    #chatbot-popup { display: none; position: absolute; bottom: 70px; right: 0; width: 350px; height: 400px; background: white; border-radius: 10px; box-shadow: 0 4px 20px rgba(0,0,0,0.2); flex-direction: column; overflow: hidden; }
    #chatbot-header { background: #007bff; color: white; padding: 10px 15px; font-size: 16px; }
    #chatbot-messages { flex: 1; padding: 15px; overflow-y: auto; }
    #chatbot-input { display: flex; padding: 10px; border-top: 1px solid #eee; }
    #chatbot-input input { flex: 1; padding: 8px; border: 1px solid #ddd; border-radius: 4px; }
    #chatbot-input button { margin-left: 8px; padding: 8px 12px; background: #007bff; color: white; border: none; border-radius: 4px; cursor: pointer; }
    .message { margin-bottom: 10px; padding: 8px 12px; border-radius: 18px; max-width: 80%; }
    .user-message { background: #e9ecef; margin-left: auto; }
    .bot-message { background: #007bff; color: white; margin-right: auto; }
    .thinking { display: flex; align-items: center; padding: 8px 12px; }
    .thinking-dot { width: 8px; height: 8px; background: #007bff; border-radius: 50%; margin: 0 3px; animation: bounce 1.5s infinite; }
    .thinking-dot:nth-child(2) { animation-delay: 0.2s; }
    .thinking-dot:nth-child(3) { animation-delay: 0.4s; }
    @keyframes bounce { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-5px); } }
  `;
  document.head.appendChild(style);

  const container = document.createElement('div');
  container.id = 'chatbot-container';
  container.innerHTML = `
    <button id="chatbot-button">💬</button>
    <div id="chatbot-popup">
      <div id="chatbot-header">Chat Assistant</div>
      <div id="chatbot-messages"></div>
      <div id="chatbot-input">
        <input type="text" id="chatbot-input-field" placeholder="Type your message...">
        <button id="chatbot-send">Send</button>
      </div>
    </div>
  `;
  document.body.appendChild(container);

  const button = document.getElementById('chatbot-button');
  const popup = document.getElementById('chatbot-popup');
  const messages = document.getElementById('chatbot-messages');
  const inputField = document.getElementById('chatbot-input-field');
  const sendButton = document.getElementById('chatbot-send');

  button.addEventListener('click', () => {
    popup.style.display = popup.style.display === 'flex' ? 'none' : 'flex';
    if (popup.style.display === 'flex') inputField.focus();
  });

  function addMessage(text, isUser = false) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${isUser ? 'user-message' : 'bot-message'}`;
    messageDiv.textContent = text;
    messages.appendChild(messageDiv);
    messages.scrollTop = messages.scrollHeight;
  }

  function addThinkingIndicator() {
    const thinkingDiv = document.createElement('div');
    thinkingDiv.className = 'thinking';
    thinkingDiv.id = 'thinking-indicator';
    thinkingDiv.innerHTML = '<div class="thinking-dot"></div><div class="thinking-dot"></div><div class="thinking-dot"></div>';
    messages.appendChild(thinkingDiv);
    messages.scrollTop = messages.scrollHeight;
  }

  function removeThinkingIndicator() {
    const indicator = document.getElementById('thinking-indicator');
    if (indicator) indicator.remove();
  }

  async function getChatCompletion(userMessage) {
    addMessage(userMessage, true);
    addThinkingIndicator();

    try {
      const response = await fetch('https://text.pollinations.ai/openai', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: 'openai',
          messages: [
            { role: 'system', content: systemMessage },
            { role: 'user', content: userMessage }
          ],
          stream: true
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let fullResponse = '';
      const botMessage = document.createElement('div');
      botMessage.className = 'message bot-message';
      messages.appendChild(botMessage);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') continue;
            try {
              // Handle incomplete JSON chunks by parsing carefully
              if (data.trim() !== '') {
                const parsed = JSON.parse(data);
                const content = parsed.choices[0]?.delta?.content;
                if (content) {
                  fullResponse += content;
                  botMessage.textContent = fullResponse;
                  messages.scrollTop = messages.scrollHeight;
                }
              }
            } catch (e) {
              // If parsing fails, try to extract content from partial data
              if (data.includes('"content":')) {
                try {
                  // Extract content manually from the chunk
                  const contentMatch = data.match(/"content":"([^"]*)"/);
                  if (contentMatch && contentMatch[1]) {
                    const content = contentMatch[1];
                    fullResponse += content;
                    botMessage.textContent = fullResponse;
                    messages.scrollTop = messages.scrollHeight;
                  }
                } catch (innerError) {
                  console.error('Error extracting content:', innerError);
                }
              }
            }
          }
        }
      }
      removeThinkingIndicator();
    } catch (error) {
      removeThinkingIndicator();
      addMessage('Error: Could not get response. Please check your API key and try again.');
      console.error('Error:', error);
    }
  }

  sendButton.addEventListener('click', () => {
    const message = inputField.value.trim();
    if (message) {
      getChatCompletion(message);
      inputField.value = '';
    }
  });

  inputField.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') sendButton.click();
  });

  // Public API
  window.Chatbot = {
    setApiKey: (key) => { apiKey = key; },
    setSystemMessage: (message) => { systemMessage = message; }
  };
})();
