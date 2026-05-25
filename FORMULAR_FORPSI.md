# Formulář Vrata Šnábl přes Forpsi

Tento web běží na GitHub Pages. GitHub Pages umí zobrazit statické HTML, CSS a JS, ale neumí spustit PHP. Proto kontaktní formulář nemůže posílat e-maily sám přímo z GitHub Pages.

Nejjednodušší vlastní řešení zdarma je použít PHP endpoint na webhostingu Forpsi a z webu na něj posílat formulářová data.

## Co je připravené

- PHP endpoint: `deploy/forpsi-form/send.php`
- Příjemce poptávek: `adam@vratasnabl.cz`
- Ochrana proti spamu:
  - honeypot pole `_honey`
  - minimální čas vyplnění formuláře
  - jednoduchý limit odeslání podle IP
  - povolené originy jen pro `vratasnabl.cz`
- Formulář na webu zkouší primárně endpoint:
  - `https://form.vratasnabl.cz/send.php`
- Záložní automatické odeslání zůstává přes FormSubmit, dokud Forpsi endpoint není fyzicky dostupný.
- Web už zákazníkovi automaticky neotevírá e-mailovou aplikaci při chybě odeslání.

## Jak to zprovoznit na Forpsi

### Varianta A: samostatná subdoména pro formulář

Tohle je nejlepší varianta, pokud hlavní web zůstává na GitHub Pages.

1. Ve Forpsi vytvořit subdoménu:
   - `form.vratasnabl.cz`

2. Nastavit DNS tak, aby `form.vratasnabl.cz` směřovala na Forpsi webhosting.

3. Na Forpsi nahrát soubor:
   - lokálně: `deploy/forpsi-form/send.php`
   - na hostingu: veřejná složka subdomény jako `send.php`

4. Ověřit v prohlížeči:
   - `https://form.vratasnabl.cz/send.php`

   Při otevření přes GET má endpoint vrátit chybu typu `Only POST is allowed`. To je v pořádku, protože formulář posílá POST.

5. Poslat test z webu:
   - otevřít `https://www.vratasnabl.cz/#kontakt`
   - vyplnit testovací poptávku
   - ověřit doručení na `adam@vratasnabl.cz`

### Varianta B: celý web přesunout na Forpsi

Pokud by se celý web nahrál na Forpsi místo GitHub Pages, šlo by PHP spustit přímo na stejné doméně. Potom by endpoint mohl být například:

- `https://www.vratasnabl.cz/send.php`

Tato varianta je také funkční, ale mění současné nasazení přes GitHub Pages.

## Co je potřeba od majitele

- přístup do Forpsi administrace nebo FTP/FTPS údaje
- potvrzení, jestli použijeme subdoménu `form.vratasnabl.cz`
- po nahrání endpointu ověřit, že testovací e-mail dorazil na `adam@vratasnabl.cz`

## Proč nestačí čistý statický web

HTML formulář v prohlížeči neumí sám bezpečně odeslat e-mail bez serveru. Kdyby se SMTP heslo vložilo do JavaScriptu, bylo by veřejně viditelné. Proto je potřeba serverový endpoint, například PHP na Forpsi.

## Kontrola po spuštění

- formulář odešle poptávku bez otevření e-mailové aplikace
- zákazník vidí hlášku, že poptávka byla odeslána
- e-mail dorazí na `adam@vratasnabl.cz`
- zpráva obsahuje jméno, telefon, e-mail, lokalitu, typ služby a popis
- GA4 měří událost `submit_inquiry`
- v konzoli nejsou chyby

## Užitečné odkazy Forpsi

- PHP `mail()` na Forpsi: https://support.forpsi.com/kb/a2862/odeslani-emailu-pres-php.aspx
- Spolehlivé odesílání e-mailů z webu: https://support.forpsi.com/kb/a3356/spolehlive-odesilani-e-mailu-z-webu.aspx
