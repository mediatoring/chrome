// Automaticke potvrzovani provizi s datovym filtrem
let isProcessing = false;

function parseCzechDate(dateStr) {
    // Parsuje datum ve formatu "26. 04. 2025" nebo "26.04.2025"
    console.log('Parsuju datum:', dateStr);
    
    // Odstranit mezery a rozdelit podle tecek
    const cleanStr = dateStr.trim().replace(/\s+/g, '');
    const parts = cleanStr.split('.');
    
    if (parts.length >= 3) {
        const day = parseInt(parts[0]);
        const month = parseInt(parts[1]);
        const year = parseInt(parts[2]);
        
        if (!isNaN(day) && !isNaN(month) && !isNaN(year)) {
            const parsedDate = new Date(year, month - 1, day);
            console.log(`Datum ${dateStr} -> ${parsedDate.toISOString().split('T')[0]}`);
            return parsedDate;
        }
    }
    
    console.log('Nepodařilo se parsovat datum:', dateStr);
    return null;
}

function isDateInRange(dateStr, dateFrom, dateTo) {
    const orderDate = parseCzechDate(dateStr);
    if (!orderDate) return false;
    
    const fromDate = new Date(dateFrom);
    const toDate = new Date(dateTo);
    
    console.log(`Kontrolujem: ${dateStr} (${orderDate.toISOString().split('T')[0]}) je mezi ${dateFrom} a ${dateTo}?`);
    
    const isInRange = orderDate >= fromDate && orderDate <= toDate;
    console.log(`Vysledek: ${isInRange}`);
    
    return isInRange;
}

function addDialogListener() {
    // Sleduj zmeny v DOM pro detekci dialogu
    const observer = new MutationObserver(function(mutations) {
        mutations.forEach(function(mutation) {
            if (mutation.type === 'childList') {
                mutation.addedNodes.forEach(function(node) {
                    if (node.nodeType === 1) { // Element node
                        // Hledaj potvrzovaci dialog
                        let confirmDialog = null;
                        
                        if (node.classList && node.classList.contains('modal')) {
                            confirmDialog = node;
                        } else {
                            confirmDialog = node.querySelector('.modal.symfony-form-dialog');
                        }
                        
                        if (confirmDialog) {
                            console.log('Detekovan potvrzovaci dialog');
                            
                            // Najdi tlacitko "Schvalit"
                            const confirmButton = confirmDialog.querySelector('button[type="submit"]');
                            if (confirmButton) {
                                console.log('Automaticky klikam na Schvalit');
                                setTimeout(() => {
                                    confirmButton.click();
                                }, 200);
                            }
                        }
                    }
                });
            }
        });
    });
    
    // Sleduj cely dokument
    observer.observe(document.body, {
        childList: true,
        subtree: true
    });
    
    // Zastav sledovani po 30 sekundach
    setTimeout(() => {
        observer.disconnect();
        console.log('Dialog listener zastaven');
    }, 30000);
}

