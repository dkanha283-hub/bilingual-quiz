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
let operationMode = "exam"; 
let hasCheckedAnswer = false; 

// GitHub Sync Management States
let ghToken = "";
let ghRepo = "";
const targetFolder = "quiz-banks"; 

// --- FIXED: COMPLETE PRE-LOADED PERCENTAGE SHEET DATA EMBEDDED PRESET ---
const defaultPercentageSheetQuestions = [
    {"question_number":1,"text_en":"If 2% of x = 360, then x is equal to:","text_hi":"यदि x का 2%, 360 है, तो x का मान ज्ञात कीजिए।","exam":"RRB NTPC GRADUATE LEVEL 2025","options":{"A":"36000","B":"18000","C":"18100","D":"36100"},"correct_answer":"B"},
    {"question_number":2,"text_en":"What is 20% of 40% of 30% of 75% of 3400?","text_hi":"3400 के 75% के 30% के 40% के 20% का मान क्या होगा?","exam":"RRB NTPC GRADUATE LEVEL 2025","options":{"A":"61.5","B":"61.2","C":"61.1","D":"61.4"},"correct_answer":"B"},
    {"question_number":3,"text_en":"By how much is 65% of 65 greater than 2/5 of 45?","text_hi":"65 का 65%, 45 के 2/5 से कितना अधिक है?","exam":"RRB NTPC GRADUATE LEVEL 2025","options":{"A":"22.25","B":"21.25","C":"18.25","D":"24.25"},"correct_answer":"D"},
    {"question_number":4,"text_en":"If 35% of k is 20 less than 1200% of 25, then k is:","text_hi":"यदि k का 35%, 25 के 1200% से 20 कम है, तो k का मान क्या है?","exam":"RPF CONSTABLE 2025","options":{"A":"840","B":"no_option_b","C":"800","D":"no_option_d"},"correct_answer":"C"},
    {"question_number":5,"text_en":"What is the square root of 144%?","text_hi":"144% का वर्गमूल क्या है ?","exam":"SSC GD 2024","options":{"A":"12%","B":"0.12%","C":"120%","D":"1.2%"},"correct_answer":"C"},
    {"question_number":6,"text_en":"2% of 50% of a number is what percentage of that number?","text_hi":"किसी संख्या के 50% का 2% उस संख्या का कितना प्रतिशत होगा?","exam":null,"options":{"A":"96","B":"no_option_b","C":"0.96","D":"no_option_d"},"correct_answer":"C"},
    {"question_number":7,"text_en":"Two numbers are respectively 30% and 18% more than a third number. The ratio of the two numbers is:","text_hi":"दो संख्याएं एक तीसरी संख्या से क्रमशः 30% और 18% अधिक हैं। उन दोनों संख्याओं का अनुपात ज्ञात कीजिए।","exam":"RRB NTPC GRADUATE LEVEL 2025","options":{"A":"55:64","B":"58:63","C":"65:59","D":"73:74"},"correct_answer":"C"},
    {"question_number":8,"text_en":"5% of a = b, then b% of 20 is the same as","text_hi":"a का 5% = b तो 20 का b% के बराबर होगा।","exam":null,"options":{"A":"20% of a/2","B":"50% of a/20","C":"50% of a/2","D":"20% of a/20"},"correct_answer":"C"},
    {"question_number":9,"text_en":"If x% of a is the same as y% of b, then z% of b will be","text_hi":"यदि a का x%, b के y% के समान है, तो b का z% होगा","exam":null,"options":{"A":"(yz/x)% of a","B":"(zx/y)% of a","C":"(xy/z)% of a","D":"(y/z)% of a"},"correct_answer":"D"},
    {"question_number":10,"text_en":"If 85% of (x-y) = 25% of (x+y) Then y is what percentage of x?","text_hi":"यदि (x-y) का 85% = (x+y) का 25% है, तो y, x का कितना प्रतिशत है?","exam":"SSC GD 2023","options":{"A":"51_4/11%","B":"54_6/11%","C":"55_1/11%","D":"58_3/11%"},"correct_answer":"B"},
    {"question_number":11,"text_en":"Two numbers A and B are such that the sum of 8% of A and 5% of B is three-fifth of the sum of 12% of A and 10% of B. The ratio of A and B is:","text_hi":"A और B दो संख्याए इस प्रकार हैं कि A के 8% और B के 5% का योग, A के 12% और B के 10% के योग का 3/5 भाग है। A और B का अनुपात कितना है?","exam":null,"options":{"A":"6:11","B":"11:6","C":"11:6","D":"no_option_d"},"correct_answer":"B"},
    {"question_number":12,"text_en":"The population of a town is increased from 60,000 to 61,050. How much is the percentage increase?","text_hi":"किसी कस्बे की जनसंख्या 60,000 से बढ़कर 61,050 हो जाती है। वृद्धि प्रतिशत कितना है?","exam":"RRB NTPC GRADUATE LEVEL 2025","options":{"A":"1.65%","B":"1.55%","C":"1.85%","D":"1.75%"},"correct_answer":"B"},
    {"question_number":13,"text_en":"Monthly expenditure of Ritvik decreases from 12,800 to 11,712. Find the percentage decrease in his expenditure.","text_hi":"ऋत्विक का मासिक खर्च ₹12,800 से घटकर ₹11,712 हो गया। उसके व्यय में प्रतिशत कमी ज्ञात कीजिये।","exam":"SSC CHSL 2024","options":{"A":"7.7%","B":"6.25%","C":"8.5%","D":"9.25%"},"correct_answer":"D"},
    {"question_number":14,"text_en":"The present cost of a house is 1,23,016. After a year, its cost will increase to 1,40,203. The percentage increase (rounded off to the nearest integer) in the cost of the house is:","text_hi":"किसी मकान की वर्तमान लागत ₹1,23,016 है। एक वर्ष बाद, इसकी लागत बढ़कर ₹1,40,203 हो जाएगी। मकान की लागत प्रतिशत वृद्धि (निकटतम पूर्णांक तक पूर्णांकित) ज्ञात कीजिए।","exam":null,"options":{"A":"10%", "B":"14%", "C":"8%", "D":"17%"},"correct_answer":"c"},
    {"question_number":15,"text_en":"The present cost of a plot area is 1,12,079. After a year, its cost increased to 1,89,297. The percentage increase (rounded off to the nearest integer) in the cost of the plot area is:","text_hi":"किसी भूखंड क्षेत्र की वर्तमान कीमत ₹1,12,079 है। एक वर्ष बाद, इसकी कीमत बढ़कर ₹1,89,297 हो गई। भूखंड क्षेत्र की कीमत में प्रतिशत वृद्धि (निकटतम पूर्णांक तक पूर्णांकित) ज्ञात कीजिए।","exam":"RRB NTPC 12TH LEVEL 2025","options":{"A":"73%", "B":"67%", "C":"69%", "D":"57%"},"correct_answer":"b"},
    {"question_number":16,"text_en":"The monthly income of Amara is 80,200. If her income is decreased by 11%, then find her new monthly income.","text_hi":"अमारा की मासिक आय ₹80,200 है। यदि उसकी आय 11% कम हो जाती है, तो उसकी नई मासिक आय ज्ञात कीजिए।","exam":"RRB NTPC 12TH LEVEL 2025","options":{"A":"71500", "B":"71378", "C":"71820", "D":"71250"},"correct_answer":"c"},
    {"question_number":17,"text_en":"The monthly income of a person is 27,540. If their income is increased by 20%, then what will be their new monthly income?","text_hi":"किसी व्यक्ति की मासिक आय ₹7,540 है। यदि उसकी आय में 20% की वृद्धि होती है, तो उसकी नई मासिक आय कितनी होगी?","exam":"RRB NTPC GRADUATE LEVEL 2025","options":{"A":"₹9,248", "B":"₹9,048", "C":"₹9,448", "D":"₹9,648"},"correct_answer":"b"},
    {"question_number":18,"text_en":"A number when increased by 50% gives 3720. The number is:","text_hi":"एक संख्या को 50% बढ़ाने पर 3720 प्राप्त होता है। संख्या है:","exam":"RRB RPF SI 2024","options":{"A":"1240", "B":"2480", "C":"4960", "D":"7440"},"correct_answer":"b"},
    {"question_number":19,"text_en":"A number when increased by 40% gives 3570. The number is:","text_hi":"एक संख्या में 40% की वृद्धि करने पर 3570 प्राप्त होता है। वह संख्या ______ है।","exam":null,"options":{"A":"2550", "B":"7650", "C":"1275", "D":"5100"},"correct_answer":"b"},
    {"question_number":20,"text_en":"A number, when decreased by 7%, gives 3720. The number is:","text_hi":"किसी संख्या में 7% की कमी करने पर 3720 प्राप्त होता है। वह संख्या ज्ञात कीजिए।","exam":"RRB NTPC GRADUATE LEVEL 2025","options":{"A":"2000", "B":"4000", "C":"12000", "D":"8000"},"correct_answer":"a"},
    {"question_number":21,"text_en":"A number, when increased by 60%, gives 3570. The number is:","text_hi":"एक संख्या में 60% की वृद्धि करने पर 3570 प्राप्त होता है। वह संख्या ज्ञात कीजिए।","exam":null,"options":{"A":"6693.75", "B":"4462.5", "C":"1115.625", "D":"2231.25"},"correct_answer":"b"},
    {"question_number":60,"text_en":"If the radius of the cylinder is decreased by 20%, then by how much percent the height must be increased, so that the volume of the cylinder remains same?","text_hi":"यदि बेलन की त्रिज्या में 20% की कमी की जाती है, तो उसकी ऊँचाई में कितने प्रतिशत की वृद्धि करनी चाहिए ताकि बेलन का आयतन समान रहे?","exam":"CGL 2017","options":{"A":"44", "B":"36.25", "C":"56.25", "D":"62.5"},"correct_answer":"c"}
];

