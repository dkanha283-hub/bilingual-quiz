// --- Core System Variables State Storage ---
let fileQuestions = [];
let examQuestions = [];
let currentIndex = 0;

let userAnswers = {}; // Mapping schema: { index: { selected: 'A', status: 'answered'|'review'|'timeout'|'skipped' } }
let questionStatuses = []; // Array statuses: 'notvisited', 'notanswered', 'answered', 'review'
let questionTimers = {}; // NEW: Tracks remaining time per individual question index { 0: 45, 1: 60, ... }

let globalCountdown = null;
let timerMode = "perQuestion"; // 'perQuestion' or 'overall'
let totalDurationConfig = 60;
let overallTimeLeft = 0; // Global clock tracker for the total exam mode

// --- Bindings Selectors ---
const fileUploader = document.getElementById('fileUploader');
const questionLimitInput = document.getElementById('questionLimitInput');
const timerInput = document.getElementById('timerInput');
const langPrefSetup = document.getElementById('langPrefSetup');
const startExamBtn = document.getElementById('startExamBtn');
const timerInputCaption = document.getElementById('timerInputCaption');

const configScreen = document.getElementById('configScreen');
const examConsole = document.getElementById('examConsole');
const resultScreen = document.getElementById('resultScreen');

const questionDisplayContainer = document.getElementById('questionDisplayContainer');
const optionsContainer = document.getElementById('optionsContainer');
const paletteGrid = document.getElementById('paletteGrid');
const consoleLangPref = document.getElementById('consoleLangPref');

// Listen for dynamic timer label switch adjustments inside the setup console card
document.querySelectorAll('input[name="timerMode"]').forEach(radio => {
    radio.addEventListener('change', (e) => {
        timerMode = e.target.value;
        if (timerMode === 'overall') {
            timerInput.value = 30; // 30 minutes standard test reference defaults
            timerInputCaption.textContent = "Duration (Total test time in minutes)";
        } else {
            timerInput.value = 60;
            timerInputCaption.textContent = "Duration (Seconds per question)";
        }
    });
});

// JSON Input File validation loader hook
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
        } catch(e) { alert("JSON structural verification file read error."); }
    };
    reader.readAsText(file);
});

// --- Start Exam Orchestrator ---
startExamBtn.onclick = () => {
    let cloned = JSON.parse(JSON.stringify(fileQuestions));
    if (document.querySelector('input[name="orderType"]:checked').value === 'shuffled') {
        cloned.sort(() => Math.random() - 0.5);
    }
    
    let limit = parseInt(questionLimitInput.value) || cloned.length;
    examQuestions = cloned.slice(0, limit);
    
    questionStatuses = new Array(examQuestions.length).fill('notvisited');
    userAnswers = {};
    questionTimers = {}; // Reset visual clock memories
    currentIndex = 0;
    questionStatuses[0] = 'notanswered';
    
    consoleLangPref.value = langPrefSetup.value;
    
    // Configure running timer properties accurately
    const rawTimeInput = parseInt(timerInput.value) || 60;
    if (timerMode === 'overall') {
        overallTimeLeft = rawTimeInput * 60; // Minutes translated cleanly to seconds
    } else {
        totalDurationConfig = rawTimeInput;
        // Seed the default clock duration for every single parsed question card item
        examQuestions.forEach((_, idx) => {
            questionTimers[idx] = totalDurationConfig;
        });
    }
    
    configScreen.classList.add('hidden');
    examConsole.classList.remove('hidden');
    
    buildPaletteGridUI();
    renderQuestionIndex();
    
    // Fire full overall exam counting track right here if mode is enabled
    if (timerMode === 'overall') initiateOverallExamTimerLoop();
};

consoleLangPref.onchange = () => { if (examQuestions.length > 0) populateQuestionText(); };

// --- Question Palette Handlers ---
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
    let answered = 0, notanswered = 0, notvisited = 0, review = 0;
    
    examQuestions.forEach((_, idx) => {
        const cell = document.getElementById(`palette-cell-${idx}`);
        if (!cell) return;
        
        const status = questionStatuses[idx];
        cell.className = `palette-cell cell-${status}`;
        if (idx === currentIndex) cell.classList.add('active-cell');
        
        if (status === 'answered') answered++;
        else if (status === 'notanswered') notanswered++;
        else if (status === 'review') review++;
        else notvisited++;
    });
    
    document.getElementById('legendAnsweredCount').textContent = answered;
    document.getElementById('legendNotAnsweredCount').textContent = notanswered;
    document.getElementById('legendNotVisitedCount').textContent = notvisited;
    document.getElementById('legendReviewCount').textContent = review;
    
    // Toggle overall submission safety button visibility on final question item index
    if (currentIndex === examQuestions.length - 1 || timerMode === "overall") {
        document.getElementById('finishExamBtn').classList.remove('hidden');
    } else {
        document.getElementById('finishExamBtn').classList.add('hidden');
    }
}

