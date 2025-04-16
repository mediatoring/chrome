// Nasloucháme zprávám z popup.js
chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {
    if (message.action === 'insertText') {
      // Spustíme script v aktivní záložce
      chrome.scripting.executeScript({
        target: { tabId: message.tabId },
        function: insertText,
        args: [message.text]
      });
    }
  });
  
  // Funkce, která vloží text do aktivního elementu
  function insertText(text) {
    // Získáme aktivní element
    const activeElement = document.activeElement;
    
    // Zkontrolujeme, zda je to textové pole nebo editovatelný obsah
    if (activeElement && 
        (activeElement.tagName === 'INPUT' || 
         activeElement.tagName === 'TEXTAREA' || 
         activeElement.isContentEditable)) {
      
      // Pro pole input a textarea
      if (activeElement.tagName === 'INPUT' || activeElement.tagName === 'TEXTAREA') {
        const start = activeElement.selectionStart || 0;
        const end = activeElement.selectionEnd || 0;
        const value = activeElement.value || '';
        
        // Vložíme text na pozici kurzoru
        activeElement.value = value.substring(0, start) + text + value.substring(end);
        
        // Posuneme kurzor za vložený text
        activeElement.selectionStart = activeElement.selectionEnd = start + text.length;
      } 
      // Pro editovatelný obsah
      else if (activeElement.isContentEditable) {
        // Použijeme document.execCommand pro vložení textu
        document.execCommand('insertText', false, text);
      }
    }
  }