// --- Core System Variables State Storage ---
let fileQuestions = [];
let examQuestions = [];
let currentIndex = 0;

let userAnswers = {}; 
let questionStatuses = []; 
let questionTimers = {}; 

let globalCountdown = null;
let timerMode = "perQuestion"; 
let totalDurationConfig = 60;
let overallTimeLeft = 0; 

// GitHub Sync Management States
let ghToken = "";
let ghRepo = "";
const targetFolder = "quiz-banks"; 

// --- DOM Nodes Layout Selectors Bindings ---
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
const cloudBankFilesContainer = document.getElementById('cloudBankFilesContainer');
const apiStatusLog = document.getElementById('apiStatusLog');

// --- RESUMABLE AUTO-SAVE ENGINE (LOCAL STORAGE) ---
window.addEventListener('DOMContentLoaded', () => {
    loadCachedGithubCredentials();
    if (localStorage.getItem('rrb_quiz_active_state') === 'true') {
        document.getElementById('recoveryModal').classList.remove('hidden');
    }
});

function commitCurrentSessionProgressToCache() {
    localStorage.setItem('rrb_quiz_active_state', 'true');
    localStorage.setItem('rrb_quiz_examQuestions', JSON.stringify(examQuestions));
    localStorage.setItem('rrb_quiz_currentIndex', currentIndex);
    localStorage.setItem('rrb_quiz_userAnswers', JSON.stringify(userAnswers));
    localStorage.setItem('rrb_quiz_questionStatuses', JSON.stringify(questionStatuses));
    localStorage.setItem('rrb_quiz_questionTimers', JSON.stringify(questionTimers));
    localStorage.setItem('rrb_quiz_timerMode', timerMode);
    localStorage.setItem('rrb_quiz_overallTimeLeft', overallTimeLeft);
    localStorage.setItem('rrb_quiz_totalDurationConfig', totalDurationConfig);
    localStorage.setItem('rrb_quiz_consoleLangPref', consoleLangPref.value);
}

function wipeSessionProgressCache() {
    localStorage.removeItem('rrb_quiz_active_state');
    localStorage.removeItem('rrb_quiz_examQuestions');
    localStorage.removeItem('rrb_quiz_currentIndex');
    localStorage.removeItem('rrb_quiz_userAnswers');
    localStorage.removeItem('rrb_quiz_questionStatuses');
    localStorage.removeItem('rrb_quiz_questionTimers');
    localStorage.removeItem('rrb_quiz_timerMode');
    localStorage.removeItem('rrb_quiz_overallTimeLeft');
    localStorage.removeItem('rrb_quiz_totalDurationConfig');
    localStorage.removeItem('rrb_quiz_consoleLangPref');
}

document.getElementById('resumeConfirmBtn').onclick = () => {
    document.getElementById('recoveryModal').classList.add('hidden');
    try {
        examQuestions = JSON.parse(localStorage.getItem('rrb_quiz_examQuestions'));
        currentIndex = parseInt(localStorage.getItem('rrb_quiz_currentIndex'));
        userAnswers = JSON.parse(localStorage.getItem('rrb_quiz_userAnswers'));
        questionStatuses = JSON.parse(localStorage.getItem('rrb_quiz_questionStatuses'));
        questionTimers = JSON.parse(localStorage.getItem('rrb_quiz_questionTimers'));
        timerMode = localStorage.getItem('rrb_quiz_timerMode');
        overallTimeLeft = parseInt(localStorage.getItem('rrb_quiz_overallTimeLeft'));
        totalDurationConfig = parseInt(localStorage.getItem('rrb_quiz_totalDurationConfig'));
        consoleLangPref.value = localStorage.getItem('rrb_quiz_consoleLangPref');

        configScreen.classList.add('hidden');
        examConsole.classList.remove('hidden');
        
        buildPaletteGridUI();
        renderQuestionIndex();
        if (timerMode === 'overall') initiateOverallExamTimerLoop();
    } catch (err) {
        alert("Session recovery error. Resetting configuration.");
        wipeSessionProgressCache();
    }
};

document.getElementById('resumeRejectBtn').onclick = () => {
    document.getElementById('recoveryModal').classList.add('hidden');
    wipeSessionProgressCache();
};

