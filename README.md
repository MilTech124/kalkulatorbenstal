# Kalkulator garaży BEN-STAL

Publiczny kalkulator wyceny garaży blaszanych (cena liczona na żywo) + panel `/panel` do edycji cennika i przeglądania zapisanych wycen.

Stack: **Next.js 16 (App Router) · TypeScript · Tailwind CSS 4 · MongoDB (Mongoose) · Zod · Vitest**

## Uruchomienie lokalne

```bash
npm install
cp .env.example .env.local      # uzupełnij MONGODB_URI, ADMIN_EMAIL, ADMIN_PASSWORD, AUTH_SECRET
```

Baza danych – jedna z opcji:

- **MongoDB Atlas / własny serwer** – wpisz URI w `MONGODB_URI`.
- **Bez instalacji Mongo (tylko do developmentu)** – w osobnym terminalu uruchom bazę w pamięci:
  ```bash
  npm run dev:mongo
  ```
  Nasłuchuje na `mongodb://127.0.0.1:27017/benstal` (dane znikają po zatrzymaniu; przy pierwszym uruchomieniu pobiera binarkę MongoDB, ok. 100 MB).

Następnie:

```bash
npm run seed    # zapisuje domyślny cennik (Excel + PDF) jako wersję 1, jeśli bazy nie ma jeszcze cennika
npm run dev     # http://localhost:3000  (panel: http://localhost:3000/panel)
```

Inne skrypty: `npm test` (testy silnika wyceny), `npm run lint`, `npm run build` + `npm start` (produkcja).

## Zmienne środowiskowe

| Zmienna          | Opis                                                                 |
| ---------------- | -------------------------------------------------------------------- |
| `MONGODB_URI`    | connection string do MongoDB                                         |
| `ADMIN_EMAIL`    | e-mail do logowania w `/panel`                                       |
| `ADMIN_PASSWORD` | hasło do logowania w `/panel`                                        |
| `AUTH_SECRET`    | losowy sekret (min. 32 znaki) do podpisywania sesji, np. `openssl rand -hex 32` |
| `ORDER_TRACKER_URL` | adres Order-trackera (domyślnie `https://order-tracker-rouge.vercel.app`) |
| `ORDER_TRACKER_API_KEY` | klucz API z Order-trackera (Ustawienia → Klucz API); bez niego przycisk „Wyślij do Tracker” pokazuje komunikat o braku konfiguracji |

## Jak liczona jest cena

Cały algorytm jest w jednym pliku: [`src/lib/pricing/engine.ts`](src/lib/pricing/engine.ts) (`calculateQuote(input, cennik)`), używanym zarówno w przeglądarce (cena na żywo), jak i na serwerze przy zapisie wyceny (serwer liczy sam – klient nie może przesłać własnej kwoty).

1. **Garaż bazowy** – z tabeli szer. × dł. (Excel): kolumna „spad do tyłu” albo „dwuspadowy” (spad na bok i dwuspad używają tej drugiej).
2. **Wysokość** – standard 2,13 m; za każde rozpoczęte 10 cm powyżej dopłata z tabeli (+ dopłata kolorowa/drewnopodobna za 10 cm). Brama segmentowa (i automat przy spadzie do tyłu) automatycznie wymusza minimalną wysokość garażu wg reguł z panelu (np. wys. bramy + 50 cm przy spadzie do tyłu).
3. **Blacha** – dopłata RAL / drewnopodobna z tabeli; **poziomy panel** z tabeli (wymuszany przez okno pleksa).
4. **Okucia** – pionowe `4 × wysokość` mb, dachu wg spadu (`2·D + S` dla spadu do tyłu, `2·S + D` dla pozostałych) × zł/mb.
5. **Rynny** – `S` (spad do tyłu), `D` (na bok), `2·D` (dwuspad) × zł/mb. **Filc** – m² (garaż + wiata). **Blachodachówka** – m² garażu.
6. **Brama** – uchylna/dwuskrzydłowa: cena bazowa (do 220 cm / powyżej) + dopłaty za 50 cm szerokości i 10 cm wysokości ponad 3 × 2 m, dwuskrzydłowa +500, automat, poziomy panel; segmentowa: tabela Oknomont (netto) × 1,23 × 1,40, rozmiar zaokrąglany w górę, winchester za m², drzwi w bramie.
7. **Okna, drzwi, dodatki** (zamek, uchwyt, kratka, kotwiczenie wg szerokości), **wiata** (stawka za mb wg szerokości × długość + kolor za mb), **ściany działowe** (m²), **ażury** (ściana m² lub cały garaż `(2S+2D)·H × 40`).