// --- DOM Nodes Layout Selectors Bindings ---
const bankSourceDropdown = document.getElementById('bankSourceDropdown');
const localFilePickerWrapper = document.getElementById('localFilePickerWrapper');
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
const practiceFeedbackBox = document.getElementById('practiceFeedbackBox');

// --- RESUMABLE AUTO-SAVE ENGINE ---
window.addEventListener('DOMContentLoaded', () => {
    fileQuestions = defaultPercentageSheetQuestions;
    questionLimitInput.max = fileQuestions.length;
    questionLimitInput.value = fileQuestions.length;

    loadCachedGithubCredentials();
    if (localStorage.getItem('rrb_quiz_active_state') === 'true') {
        document.getElementById('recoveryModal').classList.remove('hidden');
    }
});

bankSourceDropdown.addEventListener('change', (e) => {
    if (e.target.value === 'local_upload') {
        localFilePickerWrapper.classList.remove('hidden');
        fileQuestions = [];
        questionLimitInput.value = 0;
        startExamBtn.setAttribute('disabled', true); // Lock until user chooses a local file
    } else if (e.target.value === 'default_percentage') {
        localFilePickerWrapper.classList.add('hidden');
        fileQuestions = defaultPercentageSheetQuestions;
        questionLimitInput.max = fileQuestions.length;
        questionLimitInput.value = fileQuestions.length;
        startExamBtn.removeAttribute('disabled');
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
    localStorage.setItem('rrb_quiz_operationMode', operationMode);
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
    localStorage.removeItem('rrb_quiz_operationMode');
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
        operationMode = localStorage.getItem('rrb_quiz_operationMode');

        configScreen.classList.add('hidden');
        examConsole.classList.remove('hidden');
        
        buildPaletteGridUI();
        renderQuestionIndex();
        if (timerMode === 'overall') initiateOverallExamTimerLoop();
    } catch (err) {
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
    if(!ghToken || !ghRepo) return;
    localStorage.setItem('rrb_git_token', ghToken);
    localStorage.setItem('rrb_git_repo', ghRepo);
    syncCloudRepositoryBankList();
};

async function syncCloudRepositoryBankList() {
    ghToken = document.getElementById('ghTokenInput').value.trim();
    ghRepo = document.getElementById('ghRepoInput').value.trim();
    if (!ghToken || !ghRepo) return;
    
    if(apiStatusLog) apiStatusLog.textContent = "Status: Connecting to GitHub Tree...";
    
    try {
        const headers = { 
            'Accept': 'application/vnd.github.v3+json',
            'Authorization': `Bearer ${ghToken}`
        };

        const res = await fetch(`https://api.github.com/repos/${ghRepo}/contents/${targetFolder}`, { headers });
        
        if (res.status === 404) {
            if(apiStatusLog) apiStatusLog.textContent = "Status: Connected! Cloud folder empty.";
            return;
        }

        if (!res.ok) {
            if(apiStatusLog) apiStatusLog.textContent = `Status: Auth Blocked (${res.status})`;
            return;
        }

        const files = await res.json();
        const jsonFiles = Array.isArray(files) ? files.filter(f => f.name.endsWith('.json')) : [];

        if(apiStatusLog) apiStatusLog.textContent = `Status: Synced (${jsonFiles.length} cloud files available)`;

        if(jsonFiles.length > 0) {
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
        }
    } catch (err) { 
        if(apiStatusLog) apiStatusLog.textContent = "Status: Connection Handshake Terminated.";
    }
}

async function loadRemoteJsonBank(path) {
    try {
        const headers = { 
            'Accept': 'application/vnd.github.v3.raw',
            'Authorization': `Bearer ${ghToken}`
        };

        const res = await fetch(`https://api.github.com/repos/${ghRepo}/contents/${path}`, { headers });
        const data = await res.json();
        fileQuestions = Array.isArray(data) ? data : (data.questions || []);
        if (fileQuestions.length > 0) {
            startExamBtn.removeAttribute('disabled');
            questionLimitInput.max = fileQuestions.length;
            questionLimitInput.value = Math.min(20, fileQuestions.length);
        }
    } catch(err) { alert("Error downloading target cloud file configuration."); }
}

async function pushJsonBankToCloud(fileName, stringContent) {
    ghToken = document.getElementById('ghTokenInput').value.trim();
    ghRepo = document.getElementById('ghRepoInput').value.trim();
    
    // FIXED: Safely bypass cloud uploading if fields are unpopulated or unauthenticated
    if (!ghToken || !ghRepo) {
        console.log("Local Modality Active: Skipping backup upload synchronization loop.");
        return;
    }

    const base64Content = btoa(encodeURIComponent(stringContent).replace(/%([0-9A-F]{2})/g, function(match, p1) {
        return String.fromCharCode('0x' + p1);
    }));
    
    const path = `${targetFolder}/${fileName}`;

    try {
        await fetch(`https://api.github.com/repos/${ghRepo}/contents/${path}`, {
            method: 'PUT',
            headers: { 
                'Authorization': `Bearer ${ghToken}`, 
                'Content-Type': 'application/json' 
            },
            body: JSON.stringify({
                message: `Upload quiz asset: ${fileName}`,
                content: base64Content
            })
        });
        setTimeout(syncCloudRepositoryBankList, 1500);
    } catch (err) { console.error(err); }
}

window.deleteRemoteJsonBank = async function(path, sha) {
    if(!confirm("Erase this asset from GitHub?")) return;
    
    ghToken = document.getElementById('ghTokenInput').value.trim();
    ghRepo = document.getElementById('ghRepoInput').value.trim();

    try {
        const res = await fetch(`https://api.github.com/repos/${ghRepo}/contents/${path}`, {
            method: 'DELETE',
            headers: { 
                'Authorization': `Bearer ${ghToken}`, 
                'Content-Type': 'application/json' 
            },
            body: JSON.stringify({
                message: `Erase item: ${path}`,
                sha: sha
            })
        });
        if(res.ok) {
            alert("Pulled off GitHub repository instances cleanly.");
            setTimeout(syncCloudRepositoryBankList, 1000);
        }
    } catch (err) { alert("API interaction failed."); }
}

// --- STANDARD EXAM CONSOLE MANAGEMENT TRACKS ---
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
                // FIXED: Instantly unlock start buttons locally regardless of backup upload state!
                startExamBtn.removeAttribute('disabled');
                questionLimitInput.max = fileQuestions.length;
                questionLimitInput.value = fileQuestions.length;
                
                // Triggers an background upload task safely if credentials exist
                pushJsonBankToCloud(file.name, rawText);
            }
        } catch(e) { alert("JSON file schema format mismatch error."); }
    };
    reader.readAsText(file);
});

