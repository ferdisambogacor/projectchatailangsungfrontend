/**
 * Ghost AI - Main JavaScript
 * Menggabungkan tampilan dari ghostjokefix dengan fitur multi-model AI
 */

// Configuration
const CONFIG = {
  // API key for OpenRouter - Free tier key (rate limited)
  apiKey: "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",

  // API endpoint
  apiEndpoint: "https://openrouter.ai/api/v1/chat/completions",

  // Default model
  defaultModel: {
    id: "meta-llama/llama-3.1-8b-instruct:free",
    name: "Llama-3.1-8B-Instruct"
  },

  // Model categories with descriptions
  modelDescriptions: {
    "mini": {
      description: "Very small model optimized for speed and efficiency. Perfect for quick tasks that don't require deep understanding.",
      strengths: ["Very fast responses", "Low resource usage", "Good for simple tasks"]
    },
    "small": {
      description: "Small language model with good balance between speed and capability. Perfect for everyday use with fast responses and good context understanding.",
      strengths: ["Fast responses", "Good context", "General purpose"]
    },
    "medium": {
      description: "Medium-sized models with better reasoning and understanding capabilities. Great for more complex conversations and creative tasks.",
      strengths: ["Better reasoning", "More capabilities", "High quality responses"]
    },
    "large": {
      description: "Large language models with advanced capabilities and deeper understanding. Excellent for complex reasoning and specialized knowledge.",
      strengths: ["Advanced reasoning", "Deep understanding", "Complex tasks"]
    },
    "xlarge": {
      description: "Extra large models with state-of-the-art capabilities. The best choice for the most demanding tasks requiring advanced reasoning.",
      strengths: ["Premium quality", "Cutting edge", "Most capable"]
    },
    "vision": {
      description: "Models with vision capabilities that can understand and reason about images. Perfect for visual tasks and multimodal interactions.",
      strengths: ["Image analysis", "Visual reasoning", "Multimodal"]
    },
    "specialized": {
      description: "Models optimized for specific domains like coding, math, or data science. Best choice for specialized technical tasks.",
      strengths: ["Domain expertise", "Specialized knowledge", "Task-specific excellence"]
    }
  },

  // Welcome message
  welcomeMessage: "Hey there! I’m Ghost AI 👻 - pick a model from the settings and let’s chat!",

  // Typewriter placeholder texts
  placeholderTexts: [
    "Ask me anything…",
    "Summarize this for me",
    "Help me write a message",
    "Explain a difficult topic",
    "Give me a list of ideas",
    "Fix grammar in this text",
    "Make this sound professional",
    "Write a story or poem",
    "Translate this to English",
    "What's the best way to start?"
  ]
};

// DOM Elements
const darkModeToggle = document.getElementById('darkModeToggle');
const chatMessages = document.getElementById('chatMessages');
const userInput = document.getElementById('userInput');
const sendButton = document.getElementById('sendButton');
const modelSelector = document.getElementById('modelSelector');
const languageSelect = document.getElementById('language');
const soundEffectsSelect = document.getElementById('soundEffects');
const errorContainer = document.getElementById('errorContainer');
const header = document.getElementById('stickyHeader');
const typingIndicator = document.getElementById('typing-indicator');
const animatedPlaceholder = document.getElementById('animated-placeholder');
const modelDescription = document.getElementById('model-description');
const modelStrengths = document.querySelector('.model-strengths');
const clearChatBtn = document.getElementById('clear-chat-btn');
const messageSentSound = document.getElementById('messageSentSound');
const messageReceivedSound = document.getElementById('messageReceivedSound');
const parallaxLayers = document.querySelectorAll('.parallax-layer');
const modelInfoContainer = document.getElementById('modelInfoContainer');
const modelSelectorGroup = document.getElementById('modelSelectorGroup');
const languageGroup = document.getElementById('languageGroup');
const soundEffectsGroup = document.getElementById('soundEffectsGroup');