// --- Content Rendering Controller ---
function renderQuestionIndex() {
    if (timerMode === 'perQuestion') {
        clearInterval(globalCountdown);
    }
    
    if (currentIndex >= examQuestions.length) {
        currentIndex = examQuestions.length - 1; 
    }
    
    document.getElementById('questionNumTitle').textContent = `Question No. ${currentIndex + 1}`;
    document.getElementById('consoleExamTitle').textContent = examQuestions[currentIndex].exam || "RRB ONLINE EXAMINATION MASTER";
    
    populateQuestionText();
    populateOptionsGrid();
    updatePaletteMetrics();
    
    if (timerMode === 'perQuestion') initiatePerQuestionTimerLoop();
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
        
        row.innerHTML = `<input type="radio" name="opt" value="${key}" ${savedAnswer && savedAnswer.selected === key ? 'checked' : ''}> <strong>(${key})</strong> ${val}`;
        
        row.onclick = () => {
            row.querySelector('input').checked = true;
            document.querySelectorAll('.tcs-option-row').forEach(r => r.classList.remove('selected'));
            row.classList.add('selected');
        };
        optionsContainer.appendChild(row);
    });
}

// --- FIXED: Per-Question Timer System (Remembers Time Left) ---
function initiatePerQuestionTimerLoop() {
    const textNode = document.getElementById('timerText');
    
    // If this question ran out of time entirely before, keep it locked at 0s
    if (questionTimers[currentIndex] <= 0) {
        textNode.textContent = "00:00";
        textNode.style.color = '#ea2027';
        return;
    }

    function drawClock() {
        let currentRemaining = questionTimers[currentIndex];
        let mins = Math.floor(currentRemaining / 60);
        let secs = currentRemaining % 60;
        textNode.textContent = `${mins.toString().padStart(2,'0')}:${secs.toString().padStart(2,'0')}`;
        
        if (currentRemaining <= 10) textNode.style.color = '#ea2027';
        else textNode.style.color = '#00d2d3';
    }
    
    drawClock();
    globalCountdown = setInterval(() => {
        questionTimers[currentIndex]--;
        drawClock();
        
        if (questionTimers[currentIndex] <= 0) {
            clearInterval(globalCountdown);
            if (questionStatuses[currentIndex] !== 'answered' && questionStatuses[currentIndex] !== 'review') {
                userAnswers[currentIndex] = { selected: null, status: 'timeout' };
                questionStatuses[currentIndex] = 'notanswered';
            }
            advanceNextExamIndex();
        }
    }, 1000);
}

// --- Total Exam Countdown Timer Mode Loop ---
function initiateOverallExamTimerLoop() {
    const textNode = document.getElementById('timerText');
    
    function drawClock() {
        let mins = Math.floor(overallTimeLeft / 60);
        let secs = overallTimeLeft % 60;
        textNode.textContent = `${mins.toString().padStart(2,'0')}:${secs.toString().padStart(2,'0')}`;
        if (overallTimeLeft <= 60) textNode.style.color = '#ea2027'; // Red warning on last remaining minute
        else textNode.style.color = '#00d2d3';
    }
    
    drawClock();
    globalCountdown = setInterval(() => {
        overallTimeLeft--;
        drawClock();
        
        if (overallTimeLeft <= 0) {
            clearInterval(globalCountdown);
            alert("⏰ Overall Exam Time is completely over! Submitting answers sheet now.");
            completeExamValidation();
        }
    }, 1000);
}

function jumpToQuestionIndex(targetIdx) {
    if (timerMode === 'perQuestion') clearInterval(globalCountdown);
    
    if (questionStatuses[currentIndex] !== 'answered' && questionStatuses[currentIndex] !== 'review') {
        questionStatuses[currentIndex] = 'notanswered';
    }
    
    currentIndex = targetIdx;
    if (questionStatuses[currentIndex] === 'notvisited') questionStatuses[currentIndex] = 'notanswered';
    renderQuestionIndex();
}

// --- FIXED BUTTON EVENT LISTENERS ACTIONS ---

// 1. Save & Next Button
document.getElementById('submitBtn').onclick = () => {
    const selectedInput = document.querySelector('input[name="opt"]:checked');
    if (!selectedInput) {
        alert("Please select an option before saving. If you don't know the answer, use 'Skip/Mark for Review'.");
        return;
    }
    userAnswers[currentIndex] = { selected: selectedInput.value, status: 'answered' };
    questionStatuses[currentIndex] = 'answered';
    advanceNextExamIndex();
};

// 2. Mark For Review Button
document.getElementById('reviewBtn').onclick = () => {
    const selectedInput = document.querySelector('input[name="opt"]:checked');
    userAnswers[currentIndex] = { 
        selected: selectedInput ? selectedInput.value : null, 
        status: 'review' 
    };
    questionStatuses[currentIndex] = 'review';
    advanceNextExamIndex();
};