// --- GITHUB API SYNCHRONIZATION ENGINE ---
function loadCachedGithubCredentials() {
    if(localStorage.getItem('rrb_git_token')) {
        document.getElementById('ghTokenInput').value = localStorage.getItem('rrb_git_token');
        document.getElementById('ghRepoInput').value = localStorage.getItem('rrb_git_repo');
        syncCloudRepositoryBankList();
    }
}

document.getElementById('connectGhBtn').onclick = () => {
    ghToken = document.getElementById('ghTokenInput').value.trim();
    ghRepo = document.getElementById('ghRepoInput').value.trim();
    
    if(!ghToken || !ghRepo) {
        if(apiStatusLog) apiStatusLog.textContent = "Status: Token or Repo path is empty!";
        return;
    }
    localStorage.setItem('rrb_git_token', ghToken);
    localStorage.setItem('rrb_git_repo', ghRepo);
    syncCloudRepositoryBankList();
};

async function syncCloudRepositoryBankList() {
    ghToken = document.getElementById('ghTokenInput').value.trim();
    ghRepo = document.getElementById('ghRepoInput').value.trim();
    if (!ghToken || !ghRepo) return;

    if(apiStatusLog) apiStatusLog.textContent = "Status: Authenticating with GitHub...";
    cloudBankFilesContainer.innerHTML = `<div style="text-align:center; padding:10px; color:#718096; font-size:0.85rem;">Connecting...</div>`;
    
    try {
        // FIXED: Using standardized header authentication configuration formats
        const headers = {
            'Accept': 'application/vnd.github.v3+json'
        };
        if (ghToken) {
            headers['Authorization'] = `token ${ghToken}`;
        }

        const res = await fetch(`https://api.github.com/repos/${ghRepo}/contents/${targetFolder}`, { headers });
        
        if (res.status === 404) {
            if(apiStatusLog) apiStatusLog.textContent = "Status: Connected! Folder empty.";
            cloudBankFilesContainer.innerHTML = `<div style="text-align:center; padding:10px; color:#a0aec0; font-size:0.85rem;">No cloud files synced yet. Upload a local file below to populate this folder!</div>`;
            return;
        }

        if (!res.ok) {
            const textError = await res.text();
            if(apiStatusLog) apiStatusLog.textContent = `Status: Error ${res.status}`;
            cloudBankFilesContainer.innerHTML = `<div style="color:red; text-align:center; padding:5px; font-size:0.8rem;">GitHub Server Message: ${res.statusText}</div>`;
            return;
        }

        const files = await res.json();
        const jsonFiles = Array.isArray(files) ? files.filter(f => f.name.endsWith('.json')) : [];

        if(apiStatusLog) apiStatusLog.textContent = `Status: Active (${jsonFiles.length} files found)`;

        if(jsonFiles.length === 0) {
            cloudBankFilesContainer.innerHTML = `<div style="text-align:center; padding:10px; color:#a0aec0; font-size:0.85rem;">No JSON files inside folder.</div>`;
            return;
        }

        cloudBankFilesContainer.innerHTML = '';
        jsonFiles.forEach(file => {
            const row = document.createElement('div');
            row.className = 'cloud-file-row';
            row.innerHTML = `
                <span class="cloud-file-name">${file.name}</span>
                <button class="cloud-file-delete">×</button>
            `;
            
            row.querySelector('.cloud-file-name').onclick = () => loadRemoteJsonBank(file.path);
            row.querySelector('.cloud-file-delete').onclick = () => deleteRemoteJsonBank(file.path, file.sha);
            
            cloudBankFilesContainer.appendChild(row);
        });
    } catch (err) {
        if(apiStatusLog) apiStatusLog.textContent = `Error: ${err.message}`;
        cloudBankFilesContainer.innerHTML = `<div style="color:#e53e3e; text-align:center; padding:10px; font-size:0.8rem;">Connection failed. Check settings details.</div>`;
    }
}

