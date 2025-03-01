document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("start").addEventListener("click", () => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      chrome.scripting.executeScript({
        target: { tabId: tabs[0].id },
        func: () => {
          // Najít všechny odkazy v `div#ig_menu`
          const links = Array.from(document.querySelectorAll("#ig_menu a")).map(
            (link) => link.href
          );
          localStorage.setItem("placlaLinks", JSON.stringify(links));
          localStorage.setItem("currentIndex", 0);
          window.location.href = links[0];
        },
      });
    });
  });
});
document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("start").addEventListener("click", () => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      chrome.scripting.executeScript({
        target: { tabId: tabs[0].id },
        func: () => {
          // Najít všechny odkazy v `#sortable_menu_weby`
          const links = Array.from(document.querySelectorAll("#sortable_menu_weby a")).map(
            (link) => link.href
          );
          localStorage.setItem("placlaLinks", JSON.stringify(links));
          localStorage.setItem("currentIndex", 0);
          if (links.length > 0) {
            window.location.href = links[0]; // Přejít na první odkaz
          } else {
            console.log("Žádné odkazy nenalezeny.");
          }
        },
      });
    });
  });
});
