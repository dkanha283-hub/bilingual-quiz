// --- Core Console System Variables State Storage ---
let fileQuestions = [];
let examQuestions = [];
let currentIndex = 0;

let userAnswers = {}; // Format mapping: { index: { selected: 'A', status: 'answered'|'skipped'|'timeout' } }
let questionStatuses = []; // Array keeping track of structural index states: 'notvisited', 'notanswered', 'answered'

let globalCountdown = null;
let timeLeft = 0;
let questionDuration = 60; // Pulled dynamically from setup config inputs

// --- DOM Layout Selectors Bindings ---
const fileUploader = document.getElementById('fileUploader');
const questionLimitInput = document.getElementById('questionLimitInput');
const timerInput = document.getElementById('timerInput');
const langPrefSetup = document.getElementById('langPrefSetup');
const startExamBtn = document.getElementById('startExamBtn');

const configScreen = document.getElementById('configScreen');
const examConsole = document.getElementById('examConsole');
const resultScreen = document.getElementById('resultScreen');

const questionDisplayContainer = document.getElementById('questionDisplayContainer');
const optionsContainer = document.getElementById('optionsContainer');
const paletteGrid = document.getElementById('paletteGrid');
const consoleLangPref = document.getElementById('consoleLangPref');

// Enable/Disable Start button depending on loaded dataset content 
fileUploader.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function(event) {
        try {
            const data = JSON.parse(event.target.textContent || event.target.result);
            fileQuestions = Array.isArray(data) ? data : (data.questions || []);
            if (fileQuestions.length > 0) {
                startExamBtn.removeAttribute('disabled');
                questionLimitInput.max = fileQuestions.length;
                questionLimitInput.value = Math.min(20, fileQuestions.length);
            }
        } catch(e) { alert("JSON Parsing Error layout format."); }
    };
    reader.readAsText(file);
});

// --- Start Exam Orchestrator Initialization Core ---
startExamBtn.onclick = () => {
    // 1. Process Array slicing based on user question limits preference configuration
    let cloned = JSON.parse(JSON.stringify(fileQuestions));
    const orderType = document.querySelector('input[name="orderType"]:checked').value;
    if (orderType === 'shuffled') {
        cloned.sort(() => Math.random() - 0.5);
    }
    
    let limit = parseInt(questionLimitInput.value) || cloned.length;
    examQuestions = cloned.slice(0, limit);
    
    // 2. Initialize status states matrix rows maps
    questionStatuses = new Array(examQuestions.length).fill('notvisited');
    userAnswers = {};
    currentIndex = 0;
    
    // Set initial question to 'notanswered' because it is now visited
    questionStatuses[0] = 'notanswered';
    
    // Set layout display preferences mapping dropdown views
    consoleLangPref.value = langPrefSetup.value;
    questionDuration = parseInt(timerInput.value) || 60;
    
    // 3. Swap UI Panels view configurations
    configScreen.classList.add('hidden');
    examConsole.classList.remove('hidden');
    
    buildPaletteGridUI();
    renderQuestionIndex();
};

// Sync interface text updates if the layout language dropdown updates mid-test
consoleLangPref.onchange = () => { if (examQuestions.length > 0) populateQuestionText(); };

// --- Layout Grid Matrix Rendering Engine ---
function buildPaletteGridUI() {
    paletteGrid.innerHTML = '';
    examQuestions.forEach((_, idx) => {
        const cell = document.createElement('div');
        cell.className = `palette-cell cell-notvisited`;
        cell.id = `palette-cell-${idx}`;
        cell.textContent = idx + 1;
        cell.onclick = () => jumpToQuestionIndex(idx);
        paletteGrid.appendChild(cell);
    });
}