async function loadRemoteJsonBank(path) {
    if(apiStatusLog) apiStatusLog.textContent = `Status: Downloading ${path.split('/').pop()}...`;
    try {
        const headers = { 'Accept': 'application/vnd.github.v3.raw' };
        if (ghToken) headers['Authorization'] = `token ${ghToken}`;

        const res = await fetch(`https://api.github.com/repos/${ghRepo}/contents/${path}`, { headers });
        const data = await res.json();
        fileQuestions = Array.isArray(data) ? data : (data.questions || []);
        if (fileQuestions.length > 0) {
            startExamBtn.removeAttribute('disabled');
            questionLimitInput.max = fileQuestions.length;
            questionLimitInput.value = Math.min(20, fileQuestions.length);
            if(apiStatusLog) apiStatusLog.textContent = "Status: File loaded into memory!";
            alert(`Loaded successfully! Ready to start.`);
        }
    } catch(err) { 
        if(apiStatusLog) apiStatusLog.textContent = "Status: Download failed.";
        alert("Failed downloading data configuration."); 
    }
}

async function pushJsonBankToCloud(fileName, stringContent) {
    ghToken = document.getElementById('ghTokenInput').value.trim();
    ghRepo = document.getElementById('ghRepoInput').value.trim();
    if (!ghToken || !ghRepo) return;

    if(apiStatusLog) apiStatusLog.textContent = "Status: Uploading file to GitHub repository...";

    const base64Content = btoa(encodeURIComponent(stringContent).replace(/%([0-9A-F]{2})/g, function(match, p1) {
        return String.fromCharCode('0x' + p1);
    }));
    
    const path = `${targetFolder}/${fileName}`;

    try {
        const res = await fetch(`https://api.github.com/repos/${ghRepo}/contents/${path}`, {
            method: 'PUT',
            headers: { 
                'Authorization': `token ${ghToken}`, 
                'Content-Type': 'application/json' 
            },
            body: JSON.stringify({
                message: `Upload bank: ${fileName}`,
                content: base64Content
            })
        });
        if (res.ok) {
            if(apiStatusLog) apiStatusLog.textContent = "Status: Uploaded successfully!";
            setTimeout(syncCloudRepositoryBankList, 1500); 
        } else {
            const errData = await res.json();
            if(apiStatusLog) apiStatusLog.textContent = `Upload Error: ${errData.message}`;
        }
    } catch (err) { 
        if(apiStatusLog) apiStatusLog.textContent = `Upload Exception: ${err.message}`;
    }
}

window.deleteRemoteJsonBank = async function(path, sha) {
    if(!confirm("Erase this file from GitHub?")) return;
    
    ghToken = document.getElementById('ghTokenInput').value.trim();
    ghRepo = document.getElementById('ghRepoInput').value.trim();
    if(apiStatusLog) apiStatusLog.textContent = "Status: Deleting file...";

    try {
        const res = await fetch(`https://api.github.com/repos/${ghRepo}/contents/${path}`, {
            method: 'DELETE',
            headers: { 
                'Authorization': `token ${ghToken}`, 
                'Content-Type': 'application/json' 
            },
            body: JSON.stringify({
                message: `Delete item: ${path}`,
                sha: sha
            })
        });
        if(res.ok) {
            if(apiStatusLog) apiStatusLog.textContent = "Status: File deleted.";
            startExamBtn.setAttribute('disabled', true);
            setTimeout(syncCloudRepositoryBankList, 1000);
        } else {
            if(apiStatusLog) apiStatusLog.textContent = "Status: Deletion rejected.";
        }
    } catch (err) { alert("API connection failure."); }
}

// --- CONFIGURATIONS INTERFACE LISTENERS ---
if(timerInput) {
    document.querySelectorAll('input[name="timerMode"]').forEach(radio => {
        radio.addEventListener('change', (e) => {
            timerMode = e.target.value;
            if (timerMode === 'overall') {
                timerInput.value = 30; 
                timerInputCaption.textContent = "Duration (Total test time in minutes)";
            } else {
                timerInput.value = 60;
                timerInputCaption.textContent = "Duration (Seconds per question)";
            }
        });
    });
}