// Application State
let state = {
  messages: [],
  isTyping: false,
  selectedModel: CONFIG.defaultModel,
  darkMode: localStorage.getItem('darkMode') === 'enabled',
  soundEnabled: localStorage.getItem('soundEffects') === 'on',
  language: localStorage.getItem('language') || 'en',
  loadingTimeout: null,
  settingsExpanded: {
    modelSelector: true,
    language: true,
    soundEffects: true,
    modelInfo: true
  }
};

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
  initializeDarkMode();
  initializeParallax();
  loadPreferences();
  adjustChatHeight();
  initializeTextareaAutoResize();
  setupCollapsibleSettings();

  // Pastikan elemen placeholder terlihat di awal
  if (animatedPlaceholder) {
    animatedPlaceholder.style.opacity = '0.8';
  }

  // Mulai animasi typewriter setelah halaman selesai loading
  setTimeout(() => {
    initializeTypewriterPlaceholder();
  }, 500);

  // Display welcome message
  displayWelcomeMessage();

  // Jangan fokus otomatis pada input field agar placeholder terlihat
  // userInput.focus(); -- dinonaktifkan
});

// Initialize textarea auto-resize
function initializeTextareaAutoResize() {
  userInput.setAttribute('style', 'height:' + (userInput.scrollHeight) + 'px;overflow-y:hidden;');

  userInput.addEventListener('input', function() {
    this.style.height = 'auto';
    this.style.height = (this.scrollHeight) + 'px';
  });
}

// Setup collapsible settings sections
function setupCollapsibleSettings() {
  // Add collapse/expand functionality to settings groups
  setupCollapsible(modelSelectorGroup, 'modelSelector');
  setupCollapsible(languageGroup, 'language');
  setupCollapsible(soundEffectsGroup, 'soundEffects');
  setupCollapsible(modelInfoContainer, 'modelInfo');

  // Load saved state for collapsed sections
  loadCollapsibleState();
}

// Setup individual collapsible section
function setupCollapsible(element, id) {
  if (!element) return;

  // Add collapse/expand toggle to label
  const label = element.querySelector('label, h4');
  if (label) {
    // Add toggle icon
    const icon = document.createElement('i');
    icon.className = 'fas fa-chevron-down toggle-icon';
    icon.style.marginLeft = 'auto';
    icon.style.fontSize = '14px';
    icon.style.transition = 'transform 0.3s ease';
    label.style.display = 'flex';
    label.style.alignItems = 'center';
    label.style.cursor = 'pointer';
    label.appendChild(icon);

    // Add click handler
    label.addEventListener('click', (e) => {
      // If the click was on a select element, don't toggle
      if (e.target.tagName === 'SELECT') return;

      toggleSection(element, id);
    });
  }

  // Initially apply collapsed state if needed
  if (!state.settingsExpanded[id]) {
    collapseSection(element);
  }
}

// Toggle section collapse/expand
function toggleSection(element, id) {
  const isExpanded = state.settingsExpanded[id];

  if (isExpanded) {
    collapseSection(element);
  } else {
    expandSection(element);
  }

  // Update state and save
  state.settingsExpanded[id] = !isExpanded;
  saveCollapsibleState();
}

// Collapse a section
function collapseSection(element) {
  const content = element.querySelector('.select-wrapper, p, .model-strengths');
  const icon = element.querySelector('.toggle-icon');

  if (content) {
    content.style.display = 'none';
  }

  if (icon) {
    icon.style.transform = 'rotate(-90deg)';
  }
}

// Expand a section
function expandSection(element) {
  const content = element.querySelector('.select-wrapper, p, .model-strengths');
  const icon = element.querySelector('.toggle-icon');

  if (content) {
    content.style.display = '';
  }

  if (icon) {
    icon.style.transform = 'rotate(0)';
  }
}

// Save collapsed state to localStorage
function saveCollapsibleState() {
  localStorage.setItem('settingsExpanded', JSON.stringify(state.settingsExpanded));
}

// Load collapsed state from localStorage
function loadCollapsibleState() {
  // Set default state to be collapsed (all false)
  const defaultState = {
    modelSelector: false,
    language: false,
    soundEffects: false,
    modelInfo: false
  };

  const saved = localStorage.getItem('settingsExpanded');
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      state.settingsExpanded = parsed;
    } catch (e) {
      console.error('Error parsing saved settings state', e);
      state.settingsExpanded = defaultState;
    }
  } else {
    // If no saved state, use default collapsed state
    state.settingsExpanded = defaultState;
  }

  // Always apply current states
  if (!state.settingsExpanded.modelSelector) collapseSection(modelSelectorGroup);
  if (!state.settingsExpanded.language) collapseSection(languageGroup);
  if (!state.settingsExpanded.soundEffects) collapseSection(soundEffectsGroup);
  if (!state.settingsExpanded.modelInfo) collapseSection(modelInfoContainer);
}

