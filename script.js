document.addEventListener('DOMContentLoaded', function() {
    // Основные элементы
    const table = document.getElementById('scheduleTable');
    const tableBody = document.getElementById('tableBody');
    const editPanel = document.getElementById('editPanel');
    const notification = document.getElementById('notification');
    
    // Элементы редактирования
    const cellContent = document.getElementById('cellContent');
    const closeEditPanel = document.getElementById('closeEditPanel');
    const applyChanges = document.getElementById('applyChanges');
    const cancelChanges = document.getElementById('cancelChanges');
    const copyCell = document.getElementById('copyCell');
    const pasteCell = document.getElementById('pasteCell');
    const applyToAll = document.getElementById('applyToAll');
    const cellPosition = document.getElementById('cellPosition');
    const selectedCount = document.getElementById('selectedCount');
    const fontSize = document.getElementById('fontSize');
    const selectAllBtn = document.getElementById('selectAllBtn');
    const clearSelectionBtn = document.getElementById('clearSelectionBtn');
    
    // Кнопки текста
    const btnBold = document.getElementById('btnBold');
    const btnItalic = document.getElementById('btnItalic');
    const btnUnderline = document.getElementById('btnUnderline');
    const btnClearFormat = document.getElementById('btnClearFormat');
    const btnClearText = document.getElementById('btnClearText');
    
    // Выравнивание
    const alignLeft = document.getElementById('alignLeft');
    const alignCenter = document.getElementById('alignCenter');
    const alignRight = document.getElementById('alignRight');
    
    // Кнопки управления
    const addRowBtn = document.getElementById('addRowBtn');
    const addColBtn = document.getElementById('addColBtn');
    const editCellBtn = document.getElementById('editCellBtn');
    const saveTableBtn = document.getElementById('saveTableBtn');
    const resetTableBtn = document.getElementById('resetTableBtn');
    
    // Информационные элементы
    const tableInfo = document.getElementById('tableInfo');
    const lastSaved = document.getElementById('lastSaved');
    const selectedInfo = document.getElementById('selectedInfo');
    
    // Состояние приложения
    let currentCell = null;
    let selectedCells = new Set();
    let lastSelectedCell = null;
    let clipboard = null;
    let textFormat = {
        bold: false,
        italic: false,
        underline: false,
        color: 'default',
        icon: 'none',
        fontSize: '16px',
        align: 'center'
    };
    
    // Показываем уведомление
    function showNotification(message, duration = 3000) {
        notification.textContent = message;
        notification.style.display = 'block';
        
        setTimeout(() => {
            notification.style.display = 'none';
        }, duration);
    }
    
    // Обновляем информацию о таблице
    function updateTableInfo() {
        const rows = tableBody.children.length;
        const cols = table.querySelector('tr').children.length;
        tableInfo.textContent = `Таблица: ${rows}×${cols} ячеек`;
    }
    
    // Обновляем время сохранения
    function updateSaveTime() {
        const now = new Date();
        const timeString = now.toLocaleTimeString('ru-RU', {
            hour: '2-digit',
            minute: '2-digit'
        });
        lastSaved.textContent = `Сохранено: ${timeString}`;
    }
    
    // Инициализация ячеек
    function initializeCells() {
        const cells = table.querySelectorAll('td');
        cells.forEach(cell => {
            cell.addEventListener('click', function(e) {
                handleCellClick(this, e);
            });
            
            cell.addEventListener('dblclick', function(e) {
                e.preventDefault();
                handleCellClick(this, e);
                openEditPanel();
            });
        });
        
        // Заголовки тоже можно редактировать
        const headers = table.querySelectorAll('th');
        headers.forEach(header => {
            header.addEventListener('click', function(e) {
                handleCellClick(this, e);
            });
        });
        
        updateTableInfo();
        updateSelectionInfo();
    }
    
    // Обработка клика по ячейке
    function handleCellClick(cell, event) {
        if (event.ctrlKey || event.metaKey) {
            // Ctrl+Клик - добавить/убрать из выделения
            toggleCellSelection(cell);
        } else if (event.shiftKey && lastSelectedCell) {
            // Shift+Клик - выделить диапазон
            selectCellRange(lastSelectedCell, cell);
        } else {
            // Обычный клик - выбрать одну ячейку
            clearSelection();
            selectSingleCell(cell);
        }
        
        lastSelectedCell = cell;
        updateSelectionInfo();
    }
    
    // Выбор одной ячейки
    function selectSingleCell(cell) {
        // Снимаем выделение со всех ячеек
        table.querySelectorAll('.cell-active').forEach(c => {
            c.classList.remove('cell-active');
        });
        
        // Выделяем выбранную ячейку
        cell.classList.add('cell-active');
        currentCell = cell;
        selectedCells.clear();
        selectedCells.add(cell);
        
        // Обновляем информацию
        updateCellInfo();
        
        // Загружаем данные ячейки в панель редактирования
        loadCellData(cell);
    }
    
    // Переключение выделения ячейки
    function toggleCellSelection(cell) {
        if (selectedCells.has(cell)) {
            // Убираем из выделения
            cell.classList.remove('cell-active', 'cell-selected');
            selectedCells.delete(cell);
            if (currentCell === cell) {
                currentCell = selectedCells.values().next().value || null;
            }
        } else {
            // Добавляем в выделение
            cell.classList.add('cell-active', 'cell-selected');
            selectedCells.add(cell);
            currentCell = cell;
        }
        
        updateCellInfo();
    }
    
    // Выделение диапазона ячеек
    function selectCellRange(startCell, endCell) {
        clearSelection();
        
        const startRow = startCell.parentElement.rowIndex;
        const startCol = startCell.cellIndex;
        const endRow = endCell.parentElement.rowIndex;
        const endCol = endCell.cellIndex;
        
        const minRow = Math.min(startRow, endRow);
        const maxRow = Math.max(startRow, endRow);
        const minCol = Math.min(startCol, endCol);
        const maxCol = Math.max(startCol, endCol);
        
        const rows = table.querySelectorAll('tr');
        
        for (let row = minRow; row <= maxRow; row++) {
            if (rows[row]) {
                const cells = rows[row].querySelectorAll('td, th');
                for (let col = minCol; col <= maxCol; col++) {
                    if (cells[col]) {
                        cells[col].classList.add('cell-active', 'cell-selected');
                        selectedCells.add(cells[col]);
                    }
                }
            }
        }
        
        currentCell = endCell;
        updateCellInfo();
    }
    
    // Очистить выделение
    function clearSelection() {
        selectedCells.forEach(cell => {
            cell.classList.remove('cell-active', 'cell-selected');
        });
        selectedCells.clear();
        currentCell = null;
        updateSelectionInfo();
    }
    
    // Выделить всю таблицу
    function selectAllCells() {
        clearSelection();
        const allCells = table.querySelectorAll('td, th');
        allCells.forEach(cell => {
            cell.classList.add('cell-active', 'cell-selected');
            selectedCells.add(cell);
        });
        currentCell = allCells[0];
        updateSelectionInfo();
        updateCellInfo();
    }
    
    // Обновление информации о выделении
    function updateSelectionInfo() {
        const count = selectedCells.size;
        selectedInfo.textContent = `Выбрано ячеек: ${count}`;
        selectedCount.textContent = count;
        
        if (currentCell) {
            cellPosition.textContent = getCellPosition(currentCell);
        } else {
            cellPosition.textContent = 'Не выбрана';
        }
    }
    
    // Получение позиции ячейки
    function getCellPosition(cell) {
        const row = cell.parentElement;
        const rowIndex = Array.from(row.parentElement.children).indexOf(row) + 1;
        const colIndex = Array.from(row.children).indexOf(cell) + 1;
        
        // Для заголовков используем буквы
        if (row.parentElement.tagName === 'THEAD') {
            const letters = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'];
            return `${letters[colIndex-1]}1`;
        }
        
        const letters = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'];
        return `${letters[colIndex-1]}${rowIndex}`;
    }
    
    // Обновление информации о ячейке
    function updateCellInfo() {
        if (currentCell) {
            // Определяем стили ячейки
            textFormat.bold = currentCell.classList.contains('cell-bold');
            textFormat.italic = currentCell.classList.contains('cell-italic');
            textFormat.underline = currentCell.classList.contains('cell-underline');
            
            // Определяем цвет
            const colorClasses = ['cell-important', 'cell-success', 'cell-warning', 'cell-info', 'cell-highlight'];
            textFormat.color = 'default';
            colorClasses.forEach(cls => {
                if (currentCell.classList.contains(cls)) {
                    textFormat.color = cls.replace('cell-', '');
                }
            });
            
            // Обновляем кнопки
            updateFormatButtons();
            updateColorButtons();
            updateIconButtons();
            
            // Загружаем данные если только одна ячейка выбрана
            if (selectedCells.size === 1) {
                loadCellData(currentCell);
            } else {
                // Для множественного выбора показываем общую информацию
                cellContent.value = '';
            }
        }
    }
    
    // Загрузка данных ячейки в панель редактирования
    function loadCellData(cell) {
        // Убираем иконку из текста
        let text = cell.innerHTML;
        const iconMatch = text.match(/<i class="[^"]*cell-icon[^"]*"[^>]*><\/i>/);
        if (iconMatch) {
            text = text.replace(iconMatch[0], '').trim();
        }
        
        cellContent.value = text;
        
        // Определяем иконку
        if (iconMatch) {
            const iconClass = iconMatch[0].match(/fa-([^" ]+)/);
            if (iconClass) {
                textFormat.icon = iconClass[1];
            }
        } else {
            textFormat.icon = 'none';
        }
        
        // Определяем размер шрифта
        const style = window.getComputedStyle(cell);
        textFormat.fontSize = parseInt(style.fontSize) + 'px';
        fontSize.value = parseInt(textFormat.fontSize);
        
        // Определяем выравнивание
        textFormat.align = style.textAlign;
        updateAlignButtons();
    }
    
    // Обновление кнопок форматирования
    function updateFormatButtons() {
        btnBold.classList.toggle('active', textFormat.bold);
        btnItalic.classList.toggle('active', textFormat.italic);
        btnUnderline.classList.toggle('active', textFormat.underline);
    }
    
    // Обновление кнопок цвета
    function updateColorButtons() {
        document.querySelectorAll('.color-option').forEach(option => {
            option.classList.toggle('active', option.dataset.color === textFormat.color);
        });
    }
    
    // Обновление кнопок иконок
    function updateIconButtons() {
        document.querySelectorAll('.icon-option').forEach(option => {
            option.classList.toggle('active', option.dataset.icon === textFormat.icon);
        });
    }
    
    // Обновление кнопок выравнивания
    function updateAlignButtons() {
        alignLeft.classList.toggle('active', textFormat.align === 'left');
        alignCenter.classList.toggle('active', textFormat.align === 'center');
        alignRight.classList.toggle('active', textFormat.align === 'right');
    }
    
    // Открытие панели редактирования
    function openEditPanel() {
        if (selectedCells.size > 0) {
            editPanel.classList.add('active');
            if (selectedCells.size === 1) {
                loadCellData(currentCell);
            }
        } else {
            showNotification('Сначала выберите ячейку');
        }
    }
    
    // Закрытие панели редактирования
    function closePanel() {
        editPanel.classList.remove('active');
    }
    
    // Применение изменений к выбранным ячейкам
    function applyCellChanges() {
        if (selectedCells.size > 0) {
            selectedCells.forEach(cell => {
                // Удаляем старые классы форматирования
                cell.classList.remove('cell-bold', 'cell-italic', 'cell-underline');
                
                // Применяем новые
                if (textFormat.bold) cell.classList.add('cell-bold');
                if (textFormat.italic) cell.classList.add('cell-italic');
                if (textFormat.underline) cell.classList.add('cell-underline');
                
                // Применяем цвет
                cell.classList.remove('cell-important', 'cell-success', 'cell-warning', 'cell-info', 'cell-highlight');
                if (textFormat.color !== 'default') {
                    cell.classList.add(`cell-${textFormat.color}`);
                }
                
                // Применяем выравнивание
                cell.style.textAlign = textFormat.align;
                
                // Применяем размер шрифта
                cell.style.fontSize = textFormat.fontSize;
                
                // Применяем текст и иконку (только если есть текст)
                if (cellContent.value.trim() !== '') {
                    // Собираем HTML с иконкой
                    let html = '';
                    if (textFormat.icon !== 'none') {
                        const iconClass = getIconClass(textFormat.icon);
                        html = `<i class="${iconClass} cell-icon"></i>`;
                    }
                    html += cellContent.value;
                    
                    cell.innerHTML = html;
                }
                
                cell.classList.add('pulse');
            });
            
            setTimeout(() => {
                selectedCells.forEach(cell => {
                    cell.classList.remove('pulse');
                });
            }, 500);
            
            showNotification(`Изменения применены к ${selectedCells.size} ячейкам`);
            autoSave();
            closePanel();
        }
    }
    
    // Получение класса иконки
    function getIconClass(iconName) {
        const iconMap = {
            'yoga': 'fas fa-spa',
            'run': 'fas fa-running',
            'sun': 'fas fa-sun',
            'moon': 'fas fa-moon',
            'star': 'fas fa-star',
            'heart': 'fas fa-heart',
            'fire': 'fas fa-fire',
            'dumbbell': 'fas fa-dumbbell',
            'user-md': 'fas fa-user-md',
            'child': 'fas fa-child',
            'water': 'fas fa-tint',
            'clock': 'fas fa-clock',
            'check': 'fas fa-check-circle',
            'exclamation': 'fas fa-exclamation-circle',
            'users': 'fas fa-users'
        };
        
        return iconMap[iconName] || 'fas fa-question';
    }
    
    // Обработчики кнопок форматирования
    btnBold.addEventListener('click', function() {
        textFormat.bold = !textFormat.bold;
        updateFormatButtons();
    });
    
    btnItalic.addEventListener('click', function() {
        textFormat.italic = !textFormat.italic;
        updateFormatButtons();
    });
    
    btnUnderline.addEventListener('click', function() {
        textFormat.underline = !textFormat.underline;
        updateFormatButtons();
    });
    
    btnClearFormat.addEventListener('click', function() {
        textFormat.bold = false;
        textFormat.italic = false;
        textFormat.underline = false;
        textFormat.color = 'default';
        updateFormatButtons();
        updateColorButtons();
    });
    
    btnClearText.addEventListener('click', function() {
        cellContent.value = '';
    });
    
    // Обработчики цвета
    document.querySelectorAll('.color-option').forEach(option => {
        option.addEventListener('click', function() {
            textFormat.color = this.dataset.color;
            updateColorButtons();
        });
    });
    
    // Обработчики иконок
    document.querySelectorAll('.icon-option').forEach(option => {
        option.addEventListener('click', function() {
            textFormat.icon = this.dataset.icon;
            updateIconButtons();
        });
    });
    
    // Обработчики выравнивания
    alignLeft.addEventListener('click', function() {
        textFormat.align = 'left';
        updateAlignButtons();
    });
    
    alignCenter.addEventListener('click', function() {
        textFormat.align = 'center';
        updateAlignButtons();
    });
    
    alignRight.addEventListener('click', function() {
        textFormat.align = 'right';
        updateAlignButtons();
    });
    
    // Изменение размера шрифта
    fontSize.addEventListener('input', function() {
        textFormat.fontSize = this.value + 'px';
    });
    
    // Копирование ячейки
    copyCell.addEventListener('click', function() {
        if (currentCell) {
            clipboard = {
                html: currentCell.innerHTML,
                style: currentCell.getAttribute('style') || '',
                class: currentCell.getAttribute('class') || ''
            };
            showNotification('Ячейка скопирована в буфер');
        }
    });
    
    // Вставка ячейки
    pasteCell.addEventListener('click', function() {
        if (selectedCells.size > 0 && clipboard) {
            selectedCells.forEach(cell => {
                cell.innerHTML = clipboard.html;
                cell.setAttribute('style', clipboard.style);
                cell.setAttribute('class', clipboard.class);
            });
            showNotification(`Вставлено в ${selectedCells.size} ячеек`);
            autoSave();
        }
    });
    
    // Применение ко всем выделенным
    applyToAll.addEventListener('click', function() {
        applyCellChanges();
    });
    
    // Выделить всю таблицу
    selectAllBtn.addEventListener('click', selectAllCells);
    
    // Очистить выделение
    clearSelectionBtn.addEventListener('click', clearSelection);
    
    // Добавление строки
    addRowBtn.addEventListener('click', function() {
        const newRow = document.createElement('tr');
        const cols = table.querySelector('tr').children.length;
        
        // Первая ячейка - время
        const timeCell = document.createElement('th');
        const lastTime = tableBody.lastElementChild?.firstElementChild?.textContent || '19:00-20:00';
        const timeMatch = lastTime.match(/(\d+):(\d+)-(\d+):(\d+)/);
        
        if (timeMatch) {
            let startHour = parseInt(timeMatch[1]) + 1;
            let endHour = parseInt(timeMatch[3]) + 1;
            timeCell.textContent = `${startHour}:00-${endHour}:00`;
        } else {
            timeCell.textContent = '20:00-21:00';
        }
        
        newRow.appendChild(timeCell);
        
        // Остальные ячейки
        for (let i = 1; i < cols; i++) {
            const cell = document.createElement('td');
            cell.addEventListener('click', function(e) {
                handleCellClick(this, e);
            });
            cell.addEventListener('dblclick', function(e) {
                e.preventDefault();
                handleCellClick(this, e);
                openEditPanel();
            });
            newRow.appendChild(cell);
        }
        
        tableBody.appendChild(newRow);
        updateTableInfo();
        showNotification('Добавлена новая строка');
        autoSave();
    });
    
    // Добавление столбца
    addColBtn.addEventListener('click', function() {
        const rows = table.querySelectorAll('tr');
        const dayNames = ['Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота', 'Воскресенье', 'Доп. день'];
        const currentCols = rows[0].children.length;
        
        rows.forEach((row, index) => {
            const cell = index === 0 ? document.createElement('th') : document.createElement('td');
            
            if (index === 0) {
                // Заголовок
                cell.textContent = dayNames[currentCols - 1] || 'День ' + currentCols;
            } else {
                // Обычная ячейка
                cell.addEventListener('click', function(e) {
                    handleCellClick(this, e);
                });
                cell.addEventListener('dblclick', function(e) {
                    e.preventDefault();
                    handleCellClick(this, e);
                    openEditPanel();
                });
            }
            
            row.appendChild(cell);
        });
        
        updateTableInfo();
        showNotification('Добавлен новый столбец');
        autoSave();
    });
    
    // Редактирование ячейки (кнопка в панели управления)
    editCellBtn.addEventListener('click', openEditPanel);
    
    // Сохранение таблицы
    saveTableBtn.addEventListener('click', function() {
        saveTableData();
        updateSaveTime();
        showNotification('Таблица сохранена', 2000);
    });
    
    // Сброс таблицы
    resetTableBtn.addEventListener('click', function() {
        if (confirm('Сбросить все изменения к исходному состоянию?')) {
            localStorage.removeItem('stretchScheduleWithFormatting');
            location.reload();
        }
    });
    
    // Закрытие панели редактирования
    closeEditPanel.addEventListener('click', closePanel);
    cancelChanges.addEventListener('click', closePanel);
    applyChanges.addEventListener('click', applyCellChanges);
    
    // Обработка нажатия клавиш
    document.addEventListener('keydown', function(e) {
        // Ctrl+A - выделить все
        if ((e.ctrlKey || e.metaKey) && e.key === 'a') {
            e.preventDefault();
            selectAllCells();
        }
        
        // Escape - снять выделение
        if (e.key === 'Escape') {
            clearSelection();
        }
        
        // Delete - очистить выбранные ячейки
        if (e.key === 'Delete' && selectedCells.size > 0) {
            selectedCells.forEach(cell => {
                cell.innerHTML = '';
            });
            showNotification(`Очищено ${selectedCells.size} ячеек`);
            autoSave();
        }
    });
    
    // Автосохранение
    let saveTimeout;
    function autoSave() {
        clearTimeout(saveTimeout);
        saveTimeout = setTimeout(() => {
            saveTableData();
            updateSaveTime();
        }, 2000);
    }
    
    // Сохранение данных таблицы
    function saveTableData() {
        const tableData = {
            rows: []
        };
        
        // Сохраняем все строки
        table.querySelectorAll('tr').forEach(row => {
            const rowData = [];
            Array.from(row.children).forEach(cell => {
                rowData.push({
                    html: cell.innerHTML,
                    type: cell.tagName,
                    style: cell.getAttribute('style') || '',
                    className: cell.getAttribute('class') || ''
                });
            });
            tableData.rows.push(rowData);
        });
        
        localStorage.setItem('stretchScheduleWithFormatting', JSON.stringify(tableData));
    }
    
    // Загрузка данных таблицы
    function loadTableData() {
        const savedData = localStorage.getItem('stretchScheduleWithFormatting');
        
        if (savedData) {
            const tableData = JSON.parse(savedData);
            
            // Очищаем таблицу
            tableBody.innerHTML = '';
            
            // Восстанавливаем строки
            tableData.rows.forEach((rowData, rowIndex) => {
                const row = document.createElement('tr');
                
                rowData.forEach((cellData, cellIndex) => {
                    const cell = document.createElement(cellData.type);
                    cell.innerHTML = cellData.html;
                    cell.setAttribute('style', cellData.style);
                    cell.setAttribute('class', cellData.className);
                    
                    if (cell.tagName === 'TD') {
                        cell.addEventListener('click', function(e) {
                            handleCellClick(this, e);
                        });
                        cell.addEventListener('dblclick', function(e) {
                            e.preventDefault();
                            handleCellClick(this, e);
                            openEditPanel();
                        });
                    } else {
                        cell.addEventListener('click', function(e) {
                            handleCellClick(this, e);
                        });
                    }
                    
                    row.appendChild(cell);
                });
                
                if (rowIndex === 0) {
                    table.querySelector('thead').innerHTML = '';
                    table.querySelector('thead').appendChild(row);
                } else {
                    tableBody.appendChild(row);
                }
            });
            
            updateSaveTime();
            showNotification('Данные загружены из памяти');
        } else {
            // Инициализируем исходные ячейки
            initializeCells();
            showNotification('Готово к работе!');
        }
        
        updateTableInfo();
    }
    
    // Инициализация приложения
    function initApp() {
        loadTableData();
        
        // Показываем приветственное сообщение
        setTimeout(() => {
            showNotification('Используйте Ctrl+Клик для множественного выбора, Shift+Клик для выделения диапазона', 6000);
        }, 1000);
    }
    
    // Запуск приложения
    initApp();
});