function updatePaletteMetrics() {
    let answered = 0, notanswered = 0, notvisited = 0;
    
    examQuestions.forEach((_, idx) => {
        const cell = document.getElementById(`palette-cell-${idx}`);
        if (!cell) return;
        
        const status = questionStatuses[idx];
        
        cell.className = `palette-cell cell-${status}`;
        if (idx === currentIndex) cell.classList.add('active-cell');
        
        if (status === 'answered') answered++;
        else if (status === 'notanswered') notanswered++;
        else notvisited++;
    });
    
    document.getElementById('legendAnsweredCount').textContent = answered;
    document.getElementById('legendNotAnsweredCount').textContent = notanswered;
    document.getElementById('legendNotVisitedCount').textContent = notvisited;
}

// --- Render Content Controller Core Functions ---
function renderQuestionIndex() {
    clearInterval(globalCountdown);
    
    if (currentIndex >= examQuestions.length) {
        completeExamValidation();
        return;
    }
    
    document.getElementById('questionNumTitle').textContent = `Question No. ${currentIndex + 1}`;
    document.getElementById('consoleExamTitle').textContent = examQuestions[currentIndex].exam || "RRB ONLINE EXAMINATION MASTER";
    
    populateQuestionText();
    populateOptionsGrid();
    updatePaletteMetrics();
    
    // Launch dynamic running timer countdown sequence parameters
    timeLeft = questionDuration;
    initiateTimerCountdownLoop();
}

function populateQuestionText() {
    const q = examQuestions[currentIndex];
    const viewMode = consoleLangPref.value;
    questionDisplayContainer.innerHTML = '';
    
    if (viewMode === 'en' || viewMode === 'both') {
        questionDisplayContainer.innerHTML += `<div class="q-subheading">English Version</div><p style="margin:0 0 15px 0; font-weight:600;">${q.text_en}</p>`;
    }
    if (viewMode === 'both' && q.text_hi) {
        questionDisplayContainer.innerHTML += `<div class="tcs-divider-line"></div>`;
    }
    if (viewMode === 'hi' || viewMode === 'both') {
        questionDisplayContainer.innerHTML += `<div class="q-subheading">Hindi Version (हिंदी)</div><p style="margin:0; font-weight:600; font-size:1.25rem;">${q.text_hi}</p>`;
    }
}

function populateOptionsGrid() {
    const q = examQuestions[currentIndex];
    optionsContainer.innerHTML = '';
    
    const savedAnswer = userAnswers[currentIndex];
    
    Object.keys(q.options).forEach(key => {
        const val = q.options[key];
        if (typeof val === 'string' && val.startsWith('no_option')) return;
        
        const row = document.createElement('div');
        row.className = 'tcs-option-row';
        if (savedAnswer && savedAnswer.selected === key) row.classList.add('selected');
        
        row.innerHTML = `<input type="radio" name="opt" value="${key}" ${savedAnswer && savedAnswer.selected === key ? 'checked' : ''}> <strong>(A)</strong> ${val}`;
        
        // This makes sure the first letter matches option keys (A, B, C, D) perfectly
        row.querySelector('strong').textContent = `(${key})`; 
        
        row.onclick = () => {
            row.querySelector('input').checked = true;
            document.querySelectorAll('.tcs-option-row').forEach(r => r.classList.remove('selected'));
            row.classList.add('selected');
        };
        optionsContainer.appendChild(row);
    });
}

// --- Active Ticker Clock Timer Controller ---
function initiateTimerCountdownLoop() {
    const textNode = document.getElementById('timerText');
    
    function drawClock() {
        let mins = Math.floor(timeLeft / 60);
        let secs = timeLeft % 60;
        textNode.textContent = `${mins.toString().padStart(2,'0')}:${secs.toString().padStart(2,'0')}`;
        
        if (timeLeft <= 10) textNode.style.color = '#ea2027';
        else textNode.style.color = '#00d2d3';
    }
    
    drawClock();
    globalCountdown = setInterval(() => {
        timeLeft--;
        drawClock();
        
        if (timeLeft <= 0) {
            clearInterval(globalCountdown);
            userAnswers[currentIndex] = { selected: null, status: 'timeout' };
            questionStatuses[currentIndex] = 'notanswered';
            advanceNextExamIndex();
        }
    }, 1000);
}

