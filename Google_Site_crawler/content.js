// Informační zpráva o načtení content skriptu
console.log("Content script byl načten:", window.location.href);

// Funkce pro extrakci URL ze stránky
function extractUrls() {
  console.log("Zahájeno vyhledávání URL na stránce:", window.location.href);
  
  // Kontrola, zda jsme na přihlašovací stránce
  if (window.location.href.includes('accounts.google.com')) {
    console.log("Jsme na přihlašovací stránce, nemůžeme extrahovat URL");
    
    try {
      chrome.runtime.sendMessage({
        action: 'loginPageDetected',
        url: window.location.href
      });
    } catch (error) {
      console.error("Chyba při oznámení přihlašovací stránky:", error);
    }
    
    return;
  }
  
  // Získání všech odkazů
  const links = document.querySelectorAll('a[href]');
  const urls = [];
  
  // Zpracování odkazů
  links.forEach(link => {
    const href = link.href;
    
    // Ignorujeme prázdné a javascript: odkazy
    if (!href || href.startsWith('javascript:')) return;
    
    // Kontrola, zda odkaz patří do Google Sites
    if (href.includes('sites.google.com') && href.startsWith('https://')) {
      urls.push(href);
    }
  });
  
  console.log("Nalezeno celkem URL:", urls.length);
  
  // Poslání nalezených URL zpět do background skriptu
  try {
    chrome.runtime.sendMessage({
      action: 'newUrlsFound',
      urls: urls,
      currentUrl: window.location.href
    });
  } catch (error) {
    console.error("Chyba při odesílání URL do background skriptu:", error);
  }
}

// Oznámení background skriptu o načtení content skriptu
try {
  chrome.runtime.sendMessage({
    action: 'contentScriptLoaded',
    url: window.location.href
  });
} catch (error) {
  console.error("Chyba při oznámení načtení content skriptu:", error);
}

// Posluchač zpráv od background skriptu
chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {
  console.log("Content script přijal zprávu:", message);
  
  if (message.action === 'extractUrls') {
    // Ihned pošleme odpověď, abychom udrželi komunikační kanál otevřený
    sendResponse({ status: 'starting_extraction' });
    
    // Spustíme extrakci
    extractUrls();
    
    return true; // asynchronní odpověď
  }
});

// Spustíme extrakci po úplném načtení stránky
window.addEventListener('load', function() {
  // Čekáme ještě chvíli po načtení, protože Google Sites 
  // mohou mít zpožděné načítání obsahu
  setTimeout(extractUrls, 2000);
});