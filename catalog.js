let allLessons = [];
let filters = { subject: "all", grade: "all" };

// Параметри за страницирането - ПРОМЕНЕНО НА 9 УРОКА НА СТРАНИЦА
let currentPage = 1;
const itemsPerPage = 9;

async function loadCatalog() {
    try {
        const response = await fetch('lessons.json');
        if (!response.ok) throw new Error('Грешка при комуникация с базата данни.');
        allLessons = await response.json();
        renderCatalog();
    } catch (error) {
        console.error('Грешка:', error);
        const grid = document.getElementById("lessons-grid");
        if (grid) {
            grid.innerHTML = `<p style="grid-column: 1/-1; text-align: center; color: #dc2626; font-weight: 600; padding: 40px;">Възникна проблем при зареждането на уроците.</p>`;
        }
    }
}

function renderCatalog() {
    const grid = document.getElementById("lessons-grid");
    const paginationContainer = document.getElementById("pagination-controls");
    if (!grid) return;

    // 1. Филтриране по двата критерия (Предмет и Клас) едновременно
    let filtered = allLessons.filter(l => {
        return (filters.subject === "all" || l.subject === filters.subject) &&
               (filters.grade === "all" || String(l.grade) === String(filters.grade));
    });

    // Извличане на стойността от търсачката, ако има написан текст
    const searchInput = document.getElementById('lesson-search-input');
    const searchQuery = searchInput ? searchInput.value.toLowerCase().trim() : "";
    
    // Ако има търсене, филтрираме и по текст
    if (searchQuery !== "") {
        filtered = filtered.filter(l => {
            const titleMatch = l.title ? l.title.toLowerCase().includes(searchQuery) : false;
            const descMatch = l.desc ? l.desc.toLowerCase().includes(searchQuery) : false;
            return titleMatch || descMatch;
        });
    }

    // Ако няма намерени уроци
    if (!filtered.length) {
        grid.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: #64748b; padding: 60px; font-weight: 500;">Няма намерени уроци по избраните критерии.</p>';
        if (paginationContainer) paginationContainer.innerHTML = '';
        return;
    }

    // 2. ИЗЧИСЛЯВАНЕ НА СТРАНИЦИТЕ
    const totalPages = Math.ceil(filtered.length / itemsPerPage);
    
    // Предпазна мярка: ако текущата страница стане по-голяма от общия брой страници (напр. след филтриране)
    if (currentPage > totalPages) {
        currentPage = 1;
    }

    // Взимаме само уроците за текущата страница (напр. от 0 до 9, от 9 до 18 и т.н.)
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const lessonsToDisplay = filtered.slice(startIndex, endIndex);

    grid.innerHTML = "";

    // 3. РЕНДИРАНЕ НА УРОЦИТЕ ЗА ТЕКУЩАТА СТРАНИЦА
    lessonsToDisplay.forEach(lesson => {
        let buttonsHTML = "";
        if (lesson.resources && lesson.resources.length > 0) {
            lesson.resources.forEach(res => {
                let iconName = "document.png";
                const nameLower = res.name.toLowerCase();

                // Правилна логика за иконките
                if (nameLower.includes("презентация") || nameLower.includes("ppt")) {
                    iconName = "presentation.png";
                } else if (nameLower.includes("excel") || nameLower.includes("xlsx") || nameLower.includes("таблица") || (nameLower.includes("задача") && nameLower.includes("ексел"))) {
                    iconName = "excel.png";
                } else if (nameLower.includes("задача") || nameLower.includes("word") || nameLower.includes("docx")) {
                    iconName = "word.png"; 
                } else if (nameLower.includes("pdf")) {
                    iconName = "pdf.png";
                }

                buttonsHTML += `
                    <a href="${res.url}" target="_blank" class="btn-resource-single">
                        <div class="btn-resource-text-side" style="display: flex; align-items: center; gap: 8px;">
                            <img src="resources/${iconName}" style="width: 16px; height: 16px; object-fit: contain; flex-shrink: 0;" alt="">
                            <span>${res.name}</span>
                        </div>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
                    </a>
                `;
            });
        }

        const cardHTML = `
            <article class="premium-card">
                <div class="card-media-box">
                    <img src="${lesson.image}" alt="${lesson.title}">
                </div>
                <div class="card-info-content">
                    <div>
                        <div class="card-badge-row">
                            <span class="mini-badge badge-gray">${lesson.subject}</span>
                            <span class="mini-badge badge-blue">${lesson.grade} клас</span>
                        </div>
                        <h3>${lesson.title}</h3>
                        <p class="card-desc">${lesson.desc || ''}</p>
                    </div>
                    <div class="card-resources-box">
                        ${buttonsHTML}
                    </div>
                    <div class="card-footer-meta">
                        <div class="author-box">
                            <div class="author-avatar"></div>
                            <span>${lesson.type || 'Материал'}</span>
                        </div>
                        <span>${lesson.duration || '45 мин'}</span>
                    </div>
                </div>
            </article>
        `;
        grid.innerHTML += cardHTML;
    });

    // 4. СЪЗДАВАНЕ НА БУТОНИТЕ ЗА СТРАНИЦИРАНЕ
    renderPaginationControls(totalPages);
}

