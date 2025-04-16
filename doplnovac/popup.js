// Data, která chceme zobrazit a umožnit vkládat
const data = [
  "Mediatoring.com s.r.o.",
  "Nádražní 385/34",
  "Ostrava",
  "702 00",
  "04954025",
  "CZ04954025",
  "2700972651/2010",
  "+420 603 48 78 48",
  "info@mediatoring.cz",
  "https://www.kubicek.ai/kalendar"
];

// Funkce, která se spustí po načtení DOM
document.addEventListener('DOMContentLoaded', function() {
  // Získáme referenci na kontejner pro položky
  const container = document.getElementById('content');
  
  // Pro každou položku vytvoříme element a přidáme ho do kontejneru
  data.forEach(item => {
    const div = document.createElement('div');
    div.className = 'item';
    div.textContent = item;
    
    // Přidáme událost kliknutí, která pošle zprávu do background scriptu
    div.addEventListener('click', function() {
      // Získáme aktivní záložku
      chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        // Pošleme zprávu do background scriptu
        chrome.runtime.sendMessage({
          action: 'insertText',
          text: item,
          tabId: tabs[0].id
        });
        
        // Zavřeme popup po kliknutí
        window.close();
      });
    });
    
    container.appendChild(div);
  });
});