// Function to display welcome message
function displayWelcomeMessage() {
  // Clear any existing messages
  chatMessages.innerHTML = '';
  state.messages = [];

  // Add the welcome message
  addBotMessage(CONFIG.welcomeMessage);
}

// Check for saved dark mode preference
function initializeDarkMode() {
  if (state.darkMode) {
    document.body.classList.add('dark-mode');
    updateDarkModeToggleText();
    updateThemeColor('#121721'); // Dark theme color
    updateSyntaxHighlightingTheme('dark');
  } else {
    document.body.classList.remove('dark-mode');
    updateDarkModeToggleText();
    updateThemeColor('#5d6af8'); // Light theme color
    updateSyntaxHighlightingTheme('light');
  }
}

// Update syntax highlighting theme for code blocks
function updateSyntaxHighlightingTheme(theme) {
  const darkTheme = document.getElementById('hljs-theme-dark');
  const lightTheme = document.getElementById('hljs-theme-light');

  if (theme === 'dark') {
    darkTheme.removeAttribute('disabled');
    lightTheme.setAttribute('disabled', '');
  } else {
    lightTheme.removeAttribute('disabled');
    darkTheme.setAttribute('disabled', '');
  }
}

// Update theme color meta tag for mobile
function updateThemeColor(color) {
  const metaThemeColor = document.querySelector('meta[name="theme-color"]');
  if (metaThemeColor) {
    metaThemeColor.setAttribute('content', color);
  }
}

// Ubah fungsi update dark mode toggle text
function updateDarkModeToggleText() {
  const isDarkMode = document.body.classList.contains('dark-mode');
  const icon = isDarkMode ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';
  const text = isDarkMode ? 'Light Mode' : 'Dark Mode';
  darkModeToggle.innerHTML = `${icon}<span>${text}</span>`;
}

// Load user preferences
function loadPreferences() {
  // Load language preference
  const savedLanguage = localStorage.getItem('language');
  if (savedLanguage) {
    languageSelect.value = savedLanguage;
    state.language = savedLanguage;
  }

  // Load sound effects preference
  const savedSoundEffects = localStorage.getItem('soundEffects');
  if (savedSoundEffects) {
    soundEffectsSelect.value = savedSoundEffects;
    state.soundEnabled = savedSoundEffects === 'on';
  }

  // Load model preference
  const savedModelId = localStorage.getItem('selectedModelId');
  if (savedModelId) {
    const savedModelOption = Array.from(modelSelector.options).find(option => option.value === savedModelId);
    if (savedModelOption) {
      modelSelector.value = savedModelId;
      state.selectedModel = {
        id: savedModelId,
        name: savedModelOption.text.split(' (')[0] // Extract model name without category
      };
      updateModelInfo();
    }
  }
}

// Initialize parallax effect
function initializeParallax() {
  window.addEventListener('mousemove', function(e) {
    if (window.innerWidth <= 768) return; // Don't run on mobile

    const x = e.clientX;
    const y = e.clientY;

    parallaxLayers.forEach(layer => {
      const speed = parseFloat(layer.getAttribute('data-speed') || 0.1);
      const moveX = (window.innerWidth / 2 - x) * speed * 0.5;
      const moveY = (window.innerHeight / 2 - y) * speed * 0.5;

      layer.style.transform = `translate(${moveX}px, ${moveY}px)`;
    });
  });

  // Also add scroll effect
  window.addEventListener('scroll', function() {
    const scrollY = window.scrollY;

    parallaxLayers.forEach(layer => {
      const speed = parseFloat(layer.getAttribute('data-speed') || 0.1);
      const yOffset = scrollY * speed;
      layer.style.transform = `translateY(${yOffset}px)`;
    });
  });
}

