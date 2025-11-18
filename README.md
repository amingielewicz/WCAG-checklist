# WCAG Checklist — lista zasad i kryteriów (WCAG 2.2)

Krótka statyczna checklista kryteriów WCAG w języku polskim. Prosty interfejs z możliwością zaznaczania kryteriów, zapisu postępu (plik JSON / localStorage), filtrowania i drukowania (z dedykowanym @media print).

## Szybkie uruchomienie lokalnie

1. Otwórz folder projektu w przeglądarce:
   - Po prostu otwórz `index.html` (do szybkich testów).
2. Uruchom prosty serwer (zalecane — poprawne zachowanie CORS/uruchomień):
   - Python 3: `python -m http.server 8000` → odwiedź `http://localhost:8000`
   - Node (live-server): `npx live-server` lub użyj rozszerzenia Live Server w VS Code.

## Deploy na GitHub Pages

1. Utwórz repo na GitHub i wypchnij kod (branch `main`).
2. W ustawieniach repo: Settings → Pages → wybierz branch `main` i folder `/` → Save.
3. Strona powinna być dostępna pod: `https://USERNAME.github.io/REPO/`.

Opcjonalnie: użyj folderu `docs/` lub workflow GitHub Actions do automatycznego deployu.

## Struktura projektu

- index.html — główna strona
- style.css — wszystkie style (z @media print)
- script.js — logika interaktywna (zapis postępu, filtrowanie, wyszukiwanie)
- README.md — ten plik

## Uwagi dostępności (WCAG)

W projekcie zastosowano podstawowe usprawnienia WCAG:
- semantyczna struktura nagłówków (h1/h2/h3), role = "main"/"banner"
- skip link dla użytkowników klawiatury
- aria-attributes: progressbar (`aria-valuenow`, `aria-valuemin`, `aria-valuemax`, `aria-valuetext`)
- przyciski filtrów mają `aria-pressed`
- pola wyszukiwania z `aria-label` i `aria-describedby`
- elementy dynamiczne mają `aria-live` tam, gdzie występują aktualizacje (podsumowanie)
- keyboard accessible: .criterion-content jest fokusowalne i reaguje na Enter/Space
- druk: @media print usuwa elementy dekoracyjne (linie, tła) i poprawia czytelność
- kontrasty i widoczne focusy są uwzględnione w stylach (można przeprowadzić dalszy audyt kontrastu)

Rzeczy do rozważenia / dalsze kroki:
- Pełne testy z czytnikami ekranu (NVDA, VoiceOver).
- Automatyczne testy kontrastu i audyt przy pomocy Lighthouse/axe.
- Dodać aria-live="polite" dla wyników wyszukiwania (opcjonalne).
- Zapewnienie semantycznej treści alternatywnej dla wszystkich linków/elementów (jeśli dotyczy).

## Contributing

Proste poprawki: forkuj repo → utwórz branch → pull request.  
Zgłaszaj błędy lub propozycje usprawnień (dostępność, UX, tłumaczenia).

## License

Wybierz licencję według potrzeb (np. MIT). Jeśli chcesz, mogę dodać plik LICENSE z wybraną licencją.

