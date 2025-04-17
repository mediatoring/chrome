// Stav procházení
let crawlState = {
    isRunning: false,
    rootUrl: null,
    urlQueue: [],
    visitedUrls: new Set(),
    foundUrls: [],
    currentTabId: null,
    authParams: '' // Parametry autentizace z původní URL
  };
  
  // Nastavení posluchačů zpráv
  chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {
    console.log("Background skript přijal zprávu:", message);
    
    if (message.action === 'startCrawling') {
      startCrawling(message.rootUrl, sendResponse);
      return true; // asynchronní odpověď
    } else if (message.action === 'stopCrawling') {
      stopCrawling();
      sendResponse({ success: true });
    } else if (message.action === 'resetState') {
      resetState();
      sendResponse({ success: true });
    } else if (message.action === 'getStatus') {
      sendResponse({
        isRunning: crawlState.isRunning,
        foundUrls: crawlState.foundUrls,
        status: getStatusMessage()
      });
    } else if (message.action === 'getFoundUrls') {
      sendResponse({ foundUrls: crawlState.foundUrls });
    }
    
    return false;
  });
  
  // Inicializace při instalaci nebo aktualizaci
  chrome.runtime.onInstalled.addListener(function() {
    resetState();
  });
  
  function startCrawling(rootUrl, sendResponse) {
    if (crawlState.isRunning) {
      sendResponse({ error: 'Skenování již běží.' });
      return;
    }
    
    // Validace root URL
    if (!rootUrl || !rootUrl.startsWith('https://sites.google.com/')) {
      sendResponse({ error: 'Neplatná URL. Zadejte platnou Google Sites URL.' });
      return;
    }
    
    // Získání aktivního tabu
    chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
      if (!tabs || tabs.length === 0) {
        sendResponse({ error: 'Nelze získat aktivní tab.' });
        return;
      }
      
      const activeTab = tabs[0];
      console.log("Aktivní tab URL:", activeTab.url);
      
      // Extrahování parametrů autentizace
      let authParams = '';
      if (activeTab.url.includes('?')) {
        authParams = activeTab.url.split('?')[1];
        console.log("Získány parametry autentizace:", authParams);
      }
      
      // Normalizace a příprava root URL
      const baseRootUrl = normalizeUrlBase(rootUrl);
      
      // Inicializace stavu
      crawlState = {
        isRunning: true,
        rootUrl: baseRootUrl,
        urlQueue: [baseRootUrl],
        visitedUrls: new Set(),
        foundUrls: [baseRootUrl],
        currentTabId: activeTab.id,
        authParams: authParams
      };
      
      // Uložení stavu
      saveState();
      
      // Aktualizace UI
      broadcastStatus('Skenování spuštěno.');
      
      // Spustíme procházení stránek přímo na aktivním tabu pomocí content skriptu
      extractLinksFromCurrentTab(activeTab.id);
      
      sendResponse({ success: true });
    });
  }
  
  function stopCrawling() {
    crawlState.isRunning = false;
    saveState();
    broadcastStatus('Skenování zastaveno.');
  }
  
  function resetState() {
    crawlState = {
      isRunning: false,
      rootUrl: null,
      urlQueue: [],
      visitedUrls: new Set(),
      foundUrls: [],
      currentTabId: null,
      authParams: ''
    };
    
    // Vymazání uložených dat
    chrome.storage.local.remove(['crawlState']);
    
    broadcastStatus('Stav resetován.');
  }
  
  // Nový přístup: Extrakce odkazů bez navigace
  function extractLinksFromCurrentTab(tabId) {
    console.log("Extrakce odkazů z aktuálního tabu:", tabId);
    
    chrome.scripting.executeScript({
      target: { tabId: tabId },
      func: function() {
        // Funkce spuštěná v kontextu stránky
        const links = document.querySelectorAll('a[href]');
        const urls = [];
        
        // Procházení všech odkazů
        links.forEach(link => {
          if (link.href && 
              link.href.includes('sites.google.com') && 
              link.href.startsWith('https://') &&
              !link.href.includes('accounts.google.com')) {
            
            // Přidání odkazu do seznamu
            urls.push({
              url: link.href,
              text: link.textContent.trim()
            });
          }
        });
        
        return urls;
      }
    }, (results) => {
      if (chrome.runtime.lastError) {
        console.error("Chyba při extrakci odkazů:", chrome.runtime.lastError);
        finishCrawling();
        return;
      }
      
      if (!results || !results[0] || !results[0].result) {
        console.log("Nepodařilo se získat odkazy.");
        finishCrawling();
        return;
      }
      
      // Zpracování výsledků
      const links = results[0].result;
      console.log("Extrahováno odkazů:", links.length);
      
      // Zjistíme, které odkazy nebyly ještě navštíveny
      const newLinks = links.filter(link => 
        !crawlState.visitedUrls.has(normalizeUrlBase(link.url))
      );
      
      if (newLinks.length === 0) {
        console.log("Nenalezeny žádné nové odkazy.");
        finishCrawling();
        return;
      }
      
      // Rekurzivně procházíme všechny odkazy na stránce, bez navigace!
      processBatch(links, 0);
    });
  }
  
  // Rekurzivní zpracování dávky odkazu
  function processBatch(links, index) {
    if (!crawlState.isRunning || index >= links.length) {
      finishCrawling();
      return;
    }
    
    const link = links[index];
    const normalizedUrl = normalizeUrlBase(link.url);
    
    // Kontrola, zda odkaz patří do naší domény a ještě nebyl navštíven
    if (normalizedUrl.startsWith(crawlState.rootUrl) && 
        !crawlState.visitedUrls.has(normalizedUrl)) {
      
      console.log(`Zpracovávám odkaz ${index + 1}/${links.length}: ${link.url}`);
      broadcastStatus(`Procházení: ${link.text || link.url}... (${crawlState.foundUrls.length} URL nalezeno)`);
      
      // Přidání odkazu do seznamu navštívených
      crawlState.visitedUrls.add(normalizedUrl);
      
      // Přidání do seznamu nalezených, pokud tam ještě není
      if (!crawlState.foundUrls.includes(normalizedUrl)) {
        crawlState.foundUrls.push(normalizedUrl);
        
        // Aktualizace UI
        broadcastMessage({
          action: 'newUrlFound',
          foundUrls: crawlState.foundUrls
        });
        
        // Uložení stavu
        saveState();
      }
      
      // Připravíme URL s parametry autentizace
      const urlToFetch = addAuthParams(link.url, crawlState.authParams);
      
      // Stáhneme obsah stránky pomocí fetch v kontextu stránky
      chrome.scripting.executeScript({
        target: { tabId: crawlState.currentTabId },
        func: function(url) {
          return fetch(url, { 
            credentials: 'include', // Důležité: posíláme cookies 
            mode: 'cors'
          })
          .then(response => {
            if (!response.ok) {
              throw new Error('Síťová odpověď nebyla v pořádku.');
            }
            return response.text();
          })
          .then(html => {
            // Vytvoříme DOM parser a zparsujeme HTML
            const parser = new DOMParser();
            const doc = parser.parseFromString(html, 'text/html');
            
            // Získáme všechny odkazy
            const links = doc.querySelectorAll('a[href]');
            const urls = [];
            
            links.forEach(link => {
              if (link.href && 
                  link.href.includes('sites.google.com') && 
                  link.href.startsWith('https://') &&
                  !link.href.includes('accounts.google.com')) {
                
                urls.push({
                  url: link.href,
                  text: link.textContent.trim()
                });
              }
            });
            
            return urls;
          })
          .catch(error => {
            console.error('Chyba při stahování:', error);
            return [];
          });
        },
        args: [urlToFetch]
      }, (results) => {
        if (chrome.runtime.lastError || !results || !results[0] || !results[0].result) {
          console.log(`Chyba při zpracování odkazu ${link.url}:`, chrome.runtime.lastError);
        } else {
          const newLinks = results[0].result;
          console.log(`Nalezeno ${newLinks.length} odkazů na stránce ${link.url}`);
          
          // Zpracování nalezených odkazů
          processFoundLinks(newLinks);
        }
        
        // Posun na další odkaz
        setTimeout(() => {
          processBatch(links, index + 1);
        }, 300);
      });
    } else {
      // Tento odkaz přeskočíme a jdeme na další
      processBatch(links, index + 1);
    }
  }
  
  // Zpracování nalezených odkazů na stránce
  function processFoundLinks(newLinks) {
    if (!crawlState.isRunning || !newLinks || newLinks.length === 0) return;
    
    let addedCount = 0;
    
    newLinks.forEach(link => {
      const normalizedUrl = normalizeUrlBase(link.url);
      
      // Kontrola, zda odkaz patří do naší domény a ještě nebyl navštíven
      if (normalizedUrl.startsWith(crawlState.rootUrl) && 
          !crawlState.visitedUrls.has(normalizedUrl) && 
          !crawlState.foundUrls.includes(normalizedUrl)) {
        
        // Přidání do fronty a seznamu nalezených
        crawlState.foundUrls.push(normalizedUrl);
        addedCount++;
      }
    });
    
    if (addedCount > 0) {
      console.log(`Přidáno ${addedCount} nových URL.`);
      
      // Aktualizace UI
      broadcastMessage({
        action: 'newUrlFound',
        foundUrls: crawlState.foundUrls
      });
      
      // Uložení stavu
      saveState();
    }
  }
  
  // Dokončení procházení
  function finishCrawling() {
    if (!crawlState.isRunning) return;
    
    crawlState.isRunning = false;
    
    broadcastStatus(`Skenování dokončeno. Nalezeno ${crawlState.foundUrls.length} URL.`);
    saveState();
  }
  
  // Pomocné funkce
  function normalizeUrlBase(url) {
    // Odstranění parametrů z URL (vše za ?)
    let cleanUrl = url.split('?')[0];
    
    // Odstranění trailing slash, pokud existuje
    if (cleanUrl.endsWith('/') && cleanUrl.split('/').length > 5) {
      cleanUrl = cleanUrl.slice(0, -1);
    }
    
    return cleanUrl;
  }
  
  function addAuthParams(url, authParams) {
    if (!authParams) return url;
    
    // Přidání parametrů autentizace k URL
    const separator = url.includes('?') ? '&' : '?';
    return `${url}${separator}${authParams}`;
  }
  
  function broadcastStatus(status) {
    broadcastMessage({
      action: 'statusUpdate',
      status: status,
      isRunning: crawlState.isRunning,
      foundUrls: crawlState.foundUrls
    });
  }
  
  function broadcastMessage(message) {
    chrome.runtime.sendMessage(message, () => {
      if (chrome.runtime.lastError) {
        // Ignorujeme chybu, pokud popup není otevřený
        console.log("Broadcast zpráva nemohla být doručena - pravděpodobně není otevřen popup.");
      }
    });
  }
  
  function getStatusMessage() {
    if (crawlState.isRunning) {
      return `Skenování probíhá... Nalezeno ${crawlState.foundUrls.length} URL.`;
    } else if (crawlState.foundUrls.length > 0) {
      return `Skenování dokončeno. Nalezeno ${crawlState.foundUrls.length} URL.`;
    } else {
      return 'Připraven ke skenování.';
    }
  }
  
  function saveState() {
    // Konverze Set na pole pro ukládání
    const stateToSave = {
      ...crawlState,
      visitedUrls: Array.from(crawlState.visitedUrls)
    };
    
    chrome.storage.local.set({
      crawlState: stateToSave,
      foundUrls: crawlState.foundUrls,
      rootUrl: crawlState.rootUrl
    });
  }
  
  // Načtení stavu při spuštění
  chrome.storage.local.get(['crawlState'], function(data) {
    if (data.crawlState) {
      // Konverze pole zpět na Set
      crawlState = {
        ...data.crawlState,
        visitedUrls: new Set(data.crawlState.visitedUrls)
      };
    }
  });