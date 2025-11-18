# WCAG Accessibility Checklist

Kompleksowa statyczna checklista kryteriów WCAG w języku polskim.  
Prosty interfejs z możliwością zaznaczania kryteriów, zapisu postępu (plik JSON / localStorage), filtrowania i drukowania (dedykowany @media print). Przydatna zarówno do audytów, jak i szybkiego sprawdzenia strony pod kątem dostępności.

## Zakres

- WCAG 2.2  
- Poziomy zgodności: A, AA, AAA  
- Kategorie:
  - **Percepcja** (postrzegalność)  
  - **Funkcjonalność** (możliwość obsługi)  
  - **Zrozumiałość**  
  - **Solidność** (kompatybilność)  

## Funkcjonalności

- Możliwość odhaczania poszczególnych punktów checklisty.  
- Śledzenie postępu dla całej checklisty oraz dla poszczególnych poziomów.  
- Funkcje „Zaznacz wszystko” / „Odznacz wszystko”.  
- Zapis postępu do pliku JSON oraz możliwość jego wczytania.  
- Wyszukiwanie i filtrowanie kryteriów po poziomach zgodności.  
- Każdy punkt zawiera linki do dokumentacji [W3C](https://www.w3.org/Translations/WCAG21-pl-20210413/) oraz [LepszyWeb](https://wcag.lepszyweb.pl/#top).  

## Struktura projektu

- `index.html` — główna strona  
- `style.css` — wszystkie style (z @media print)  
- `script.js` — logika interaktywna (zapis postępu, filtrowanie, wyszukiwanie)  
- `README.md` — ten plik  

## Dla kogo

Dla wszystkich: testerów, projektantów, programistów i osób dbających o dostępność stron.

## Stabilność

Checklista jest stabilna — testy można wykonywać w dowolnym momencie bez ryzyka utraty danych.

## Uwagi dostępności (WCAG)

W projekcie zastosowano podstawowe usprawnienia WCAG:

- semantyczna struktura nagłówków (`h1`/`h2`/`h3`), role `main` / `banner`  
- skip link dla użytkowników klawiatury  
- aria-attributes: `progressbar` (`aria-valuenow`, `aria-valuemin`, `aria-valuemax`, `aria-valuetext`)  
- przyciski filtrów mają `aria-pressed`  
- pola wyszukiwania z `aria-label` i `aria-describedby`  
- elementy dynamiczne mają `aria-live` tam, gdzie występują aktualizacje (podsumowanie)  
- keyboard accessible: `.criterion-content` jest fokusowalne i reaguje na Enter/Space  
- druk: @media print usuwa elementy dekoracyjne (linie, tła) i poprawia czytelność  
- kontrasty i widoczne focusy są uwzględnione w stylach (można przeprowadzić dalszy audyt kontrastu)  

### Rzeczy do rozważenia / dalsze kroki

- Pełne testy z czytnikami ekranu (NVDA, VoiceOver)  
- Automatyczne testy kontrastu i audyt przy pomocy Lighthouse / axe  
- Dodanie `aria-live="polite"` dla wyników wyszukiwania (opcjonalne)  
- Zapewnienie semantycznej treści alternatywnej dla wszystkich linków/elementów  

## Współpraca

Pull requesty są mile widziane, o ile poprawiają jakość checklisty, nie psując jej struktury.  
Zanim zmienisz strukturę checklisty, **otwórz issue ticket**, opisz propozycję zmian i **wywołaj autora**.  
Zgłoszenia błędów, propozycje nowych funkcji lub ulepszeń dokumentacji powinny być konkretne: co, gdzie i dlaczego.  
Styl dokumentacji i nazewnictwa: spójny, jasny, bez zbędnych ozdobników.

Proste poprawki: forkuj repo → utwórz branch → pull request.  
Zgłaszaj błędy lub propozycje usprawnień (dostępność, UX, tłumaczenia).  

## Licencja

Creative Commons BY 4.0 — możesz korzystać, modyfikować i udostępniać, podając autora.
## Licencja

- Kod źródłowy: MIT License  
- Treści i materiały edukacyjne wykorzystane w projekcie pochodzą z W3C ([w3.org](https://www.w3.org/)) oraz LepszyWeb ([lepszyweb.pl](https://lepszyweb.pl)) i są wykorzystywane zgodnie z ich licencjami.

## Notka o AI

Niektóre fragmenty dokumentacji i kodu zostały wygenerowane lub wspomagane przy użyciu narzędzi AI.
