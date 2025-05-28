document.addEventListener('DOMContentLoaded', function() {
    const processBtn = document.getElementById('processBtn');
    const setLastMonthBtn = document.getElementById('setLastMonth');
    const status = document.getElementById('status');
    const dateFromInput = document.getElementById('dateFrom');
    const dateToInput = document.getElementById('dateTo');
    
    // Nastav minuly mesic
    function setLastMonth() {
        const now = new Date();
        const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);
        
        dateFromInput.value = formatDate(lastMonth);
        dateToInput.value = formatDate(lastMonthEnd);
    }
    
    function formatDate(date) {
        return date.toISOString().split('T')[0];
    }
    
    function parseCzechDate(dateStr) {
        // Parsuje datum ve formatu "29. 01. 2024"
        const parts = dateStr.trim().split(/\s+/);
        if (parts.length >= 3) {
            const day = parseInt(parts[0].replace('.', ''));
            const month = parseInt(parts[1].replace('.', ''));
            const year = parseInt(parts[2]);
            return new Date(year, month - 1, day);
        }
        return null;
    }
    
    // Nastav vychozi hodnoty - minuly mesic
    setLastMonth();
    
    setLastMonthBtn.addEventListener('click', function() {
        setLastMonth();
    });
    
    processBtn.addEventListener('click', function() {
        const dateFrom = dateFromInput.value;
        const dateTo = dateToInput.value;
        
        if (!dateFrom || !dateTo) {
            status.textContent = 'Chyba: Zadejte datovy rozsah';
            return;
        }
        
        if (new Date(dateFrom) > new Date(dateTo)) {
            status.textContent = 'Chyba: Datum od musi byt mensi nez datum do';
            return;
        }
        
        processBtn.disabled = true;
        processBtn.textContent = 'Zpracovavam...';
        status.textContent = 'Spoustim automaticke zpracovani...';
        
        chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
            const activeTab = tabs[0];
            
            if (!activeTab.url.includes('/admin/affilbox-objednavky')) {
                status.textContent = 'Chyba: Nejste na strance Affilbox objednavek';
                processBtn.disabled = false;
                processBtn.textContent = 'Spustit zpracovani';
                return;
            }
            
            chrome.tabs.sendMessage(activeTab.id, {
                action: 'processCommissions',
                dateFrom: dateFrom,
                dateTo: dateTo
            }, function(response) {
                if (chrome.runtime.lastError) {
                    status.textContent = 'Chyba: Nepodarilo se komunikovat se strankou';
                    processBtn.disabled = false;
                    processBtn.textContent = 'Spustit zpracovani';
                    return;
                }
                
                if (response && response.status === 'started') {
                    status.textContent = `Zpracovani spusteno pro ${dateFrom} - ${dateTo}`;
                    
                    setTimeout(() => {
                        processBtn.disabled = false;
                        processBtn.textContent = 'Spustit zpracovani';
                        status.textContent = 'Pripraveno ke spusteni';
                    }, 3000);
                }
            });
        });
    });
});