startExamBtn.onclick = () => {
    if(!fileQuestions || fileQuestions.length === 0) {
        alert("Please load a question dataset bank profile first.");
        return;
    }

    operationMode = document.querySelector('input[name="assessmentMode"]:checked').value;
    
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
    
    if (operationMode === "practice") {
        document.getElementById('submitBtn').textContent = "Next Question ➡️";
        document.getElementById('practiceCheckBtn').classList.remove('hidden');
    } else {
        document.getElementById('submitBtn').textContent = "Save & Next ➡️";
        document.getElementById('practiceCheckBtn').classList.add('hidden');
    }
    
    configScreen.classList.add('hidden');
    examConsole.classList.remove('hidden');
    
    buildPaletteGridUI();
    renderQuestionIndex();
    if (timerMode === 'overall') initiateOverallExamTimerLoop();
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
    practiceFeedbackBox.classList.add('hidden'); 
    hasCheckedAnswer = false; 
    
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
            if (operationMode === "practice" && hasCheckedAnswer) return;

            row.querySelector('input').checked = true;
            document.querySelectorAll('.tcs-option-row').forEach(r => r.classList.remove('selected'));
            row.classList.add('selected');
            
            userAnswers[currentIndex] = { selected: key, status: questionStatuses[currentIndex] === 'review' ? 'review':'answered' };
            commitCurrentSessionProgressToCache();
        };
        optionsContainer.appendChild(row);
    });
}

