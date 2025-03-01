chrome.webNavigation.onCompleted.addListener((details) => {
  chrome.scripting.executeScript({
    target: { tabId: details.tabId },
    func: () => {
      const delay = 500;
      const links = JSON.parse(localStorage.getItem("placlaLinks") || "[]");
      let currentIndex = parseInt(localStorage.getItem("currentIndex") || "0", 10);

      if (currentIndex >= links.length) {
        console.log("Iterace dokončena.");
        return;
      }

      function processLinks() {
        const cenaLinks = Array.from(
          document.querySelectorAll(".prijmout_poptavku_cena_3")
        );
        const poptavkaLinks = Array.from(
          document.querySelectorAll(".prijmout_poptavku_3")
        );
        const allLinks = cenaLinks.concat(poptavkaLinks);
        let index = 0;

        function clickNextLink() {
          if (index < allLinks.length) {
            allLinks[index].click();
            index++;
            setTimeout(clickNextLink, delay);
          } else {
            currentIndex++;
            localStorage.setItem("currentIndex", currentIndex);
            if (currentIndex < links.length) {
              window.location.href = links[currentIndex];
            } else {
              console.log("Iterace dokončena.");
            }
          }
        }

        if (allLinks.length > 0) {
          clickNextLink();
        } else {
          currentIndex++;
          localStorage.setItem("currentIndex", currentIndex);
          if (currentIndex < links.length) {
            window.location.href = links[currentIndex];
          } else {
            console.log("Iterace dokončena.");
          }
        }
      }

      processLinks();
    },
  });
}, {
  url: [{ urlContains: "sluzba.placla.cz/bloger/blog2.php" }]
});