function renderPaginationControls(totalPages) {
    const container = document.getElementById("pagination-controls");
    if (!container) return;

    // Ако всички материали се събират на 1 страница, не показваме бутони
    if (totalPages <= 1) {
        container.innerHTML = "";
        return;
    }

    let html = "";

    // Бутон за Предишна страница
    html += `
        <button ${currentPage === 1 ? 'disabled style="opacity: 0.4; cursor: not-allowed;"' : ''} 
            class="filter-pill-btn" onclick="changePage(${currentPage - 1})">
            &larr; Предишна
        </button>
    `;

    // Номера на страниците (1, 2, 3...)
    for (let i = 1; i <= totalPages; i++) {
        const isActive = i === currentPage;
        html += `
            <button class="filter-pill-btn ${isActive ? 'active' : ''}" 
                style="${isActive ? 'background-color: var(--accent-blue) !important; color: white !important;' : ''}"
                onclick="changePage(${i})">
                ${i}
            </button>
        `;
    }

    // Бутон за Следваща страница
    html += `
        <button ${currentPage === totalPages ? 'disabled style="opacity: 0.4; cursor: not-allowed;"' : ''} 
            class="filter-pill-btn" onclick="changePage(${currentPage + 1})">
            Следваща &rarr;
        </button>
    `;

    container.innerHTML = html;
}

// Функция за смяна на страницата
window.changePage = function(page) {
    currentPage = page;
    renderCatalog();
    // Автоматично плавно скролване нагоре, до началото на каталога
    window.scrollTo({ top: 300, behavior: 'smooth' });
}

// Инициализация при зареждане на DOM дървото
document.addEventListener("DOMContentLoaded", () => {
    loadCatalog();

    // Корекция: Използваме e.currentTarget, за да хваща перфектно клика върху текста на категориите
    document.querySelectorAll(".filter-pill-btn").forEach(pill => {
        pill.addEventListener("click", (e) => {
            const button = e.currentTarget;
            const filterType = button.getAttribute("data-filter");
            const filterValue = button.getAttribute("data-value");

            if (!filterType) return; // Прескачаме бутоните за страници, които нямат филтри

            button.parentElement.querySelectorAll(".filter-pill-btn").forEach(p => p.classList.remove("active"));
            button.classList.add("active");

            filters[filterType] = filterValue;
            
            // Връщаме на първа страница при смяна на категория
            currentPage = 1; 
            renderCatalog();
        });
    });

    // Търсачка в реално време
    const searchInput = document.getElementById('lesson-search-input');
    if (searchInput) {
        searchInput.addEventListener('input', function() {
            currentPage = 1; // Връщаме на първа страница при ново търсене
            renderCatalog();
        });
    }
});