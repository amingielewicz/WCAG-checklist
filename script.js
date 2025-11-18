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

 function checkAll() {
    const checkboxes = document.querySelectorAll('.criterion:not(.hidden) input[type="checkbox"]');
    checkboxes.forEach(checkbox => {
        checkbox.checked = true;
        checkbox.closest('.criterion') && checkbox.closest('.criterion').classList.add('checked');
    });
    saveProgressToStorage();
    updateProgress();
 }

 function uncheckAll() {
    const checkboxes = document.querySelectorAll('input[type="checkbox"]');
    checkboxes.forEach(checkbox => {
        checkbox.checked = false;
        checkbox.closest('.criterion') && checkbox.closest('.criterion').classList.remove('checked');
    });
    saveProgressToStorage();
    updateProgress();
 }

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

 // Odczyt z localStorage
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

 function applyFilters() {
    const criteria = document.querySelectorAll('.criterion');
    const searchTerm = document.getElementById('searchBox') ? document.getElementById('searchBox').value.toLowerCase() : '';
    
    criteria.forEach(criterion => {
        const badge = criterion.querySelector('.level-badge');
        const badgeText = badge ? badge.textContent.trim() : '';
        const matchesFilter = activeFilters[badgeText];
        
        let matchesSearch = true;
        if (searchTerm !== '') {
            const text = criterion.textContent.toLowerCase();
            matchesSearch = text.includes(searchTerm);
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

 function updateSearchMatches() {
    // Wszystkie widoczne kryteria traktujemy jako wyniki (searchCriteria już ukrywa niepasujące)
    searchMatches = Array.from(document.querySelectorAll('.criterion:not(.hidden)'));
    // Nie ustawiamy automatycznie zaznacenia — indeks ustawiamy na -1, aby wpisywanie nie traciło focusu.
    searchMatchIndex = searchMatches.length ? -1 : -1;
    // Usuń wcześniejsze zaznacenia wizualne (jeżeli były)
    document.querySelectorAll('.search-current').forEach(n => n.classList.remove('search-current'));
}

function handleSearchKeyDown(e) {
	if (e.key !== 'Enter') return;
	e.preventDefault();
	if (!searchMatches || searchMatches.length === 0) return;

	if (e.shiftKey) {
		// poprzedni wynik
		searchMatchIndex = (searchMatchIndex - 1 + searchMatches.length) % searchMatches.length;
	} else {
		// następny wynik
		searchMatchIndex = (searchMatchIndex + 1) % searchMatches.length;
	}
	focusSearchMatch();
}

function focusSearchMatch() {
	const el = searchMatches[searchMatchIndex];
	if (!el) return;
	// usuń stare
	document.querySelectorAll('.search-current').forEach(n => n.classList.remove('search-current'));
	el.classList.add('search-current');

	// ustaw fokus na zawartości kryterium (etykieta), przewiń płynnie
	const content = el.querySelector('.criterion-content') || el;
	if (content && typeof content.focus === 'function') content.focus();
	el.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

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

// Szuka najbliższego poprzedniego h2 lub h3 dla elementu (zakłada strukturę h2/h3 + kryteria jako rodzeństwo)
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

 /* Funkcja przełączania trybu (pozostawiona bez zmian logicznych) */
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

// (usunięto: updateW3CLinks — linki do W3C pozostają takie, jakie są w index.html)

