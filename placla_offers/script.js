(function(){
    var delay = 50;
    function processLinks() {
        var cenaLinks = Array.from(document.querySelectorAll('.prijmout_poptavku_cena_3'));
        var poptavkaLinks = Array.from(document.querySelectorAll('.prijmout_poptavku_3'));
        var links = cenaLinks.concat(poptavkaLinks);
        var index = 0;
        function clickNextLink() {
            if (index < links.length) {
                links[index].click();
                index++;
                setTimeout(clickNextLink, delay);
            } else {
                var nextButton = document.getElementById('btn_next_blog');
                if (nextButton) {
                    nextButton.click();
                    setTimeout(processLinks, delay);
                }
            }
        }
        if (links.length > 0) {
            clickNextLink();
        } else {
            var nextButton = document.getElementById('btn_next_blog');
            if (nextButton) {
                nextButton.click();
                setTimeout(processLinks, delay);
            }
        }
    }
    processLinks();
})();
