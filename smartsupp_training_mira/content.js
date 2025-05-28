let isRunning = false;
let questions = [];
let currentIndex = 0;
let intervalId;

// Počkej na plné načtení stránky
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

function init() {
    console.log('Content script inicializován');
}

// Poslouchání zpráv z popup
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    console.log('Přijata zpráva:', request);
    
    if (request.action === 'start') {
        questions = request.questions;
        currentIndex = 0;
        startAutoFill();
        sendResponse({success: true});
    } else if (request.action === 'stop') {
        stopAutoFill();
        sendResponse({success: true});
    }
});

function startAutoFill() {
    if (isRunning) return;
    
    isRunning = true;
    console.log('Auto-fill spuštěn s', questions.length, 'otázkami');
    
    // Spustí první vyplnění po 1 sekundě
    setTimeout(() => {
        fillNextQuestion();
    }, 1000);
}

function stopAutoFill() {
    isRunning = false;
    if (intervalId) {
        clearInterval(intervalId);
        intervalId = null;
    }
    console.log('Auto-fill zastaven');
}

function fillNextQuestion() {
    if (!isRunning || currentIndex >= questions.length) return;
    
    const currentQuestion = questions[currentIndex];
    console.log(`Vyplňujem otázku ${currentIndex + 1}:`, currentQuestion.question);
    
    // Najdi a klikni na tlačítko "+ Přidat"
    const addButton = document.querySelector('[data-testid="training-list-add-new"]');
    if (!addButton) {
        console.error('Tlačítko "+ Přidat" nenalezeno');
        // Zkus to znovu za 2 sekundy
        setTimeout(() => fillNextQuestion(), 2000);
        return;
    }
    
    console.log('Klikám na tlačítko + Přidat');
    addButton.click();
    
    // Počkej na otevření modalu a vyplň formulář
    setTimeout(() => {
        fillModal(currentQuestion);
    }, 1500);
}

function fillModal(questionData) {
    console.log('Hledám modal inputs...');
    
    // Najdi input pro otázku
    const questionInput = document.querySelector('[data-testid="training-modal-question-input"]');
    if (questionInput) {
        console.log('Vyplňuji otázku:', questionData.question);
        questionInput.value = questionData.question;
        questionInput.dispatchEvent(new Event('input', { bubbles: true }));
        questionInput.dispatchEvent(new Event('change', { bubbles: true }));
    } else {
        console.error('Input pro otázku nenalezen');
    }
    
    // Najdi textarea pro odpověď
    const answerTextarea = document.querySelector('[data-testid="training-modal-answer-input"]');
    if (answerTextarea) {
        console.log('Vyplňuji odpověď:', questionData.answer);
        answerTextarea.value = questionData.answer;
        answerTextarea.dispatchEvent(new Event('input', { bubbles: true }));
        answerTextarea.dispatchEvent(new Event('change', { bubbles: true }));
    } else {
        console.error('Textarea pro odpověď nenalezena');
    }
    
    // Automaticky potvrdí modal po krátké pauze
    setTimeout(() => {
        // Najdi potvrzovací tlačítko
        const confirmButton = document.querySelector('button[type="submit"]') ||
                            document.querySelector('button:contains("Uložit")') ||
                            document.querySelector('button:contains("Potvrdit")') ||
                            document.querySelector('button:contains("Přidat")');
        
        if (confirmButton) {
            console.log('Klikám na potvrzovací tlačítko');
            confirmButton.click();
            
            // Naplánuj další otázku
            currentIndex++;
            setTimeout(() => {
                if (currentIndex < questions.length) {
                    fillNextQuestion();
                } else {
                    stopAutoFill();
                    console.log('Všechny otázky vyplněny!');
                }
            }, 2000);
        } else {
            console.error('Potvrzovací tlačítko nenalezeno');
            currentIndex++;
        }
    }, 1000);
}