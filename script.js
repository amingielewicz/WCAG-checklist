const activeFilters = {
    'A': true,
    'AA': true,
    'AAA': true
};

// Dodajemy globalne zmienne do przechowywania wyników wyszukiwania
let searchMatches = [];
let searchMatchIndex = -1;

// Centralna inicjalizacja
window.addEventListener('DOMContentLoaded', function() {
    init();
});

/**
 * Inicjalizuje aplikację: tryb, lokalne ustawienia, listener'y, oraz
 * element progress-fill (jeśli nie istnieje).
 * @returns {void}
 */
function init() {
    // Wczytaj tryb
    const savedTheme = localStorage.getItem('theme');
    const toggle = document.getElementById('themeToggle');
    if (savedTheme === 'dark') {
        document.body.classList.add('dark-mode');
        if (toggle) toggle.checked = true;
    }

    // Wczytaj zapisany postęp (synchronous localStorage)
    loadProgressFromStorage();

    // Podłącz listener'y checkboxów i przycisków
    addCheckboxListeners();

    const btnCheckAll = document.getElementById("btnCheckAll");
    if (btnCheckAll) btnCheckAll.addEventListener("click", checkAll);

    // Podłącz pozostałe przyciski (jeśli istnieją)
    const btnUncheck = document.getElementById("btnUncheckAll");
    if (btnUncheck) btnUncheck.addEventListener("click", uncheckAll);

    const btnSave = document.getElementById("btnSaveProgress");
    if (btnSave) btnSave.addEventListener("click", saveProgress);

    const btnLoad = document.getElementById("btnLoadProgress");
    if (btnLoad) btnLoad.addEventListener("click", loadProgress);

    const btnPrint = document.getElementById("btnPrint");
    if (btnPrint) btnPrint.addEventListener("click", () => window.print());

    // Lepsze nasłuchiwanie pola wyszukiwania
    const searchBox = document.getElementById('searchBox');
    if (searchBox) {
        searchBox.addEventListener('input', searchCriteria);
        // Obsługa Enter / Shift+Enter do przeskakiwania po wynikach wyszukiwania
        searchBox.addEventListener('keydown', handleSearchKeyDown);
    }

    // Ustaw aria-pressed dla przycisków filtrów zgodnie ze stanem
    ['A','AA','AAA'].forEach(level => {
        const btn = document.getElementById('filter' + level);
        if (btn) {
            btn.setAttribute('aria-pressed', String(!!activeFilters[level]));
            // synchronizuj klasę wizualną z wartością filtra (dla czytelności)
            if (!activeFilters[level]) btn.classList.add('inactive'); else btn.classList.remove('inactive');
        }
    });

    // Ustaw rel noopener dla zewnętrznych linków otwieranych w nowej karcie
    document.querySelectorAll('a[target="_blank"]').forEach(a => {
        if (!a.hasAttribute('rel')) a.setAttribute('rel', 'noopener noreferrer');
    });

    // Uczyń etykiety kryteriów fokusowalne i obsłuż Enter/Space
    document.querySelectorAll('.criterion-content').forEach(label => {
        label.setAttribute('tabindex', '0');
        label.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                const forId = label.getAttribute('for') || label.htmlFor;
                // jeśli to nie label-for (np. div > label), znajdź input w obrębie
                let checkbox = null;
                if (forId) checkbox = document.getElementById(forId);
                if (!checkbox) checkbox = label.querySelector('input[type="checkbox"]') || label.parentElement.querySelector('input[type="checkbox"]');
                if (checkbox) {
                    checkbox.checked = !checkbox.checked;
                    checkbox.dispatchEvent(new Event('change', { bubbles: true }));
                    checkbox.focus();
                }
            }
        });
    });

    // Upewnij się, że istnieje element .progress-fill (animowane wypełnienie paska)
    const progressContainer = document.querySelector('.progress-bar-container');
    if (progressContainer && !progressContainer.querySelector('.progress-fill')) {
        const fill = document.createElement('div');
        fill.className = 'progress-fill';
        fill.style.width = '0%';
        progressContainer.insertBefore(fill, progressContainer.firstChild);
    }

     updateProgress();
 }
 
 /**
 * Dodaje listener'y do wszystkich checkboxów kryteriów.
 * @returns {void}
 */
 function addCheckboxListeners() {
    const checkboxes = document.querySelectorAll('input[type="checkbox"]');
    checkboxes.forEach(checkbox => {
        // ustaw klasę zgodnie ze stanem (np. po wczytaniu)
        const criterion = checkbox.closest('.criterion');
        if (checkbox.checked) {
            criterion && criterion.classList.add('checked');
        } else {
            criterion && criterion.classList.remove('checked');
        }

        checkbox.addEventListener('change', function() {
            const criterion = this.closest('.criterion');
            if (this.checked) {
                criterion && criterion.classList.add('checked');
            } else {
                criterion && criterion.classList.remove('checked');
            }
            // Zapisz lokalnie (synchronous)
            saveProgressToStorage();
            updateProgress();
        });
    });
 }

 /**
 * Aktualizuje pasek postępu i ARIA; oblicza procent i ustawia szerokość .progress-fill.
 * @returns {void}
 */
 function updateProgress() {
    const allCheckboxes = document.querySelectorAll('.criterion input[type="checkbox"]');
    const checkedCheckboxes = document.querySelectorAll('.criterion input[type="checkbox"]:checked');
    const percentage = allCheckboxes.length > 0 
        ? Math.round((checkedCheckboxes.length / allCheckboxes.length) * 100) 
        : 0;
    
    // Aktualizuj ARIA paska postępu
    const progressBar = document.getElementById('progressBar');
    if (progressBar) {
        const checkedCount = document.querySelectorAll('.criterion input[type="checkbox"]:checked').length;
        const totalCount = document.querySelectorAll('.criterion input[type="checkbox"]').length;
        const percent = totalCount > 0 ? Math.round((checkedCount / totalCount) * 100) : 0;
        progressBar.setAttribute('aria-valuenow', String(percent));
        progressBar.setAttribute('aria-valuetext', `${percent} procent, ${checkedCount} z ${totalCount}`);
        
        // Aktualizujemy widoczny fill (animowany element) zamiast szerokości samego kontenera tekstowego
        const fill = document.querySelector('.progress-fill');
        if (fill) fill.style.width = percentage + '%';
        progressBar.textContent = percentage + '% (' + checkedCheckboxes.length + '/' + allCheckboxes.length + ')';
        
        // Nie zmieniamy położenia tekstu paska — utrzymujemy go zawsze wyśrodkowanego.
    }
    
    // Aktualizuj podsumowanie według poziomów
    updateLevelSummary();
 }

 /**
 * Aktualizuje podsumowanie (słupki) według poziomów A/AA/AAA.
 * @returns {void}
 */
 function updateLevelSummary() {
    const levels = ['A', 'AA', 'AAA'];
    
    levels.forEach(level => {
        const allLevelCheckboxes = document.querySelectorAll(`.criterion[data-level="${level}"] input[type="checkbox"]`);
        const checkedLevelCheckboxes = document.querySelectorAll(`.criterion[data-level="${level}"] input[type="checkbox"]:checked`);
        
        const total = allLevelCheckboxes.length;
        const checked = checkedLevelCheckboxes.length;
        const percent = total > 0 ? Math.round((checked / total) * 100) : 0;
        
        const bar = document.getElementById('summaryBar' + level);
        if (bar) bar.style.width = percent + '%';
        
        const stats = document.getElementById('summaryStats' + level);
        if (stats) stats.textContent = checked + '/' + total;
    });
 }

 /**
 * Zaznacza wszystkie widoczne kryteria.
 * @returns {void}
 */
 function checkAll() {
    const checkboxes = document.querySelectorAll('.criterion:not(.hidden) input[type="checkbox"]');
    checkboxes.forEach(checkbox => {
        checkbox.checked = true;
        checkbox.closest('.criterion') && checkbox.closest('.criterion').classList.add('checked');
    });
    saveProgressToStorage();
    updateProgress();
 }

 /**
 * Odznacza wszystkie checkboxy.
 * @returns {void}
 */
 function uncheckAll() {
    const checkboxes = document.querySelectorAll('input[type="checkbox"]');
    checkboxes.forEach(checkbox => {
        checkbox.checked = false;
        checkbox.closest('.criterion') && checkbox.closest('.criterion').classList.remove('checked');
    });
    saveProgressToStorage();
    updateProgress();
 }

 /**
 * Eksportuje aktualny stan checkboxów do pliku JSON (pobranie).
 * @returns {void}
 */
 function saveProgress() {
    const checkboxes = document.querySelectorAll('input[type="checkbox"]');
    const state = {};
    checkboxes.forEach(checkbox => {
        state[checkbox.id] = checkbox.checked;
    });
    
    const dataStr = JSON.stringify(state, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = 'wcag-progress-' + new Date().toISOString().split('T')[0] + '.json';
    link.click();
    
    URL.revokeObjectURL(url);
    
    alert('✅ Postęp został zapisany do pliku!');
 }

 /**
 * Odczytuje plik JSON i ustawia stan checkboxów zgodnie z zawartością.
 * @returns {void}
 */
 function loadProgress() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    
    input.onchange = function(e) {
        const file = e.target.files[0];
        const reader = new FileReader();
        
        reader.onload = function(event) {
            try {
                const state = JSON.parse(event.target.result);
                Object.keys(state).forEach(id => {
                    const checkbox = document.getElementById(id);
                    if (checkbox) {
                        checkbox.checked = state[id];
                        const criterion = checkbox.closest('.criterion');
                        if (state[id]) {
                            criterion && criterion.classList.add('checked');
                        } else {
                            criterion && criterion.classList.remove('checked');
                        }
                    }
                });
                saveProgressToStorage();
                updateProgress();
                alert('✅ Postęp został wczytany pomyślnie!');
            } catch (error) {
                alert('❌ Błąd podczas wczytywania pliku: ' + error.message);
            }
        };
        
        reader.readAsText(file);
    };
    
    input.click();
 }

 /**
 * Zapisuje postęp do localStorage.
 * @returns {void}
 */
 // Zapis do localStorage (synchronous)
 function saveProgressToStorage() {
    const checkboxes = document.querySelectorAll('input[type="checkbox"]');
    const state = {};
    checkboxes.forEach(checkbox => {
        state[checkbox.id] = checkbox.checked;
    });
    
    try {
        localStorage.setItem('wcag-progress', JSON.stringify(state));
    } catch (error) {
        console.error('Error saving progress to localStorage:', error);
    }
 }

 /**
 * Wczytuje postęp z localStorage i aplikuje stan na checkboxach.
 * @returns {void}
 */
 function loadProgressFromStorage() {
    try {
        const raw = localStorage.getItem('wcag-progress');
        if (!raw) return;
        const state = JSON.parse(raw);
        Object.keys(state).forEach(id => {
            const checkbox = document.getElementById(id);
            if (checkbox) {
                checkbox.checked = state[id];
                const criterion = checkbox.closest('.criterion');
                if (state[id]) {
                    criterion && criterion.classList.add('checked');
                } else {
                    criterion && criterion.classList.remove('checked');
                }
            }
        });
    } catch (error) {
        console.log('No saved progress found or error loading:', error);
    }
 }

 /**
 * Przełącza filtr poziomu (A/AA/AAA) i aplikuje filtry.
 * @param {string} level - 'A' | 'AA' | 'AAA'
 * @returns {void}
 */
 function toggleFilter(level) {
    activeFilters[level] = !activeFilters[level];
    const btn = document.getElementById('filter' + level);
    if (btn) {
        btn.classList.toggle('inactive');
        // zaktualizuj aria-pressed
        btn.setAttribute('aria-pressed', String(!btn.classList.contains('inactive')));
    }
    applyFilters();
 }

 /**
 * Aplikuje aktywne filtry oraz wyszukiwanie do widoczności kryteriów.
 * @returns {void}
 */
 function applyFilters() {
    const criteria = document.querySelectorAll('.criterion');
    const searchTerm = document.getElementById('searchBox') ? document.getElementById('searchBox').value.toLowerCase() : '';

    // Jeśli jest fraza wyszukiwania, przygotuj mapę nagłówków (h2/h3),
    // aby uwzględniać kryteria, które pasują przez dopasowanie nagłówka sekcji.
    const headerMatches = new Map();
    if (searchTerm !== '') {
        document.querySelectorAll('h2, h3').forEach(h => {
            headerMatches.set(h, h.textContent.toLowerCase().includes(searchTerm));
        });
    }
    
    criteria.forEach(criterion => {
        const badge = criterion.querySelector('.level-badge');
        const badgeText = badge ? badge.textContent.trim() : '';
        const matchesFilter = activeFilters[badgeText];
        
        let matchesSearch = true;
        if (searchTerm !== '') {
            const text = criterion.textContent.toLowerCase();
            // sprawdź także, czy nagłówek sekcji pasuje do wyszukiwania
            const header = findSectionHeader(criterion);
            const headerMatch = header ? headerMatches.get(header) : false;
            matchesSearch = text.includes(searchTerm) || headerMatch;
        }
        
        if (matchesFilter && matchesSearch) {
            criterion.classList.remove('hidden');
        } else {
            criterion.classList.add('hidden');
        }
    });
    
    updateSectionVisibility();
    updateSearchInfo();
 }

 /**
 * Aktualizuje widoczność nagłówków / intro w zależności od wyszukiwania.
 * @returns {void}
 */
 function updateSectionVisibility() {
    const sections = document.querySelectorAll('h2, h3');
    const intros = document.querySelectorAll('.intro');
    
    sections.forEach(section => {
        // zawsze pokazuj nagłówki
        section.classList.remove('hidden');
    });

    // Ukrywamy wprowadzenia tylko gdy użytkownik aktywnie wyszukuje.
    // Pozostawiamy je widoczne przy samym filtrowaniu poziomów.
    const searchTerm = document.getElementById('searchBox') ? document.getElementById('searchBox').value.toLowerCase() : '';

    if (searchTerm !== '') {
        intros.forEach(i => i.classList.add('hidden'));
    } else {
        intros.forEach(i => i.classList.remove('hidden'));
    }
 }

 /**
 * Aktualizuje informacje o wynikach wyszukiwania widoczne dla użytkownika.
 * @returns {void}
 */
 function updateSearchInfo() {
    const criteria = document.querySelectorAll('.criterion:not(.hidden)');
    const searchTerm = document.getElementById('searchBox') ? document.getElementById('searchBox').value.toLowerCase() : '';
    const searchInfo = document.getElementById('searchInfo');
    
    if (!searchInfo) return;
    if (searchTerm === '') {
        searchInfo.textContent = '';
        return;
    }
    
    const visibleCount = criteria.length;
    
    if (visibleCount === 0) {
        searchInfo.textContent = '❌ Nie znaleziono kryteriów pasujących do wyszukiwania.';
        searchInfo.style.color = '#e74c3c';
    } else {
        searchInfo.textContent = `✅ Znaleziono: ${visibleCount} ${visibleCount === 1 ? 'wynik' : visibleCount < 5 ? 'wyniki' : 'wyników'}`;
        searchInfo.style.color = '#27ae60';
    }
 }

 /**
 * Przeszukuje kryteria oraz nagłówki, podświetla dopasowania.
 * Wyszukuje po tekście i nagłówkach; wykorzystuje highlightText().
 * @returns {void}
 */
 function searchCriteria() {
    const searchTerm = document.getElementById('searchBox') ? document.getElementById('searchBox').value.toLowerCase() : '';
    
    document.querySelectorAll('.highlight').forEach(el => {
        const parent = el.parentNode;
        parent.replaceChild(document.createTextNode(el.textContent), el);
        parent.normalize();
    });
    
    if (searchTerm === '') {
        applyFilters();
        return;
    }
    
    // Przygotuj mapę nagłówków (h2/h3) — czy nagłówek pasuje do wyszukiwania
    const headerMatches = new Map();
    document.querySelectorAll('h2, h3').forEach(h => {
        const txt = h.textContent.toLowerCase();
        const matches = txt.includes(searchTerm);
        headerMatches.set(h, matches);
        if (matches) {
            // podświetl fragment w nagłówku
            highlightText(h, searchTerm);
        }
    });
    
    const criteria = document.querySelectorAll('.criterion');
    
    criteria.forEach(criterion => {
        const text = criterion.textContent.toLowerCase();
        const badge = criterion.querySelector('.level-badge');
        const badgeText = badge ? badge.textContent.trim() : '';
        const matchesFilter = activeFilters[badgeText];

        // znajdź nagłówek sekcji dla tego kryterium (h2 lub h3 poprzedzający)
        const header = findSectionHeader(criterion);
        const headerMatch = header ? headerMatches.get(header) : false;

        const matchesSearch = text.includes(searchTerm) || headerMatch;

        if (matchesSearch && matchesFilter) {
            criterion.classList.remove('hidden');
            const label = criterion.querySelector('label');
            if (label) {
                highlightText(label, searchTerm);
            }
        } else {
            criterion.classList.add('hidden');
        }
    });
    
    updateSearchMatches();
    // Nie ustawiamy automatycznie focusu ani indeksu tutaj — Enter w polu wyszukiwania
    // przeniesie do pierwszego wyniku dzięki handleSearchKeyDown.
    updateSectionVisibility();
    updateSearchInfo();
}