fileUploader.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function(event) {
        try {
            const rawText = event.target.textContent || event.target.result;
            const data = JSON.parse(rawText);
            fileQuestions = Array.isArray(data) ? data : (data.questions || []);
            if (fileQuestions.length > 0) {
                startExamBtn.removeAttribute('disabled');
                questionLimitInput.max = fileQuestions.length;
                questionLimitInput.value = Math.min(20, fileQuestions.length);
                
                pushJsonBankToCloud(file.name, rawText);
            }
        } catch(e) { alert("JSON validation error."); }
    };
    reader.readAsText(file);
});

// --- CORE TEST SIMULATION OPERATORS ---
startExamBtn.onclick = () => {
    let cloned = JSON.parse(JSON.stringify(fileQuestions));
    if (document.querySelector('input[name="orderType"]:checked').value === 'shuffled') {
        cloned.sort(() => Math.random() - 0.5);
    }
    
    let limit = parseInt(questionLimitInput.value) || cloned.length;
    examQuestions = cloned.slice(0, limit);
    
    questionStatuses = new Array(examQuestions.length).fill('notvisited');
    userAnswers = {};
    questionTimers = {}; 
    currentIndex = 0;
    questionStatuses[0] = 'notanswered';
    
    consoleLangPref.value = langPrefSetup.value;
    
    const rawTimeInput = parseInt(timerInput.value) || 60;
    if (timerMode === 'overall') {
        overallTimeLeft = rawTimeInput * 60; 
    } else {
        totalDurationConfig = rawTimeInput;
        examQuestions.forEach((_, idx) => { questionTimers[idx] = totalDurationConfig; });
    }
    
    configScreen.classList.add('hidden');
    examConsole.classList.remove('hidden');
    
    buildPaletteGridUI();
    renderQuestionIndex();
    
    if (timerMode === 'overall') initiateOverallExamTimerLoop();
};

consoleLangPref.onchange = () => { 
    if (examQuestions.length > 0) {
        populateQuestionText(); 
        commitCurrentSessionProgressToCache();
    } 
};

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
    
    if (currentIndex === examQuestions.length - 1 || timerMode === "overall") {
        document.getElementById('finishExamBtn').classList.remove('hidden');
    } else {
        document.getElementById('finishExamBtn').classList.add('hidden');
    }
}

function renderQuestionIndex() {
    if (timerMode === 'perQuestion') clearInterval(globalCountdown);
    if (currentIndex >= examQuestions.length) currentIndex = examQuestions.length - 1; 
    
    document.getElementById('questionNumTitle').textContent = `Question No. ${currentIndex + 1}`;
    document.getElementById('consoleExamTitle').textContent = examQuestions[currentIndex].exam || "RRB ONLINE EXAMINATION MASTER";
    
    populateQuestionText();
    populateOptionsGrid();
    updatePaletteMetrics();
    
    if (timerMode === 'perQuestion') initiatePerQuestionTimerLoop();
    commitCurrentSessionProgressToCache(); 
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
            
            userAnswers[currentIndex] = { selected: key, status: questionStatuses[currentIndex] === 'review' ? 'review':'answered' };
            commitCurrentSessionProgressToCache();
        };
        optionsContainer.appendChild(row);
    });
}