document.getElementById('practiceCheckBtn').onclick = () => {
    const selectedInput = document.querySelector('input[name="opt"]:checked');
    if (!selectedInput) { alert("Please pick an input option first."); return; }
    
    const q = examQuestions[currentIndex];
    const isCorrect = selectedInput.value.toUpperCase() === q.correct_answer.toUpperCase().trim();
    
    practiceFeedbackBox.className = "practice-feedback-card " + (isCorrect ? "feedback-correct" : "feedback-wrong");
    practiceFeedbackBox.innerHTML = isCorrect ? "✓ Correct Answer! Well done. +1 Mark." : `✗ Incorrect Response. Target Answer Key is option (${q.correct_answer.toUpperCase()}).`;
    practiceFeedbackBox.classList.remove('hidden');
    
    hasCheckedAnswer = true; 
    userAnswers[currentIndex] = { selected: selectedInput.value, status: 'answered' };
    questionStatuses[currentIndex] = 'answered';
    updatePaletteMetrics();
    commitCurrentSessionProgressToCache();
};

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
    
    if (operationMode === "practice") {
        if (selectedInput && !hasCheckedAnswer) {
            alert("Please click 'Check Answer' first to verify your selection before moving to the next question.");
            return;
        }
        if (!selectedInput) {
            userAnswers[currentIndex] = { selected: null, status: 'skipped' };
            questionStatuses[currentIndex] = 'notanswered';
        }
    } else {
        if (!selectedInput) { alert("Please choose an answer."); return; }
        userAnswers[currentIndex] = { selected: selectedInput.value, status: 'answered' };
        questionStatuses[currentIndex] = 'answered';
    }
    
    advanceNextExamIndex();
};

document.getElementById('reviewBtn').onclick = () => {
    const selectedInput = document.querySelector('input[name="opt"]:checked');
    userAnswers[currentIndex] = { selected: selectedInput ? selectedInput.value : null, status: 'review' };
    questionStatuses[currentIndex] = 'review';
    advanceNextExamIndex();
};

document.getElementById('clearResponseBtn').onclick = () => {
    if (operationMode === "practice" && hasCheckedAnswer) return; 

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
document.getElementById('calcToggleBtn').onclick = () => calcPad.classList.toggle('hidden');
document.getElementById('calcCloseBtn').onclick = () => calcPad.classList.add('hidden');

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

document.getElementById('restartBtn').onclick = () => {
    resultScreen.classList.add('hidden'); configScreen.classList.remove('hidden');
    fileUploader.value = ''; startExamBtn.setAttribute('disabled', false);
};