// --- Inter-Question Palette Navigation Matrix jump logic ---
function jumpToQuestionIndex(targetIdx) {
    clearInterval(globalCountdown);
    
    if (questionStatuses[currentIndex] !== 'answered') {
        questionStatuses[currentIndex] = 'notanswered';
    }
    
    currentIndex = targetIdx;
    if (questionStatuses[currentIndex] === 'notvisited') {
        questionStatuses[currentIndex] = 'notanswered';
    }
    renderQuestionIndex();
}

// --- Verification Actions Forms Footers ---
document.getElementById('submitBtn').onclick = () => {
    const selectedInput = document.querySelector('input[name="opt"]:checked');
    if (!selectedInput) {
        alert("Please choose an answer option selection, or click 'Skip Question' if you don't know it.");
        return;
    }
    
    userAnswers[currentIndex] = { selected: selectedInput.value, status: 'answered' };
    questionStatuses[currentIndex] = 'answered';
    advanceNextExamIndex();
};

document.getElementById('skipBtn').onclick = () => {
    userAnswers[currentIndex] = { selected: null, status: 'skipped' };
    questionStatuses[currentIndex] = 'notanswered';
    advanceNextExamIndex();
};

function advanceNextExamIndex() {
    currentIndex++;
    renderQuestionIndex();
}

// --- Detailed Evaluation Review Screen Rendering Module ---
function completeExamValidation() {
    clearInterval(globalCountdown);
    examConsole.classList.add('hidden');
    resultScreen.classList.remove('hidden');
    
    let totalScore = 0;
    const auditContainer = document.getElementById('reviewAuditTrailContainer');
    auditContainer.innerHTML = '';
    
    examQuestions.forEach((q, idx) => {
        const record = userAnswers[idx] || { selected: null, status: 'skipped' };
        const isCorrect = record.selected && record.selected.toUpperCase() === q.correct_answer.toUpperCase().trim();
        
        if (isCorrect) totalScore++;
        
        const card = document.createElement('div');
        card.className = 'audit-card';
        
        let badgeHTML = '';
        if (record.status === 'timeout') {
            card.classList.add('audit-timeout');
            badgeHTML = `<span class="status-badge bg-timeout">Timed Out ⏰</span>`;
        } else if (!record.selected) {
            card.classList.add('audit-wrong');
            badgeHTML = `<span class="status-badge bg-wrong">Skipped / Unanswered</span>`;
        } else if (isCorrect) {
            card.classList.add('audit-correct');
            badgeHTML = `<span class="status-badge bg-correct">Correct +1</span>`;
        } else {
            card.classList.add('audit-wrong');
            badgeHTML = `<span class="status-badge bg-wrong">Incorrect</span>`;
        }
        
        card.innerHTML = `
            <div class="audit-header">
                <span>Question No. ${idx + 1}</span>
                ${badgeHTML}
            </div>
            <p><strong>English:</strong> ${q.text_en}</p>
            <p style="color:#4a5568;"><strong>हिंदी:</strong> ${q.text_hi || ''}</p>
            <div class="audit-choices-comparison">
                <div>Your Selected Choice: <strong style="color:${isCorrect ? '#4cd137':'#ea2027'}">${record.selected || 'None (No Selection)'}</strong></div>
                <div>Correct Answer Key: <strong style="color:#4cd137">${q.correct_answer.toUpperCase()}</strong></div>
            </div>
        `;
        auditContainer.appendChild(card);
    });
    
    document.getElementById('resScore').textContent = totalScore;
    document.getElementById('resTotal').textContent = examQuestions.length;
    const finalPct = ((totalScore / examQuestions.length) * 100).toFixed(1);
    document.getElementById('resAccuracy').textContent = `${finalPct}%`;
}

// Reset System Engine loops to front settings configurations dashboard view
document.getElementById('restartBtn').onclick = () => {
    resultScreen.classList.add('hidden');
    configScreen.classList.remove('hidden');
    fileUploader.value = '';
    startExamBtn.setAttribute('disabled', true);
};
