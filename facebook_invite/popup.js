// Počkáme, až se DOM plně načte
document.addEventListener('DOMContentLoaded', function() {
    // Definice proměnných až po načtení DOM
    const startButton = document.getElementById('startButton');
    const stopButton = document.getElementById('stopButton');
    const statusDiv = document.getElementById('status');
    const delayInput = document.getElementById('delayInput');
    const scrollDelayInput = document.getElementById('scrollDelayInput');
    
    // Přidáme posluchače událostí pokud existují prvky
    if (startButton) {
      startButton.addEventListener('click', function() {
        startInviting(startButton, stopButton, statusDiv, delayInput, scrollDelayInput);
      });
    } else {
      console.error('Start button nebyl nalezen');
    }
    
    if (stopButton) {
      stopButton.addEventListener('click', function() {
        stopInviting(startButton, stopButton, statusDiv);
      });
    } else {
      console.error('Stop button nebyl nalezen');
    }
  });
  
  // Globální proměnná pro sledování stavu
  let invitingInProgress = false;
  
  function startInviting(startButton, stopButton, statusDiv, delayInput, scrollDelayInput) {
    const delay = delayInput ? delayInput.value : 500;
    const scrollDelay = scrollDelayInput ? scrollDelayInput.value : 1500;
    
    if (startButton) startButton.style.display = 'none';
    if (stopButton) stopButton.style.display = 'block';
    if (statusDiv) statusDiv.textContent = 'Odesílám pozvánky...';
    
    invitingInProgress = true;
    
    chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
      chrome.scripting.executeScript({
        target: { tabId: tabs[0].id },
        function: invitePeople,
        args: [parseInt(delay), parseInt(scrollDelay)]
      }, (results) => {
        if (results && results[0]) {
          if (statusDiv) statusDiv.textContent = 'Proces pozvávání běží...';
        } else {
          if (statusDiv) statusDiv.textContent = 'Došlo k chybě při spouštění.';
          resetButtons(startButton, stopButton);
        }
      });
    });
  }
  
  function stopInviting(startButton, stopButton, statusDiv) {
    invitingInProgress = false;
    
    chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
      chrome.scripting.executeScript({
        target: { tabId: tabs[0].id },
        function: stopInvitingProcess
      }, () => {
        if (statusDiv) statusDiv.textContent = 'Proces zastaven.';
        resetButtons(startButton, stopButton);
      });
    });
  }
  
  function resetButtons(startButton, stopButton) {
    if (startButton) startButton.style.display = 'block';
    if (stopButton) stopButton.style.display = 'none';
  }
  
  // Sledovat stav procesu
  chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    const statusDiv = document.getElementById('status');
    const startButton = document.getElementById('startButton');
    const stopButton = document.getElementById('stopButton');
    
    if (request.action === "updateCounter") {
      if (statusDiv) statusDiv.textContent = `Pozváno: ${request.count}`;
    } else if (request.action === "processComplete") {
      if (statusDiv) statusDiv.textContent = `Proces dokončen. Celkem pozváno: ${request.count}`;
      resetButtons(startButton, stopButton);
    }
  });
  
  // Funkce, která se bude spouštět v kontextu stránky Facebooku
  function invitePeople(clickDelay, scrollDelay) {
    // Globální proměnné pro sledování stavu
    window.fbAutoInviter = {
      isRunning: true,
      invitedCount: 0,
      scrollingAttempts: 0,
      lastScrollPosition: 0,
      clickDelay: clickDelay || 500,
      scrollDelay: scrollDelay || 1500
    };
    
    console.log('Facebook Auto Inviter spuštěn:', window.fbAutoInviter);
    
    // Funkce pro klikání na tlačítka "Pozvat"
    function processInviteButtons() {
      if (!window.fbAutoInviter.isRunning) {
        console.log('Proces byl zastaven.');
        return;
      }
      
      // Hledáme všechna tlačítka "Pozvat" podle textu ve spanu
      const inviteButtons = [];
      const spans = document.querySelectorAll('span');
      
      for (let span of spans) {
        if (span.textContent === 'Pozvat' && span.closest('[role="button"]')) {
          const button = span.closest('[role="button"]');
          if (!button.getAttribute('data-invited') && button.offsetParent !== null) {
            inviteButtons.push(button);
          }
        }
      }
      
      console.log(`Nalezeno ${inviteButtons.length} nových tlačítek Pozvat`);
      
      // Klikáme na nalezená tlačítka s nastaveným zpožděním
      if (inviteButtons.length > 0) {
        window.fbAutoInviter.scrollingAttempts = 0; // Reset pokusů při nálezu tlačítek
        
        for (let i = 0; i < inviteButtons.length; i++) {
          setTimeout(() => {
            if (!window.fbAutoInviter.isRunning) return;
            
            if (inviteButtons[i] && !inviteButtons[i].getAttribute('data-invited')) {
              try {
                inviteButtons[i].click();
                inviteButtons[i].setAttribute('data-invited', 'true');
                window.fbAutoInviter.invitedCount++;
                
                // Odeslat počítadlo zpět do popup
                chrome.runtime.sendMessage({
                  action: "updateCounter",
                  count: window.fbAutoInviter.invitedCount
                });
                
                console.log(`Pozváno: ${window.fbAutoInviter.invitedCount}`);
              } catch (error) {
                console.error('Chyba při klikání na tlačítko:', error);
              }
            }
            
            // Po zpracování všech tlačítek, scrollujeme dolů pro načtení dalších
            if (i === inviteButtons.length - 1) {
              setTimeout(scrollDown, 1000);
            }
          }, i * window.fbAutoInviter.clickDelay);
        }
      } else {
        // Žádná tlačítka nenalezena, zkusíme scrollovat dolů
        scrollDown();
      }
    }
    
    // Funkce pro scrollování v dialogu
    function scrollDown() {
      if (!window.fbAutoInviter.isRunning) return;
      
      // Najdeme dialog s tlačítky (většinou je to modal s rolí "dialog")
      const dialog = document.querySelector('[role="dialog"]');
      if (!dialog) {
        console.log('Dialog nebyl nalezen');
        finishProcess();
        return;
      }
      
      // Najdeme scrollovatelný element v dialogu
      const scrollables = Array.from(dialog.querySelectorAll('div')).filter(div => {
        const style = window.getComputedStyle(div);
        return (style.overflowY === 'auto' || style.overflowY === 'scroll') && 
               div.scrollHeight > div.clientHeight;
      });
      
      if (scrollables.length === 0) {
        console.log('Scrollovatelný element nebyl nalezen');
        finishProcess();
        return;
      }
      
      const scrollable = scrollables[0];
      const currentScrollPosition = scrollable.scrollTop;
      
      // Zkontrolujeme, zda jsme se při předchozím pokusu posunuli
      if (Math.abs(currentScrollPosition - window.fbAutoInviter.lastScrollPosition) < 5) {
        window.fbAutoInviter.scrollingAttempts++;
        console.log(`Scroll se nepohnul, pokus: ${window.fbAutoInviter.scrollingAttempts}`);
        
        // Po několika pokusech skončíme, nejspíš jsme na konci seznamu
        if (window.fbAutoInviter.scrollingAttempts >= 5) {
          console.log('Dosažen konec seznamu.');
          finishProcess();
          return;
        }
      } else {
        window.fbAutoInviter.scrollingAttempts = 0;
      }
      
      // Zapamatujeme si aktuální pozici pro další kontrolu
      window.fbAutoInviter.lastScrollPosition = scrollable.scrollTop;
      
      // Scrollujeme o kus dolů
      scrollable.scrollTop += 300;
      
      // Počkáme na načtení nového obsahu a pak hledáme další tlačítka
      setTimeout(processInviteButtons, window.fbAutoInviter.scrollDelay);
    }
    
    // Funkce pro ukončení procesu
    function finishProcess() {
      if (!window.fbAutoInviter.isRunning) return;
      
      console.log(`Proces dokončen. Celkem pozváno: ${window.fbAutoInviter.invitedCount}`);
      window.fbAutoInviter.isRunning = false;
      
      // Odeslat informaci o dokončení zpět do popup
      chrome.runtime.sendMessage({
        action: "processComplete",
        count: window.fbAutoInviter.invitedCount
      });
    }
    
    // Spustíme proces
    processInviteButtons();
    
    return "Proces pozvávání byl spuštěn";
  }
  
  // Funkce pro zastavení procesu pozvávání
  function stopInvitingProcess() {
    if (window.fbAutoInviter) {
      window.fbAutoInviter.isRunning = false;
      console.log('Proces pozvávání byl zastaven.');
      return "Proces zastaven";
    }
    return "Proces nebyl spuštěn";
  }