function initiatePerQuestionTimerLoop() {
    const textNode = document.getElementById('timerText');
    if (questionTimers[currentIndex] <= 0) {
        textNode.textContent = "00:00"; textNode.style.color = '#ea2027'; return;
    }

    function drawClock() {
        let currentRemaining = questionTimers[currentIndex];
        let mins = Math.floor(currentRemaining / 60); let secs = currentRemaining % 60;
        textNode.textContent = `${mins.toString().padStart(2,'0')}:${secs.toString().padStart(2,'0')}`;
        if (currentRemaining <= 10) textNode.style.color = '#ea2027'; else textNode.style.color = '#00d2d3';
    }
    
    drawClock();
    globalCountdown = setInterval(() => {
        questionTimers[currentIndex]--;
        drawClock();
        commitCurrentSessionProgressToCache(); 
        
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

function initiateOverallExamTimerLoop() {
    const textNode = document.getElementById('timerText');
    function drawClock() {
        let mins = Math.floor(overallTimeLeft / 60); let secs = overallTimeLeft % 60;
        textNode.textContent = `${mins.toString().padStart(2,'0')}:${secs.toString().padStart(2,'0')}`;
        if (overallTimeLeft <= 60) textNode.style.color = '#ea2027'; else textNode.style.color = '#00d2d3';
    }
    drawClock();
    globalCountdown = setInterval(() => {
        overallTimeLeft--;
        drawClock();
        commitCurrentSessionProgressToCache();
        if (overallTimeLeft <= 0) {
            clearInterval(globalCountdown);
            alert("⏰ Total Exam Time Completed!");
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

document.getElementById('submitBtn').onclick = () => {
    const selectedInput = document.querySelector('input[name="opt"]:checked');
    if (!selectedInput) { alert("Please choose an answer."); return; }
    userAnswers[currentIndex] = { selected: selectedInput.value, status: 'answered' };
    questionStatuses[currentIndex] = 'answered';
    advanceNextExamIndex();
};

document.getElementById('reviewBtn').onclick = () => {
    const selectedInput = document.querySelector('input[name="opt"]:checked');
    userAnswers[currentIndex] = { selected: selectedInput ? selectedInput.value : null, status: 'review' };
    questionStatuses[currentIndex] = 'review';
    advanceNextExamIndex();
};

document.getElementById('clearResponseBtn').onclick = () => {
    userAnswers[currentIndex] = null;
    if (questionStatuses[currentIndex] === 'answered' || questionStatuses[currentIndex] === 'review') {
        questionStatuses[currentIndex] = 'notanswered';
    }
    populateOptionsGrid();
    updatePaletteMetrics();
    commitCurrentSessionProgressToCache();
};

function advanceNextExamIndex() {
    if (currentIndex < examQuestions.length - 1) {
        currentIndex++;
        renderQuestionIndex();
    } else if (timerMode === 'perQuestion') {
        completeExamValidation();
    }
}

document.getElementById('finishExamBtn').onclick = () => {
    if (confirm("Submit your test paper console?")) completeExamValidation();
};

function completeExamValidation() {
    clearInterval(globalCountdown);
    wipeSessionProgressCache(); 
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
        let badgeHTML = record.status === 'timeout' ? `<span class="status-badge bg-timeout">Timed Out ⏰</span>` : (record.status === 'review' ? `<span class="status-badge" style="background:#9b59b6;">Review 🟣</span>` : (!record.selected ? `<span class="status-badge bg-wrong">Skipped</span>` : (isCorrect ? `<span class="status-badge bg-correct">Correct +1</span>` : `<span class="status-badge bg-wrong">Incorrect</span>`)));
        
        card.innerHTML = `
            <div class="audit-header"><span>Question No. ${idx + 1}</span>${badgeHTML}</div>
            <p><strong>English:</strong> ${q.text_en}</p><p style="color:#4a5568;"><strong>हिंदी:</strong> ${q.text_hi || ''}</p>
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

// --- FLOATING SCIENTIFIC CALCULATOR ---
const calcPad = document.getElementById('floatingCalculator');
if(document.getElementById('calcToggleBtn')) {
    document.getElementById('calcToggleBtn').onclick = () => calcPad.classList.toggle('hidden');
    document.getElementById('calcCloseBtn').onclick = () => calcPad.classList.add('hidden');
}

let calcExpression = "";
window.pressCalcKey = function(key) {
    const disp = document.getElementById('calcDisplay');
    if (key === 'C') {
        calcExpression = ""; disp.value = "0";
    } else if (key === 'SQRT') {
        try {
            disp.value = Math.sqrt(eval(disp.value || calcExpression));
            calcExpression = disp.value;
        } catch(e) { disp.value = "Error"; }
    } else if (key === '=') {
        try {
            disp.value = eval(calcExpression) || "0"; calcExpression = disp.value;
        } catch(e) { disp.value = "Error"; calcExpression = ""; }
    } else {
        if (disp.value === "0" && !isNaN(key)) calcExpression = "";
        calcExpression += key; disp.value = calcExpression;
    }
}

if(document.getElementById('restartBtn')) {
    document.getElementById('restartBtn').onclick = () => {
        resultScreen.classList.add('hidden'); configScreen.classList.remove('hidden');
        fileUploader.value = ''; startExamBtn.setAttribute('disabled', true);
        syncCloudRepositoryBankList();
    };
}
