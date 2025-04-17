# Google Sites Crawler / Crawler pro Google Sites

A Chrome extension for iterative crawling of Google Sites pages. This tool helps you navigate and extract information from Google Sites systematically.

Chrome rozšíření pro iterativní procházení stránek Google Sites. Tento nástroj vám pomůže systematicky procházet a extrahovat informace z Google Sites.

## Features / Funkce

- Automated crawling of Google Sites pages / Automatizované procházení stránek Google Sites
- Works with modern Google Sites platform / Funguje s moderní platformou Google Sites
- Browser popup interface for easy control / Rozhraní v prohlížeči pro snadné ovládání
- Data storage and download capabilities / Možnosti ukládání a stahování dat
- Supports authenticated access to Google Sites / Podpora přístupu k zabezpečeným Google Sites
- Export to CSV and TXT formats / Export do formátů CSV a TXT

## Installation / Instalace

1. Clone this repository or download the source code / Naklonujte tento repozitář nebo stáhněte zdrojový kód
2. Open Chrome and navigate to `chrome://extensions/` / Otevřete Chrome a přejděte na `chrome://extensions/`
3. Enable "Developer mode" in the top right corner / Zapněte "Režim pro vývojáře" v pravém horním rohu
4. Click "Load unpacked" and select the directory containing the extension files / Klikněte na "Načíst rozbalené" a vyberte složku s rozšířením

## Required Permissions / Požadovaná oprávnění

The extension requires the following permissions to function / Rozšíření vyžaduje následující oprávnění:
- Access to tabs / Přístup k záložkám
- Script execution / Spouštění skriptů
- Active tab access / Přístup k aktivní záložce
- Storage capabilities / Možnosti ukládání
- Download functionality / Funkce stahování
- Access to Google Sites domains / Přístup k doménám Google Sites

## Files Structure / Struktura souborů

- `manifest.json` - Extension configuration and permissions / Konfigurace rozšíření a oprávnění
- `background.js` - Background service worker handling core functionality / Service worker na pozadí zajišťující hlavní funkcionalitu
- `content.js` - Content script for page interaction / Skript pro interakci se stránkou
- `popup.js` - Extension popup logic / Logika vyskakovacího okna
- `popup.html` - Extension popup interface / Rozhraní vyskakovacího okna
- `icon.svg` - Extension icon / Ikona rozšíření

## Usage / Použití

1. Click the extension icon in Chrome toolbar / Klikněte na ikonu rozšíření v panelu nástrojů Chrome
2. Enter the root URL of the Google Site you want to crawl / Zadejte kořenovou URL Google Sites, kterou chcete procházet
3. Click "Start scanning" / Klikněte na "Spustit skenování"
4. The extension will automatically collect all accessible URLs / Rozšíření automaticky shromáždí všechny dostupné URL
5. Download results in CSV or TXT format / Stáhněte výsledky ve formátu CSV nebo TXT

## Technical Requirements / Technické požadavky

- Google Chrome browser / Prohlížeč Google Chrome
- Access to Google Sites / Přístup ke Google Sites
- Appropriate permissions granted to the extension / Udělená příslušná oprávnění pro rozšíření

## Version / Verze

Current version / Aktuální verze: 1.0

## Support / Podpora

For issues and feature requests, please use the GitHub issues page.
Pro nahlášení problémů a požadavků na nové funkce použijte prosím GitHub issues.

## License / Licence

[MIT License](https://opensource.org/licenses/MIT)

## Author / Autor

[Your name/organization here] / [Vaše jméno/organizace zde] 