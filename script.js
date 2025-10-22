// script.js (обновлённая версия с фиксом блюра и переключателем языка)

let currentLang; // Глобальная переменная для хранения текущего языка

document.addEventListener('DOMContentLoaded', () => {
    console.log("Proposly Script: DOM-дерево готово. Начинаю работу.");

    // --- КОД ДЛЯ ПЛАВНОЙ ТЕНИ ШАПКИ (остается без изменений) ---
    const headerContainer = document.querySelector('.header .container'); 
    const scrollDistance = 400; 

    function updateHeaderEffect() {
        const progress = Math.min(window.scrollY / scrollDistance, 1.0);
        if (headerContainer) {
            headerContainer.style.setProperty('--scroll-progress', progress);
        }
    }
    updateHeaderEffect();
    window.addEventListener('scroll', updateHeaderEffect);
    console.log("Proposly Script: Логика для *плавной* тени шапки (с фиксом блюра) активирована.");
    // --- КОНЕЦ КОДА ДЛЯ ПЛАВNOЙ ТЕНИ ШАПКИ ---

    // --- НАЧАЛО НОВОГО КОДА ДЛЯ ПЕРЕВОДА ---
    
    // 1. Определяем язык
    // Пытаемся достать из localStorage
    let savedLang = localStorage.getItem('proposlyLang');
    
    if (savedLang) {
        currentLang = savedLang;
        console.log(`Proposly Script: Найден сохранённый язык '${currentLang}' в localStorage.`);
    } else {
        // Если в localStorage нет, определяем по браузеру
        const userLang = navigator.language.slice(0, 2);
        console.log(`Proposly Script: Язык браузера определён как '${userLang}'.`);
        currentLang = (userLang === 'ru') ? 'ru' : 'en';
        // Сохраняем в localStorage для будущих визитов
        localStorage.setItem('proposlyLang', currentLang);
    }
    
    console.log(`Proposly Script: Выбран язык '${currentLang}'. Запускаю загрузку текстов...`);
    // 2. Загружаем тексты
    loadLanguage(currentLang);

    // 3. Навешиваем обработчик на кнопку
    const switcherButton = document.getElementById('lang-switcher');
    if (switcherButton) {
        switcherButton.addEventListener('click', (e) => {
            e.preventDefault(); // Отменяем стандартное поведение ссылки
            
            // Переключаем язык
            currentLang = (currentLang === 'ru') ? 'en' : 'ru';
            
            // Сохраняем выбор
            localStorage.setItem('proposlyLang', currentLang);
            
            // Перезагружаем переводы
            loadLanguage(currentLang);
            
            console.log(`Proposly Script: Язык изменён на '${currentLang}' по клику.`);
        });
    } else {
        console.warn("Proposly Script: Кнопка переключения языка #lang-switcher не найдена.");
    }
    // --- КОНЕЦ НОВОГО КОДА ДЛЯ ПЕРЕВОДА ---
});

// === ЭТА ФУНКЦИЯ ПОЛНОСТЬЮ ОБНОВЛЕНА ===
async function loadLanguage(lang) {
    const filePath = `messages_${lang}.json`;
    console.log(`Proposly Script: Пытаюсь загрузить файл: ${filePath}`);

    try {
        const response = await fetch(filePath);

        if (!response.ok) {
            throw new Error(`Сетевая ошибка: Не удалось найти файл '${filePath}' (Статус: ${response.status}).`);
        }

        const translations = await response.json();
        console.log("Proposly Script: Файл с текстами успешно загружен и обработан.");

        // --- 1. ОБЫЧНАЯ ЗАМЕНА ТЕКСТА (как и было) ---
        const elements = document.querySelectorAll('[data-lang-key]');
        console.log(`Proposly Script: Найдено ${elements.length} элементов для [data-lang-key].`);

        elements.forEach(element => {
            const key = element.getAttribute('data-lang-key');
            if (translations[key]) {
                element.innerHTML = translations[key];
            } else {
                console.warn(`Внимание: ключ '${key}' не найден в файле ${filePath}`);
            }
        });
        
        // --- 2. НОВЫЙ БЛОК: ДИНАМИЧЕСКАЯ ЗАГРУЗКА HTML ---
        const htmlElements = document.querySelectorAll('[data-lang-load-html]');
        console.log(`Proposly Script: Найдено ${htmlElements.length} элементов для [data-lang-load-html].`);
        
        // Используем Promise.all, чтобы дождаться загрузки всех HTML-файлов
        await Promise.all(Array.from(htmlElements).map(async (element) => {
            const key = element.getAttribute('data-lang-load-html');
            const contentFilePath = translations[key];
            
            if (contentFilePath) {
                try {
                    console.log(`Proposly Script: Загружаю HTML из '${contentFilePath}'...`);
                    const contentResponse = await fetch(contentFilePath);
                    if (!contentResponse.ok) {
                        throw new Error(`Сетевая ошибка: Не удалось найти файл контента '${contentFilePath}' (Статус: ${contentResponse.status}).`);
                    }
                    const htmlContent = await contentResponse.text();
                    element.innerHTML = htmlContent;
                    console.log(`Proposly Script: HTML из '${contentFilePath}' успешно загружен.`);
                } catch (contentError) {
                    console.error(contentError);
                    element.innerHTML = `<p style="color: red;">Ошибка загрузки контента: ${contentError.message}</p>`;
                }
            } else {
                console.warn(`Внимание: ключ '${key}' (для HTML-файла) не найден в ${filePath}`);
            }
        }));
        // --- КОНЕЦ НОВОГО БЛОКА ---

        console.log("Proposly Script: Перевод страницы полностью завершён!");

        // Обновление кнопки переключателя (как и было)
        const switcher = document.getElementById('lang-switcher');
        if (switcher) {
            switcher.textContent = (lang === 'ru') ? 'EN' : 'RU';
        }

    } catch (error) {
        console.error("--- КРИТИЧЕСКАЯ ОШИБКА ---");
        console.error(error);

        const errorBox = document.createElement('div');
        errorBox.style.cssText = `
            position: fixed; top: 20px; left: 20px; right: 20px; padding: 20px;
            background-color: #FFD2D2; border: 2px solid #D8000C; color: #D8000C;
            font-family: monospace; z-index: 9999; border-radius: 8px;
        `;
        errorBox.innerHTML = `
            <strong>[Ошибка Proposly]</strong> Не удалось загрузить тексты для страницы. <br>
            <strong>Что делать:</strong> Нажмите F12, перейдите во вкладку "Console" (Консоль) и посмотрите на ошибку, выделенную красным цветом.
        `;
        document.body.prepend(errorBox);
    }
}