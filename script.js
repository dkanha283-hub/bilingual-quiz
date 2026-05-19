// --- Memory State Configuration Variables ---
let rawQuestions = [];
let targetQuestions = [];
let currentIndex = 0;
let userScore = 0;
let currentTimer = null;
let timeLeft = 0;
let selectedOptionKey = null;

// --- DOM Nodes Bindings ---
const fileUploader = document.getElementById('fileUploader');
const timerInput = document.getElementById('timerInput');
const clearBtn = document.getElementById('clearBtn');
const submitBtn = document.getElementById('submitBtn');
const restartBtn = document.getElementById('restartBtn');

const uploadPrompt = document.getElementById('uploadPrompt');
const quizContainer = document.getElementById('quizContainer');
const resultContainer = document.getElementById('resultContainer');
const questionDisplayContainer = document.getElementById('questionDisplayContainer');

// Listen for global language switch adjustments live during test
document.querySelectorAll('input[name="langPref"]').forEach(radio => {
    radio.addEventListener('change', () => {
        if (targetQuestions.length > 0 && currentIndex < targetQuestions.length) {
            renderLanguageContent(); // Instantly change text language without breaking state
        }
    });
});

// --- File Resource Loading Engine ---
fileUploader.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(event) {
        try {
            const parsedData = JSON.parse(event.target.textContent || event.target.result);
            rawQuestions = Array.isArray(parsedData) ? parsedData : (parsedData.questions || []);
            
            if (rawQuestions.length > 0) {
                initializeQuiz();
            } else {
                alert("Invalid configuration template. Check JSON arrays schema syntax.");
            }
        } catch (err) {
            alert("Error reading file stream properties: " + err);
        }
    };
    reader.readAsText(file);
});

// --- Quiz State Controllers ---
function initializeQuiz() {
    currentIndex = 0;
    userScore = 0;
    
    // Deep clone array questions safely
    targetQuestions = JSON.parse(JSON.stringify(rawQuestions));
    
    const orderType = document.querySelector('input[name="orderType"]:checked').value;
    if (orderType === 'shuffled') {
        targetQuestions.sort(() => Math.random() - 0.5);
    }
    
    uploadPrompt.classList.add('hidden');
    resultContainer.classList.add('hidden');
    quizContainer.classList.remove('hidden');
    
    renderCurrentQuestion();
}

function renderCurrentQuestion() {
    clearInterval(currentTimer);
    selectedOptionKey = null;
    
    if (currentIndex >= targetQuestions.length) {
        showResults();
        return;
    }
    
    const q = targetQuestions[currentIndex];
    
    // Header progression updates
    document.getElementById('questionNum').textContent = `Question ${currentIndex + 1} of ${targetQuestions.length}`;
    document.getElementById('examTarget').textContent = q.exam ? `🎯 ${q.exam}` : '';
    
    // Call standalone function to parse selection context languages
    renderLanguageContent();
    
    // Options grid iteration mapping
    const optionsContainer = document.getElementById('optionsContainer');
    optionsContainer.innerHTML = '';
    
    Object.keys(q.options).forEach(key => {
        const optionValue = q.options[key];
        if (typeof optionValue === 'string' && optionValue.startsWith('no_option')) return;
        
        const card = document.createElement('div');
        card.className = 'option-card';
        card.innerHTML = `<strong>${key}:</strong> <span>${optionValue}</span>`;
        card.onclick = () => selectOption(card, key);
        optionsContainer.appendChild(card);
    });
    
    // Set timer values up natively
    timeLeft = parseInt(timerInput.value) || 60;
    executeRunningTimer();
}

// --- Dynamic Interface Language Switcher ---
function renderLanguageContent() {
    const q = targetQuestions[currentIndex];
    const langPref = document.querySelector('input[name="langPref"]:checked').value;
    
    questionDisplayContainer.innerHTML = '';
    
    const wrapperCard = document.createElement('div');
    wrapperCard.className = 'q-box';
    
    if (langPref === 'en') {
        wrapperCard.innerHTML = `<h3>English</h3><p class="q-text">${q.text_en}</p>`;
    } else if (langPref === 'hi') {
        wrapperCard.innerHTML = `<h3>Hindi (हिंदी)</h3><p class="q-text">${q.text_hi}</p>`;
    } else {
        // Both (Bilingual Mode) stacked inside one single viewport card block seamlessly
        wrapperCard.innerHTML = `
            <h3>English</h3>
            <p class="q-text">${q.text_en}</p>
            <div class="q-divider"></div>
            <h3>Hindi (हिंदी)</h3>
            <p class="q-text">${q.text_hi}</p>
        `;
    }
    questionDisplayContainer.appendChild(wrapperCard);
}

function selectOption(domCard, key) {
    document.querySelectorAll('.option-card').forEach(c => c.classList.remove('selected'));
    domCard.classList.add('selected');
    selectedOptionKey = key;
}

// --- Running Timer System Core ---
function executeRunningTimer() {
    const bar = document.getElementById('timerBar');
    const text = document.getElementById('timerText');
    const maxTime = parseInt(timerInput.value) || 60;
    
    function refreshLayoutView() {
        text.textContent = `${timeLeft}s`;
        const percentage = (timeLeft / maxTime) * 100;
        bar.style.width = `${percentage}%`;
        
        // Dynamic Warning Color Shift when running low on clock ticks
        if (timeLeft <= 10) {
            bar.style.backgroundColor = '#e53e3e'; // Turning bright warning crimson Red
            text.style.color = '#e53e3e';
        } else {
            bar.style.backgroundColor = '#3182ce'; // Normal accent Blue
            text.style.color = '#2b6cb0';
        }
    }
    
    refreshLayoutView();
    
    currentTimer = setInterval(() => {
        timeLeft--;
        refreshLayoutView();
        
        if (timeLeft <= 0) {
            clearInterval(currentTimer);
            processAnswerSubmission(); // Advance automatically on clock zero out
        }
    }, 1000);
}

// --- Verification & Calculation Form Logic ---
submitBtn.onclick = processAnswerSubmission;

function processAnswerSubmission() {
    clearInterval(currentTimer);
    const q = targetQuestions[currentIndex];
    
    // Clean string variants checks mapping
    if (selectedOptionKey && selectedOptionKey.toUpperCase() === q.correct_answer.toUpperCase().trim()) {
        userScore++;
    }
    
    currentIndex++;
    renderCurrentQuestion();
}

function showResults() {
    quizContainer.classList.add('hidden');
    resultContainer.classList.remove('hidden');
    
    document.getElementById('finalScore').textContent = userScore;
    document.getElementById('totalQuestions').textContent = targetQuestions.length;
    
    const accuracy = ((userScore / targetQuestions.length) * 100).toFixed(2);
    document.getElementById('accuracyText').innerHTML = `Accuracy Rate: <strong>${accuracy}%</strong>`;
}

// --- Reset Parameters Cleanup ---
clearBtn.onclick = () => {
    clearInterval(currentTimer);
    fileUploader.value = '';
    rawQuestions = [];
    quizContainer.classList.add('hidden');
    resultContainer.classList.add('hidden');
    uploadPrompt.classList.remove('hidden');
};

restartBtn.onclick = initializeQuiz;
