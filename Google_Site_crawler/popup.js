document.addEventListener('DOMContentLoaded', function() {
    // Načtení a nastavení dříve uložených dat
    loadSavedState();
    
    // Elementy UI
    const rootUrlInput = document.getElementById('rootUrl');
    const startButton = document.getElementById('startButton');
    const stopButton = document.getElementById('stopButton');
    const resetButton = document.getElementById('resetButton');
    const downloadCsvButton = document.getElementById('downloadCsv');
    const downloadTxtButton = document.getElementById('downloadTxt');
    const statusElement = document.getElementById('status');
    const resultsElement = document.getElementById('results');
    const urlCountElement = document.getElementById('urlCount');
    
    // Event listenery
    startButton.addEventListener('click', startCrawling);
    stopButton.addEventListener('click', stopCrawling);
    resetButton.addEventListener('click', resetState);
    downloadCsvButton.addEventListener('click', downloadAsCsv);
    downloadTxtButton.addEventListener('click', downloadAsTxt);
    
    // Kontrola aktuálního stavu procházení
    chrome.runtime.sendMessage({ action: 'getStatus' }, function(response) {
      updateUIState(response.isRunning, response.foundUrls || []);
    });
    
    // Posluchač zpráv od background skriptu
    chrome.runtime.onMessage.addListener(function(message) {
      if (message.action === 'statusUpdate') {
        updateUIState(message.isRunning, message.foundUrls);
        updateStatusMessage(message.status, message.isRunning);
      } else if (message.action === 'newUrlFound') {
        updateUIState(true, message.foundUrls);
      }
    });
    
    function startCrawling() {
      const rootUrl = rootUrlInput.value.trim();
      
      if (!rootUrl || !rootUrl.startsWith('https://sites.google.com/')) {
        updateStatusMessage('Neplatná URL. Zadejte platnou Google Sites URL.', false, true);
        return;
      }
      
      // Uložení root URL
      chrome.storage.local.set({ rootUrl: rootUrl });
      
      updateStatusMessage('Spouštím skenování...', true);
      
      // Poslání zprávy background skriptu pro spuštění procházení
      chrome.runtime.sendMessage({
        action: 'startCrawling',
        rootUrl: rootUrl
      }, function(response) {
        if (response && response.error) {
          updateStatusMessage(`Chyba: ${response.error}`, false, true);
        }
      });
    }
    
    function stopCrawling() {
      chrome.runtime.sendMessage({ action: 'stopCrawling' });
      updateStatusMessage('Skenování zastaveno uživatelem.', false);
    }
    
    function resetState() {
      chrome.runtime.sendMessage({ action: 'resetState' });
      rootUrlInput.value = '';
      resultsElement.innerHTML = '';
      urlCountElement.textContent = '0';
      updateStatusMessage('Vše bylo resetováno.', false);
      
      // Vymazání uložených dat
      chrome.storage.local.remove(['rootUrl', 'foundUrls']);
    }
    
    function updateUIState(isRunning, foundUrls) {
      startButton.disabled = isRunning;
      stopButton.disabled = !isRunning;
      
      displayUrls(foundUrls);
      urlCountElement.textContent = foundUrls.length;
      
      downloadCsvButton.disabled = foundUrls.length === 0;
      downloadTxtButton.disabled = foundUrls.length === 0;
    }
    
    function updateStatusMessage(message, isRunning, isError = false) {
      statusElement.textContent = message;
      statusElement.className = '';
      
      // Pokud zpráva obsahuje informaci o přihlášení, zvýrazníme ji
      if (message.includes('přihlášení') || message.includes('Přihlaste se')) {
        isError = true;
        // Při detekci přihlášení nastavíme tlačítka správně
        startButton.disabled = false;
        stopButton.disabled = true;
      }
      
      if (isRunning) {
        statusElement.classList.add('status-running');
      } else if (isError) {
        statusElement.classList.add('status-error');
      } else {
        statusElement.classList.add('status-complete');
      }
    }
    
    function displayUrls(urls) {
      if (!urls || urls.length === 0) {
        resultsElement.innerHTML = '<p>Zatím žádné URL nebyly nalezeny.</p>';
        return;
      }
      
      let html = '';
      urls.forEach(url => {
        html += `<div>${url}</div>`;
      });
      
      resultsElement.innerHTML = html;
    }
    
    function downloadAsCsv() {
      chrome.runtime.sendMessage({ action: 'getFoundUrls' }, function(response) {
        if (response.foundUrls && response.foundUrls.length > 0) {
          const csvContent = 'URL\n' + response.foundUrls.join('\n');
          downloadFile(csvContent, 'google_sites_urls.csv', 'text/csv');
        }
      });
    }
    
    function downloadAsTxt() {
      chrome.runtime.sendMessage({ action: 'getFoundUrls' }, function(response) {
        if (response.foundUrls && response.foundUrls.length > 0) {
          const txtContent = response.foundUrls.join('\n');
          downloadFile(txtContent, 'google_sites_urls.txt', 'text/plain');
        }
      });
    }
    
    function downloadFile(content, filename, contentType) {
      const blob = new Blob([content], { type: contentType });
      const url = URL.createObjectURL(blob);
      
      chrome.downloads.download({
        url: url,
        filename: filename,
        saveAs: true
      });
    }
    
    function loadSavedState() {
      chrome.storage.local.get(['rootUrl', 'foundUrls'], function(data) {
        if (data.rootUrl) {
          document.getElementById('rootUrl').value = data.rootUrl;
        }
        
        if (data.foundUrls && data.foundUrls.length > 0) {
          displayUrls(data.foundUrls);
          urlCountElement.textContent = data.foundUrls.length;
          downloadCsvButton.disabled = false;
          downloadTxtButton.disabled = false;
        }
      });
    }
  });