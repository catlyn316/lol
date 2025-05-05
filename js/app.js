// 初始化 GUN，使用 localStorage 作為持久化存儲
const gun = Gun({
    peers: ['https://gun-manhattan.herokuapp.com/gun'],
    localStorage: true
});

// 建立訊息集合
const messages = gun.get('messages');

// DOM 元素
const loginScreen = document.getElementById('loginScreen');
const chatScreen = document.getElementById('chatScreen');
const messagesContainer = document.getElementById('messages');
const messageInput = document.getElementById('messageInput');
const usernameInput = document.getElementById('usernameInput');
const currentUsernameSpan = document.getElementById('currentUsername');
const clearButton = document.getElementById('clearMessages');

// 用來追踪已顯示的訊息
const displayedMessages = new Set();
let currentUsername = '';

// 登入函數
function login() {
    const username = usernameInput.value.trim();
    if (!username) {
        alert('請輸入使用者名稱！');
        return;
    }

    currentUsername = username;
    currentUsernameSpan.textContent = username;
    
    // 儲存使用者名稱到 localStorage
    localStorage.setItem('chatUsername', username);
    
    // 切換介面
    loginScreen.style.display = 'none';
    chatScreen.style.display = 'block';
    
    // 載入歷史訊息
    loadMessages();
}

// 檢查是否已經登入
function checkPreviousLogin() {
    const savedUsername = localStorage.getItem('chatUsername');
    if (savedUsername) {
        usernameInput.value = savedUsername;
        login();
    }
}

// 載入訊息
function loadMessages() {
    // 清空顯示的訊息
    messagesContainer.innerHTML = '';
    displayedMessages.clear();
    
    // 重新載入所有訊息
    messages.map().once((message, id) => {
        if (message && message.text && !displayedMessages.has(message.id)) {
            displayMessage(message);
        }
    });
}

// 清除所有訊息
function clearMessages() {
    // 清除畫面上的訊息
    messagesContainer.innerHTML = '';
    displayedMessages.clear();
    
    // 清除 GUN 資料庫中的訊息
    messages.map().once((message, id) => {
        if (message) {
            messages.get(id).put(null);
        }
    });
}

// 發送訊息函數
function sendMessage() {
    const text = messageInput.value.trim();
    if (!text) return;

    // 建立訊息物件
    const message = {
        text: text,
        username: currentUsername,
        timestamp: Date.now(),
        id: Math.random().toString(36).substr(2, 9)
    };

    // 儲存訊息到 GUN
    messages.get(message.id).put(message);
    
    // 清空輸入框
    messageInput.value = '';
}

// 訊息顯示函數
function displayMessage(message) {
    // 檢查訊息是否已經顯示過
    if (!message.id || displayedMessages.has(message.id)) {
        return;
    }

    // 將訊息ID加入已顯示集合
    displayedMessages.add(message.id);

    const div = document.createElement('div');
    div.className = 'message';
    
    const usernameSpan = document.createElement('span');
    usernameSpan.className = 'message-username';
    usernameSpan.textContent = message.username || '匿名';
    
    const textSpan = document.createElement('span');
    textSpan.className = 'message-text';
    textSpan.textContent = message.text;

    div.appendChild(usernameSpan);
    div.appendChild(textSpan);
    messagesContainer.appendChild(div);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

// 事件監聽
messageInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        sendMessage();
    }
});

clearButton.addEventListener('click', clearMessages);

// 監聽新訊息
messages.map().on(function(message, id) {
    if (message && message.text && message.id) {
        displayMessage(message);
    }
});

// 頁面載入時檢查登入狀態
checkPreviousLogin();