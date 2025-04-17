# Doplňovač - Chrome rozšíření pro automatické doplňování údajů

## 🇨🇿 Česky

### Popis
Doplňovač je Chrome rozšíření, které umožňuje jedním kliknutím vkládat přednastavené údaje do formulářů.

### Instalace
1. Stáhněte si tento repozitář
2. Otevřete Chrome a přejděte na `chrome://extensions/`
3. Zapněte "Režim pro vývojáře" (Developer mode) v pravém horním rohu
4. Klikněte na "Načíst rozbalené" (Load unpacked) a vyberte složku s rozšířením

### Nastavení vlastních údajů
1. Otevřete soubor `popup.js`
2. Upravte pole `data` na začátku souboru (řádky 2-13):

```javascript
const data = [
  "NÁZEV_VAŠÍ_FIRMY",  // např. "Mediatoring.com s.r.o."
  "VAŠE_ULICE_A_ČÍSLO",  // např. "Nádražní 385/34"
  "VAŠE_MĚSTO",  // např. "Ostrava"
  "VAŠE_PSČ",  // např. "702 00"
  "VAŠE_IČO",  // např. "04954025"
  "VAŠE_DIČ",  // např. "CZ04954025"
  "VAŠE_ČÍSLO_ÚČTU",  // např. "2700972651/2010"
  "VÁŠ_TELEFON",  // např. "+420 603 48 78 48"
  "VÁŠ_EMAIL",  // např. "info@mediatoring.cz"
  "VAŠE_URL"  // např. "https://www.kubicek.ai/kalendar"
];
```

3. Uložte soubor
4. V Chrome přejděte znovu na `chrome://extensions/`
5. Klikněte na ikonu "Reload" (🔄) u vašeho rozšíření

### Použití
1. Klikněte na textové pole, kam chcete vložit údaj
2. Klikněte na ikonu rozšíření v panelu Chrome
3. Klikněte na údaj, který chcete vložit
4. Údaj se automaticky vloží na pozici kurzoru

## 🇬🇧 English

### Description
Doplňovač is a Chrome extension that allows you to insert preset data into forms with a single click.

### Installation
1. Download this repository
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" in the top right corner
4. Click "Load unpacked" and select the extension folder

### Setting Up Your Data
1. Open the `popup.js` file
2. Modify the `data` array at the beginning of the file (lines 2-13):

```javascript
const data = [
  "YOUR_COMPANY_NAME",  // e.g. "Mediatoring.com s.r.o."
  "YOUR_STREET_ADDRESS",  // e.g. "Nádražní 385/34"
  "YOUR_CITY",  // e.g. "Ostrava"
  "YOUR_ZIP_CODE",  // e.g. "702 00"
  "YOUR_BUSINESS_ID",  // e.g. "04954025"
  "YOUR_TAX_ID",  // e.g. "CZ04954025"
  "YOUR_BANK_ACCOUNT",  // e.g. "2700972651/2010"
  "YOUR_PHONE",  // e.g. "+420 603 48 78 48"
  "YOUR_EMAIL",  // e.g. "info@mediatoring.cz"
  "YOUR_URL"  // e.g. "https://www.kubicek.ai/kalendar"
];
```

3. Save the file
4. In Chrome, go back to `chrome://extensions/`
5. Click the "Reload" icon (🔄) on your extension

### Usage
1. Click on the text field where you want to insert data
2. Click the extension icon in Chrome toolbar
3. Click on the data you want to insert
4. The data will be automatically inserted at the cursor position

## ⚠️ Poznámka / Note
Po každé úpravě údajů je nutné znovu načíst rozšíření v Chrome. / After each data modification, you need to reload the extension in Chrome. 