/**
 * Szuka najbliższego poprzedniego h2 lub h3 dla elementu (zakłada strukturę h2/h3 + kryteria jako rodzeństwo)
 * @param {Element} el - element, dla którego szukamy nagłówek sekcji
 * @returns {Element|null} - znaleziony nagłówek lub null
 */
function findSectionHeader(el) {
    let node = el.previousElementSibling;
    while (node) {
        if (node.tagName === 'H2' || node.tagName === 'H3') return node;
        node = node.previousElementSibling;
    }
    // jeśli nic nie znaleziono, spróbuj iść w górę drzewa DOM (bezpieczność)
    let parent = el.parentElement;
    while (parent) {
        node = parent.previousElementSibling;
        while (node) {
            if (node.tagName === 'H2' || node.tagName === 'H3') return node;
            node = node.previousElementSibling;
        }
        parent = parent.parentElement;
    }
    return null;
 }

 /**
 * Podświetla dopasowany fragment tekstu wewnątrz elementu.
 * @param {Element} element - element DOM do przeszukania
 * @param {string} searchTerm - fraza wyszukiwana (małe litery)
 * @returns {void}
 */
 function highlightText(element, searchTerm) {
    const walker = document.createTreeWalker(
        element,
        NodeFilter.SHOW_TEXT,
        null,
        false
    );
    
    const nodesToReplace = [];
    let node;
    
    while (node = walker.nextNode()) {
        const text = node.textContent.toLowerCase();
        if (text.includes(searchTerm)) {
            nodesToReplace.push(node);
        }
    }
    
    nodesToReplace.forEach(node => {
        const text = node.textContent;
        const lowerText = text.toLowerCase();
        const index = lowerText.indexOf(searchTerm);
        
        if (index !== -1) {
            const before = text.substring(0, index);
            const match = text.substring(index, index + searchTerm.length);
            const after = text.substring(index + searchTerm.length);
            
            const fragment = document.createDocumentFragment();
            
            if (before) fragment.appendChild(document.createTextNode(before));
            
            const highlight = document.createElement('span');
            highlight.className = 'highlight';
            highlight.textContent = match;
            fragment.appendChild(highlight);
            
            if (after) fragment.appendChild(document.createTextNode(after));
            
            node.parentNode.replaceChild(fragment, node);
        }
    });
 }