// Adjust chat height based on viewport
function adjustChatHeight() {
  const viewportHeight = window.innerHeight;
  const headerHeight = header ? header.offsetHeight : 0;
  const chatContainer = document.querySelector('.chat-container');
  const chatMessagesElement = document.querySelector('.chat-messages');
  const chatHeader = document.querySelector('.chat-header');
  const chatInput = document.querySelector('.chat-input');

  if (chatContainer && chatMessagesElement && chatHeader && chatInput) {
    const availableHeight = viewportHeight - headerHeight - 40; // 40px for margins
    const chatHeaderHeight = chatHeader.offsetHeight;
    const chatInputHeight = chatInput.offsetHeight;
    const chatMessagesHeight = availableHeight - chatHeaderHeight - chatInputHeight;

    // Set minimum height
    const minHeight = 300;
    chatMessagesElement.style.height = `${Math.max(chatMessagesHeight, minHeight)}px`;
  }
}

// Event listeners
function setupEventListeners() {
  // Toggle dark mode
  darkModeToggle.addEventListener('click', toggleDarkMode);

  // Send message with button click
  sendButton.addEventListener('click', handleSendMessage);

  // Send message with Enter key (but not with Shift+Enter)
  userInput.addEventListener('keydown', e => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  });

  // Update model when selection changes
  modelSelector.addEventListener('change', () => {
    const selectedOption = modelSelector.options[modelSelector.selectedIndex];
    state.selectedModel = {
      id: selectedOption.value,
      name: selectedOption.text.split(' (')[0] // Extract model name without category
    };

    // Save preference
    localStorage.setItem('selectedModelId', state.selectedModel.id);

    // Update UI
    updateModelInfo();

    // Add a message about model change
    addBotMessage(`Model changed to ${state.selectedModel.name}. How can I help you today?`);
  });

  // Update language preference
  languageSelect.addEventListener('change', () => {
    state.language = languageSelect.value;
    localStorage.setItem('language', state.language);

    // Add a message about language change
    const language = state.language === 'en' ? 'English' : 'Indonesian';
    addBotMessage(`Language changed to ${language}. Let's continue our conversation.`);
  });

  // Update sound effects preference
  soundEffectsSelect.addEventListener('change', () => {
    state.soundEnabled = soundEffectsSelect.value === 'on';
    localStorage.setItem('soundEffects', soundEffectsSelect.value);

    // Play sound if enabled to demonstrate
    if (state.soundEnabled) {
      playSound('messageSentSound');
    }
  });

  // Clear chat
  clearChatBtn.addEventListener('click', () => {
    // Clear chat messages
    chatMessages.innerHTML = '';
    state.messages = [];

    // Display welcome message again
    displayWelcomeMessage();
  });

  // Adjust height on window resize
  window.addEventListener('resize', () => {
    adjustChatHeight();
    initializeTextareaAutoResize();
  });

  // Make header sticky on scroll
  window.addEventListener('scroll', () => {
    if (window.scrollY > 10) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }
  });
}

// Call setup event listeners
setupEventListeners();

// Ubah fungsi toggle dark mode dengan animasi yang lebih baik
function toggleDarkMode() {
  document.body.classList.toggle('dark-mode');
  darkModeToggle.classList.add('toggle-animation');

  // Save preference to localStorage
  state.darkMode = document.body.classList.contains('dark-mode');
  localStorage.setItem('darkMode', state.darkMode ? 'enabled' : 'disabled');

  // Update theme colors
  if (state.darkMode) {
    updateThemeColor('#121721');
    updateSyntaxHighlightingTheme('dark');
  } else {
    updateThemeColor('#5d6af8');
    updateSyntaxHighlightingTheme('light');
  }

  // Update button text and icon
  updateDarkModeToggleText();

  // Play sound effect if enabled
  playSound('messageSentSound');

  // Remove animation class after animation completes
  setTimeout(() => {
    darkModeToggle.classList.remove('toggle-animation');
  }, 500);
}

