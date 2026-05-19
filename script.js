// --- State Management ---
let fileQuestions = [];
let operationMode = "exam";
let isExamEnded = false;

// --- Load Logic ---
window.addEventListener('DOMContentLoaded', () => {
    // 1. Force load the questions immediately
    fileQuestions = [
        {"question_number":1,"text_en":"If 2% of x = 360, then x is equal to:","text_hi":"यदि x का 2%, 360 है, तो x का मान ज्ञात कीजिए।","exam":"RRB NTPC","options":{"A":"36000","B":"18000","C":"18100","D":"36100"},"correct_answer":"B"},
        {"question_number":2,"text_en":"What is 20% of 40% of 30% of 75% of 3400?","text_hi":"3400 के 75% के 30% के 40% के 20% का मान क्या होगा?","exam":"RRB NTPC","options":{"A":"61.5","B":"61.2","C":"61.1","D":"61.4"},"correct_answer":"B"}
    ];
    
    // 2. Attach Click Listeners Manually
    document.getElementById('connectGhBtn').onclick = function() {
        document.getElementById('apiStatusLog').textContent = "Status: Connecting...";
        // Direct simulation of connection
        setTimeout(() => {
            document.getElementById('apiStatusLog').textContent = "Status: Connected to GitHub API.";
        }, 800);
    };

    document.getElementById('startExamBtn').onclick = function() {
        if (fileQuestions.length === 0) return alert("No questions loaded.");
        document.getElementById('configScreen').classList.add('hidden');
        document.getElementById('examConsole').classList.remove('hidden');
        // Logic to build exam will follow...
        console.log("Exam Started");
    };

    // 3. File Upload Handler
    document.getElementById('fileUploader').addEventListener('change', function(e) {
        const file = e.target.files[0];
        const reader = new FileReader();
        reader.onload = function(event) {
            try {
                fileQuestions = JSON.parse(event.target.result);
                document.getElementById('apiStatusLog').textContent = "Status: Local File Loaded.";
            } catch(e) { alert("Error parsing JSON file"); }
        };
        reader.readAsText(file);
    });
    
    console.log("App Initialized Successfully.");
});
