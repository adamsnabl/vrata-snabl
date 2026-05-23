# Nasazení webu Vrata Šnábl na Forpsi

Tento projekt je statický web bez databáze. Do produkce se nahrávají pouze:

- `*.html`
- `assets/`
- `sitemap.xml`
- `robots.txt`
- `.htaccess`

## Doporučené řešení

Nejjednodušší a bezpečný postup je:

1. Ukládat každou stabilní verzi do Gitu.
2. Přístupy k Forpsi držet mimo repozitář.
3. Nasazovat přes skript `deploy/forpsi-deploy.sh`.
4. První nahrání spustit jako dry run a až potom ostrý upload.

## Co je potřeba z Forpsi

Připravte tyto údaje ze zákaznické administrace nebo e-mailu od Forpsi:

- FTP/FTPS server
- FTP uživatelské jméno
- FTP heslo
- cílový adresář

U běžného FTP účtu konkrétního webu bývá cílový adresář:

```text
/www
```

U hlavního multihostingového FTP účtu bývá cesta:

```text
/vratasnabl.cz/www
```

## Lokální nastavení

Zkopírujte vzorový soubor:

```bash
cp deploy/forpsi.env.example deploy/forpsi.env
```

Doplňte hodnoty v `deploy/forpsi.env`. Tento soubor je v `.gitignore` a nesmí se commitovat.

## Kontrola před uploadem

```bash
npx --yes html-validate *.html
xmllint --noout sitemap.xml
node --check assets/js/main.js
```

## Zkušební deploy bez nahrání

```bash
bash deploy/forpsi-deploy.sh
```

Výchozí nastavení je dry run, takže skript jen ukáže, co by nahrával.

## Ostrý upload

V `deploy/forpsi.env` nastavte:

```text
FORPSI_DRY_RUN=0
```

Potom spusťte:

```bash
bash deploy/forpsi-deploy.sh
```

## Mazání starých souborů na hostingu

Výchozí nastavení staré soubory nemaže. Po prvním bezpečném nasazení lze zapnout synchronizaci s mazáním:

```text
FORPSI_DELETE_REMOTE=1
```

Používejte až ve chvíli, kdy je jisté, že `FORPSI_REMOTE_DIR` ukazuje do správné složky `www`.

## Ověření po nasazení

Po uploadu ověřte:

- `https://www.vratasnabl.cz/`
- `https://www.vratasnabl.cz/sitemap.xml`
- `https://www.vratasnabl.cz/robots.txt`
- hlavní podstránky služeb
- obrázky
- formulář
- telefonní odkazy
- HTTPS
- přesměrování na `www`

Potom spusťte PageSpeed Insights pro mobil i desktop.

## Návrat ke starší verzi

Historii změn zobrazíte:

```bash
git log --oneline
```

Starší verzi lze dočasně prohlédnout:

```bash
git checkout <commit>
```

Návrat zpět na hlavní větev:

```bash
git checkout main
```

Pro produkční návrat se bezpečnější postup řeší novým commitem, který vrátí konkrétní změny.