// Update model info in settings panel
function updateModelInfo() {
  const modelId = state.selectedModel.id;
  let modelCategory = '';

  // Determine model category based on selection or ID
  const selectedOption = modelSelector.options[modelSelector.selectedIndex];
  const optionText = selectedOption.text;

  if (optionText.includes('(Mini)')) modelCategory = 'mini';
  else if (optionText.includes('(Small)')) modelCategory = 'small';
  else if (optionText.includes('(Medium)')) modelCategory = 'medium';
  else if (optionText.includes('(Large)')) modelCategory = 'large';
  else if (optionText.includes('(XLarge)')) modelCategory = 'xlarge';
  else if (optionText.includes('(Vision)')) modelCategory = 'vision';
  else if (optionText.includes('(Code)') || optionText.includes('(Math)') ||
          optionText.includes('(Data Science)') || optionText.includes('(Specialized)')) {
    modelCategory = 'specialized';
  }
  else modelCategory = 'small'; // Default to small if not specified

  // Update description
  if (modelDescription && CONFIG.modelDescriptions[modelCategory]) {
    modelDescription.textContent = CONFIG.modelDescriptions[modelCategory].description;
  }

  // Update strengths tags
  if (modelStrengths && CONFIG.modelDescriptions[modelCategory]) {
    modelStrengths.innerHTML = '';

    CONFIG.modelDescriptions[modelCategory].strengths.forEach(strength => {
      const tag = document.createElement('span');
      tag.className = 'strength-tag';
      tag.textContent = strength;
      modelStrengths.appendChild(tag);
    });
  }
}

// Handle sending a message or stopping AI response
function handleSendMessage() {
  // If AI is currently typing, stop the response
  if (state.isTyping) {
    stopAIResponse();
    return;
  }

  const message = userInput.value.trim();

  if (message) {
    // Add user message to chat
    addUserMessage(message);

    // Clear input field
    userInput.value = '';
    userInput.style.height = 'auto';

    // Reset textarea height
    userInput.style.height = '44px';

    // Get response from AI
    getAIResponse(message);
  }
}

// Variabel untuk controller abort fetch request
let currentController = null;

// Stop AI response
function stopAIResponse() {
  // Hide typing indicator
  hideTypingIndicator();

  // Batalkan request API yang sedang berjalan
  if (currentController) {
    currentController.abort();
    currentController = null;
  }

  // Tambahkan pesan bahwa respons dihentikan
  addBotMessage("Respons dihentikan oleh pengguna.");

  // Reset state
  state.isTyping = false;

  // Update tombol kembali ke Send
  updateSendButton();
}

// Add user message to chat
function addUserMessage(message) {
  // Create message container
  const messageContainer = document.createElement('div');
  messageContainer.className = 'message-container';

  // Create message content
  const messageContent = document.createElement('div');
  messageContent.className = 'message-content user';
  messageContent.textContent = message;

  // Assemble message
  messageContainer.appendChild(messageContent);

  // Add to chat
  chatMessages.appendChild(messageContainer);

  // Save to message history
  state.messages.push({
    role: 'user',
    content: message
  });

  // Play sound if enabled
  playSound('messageSentSound');

  // Scroll to bottom
  scrollToBottom();
}

// Add bot message to chat
function addBotMessage(message) {
  // Create message container
  const messageContainer = document.createElement('div');
  messageContainer.className = 'message-container';

  // Create message content
  const messageContent = document.createElement('div');
  messageContent.className = 'message-content bot';

  // Format message with markdown
  const formattedMessage = formatMessage(message);
  messageContent.innerHTML = formattedMessage;

  // Assemble message
  messageContainer.appendChild(messageContent);

  // Add to chat
  chatMessages.appendChild(messageContainer);

  // Save to message history
  state.messages.push({
    role: 'assistant',
    content: message
  });

  // Apply syntax highlighting to code blocks
  applyCodeHighlighting();

  // Play sound if enabled
  playSound('messageReceivedSound');

  // Scroll to bottom
  scrollToBottom();
}

// Function to update send button based on AI typing state
function updateSendButton() {
  if (state.isTyping) {
    // Change to Stop button
    sendButton.classList.add('stop-button');
    sendButton.innerHTML = `
      <span class="button-text">Stop</span>
      <i class="fas fa-stop"></i>
    `;
    sendButton.title = "Stop AI response";
  } else {
    // Change back to Send button
    sendButton.classList.remove('stop-button');
    sendButton.innerHTML = `
      <span class="button-text">Send</span>
      <i class="fas fa-paper-plane"></i>
    `;
    sendButton.title = "Send message";
  }
}