/**
 * Obsługa Enter / Shift+Enter w wyszukiwaniu
 */
function handleSearchKeyDown(event) {
    if (searchMatches.length === 0) return;
    if (event.key === 'Enter') {
        event.preventDefault();
        if (event.shiftKey) searchMatchIndex = (searchMatchIndex - 1 + searchMatches.length) % searchMatches.length;
        else searchMatchIndex = (searchMatchIndex + 1) % searchMatches.length;

        const el = searchMatches[searchMatchIndex];
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
}

/**
 * Aktualizacja tablicy wyników wyszukiwania
 */
function updateSearchMatches() {
    const searchTerm = document.getElementById('searchBox')?.value.toLowerCase() || '';
    if (searchTerm === '') { searchMatches = []; searchMatchIndex = -1; return; }
    searchMatches = Array.from(document.querySelectorAll('.criterion:not(.hidden) label'));
    searchMatchIndex = -1;
}

 /**
 * Przełącza motyw (light/dark) i zapisuje preferencję w localStorage.
 * @returns {void}
 */
 function toggleTheme() {
    const body = document.body;
    const toggle = document.getElementById('themeToggle');
    
    body.classList.toggle('dark-mode');
    
    if (body.classList.contains('dark-mode')) {
        localStorage.setItem('theme', 'dark');
    } else {
        localStorage.setItem('theme', 'light');
    }
 }