function processAffilboxCommissions(dateFrom, dateTo) {
    if (isProcessing) {
        console.log('Zpracovani jiz probiha...');
        return;
    }
    
    isProcessing = true;
    console.log(`Spoustim automaticke zpracovani provizi pro obdobi ${dateFrom} - ${dateTo}...`);
    
    // Pridej listener pro automaticke potvrzovani dialogu
    addDialogListener();
    
    const tableRows = document.querySelectorAll('table.table tbody tr');
    let processedCount = 0;
    let confirmedCount = 0;
    let rejectedCount = 0;
    let skippedCount = 0;
    
    tableRows.forEach((row, index) => {
        const dateCell = row.querySelector('td:nth-child(2)');
        const statusCell = row.querySelector('td:nth-child(7)');
        const conversionStatusCell = row.querySelector('td:nth-child(8)');
        const actionsCell = row.querySelector('td:nth-child(9)');
        
        if (!dateCell || !statusCell || !conversionStatusCell || !actionsCell) {
            return;
        }
        
        const orderDateStr = dateCell.textContent.trim();
        const orderStatus = statusCell.textContent.trim();
        const conversionStatus = conversionStatusCell.textContent.trim();
        
        // Debug - vypis informace o kazdem radku
        console.log(`Radek ${index + 1}:`, {
            datum: orderDateStr,
            stavObjednavky: orderStatus,
            stavKonverze: conversionStatus,
            maAkce: actionsCell.innerHTML.includes('potvrdit') || actionsCell.innerHTML.includes('zamitnout')
        });
        
        // Kontrola datoveho rozsahu
        if (!isDateInRange(orderDateStr, dateFrom, dateTo)) {
            console.log(`Preskakuji radek ${index + 1} - mimo datovy rozsah`);
            skippedCount++;
            return;
        }
        
        console.log(`Radek ${index + 1} je v datovem rozsahu`);
        
        // Zpracuj pouze cekajici konverze
        if (conversionStatus === 'čekající') {
            if (orderStatus === 'vyexpedovaná') {
                const confirmButton = actionsCell.querySelector('a[href*="/potvrdit"]');
                if (confirmButton) {
                    setTimeout(() => {
                        confirmButton.click();
                        console.log(`Potvrzena provize pro objednavku v radku ${index + 1} (${orderDateStr})`);
                    }, processedCount * 1000); // Zpozdeni 1s mezi kliknutimi
                    confirmedCount++;
                    processedCount++;
                }
            } else if (orderStatus === 'stornovaná') {
                const rejectButton = actionsCell.querySelector('a[href*="/zamitnout"]');
                if (rejectButton) {
                    setTimeout(() => {
                        rejectButton.click();
                        console.log(`Zamitnuta provize pro objednavku v radku ${index + 1} (${orderDateStr})`);
                    }, processedCount * 1000); // Zpozdeni 1s mezi kliknutimi
                    rejectedCount++;
                    processedCount++;
                }
            }
        }
    });
    
    setTimeout(() => {
        isProcessing = false;
        const message = `Zpracovani dokonceno pro obdobi ${dateFrom} - ${dateTo}!\nPotvrzeno: ${confirmedCount}\nZamitnuto: ${rejectedCount}\nPreskoceno (mimo rozsah): ${skippedCount}`;
        console.log(message);
        showNotification(message);
    }, processedCount * 1000 + 2000);
    
    if (processedCount === 0) {
        isProcessing = false;
        const message = `Nebyly nalezeny zadne cekajici provize ke zpracovani v obdobi ${dateFrom} - ${dateTo}.`;
        console.log(message);
        showNotification(message);
    }
}

function showNotification(message) {
    const existingNotification = document.getElementById('affilbox-notification');
    if (existingNotification) {
        existingNotification.remove();
    }
    
    const notification = document.createElement('div');
    notification.id = 'affilbox-notification';
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #28a745;
        color: white;
        padding: 15px 20px;
        border-radius: 5px;
        box-shadow: 0 4px 8px rgba(0,0,0,0.2);
        z-index: 10000;
        font-family: Arial, sans-serif;
        font-size: 14px;
        max-width: 350px;
        white-space: pre-line;
    `;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        if (notification.parentNode) {
            notification.remove();
        }
    }, 8000);
}

function addFloatingButton() {
    const button = document.createElement('button');
    button.id = 'affilbox-auto-button';
    button.textContent = 'Auto provize';
    button.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        background: #007bff;
        color: white;
        border: none;
        padding: 12px 16px;
        border-radius: 25px;
        cursor: pointer;
        z-index: 9999;
        font-size: 14px;
        font-weight: bold;
        box-shadow: 0 4px 8px rgba(0,0,0,0.2);
        transition: all 0.3s ease;
    `;
    
    button.addEventListener('mouseenter', () => {
        button.style.background = '#0056b3';
        button.style.transform = 'scale(1.05)';
    });
    
    button.addEventListener('mouseleave', () => {
        button.style.background = '#007bff';
        button.style.transform = 'scale(1)';
    });
    
    button.addEventListener('click', () => {
        const now = new Date();
        const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);
        
        const dateFrom = lastMonth.toISOString().split('T')[0];
        const dateTo = lastMonthEnd.toISOString().split('T')[0];
        
        processAffilboxCommissions(dateFrom, dateTo);
    });
    
    document.body.appendChild(button);
}

function init() {
    if (window.location.href.includes('/admin/affilbox-objednavky')) {
        console.log('Affilbox Auto Provisor nacten');
        addFloatingButton();
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.onMessage) {
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
        if (request.action === 'processCommissions') {
            processAffilboxCommissions(request.dateFrom, request.dateTo);
            sendResponse({status: 'started'});
        }
    });
}