// Show the typing indicator
function showTypingIndicator() {
  state.isTyping = true;
  typingIndicator.classList.remove('hidden');
  scrollToBottom();

  // Update send button to show stop
  updateSendButton();

  // Set a timeout to clear the indicator if no response is received
  state.loadingTimeout = setTimeout(() => {
    hideTypingIndicator();
    showError('The AI is taking too long to respond. Please try again.');
  }, 30000); // 30 seconds timeout
}

// Hide the typing indicator
function hideTypingIndicator() {
  state.isTyping = false;
  typingIndicator.classList.add('hidden');

  // Update send button back to normal
  updateSendButton();

  // Clear the timeout
  if (state.loadingTimeout) {
    clearTimeout(state.loadingTimeout);
    state.loadingTimeout = null;
  }
}

// Format message with markdown and sanitize
function formatMessage(message) {
  try {
    // Convert markdown to HTML using marked library
    const rawHtml = marked.parse(message);

    // Sanitize HTML to prevent XSS using DOMPurify
    const cleanHtml = DOMPurify.sanitize(rawHtml, {
      ADD_ATTR: ['target'],
      ADD_TAGS: ['iframe'],
      ALLOWED_ATTR: ['target', 'class', 'id', 'style', 'src', 'href', 'alt', 'rel']
    });

    return cleanHtml;
  } catch (error) {
    console.error('Error formatting message:', error);
    return message;
  }
}

// Apply syntax highlighting to code blocks
function applyCodeHighlighting() {
  document.querySelectorAll('pre code').forEach((block) => {
    hljs.highlightElement(block);
  });
}

// Get the current time in HH:MM format
function getCurrentTime() {
  const now = new Date();
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
}

