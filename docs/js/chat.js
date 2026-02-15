// Mogge Chatbot Widget
import { API_BASE_URL } from './config.js';

(function () {
    var MAX_HISTORY = 10;
    var STORAGE_KEY = 'mogge_chat_history';

    // Load history from sessionStorage
    var chatHistory = [];
    try {
        var stored = sessionStorage.getItem(STORAGE_KEY);
        if (stored) chatHistory = JSON.parse(stored);
    } catch (e) {}

    function saveHistory() {
        // Keep only last MAX_HISTORY messages
        if (chatHistory.length > MAX_HISTORY * 2) {
            chatHistory = chatHistory.slice(-MAX_HISTORY * 2);
        }
        try {
            sessionStorage.setItem(STORAGE_KEY, JSON.stringify(chatHistory));
        } catch (e) {}
    }

    var OPEN_KEY = 'mogge_chat_open';
    var isOpen = sessionStorage.getItem(OPEN_KEY) === 'true';

    // Build the widget HTML
    var widget = document.createElement('div');
    widget.className = 'chat-widget';
    widget.innerHTML =
        '<div class="chat-greeting" id="chat-greeting">' +
            'Hej! Jag heter Mogge \uD83D\uDC9C Kan jag hj\u00E4lpa dig?' +
        '</div>' +
        '<div class="chat-window" id="chat-window">' +
            '<div class="chat-header">' +
                '<div class="chat-avatar">\uD83D\uDC9C</div>' +
                '<div class="chat-header-info">' +
                    '<h3>Mogge</h3>' +
                    '<p><span class="chat-status"></span>Din personliga shoppingv\u00E4n</p>' +
                '</div>' +
                '<button class="chat-clear-btn" id="chat-clear" title="Rensa chatt">' +
                    '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18"/><path d="M8 6V4h8v2"/><path d="M19 6l-1 14H6L5 6"/></svg>' +
                '</button>' +
            '</div>' +
            '<div class="chat-messages" id="chat-messages">' +
                '<div class="chat-msg bot">Hej d\u00E4r! \uD83D\uDC4B Jag \u00E4r Mogge, din personliga shoppingassistent. Vad kan jag hj\u00E4lpa dig med idag? \uD83D\uDC9C</div>' +
            '</div>' +
            '<div class="chat-quick-actions" id="chat-quick-actions">' +
                '<button class="chat-quick-btn" data-msg="Vad har ni f\u00F6r nyheter?">Nyheter \u2728</button>' +
                '<button class="chat-quick-btn" data-msg="Har ni fri frakt?">Frakt \uD83D\uDE9A</button>' +
                '<button class="chat-quick-btn" data-msg="Vad rekommenderar du?">Tips \uD83D\uDCA1</button>' +
                '<button class="chat-quick-btn" data-msg="Hur returnerar jag en vara?"">Retur \uD83D\uDD04</button>' +
            '</div>' +
            '<div class="chat-input-area">' +
                '<input type="text" class="chat-input" id="chat-input" placeholder="Skriv ett meddelande..." autocomplete="off">' +
                '<button class="chat-send" id="chat-send">' +
                    '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 2L11 13"/><path d="M22 2L15 22L11 13L2 9L22 2Z"/></svg>' +
                '</button>' +
            '</div>' +
        '</div>' +
        '<button class="chat-toggle" id="chat-toggle">' +
            '<span class="chat-icon">\uD83D\uDCAC</span>' +
            '<span class="close-icon">\u2715</span>' +
        '</button>';

    document.body.appendChild(widget);

    var toggleBtn = document.getElementById('chat-toggle');
    var chatWindow = document.getElementById('chat-window');
    var greeting = document.getElementById('chat-greeting');
    var messagesEl = document.getElementById('chat-messages');
    var inputEl = document.getElementById('chat-input');
    var sendBtn = document.getElementById('chat-send');
    var quickActions = document.getElementById('chat-quick-actions');

    // Restore open state from session
    if (isOpen) {
        toggleBtn.classList.add('open');
        chatWindow.classList.add('open');
        greeting.classList.add('hidden');
        setTimeout(function () { inputEl.focus(); }, 100);
    }

    // Show greeting after 2 seconds (only if no history and not open)
    if (chatHistory.length === 0 && !isOpen) {
        setTimeout(function () {
            if (!isOpen) greeting.classList.remove('hidden');
        }, 2000);

        setTimeout(function () {
            greeting.classList.add('hidden');
        }, 10000);
    }

    // Restore previous messages from history
    if (chatHistory.length > 0) {
        // Clear default greeting
        messagesEl.innerHTML = '';

        for (var i = 0; i < chatHistory.length; i++) {
            var h = chatHistory[i];
            var type = h.role === 'user' ? 'user' : 'bot';
            var msg = document.createElement('div');
            msg.className = 'chat-msg ' + type;
            msg.textContent = h.content;
            messagesEl.appendChild(msg);
        }
        scrollToBottom();
    }

    // Toggle chat
    toggleBtn.addEventListener('click', function () {
        isOpen = !isOpen;
        toggleBtn.classList.toggle('open', isOpen);
        chatWindow.classList.toggle('open', isOpen);
        greeting.classList.add('hidden');
        sessionStorage.setItem(OPEN_KEY, isOpen ? 'true' : 'false');
        if (isOpen) inputEl.focus();
    });

    // Send message
    function sendMessage(text) {
        if (!text.trim()) return;

        // Add user message
        addMessage(text, 'user');
        chatHistory.push({ role: 'user', content: text });
        saveHistory();
        inputEl.value = '';

        // Show typing indicator
        var typing = document.createElement('div');
        typing.className = 'chat-typing visible';
        typing.innerHTML = '<span></span><span></span><span></span>';
        messagesEl.appendChild(typing);
        scrollToBottom();

        // Disable input
        inputEl.disabled = true;
        sendBtn.disabled = true;

        var token = localStorage.getItem('token');
        var headers = { 'Content-Type': 'application/json' };
        if (token) headers['Authorization'] = 'Bearer ' + token;

        fetch(API_BASE_URL + '/api/chat', {
            method: 'POST',
            headers: headers,
            body: JSON.stringify({
                message: text,
                history: chatHistory.slice(-20)
            })
        })
            .then(function (r) { return r.json(); })
            .then(function (data) {
                typing.remove();
                var reply = data.reply || 'Hmm, jag fick inget svar. Prova igen! \uD83D\uDC9C';
                addMessage(reply, 'bot');
                chatHistory.push({ role: 'assistant', content: reply });
                saveHistory();

                // Auto-navigate if action returned
                if (data.action && data.action.type === 'navigate') {
                    addMessage('\uD83D\uDC49 Jag visar dig det nu...', 'bot');
                    sessionStorage.setItem(OPEN_KEY, 'true');
                    setTimeout(function () {
                        window.location.href = data.action.url;
                    }, 1200);
                }
            })
            .catch(function () {
                typing.remove();
                addMessage('Oj, n\u00E5got gick fel! Prova igen om en stund \uD83D\uDC9C', 'bot');
            })
            .finally(function () {
                inputEl.disabled = false;
                sendBtn.disabled = false;
                inputEl.focus();
            });
    }

    function addMessage(text, type) {
        var msg = document.createElement('div');
        msg.className = 'chat-msg ' + type;
        msg.textContent = text;
        messagesEl.appendChild(msg);
        scrollToBottom();
    }

    function scrollToBottom() {
        setTimeout(function () {
            messagesEl.scrollTop = messagesEl.scrollHeight;
        }, 50);
    }

    // Events
    sendBtn.addEventListener('click', function () {
        sendMessage(inputEl.value);
    });

    inputEl.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            sendMessage(inputEl.value);
        }
    });

    // Quick action buttons
    quickActions.addEventListener('click', function (e) {
        var btn = e.target.closest('.chat-quick-btn');
        if (btn) sendMessage(btn.dataset.msg);
    });

    // Clear chat button
    document.getElementById('chat-clear').addEventListener('click', function () {
        chatHistory = [];
        sessionStorage.removeItem(STORAGE_KEY);
        messagesEl.innerHTML =
            '<div class="chat-msg bot">Hej d\u00E4r! \uD83D\uDC4B Jag \u00E4r Mogge, din personliga shoppingassistent. Vad kan jag hj\u00E4lpa dig med idag? \uD83D\uDC9C</div>';
    });
})();