// 3. Clear Response Button
document.getElementById('clearResponseBtn').onclick = () => {
    userAnswers[currentIndex] = null;
    if (questionStatuses[currentIndex] === 'answered' || questionStatuses[currentIndex] === 'review') {
        questionStatuses[currentIndex] = 'notanswered';
    }
    populateOptionsGrid();
    updatePaletteMetrics();
};

// 4. Skip Button Handler (Triggered when user skips natively via index limits)
function advanceNextExamIndex() {
    if (currentIndex < examQuestions.length - 1) {
        currentIndex++;
        renderQuestionIndex();
    } else if (timerMode === 'perQuestion') {
        // If we reached the final question item under per-question setup, trigger results compilation
        completeExamValidation();
    }
}

document.getElementById('finishExamBtn').onclick = () => {
    if (confirm("Are you sure you want to conclude and submit this exam session layout?")) {
        completeExamValidation();
    }
};

// --- Detailed Review Screen & Enhanced Visual Progress Bars Engine ---
function completeExamValidation() {
    clearInterval(globalCountdown);
    examConsole.classList.add('hidden');
    resultScreen.classList.remove('hidden');
    
    let totalScore = 0, wrongCount = 0, reviewSkippedCount = 0;
    const auditContainer = document.getElementById('reviewAuditTrailContainer');
    auditContainer.innerHTML = '';
    
    examQuestions.forEach((q, idx) => {
        const record = userAnswers[idx] || { selected: null, status: 'skipped' };
        const isCorrect = record.selected && record.selected.toUpperCase() === q.correct_answer.toUpperCase().trim();
        
        if (record.status === 'review' || !record.selected) reviewSkippedCount++;
        else if (isCorrect) totalScore++;
        else wrongCount++;
        
        const card = document.createElement('div');
        card.className = 'audit-card';
        
        let badgeHTML = '';
        if (record.status === 'timeout') {
            card.classList.add('audit-timeout');
            badgeHTML = `<span class="status-badge bg-timeout">Timed Out ⏰</span>`;
        } else if (record.status === 'review') {
            card.classList.add('audit-timeout');
            badgeHTML = `<span class="status-badge" style="background:#9b59b6;">Marked For Review 🟣</span>`;
        } else if (!record.selected) {
            card.classList.add('audit-wrong');
            badgeHTML = `<span class="status-badge bg-wrong">Skipped</span>`;
        } else if (isCorrect) {
            card.classList.add('audit-correct');
            badgeHTML = `<span class="status-badge bg-correct">Correct +1</span>`;
        } else {
            card.classList.add('audit-wrong');
            badgeHTML = `<span class="status-badge bg-wrong">Incorrect</span>`;
        }
        
        card.innerHTML = `
            <div class="audit-header"><span>Question No. ${idx + 1}</span>${badgeHTML}</div>
            <p><strong>English:</strong> ${q.text_en}</p>
            <p style="color:#4a5568;"><strong>हिंदी:</strong> ${q.text_hi || ''}</p>
            <div class="audit-choices-comparison">
                <div>Your Selected Choice: <strong style="color:${isCorrect ? '#4cd137':'#ea2027'}">${record.selected || 'None'}</strong></div>
                <div>Correct Answer Key: <strong style="color:#4cd137">${q.correct_answer.toUpperCase()}</strong></div>
            </div>
        `;
        auditContainer.appendChild(card);
    });
    
    const totalQ = examQuestions.length;
    document.getElementById('resScore').textContent = totalScore;
    document.getElementById('resTotal').textContent = totalQ;
    document.getElementById('resAccuracy').textContent = `${((totalScore / totalQ) * 100).toFixed(1)}%`;
    
    document.getElementById('barCorrect').style.width = `${(totalScore / totalQ) * 100}%`;
    document.getElementById('barWrong').style.width = `${(wrongCount / totalQ) * 100}%`;
    document.getElementById('barSkipped').style.width = `${(reviewSkippedCount / totalQ) * 100}%`;
}

// --- Floating Virtual Calculator Functions ---
const calcPad = document.getElementById('floatingCalculator');
document.getElementById('calcToggleBtn').onclick = () => calcPad.classList.toggle('hidden');
document.getElementById('calcCloseBtn').onclick = () => calcPad.classList.add('hidden');

let calcExpression = "";
window.pressCalcKey = function(key) {
    const disp = document.getElementById('calcDisplay');
    if (key === 'C') {
        calcExpression = "";
        disp.value = "0";
    } else if (key === '=') {
        try {
            disp.value = eval(calcExpression) || "0";
            calcExpression = disp.value;
        } catch(e) { disp.value = "Error"; calcExpression = ""; }
    } else {
        if (disp.value === "0" && !isNaN(key)) calcExpression = "";
        calcExpression += key;
        disp.value = calcExpression;
    }
}

document.getElementById('restartBtn').onclick = () => {
    resultScreen.classList.add('hidden');
    configScreen.classList.remove('hidden');
    fileUploader.value = '';
    startExamBtn.setAttribute('disabled', true);
};