// Scroll chat to bottom
function scrollToBottom() {
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Show error message
function showError(message) {
  errorContainer.textContent = message;
  errorContainer.classList.add('visible');

  // Auto hide after 5 seconds
  setTimeout(() => {
    errorContainer.classList.remove('visible');
  }, 5000);
}

// Play a sound effect
function playSound(soundId) {
  if (state.soundEnabled) {
    const sound = document.getElementById(soundId);
    if (sound) {
      sound.volume = 0.5; // Set reasonable volume
      sound.currentTime = 0; // Reset to beginning
      sound.play().catch(error => console.log('Sound play error:', error));
    }
  }
}

// Get AI response from OpenRouter API
async function getAIResponse(userMessage) {
  // Hentikan request sebelumnya jika ada
  if (currentController) {
    currentController.abort();
    currentController = null;
  }

  // Show typing indicator
  showTypingIndicator();

  // Create conversation history for API
  const history = state.messages.slice(-6); // Keep last 6 messages for context

  // Create request body
  const requestBody = {
    model: state.selectedModel.id,
    messages: [
      { role: "system", content: `You are a helpful assistant. Respond in ${state.language === 'id' ? 'Indonesian' : 'English'} language.` },
      ...history
    ],
    temperature: 0.7,
    max_tokens: 1024
  };

  // Create AbortController untuk cancel request
  currentController = new AbortController();
  const signal = currentController.signal;

  try {
    const response = await fetch(CONFIG.apiEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${CONFIG.apiKey}`,
        'HTTP-Referer': window.location.origin,
        'X-Title': 'Ghost AI'
      },
      body: JSON.stringify(requestBody),
      signal: signal
    });

    // Periksa apakah controller masih sama (jika null berarti request telah dibatalkan)
    if (!currentController) {
      console.log('Request was cancelled, ignoring response');
      return;
    }

    const data = await response.json();

    // Periksa lagi apakah controller masih sama setelah parsing JSON
    if (!currentController) {
      console.log('Request was cancelled after parsing, ignoring response');
      return;
    }

    // Hide typing indicator
    hideTypingIndicator();

    // Reset controller
    currentController = null;

    if (response.ok && data.choices && data.choices[0]) {
      const aiMessage = data.choices[0].message.content;
      addBotMessage(aiMessage);
    } else {
      console.error('API Error:', data);
      showError(data.error?.message || 'Error getting response from AI. Please try again.');

      // Add fallback message
      addBotMessage("I apologize, but I'm having trouble connecting to the AI service right now. Please try again in a moment.");
    }
  } catch (error) {
    // Jika error karena request di-abort, jangan tampilkan error
    if (error.name === 'AbortError') {
      console.log('Request was aborted');
      return;
    }

    // Hide typing indicator
    hideTypingIndicator();

    // Reset controller
    currentController = null;

    console.error('Fetch Error:', error);
    showError('Network error. Please check your connection and try again.');

    // Add fallback message
    addBotMessage("I apologize, but I'm having trouble connecting to the AI service right now. Please check your internet connection and try again.");
  }
}

// Initialize typewriter placeholder effect
function initializeTypewriterPlaceholder() {
  if (!animatedPlaceholder) {
    console.error('Animated placeholder element not found');
    return;
  }

  console.log('Initializing typewriter effect');
  const placeholderTexts = CONFIG.placeholderTexts;
  let currentIndex = 0;
  let isDeleting = false;
  let text = '';
  let charIndex = 0;
  let typingSpeed = 100; // Speed in milliseconds
  let isRunning = true; // Flag to track if animation should continue

  function type() {
    // Exit if animation should stop
    if (!isRunning) return;

    const currentText = placeholderTexts[currentIndex];

    // Check if input is focused or has content
    const isInputFocused = document.activeElement === userInput;
    const hasContent = userInput && userInput.value.length > 0;

    // Only hide placeholder when input is focused or has content
    if (isInputFocused || hasContent) {
      animatedPlaceholder.style.opacity = '0';
      setTimeout(type, 500);
      return;
    }

    // Make sure the placeholder is visible and continue animation
    animatedPlaceholder.style.opacity = '0.8';

    if (isDeleting) {
      // Deleting text
      text = currentText.substring(0, charIndex - 1);
      charIndex--;
      typingSpeed = 50; // Faster when deleting
    } else {
      // Typing text
      text = currentText.substring(0, charIndex + 1);
      charIndex++;
      typingSpeed = 100; // Slower when typing
    }

    animatedPlaceholder.textContent = text;

    if (!isDeleting && charIndex === currentText.length) {
      // Finished typing, wait before deleting
      isDeleting = true;
      typingSpeed = 1500; // Pause before deleting
    } else if (isDeleting && charIndex === 0) {
      // Finished deleting, move to next text
      isDeleting = false;
      currentIndex = (currentIndex + 1) % placeholderTexts.length;
      typingSpeed = 500; // Pause before typing new text
    }

    setTimeout(type, typingSpeed);
  }

  // Start the animation dan pastikan placeholder terlihat
  setTimeout(() => {
    // Pastikan placeholder terlihat di awal
    animatedPlaceholder.style.opacity = '0.8';
    type();
  }, 1000);

  // Add event listeners to hide/show placeholder based on focus
  userInput.addEventListener('focus', () => {
    console.log('Input focused');
    animatedPlaceholder.style.opacity = '0';
  });

  userInput.addEventListener('blur', () => {
    console.log('Input blurred');
    if (userInput.value.length === 0) {
      animatedPlaceholder.style.opacity = '0.8';
      // Restart animation jika berhenti
      if (!isRunning) {
        isRunning = true;
        type();
      }
    }
  });

  // Also check for input changes
  userInput.addEventListener('input', () => {
    if (userInput.value.length > 0) {
      animatedPlaceholder.style.opacity = '0';
    } else if (document.activeElement !== userInput) {
      animatedPlaceholder.style.opacity = '0.8';
      // Restart animation jika berhenti
      if (!isRunning) {
        isRunning = true;
        type();
      }
    }
  });

  // Ensure placeholder shows when page is clicked anywhere but input
  document.addEventListener('click', (e) => {
    if (e.target !== userInput && userInput.value.length === 0) {
      userInput.blur();
      animatedPlaceholder.style.opacity = '0.8';
      // Restart animation jika berhenti
      if (!isRunning) {
        isRunning = true;
        type();
      }
    }
  });
}
