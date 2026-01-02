const chatContainer = document.getElementById('chatContainer');
const chatForm = document.getElementById('chatForm');
const messageInput = document.getElementById('messageInput');
const sendButton = document.getElementById('sendButton');
const serviceName = document.getElementById('serviceName');
const welcomeMessage = document.querySelector('.welcome-message');

let messages = [];

chatForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const userMessage = messageInput.value.trim();
    if (!userMessage) return;

    // Agregar mensaje del usuario
    addMessage('user', userMessage);
    messageInput.value = '';
    sendButton.disabled = true;

    // Ocultar mensaje de bienvenida
    if (welcomeMessage) {
        welcomeMessage.classList.add('hidden');
    }

    // Agregar mensaje de asistente (vacío, se llenará con el stream)
    const assistantMessageElement = addMessage('assistant', '');
    assistantMessageElement.classList.add('streaming');

    try {
        // Agregar mensaje del usuario al array
        messages.push({ role: 'user', content: userMessage });

        // Llamar a la API
        const response = await fetch('/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ messages }),
        });

        if (!response.ok) {
            throw new Error(`Error: ${response.status}`);
        }

        // Leer el stream
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let assistantMessage = '';
        const messageContent = assistantMessageElement.querySelector('.message-content');

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value, { stream: true });
            assistantMessage += chunk;
            messageContent.textContent = assistantMessage;
            
            // Auto-scroll
            chatContainer.scrollTop = chatContainer.scrollHeight;
        }

        // Agregar mensaje completo al array
        messages.push({ role: 'assistant', content: assistantMessage });
        assistantMessageElement.classList.remove('streaming');

        // Actualizar nombre del servicio (si está disponible en los headers)
        const serviceHeader = response.headers.get('x-service');
        if (serviceHeader) {
            serviceName.textContent = `Servicio: ${serviceHeader}`;
        }

    } catch (error) {
        console.error('Error:', error);
        const errorContent = assistantMessageElement.querySelector('.message-content');
        errorContent.textContent = `Error: ${error.message}`;
        errorContent.style.color = '#e74c3c';
        assistantMessageElement.classList.remove('streaming');
    } finally {
        sendButton.disabled = false;
        messageInput.focus();
    }
});

function addMessage(role, content) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${role}`;
    
    const contentDiv = document.createElement('div');
    contentDiv.className = 'message-content';
    contentDiv.textContent = content;
    
    messageDiv.appendChild(contentDiv);
    chatContainer.appendChild(messageDiv);
    
    // Auto-scroll
    chatContainer.scrollTop = chatContainer.scrollHeight;
    
    return messageDiv;
}

// Permitir enviar con Enter (Shift+Enter para nueva línea)
messageInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        chatForm.dispatchEvent(new Event('submit'));
    }
});