Wszystkie kwoty, mnożniki, wzory (współczynniki `s`/`d`) i reguły wysokości edytuje się w `/panel` → Cennik. Każdy zapis tworzy nową wersję; można wrócić do wcześniejszej lub przywrócić cennik domyślny.

Domyślne dane: [`src/lib/pricing/data/base-table.ts`](src/lib/pricing/data/base-table.ts) (generowany skryptem `py scripts/import-xlsx.py plik.xlsx` z Excela) i [`src/lib/pricing/data/sectional.ts`](src/lib/pricing/data/sectional.ts) (przepisany cennik bram segmentowych).

> Uwaga: dopłaty bramy uchylnej za +50 cm szerokości (150 zł) i +10 cm wysokości (50 zł) to wartości tymczasowe – do uzupełnienia w panelu.

## Statusy wycen i Order-tracker

Każda wycena ma status: **Nowe → Wyceniono → Zamówiono → W realizacji → W trasie → Dostarczone / Anulowane** (zmiana w liście lub w szczegółach, filtr w liście). Nowe wyceny z kalkulatora dostają status „Nowe”.

W panelu (lista i szczegóły) jest ikona/przycisk **„Wyślij do Tracker”** – otwiera okno z podglądem: status w trackerze (mapowany z statusu wyceny), opcjonalna data dostawy i uwagi (domyślnie skrócona konfiguracja garażu). Wysyłka idzie serwer→serwer (`POST {ORDER_TRACKER_URL}/api/integration/orders`, nagłówek `X-Api-Key`), z adresem rozbitym na ulicę / kod / miasto (geokodowanie pina na mapie). Po wysłaniu wycena dostaje znacznik trackera (id zamówienia, data), a status „Nowe/Wyceniono” zmienia się na „Zamówiono”. Ponowna wysyłka jest możliwa (z ostrzeżeniem – tworzy drugie zamówienie).

## Struktura

```
src/
  app/                 strony i API (App Router)
    page.tsx           kalkulator
    panel/             login, lista wycen, szczegóły, edytor cennika
    api/pricing        GET aktywny cennik (public)
    api/quotes         POST zapis wyceny (public)
    api/admin/*        login/logout, cennik (GET/PUT/POST), wyceny (GET/DELETE)
  proxy.ts             ochrona /panel/* i /api/admin/* (cookie sesji JWT)
  lib/pricing/         silnik wyceny, typy, schematy zod, domyślny cennik, repozytorium
  lib/auth.ts          sesja (jose), porównanie haseł w stałym czasie
  models/              Mongoose: PriceList (wersjonowany), Quote, Counter
  components/          UI kalkulatora i panelu
scripts/               seed.ts, dev-mongo.ts, import-xlsx.py
```

## Wdrożenie

- **Vercel + MongoDB Atlas** – dodaj zmienne środowiskowe w projekcie Vercel, `npm run seed` uruchom raz lokalnie z URI Atlasa (albo zaloguj się do panelu i użyj „Przywróć cennik domyślny” – zapisze cennik do bazy).
- **Własny serwer (Node 20+)** – `npm ci && npm run build && npm start` (port 3000), za reverse proxy z HTTPS (cookie sesji ma `secure` w produkcji).
