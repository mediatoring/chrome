document.addEventListener('DOMContentLoaded', function() {
    const questionsData = document.getElementById('questionsData');
    const startBtn = document.getElementById('startBtn');
    const stopBtn = document.getElementById('stopBtn');
    const status = document.getElementById('status');

    // Načtení uložených dat
    chrome.storage.local.get(['questionsData'], function(result) {
        if (result.questionsData) {
            questionsData.value = result.questionsData;
        }
    });

    // Uložení dat při změně
    questionsData.addEventListener('input', function() {
        chrome.storage.local.set({questionsData: questionsData.value});
    });

    startBtn.addEventListener('click', async function() {
        const data = questionsData.value.trim();
        if (!data) {
            showStatus('Zadej otázky a odpovědi!', 'error');
            return;
        }

        // Parsování dat
        const lines = data.split('\n').filter(line => line.trim() && line.includes('|'));
        const questions = lines.map(line => {
            const [question, answer] = line.split('|').map(s => s.trim());
            return {question, answer};
        });

        if (questions.length === 0) {
            showStatus('Neplatný formát! Použij: Otázka|Odpověď', 'error');
            return;
        }

        try {
            // Získání aktivní záložky
            const [tab] = await chrome.tabs.query({active: true, currentWindow: true});
            
            // Vložení content scriptu ručně
            await chrome.scripting.executeScript({
                target: {tabId: tab.id},
                files: ['content.js']
            });

            // Krátká pauza pro inicializaci
            setTimeout(() => {
                // Odeslání dat do content scriptu
                chrome.tabs.sendMessage(tab.id, {
                    action: 'start',
                    questions: questions
                }, (response) => {
                    if (chrome.runtime.lastError) {
                        showStatus('Chyba spojení: ' + chrome.runtime.lastError.message, 'error');
                    } else {
                        showStatus(`Spuštěno s ${questions.length} otázkami`, 'success');
                    }
                });
            }, 500);

        } catch (error) {
            showStatus('Chyba: ' + error.message, 'error');
        }
    });

    stopBtn.addEventListener('click', async function() {
        try {
            const [tab] = await chrome.tabs.query({active: true, currentWindow: true});
            chrome.tabs.sendMessage(tab.id, {action: 'stop'}, (response) => {
                if (chrome.runtime.lastError) {
                    showStatus('Chyba při zastavování', 'error');
                } else {
                    showStatus('Zastaveno', 'error');
                }
            });
        } catch (error) {
            showStatus('Chyba: ' + error.message, 'error');
        }
    });

    function showStatus(message, type) {
        status.textContent = message;
        status.className = `status ${type}`;
        status.style.display = 'block';
        setTimeout(() => {
            status.style.display = 'none';
        }, 3000);
    }
});