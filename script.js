(function() {
    const EXCHANGE_RATES = { USD: 1, BYN: 2.9476, RUB: 80.5573, EUR: 0.9200 };
    
    const translations = {
        ru: { 
            income: 'Доходы', expense: 'Затраты', balance: 'Баланс', historyTitle: 'История', 
            themeDark: '🌙 Тёмная', themeLight: '☀️ Светлая', submit: 'Добавить', clearAll: '🗑 Очистить', 
            typeIncome: '+ Доход', typeExpense: '− Расход', historyEmpty: 'Нет операций', records: 'записей', 
            budgetLabel: 'Лимит на месяц', budgetLeft: 'Осталось', budgetOver: 'Перерасход!',
            alertNoMoney: 'Недостаточно средств! На балансе: ', alertAmount: 'Введите сумму больше нуля!',
            noDesc: 'Без описания', deleteTitle: 'Удалить', catOther: 'Другое', catFood: 'Еда', catTransport: 'Транспорт', catFun: 'Развлечения', catHealth: 'Здоровье', catSalary: 'Зарплата'
        },
        be: { 
            income: 'Даходы', expense: 'Затраты', balance: 'Баланс', historyTitle: 'Гісторыя', 
            themeDark: '🌙 Цёмная', themeLight: '☀️ Светлая', submit: 'Дадаць', clearAll: '🗑 Ачысціць', 
            typeIncome: '+ Даход', typeExpense: '− Затрата', historyEmpty: 'Няма аперацый', records: 'запісаў', 
            budgetLabel: 'Ліміт на месяц', budgetLeft: 'Засталося', budgetOver: 'Перавыдаткі!',
            alertNoMoney: 'Недастаткова сродкаў! На балянсе: ', alertAmount: 'Увядзіце суму больш за нуль!',
            noDesc: 'Без апісання', deleteTitle: 'Выдаліць', catOther: 'Іншае', catFood: 'Ежа', catTransport: 'Транспарт', catFun: 'Забавы', catHealth: 'Здароўе', catSalary: 'Зарплата'
        },
        en: { 
            income: 'Income', expense: 'Expenses', balance: 'Balance', historyTitle: 'History', 
            themeDark: '🌙 Dark', themeLight: '☀️ Light', submit: 'Add', clearAll: '🗑 Clear', 
            typeIncome: '+ Income', typeExpense: '− Expense', historyEmpty: 'No transactions', records: 'records', 
            budgetLabel: 'Monthly Budget', budgetLeft: 'Left', budgetOver: 'Overspent!',
            alertNoMoney: 'Insufficient funds! Balance: ', alertAmount: 'Enter an amount greater than zero!',
            noDesc: 'No description', deleteTitle: 'Delete', catOther: 'Other', catFood: 'Food', catTransport: 'Transport', catFun: 'Fun', catHealth: 'Health', catSalary: 'Salary'
        }
    };

    let currentLang = 'ru', currentCurrency = 'BYN', currentType = 'income';
    let transactions = JSON.parse(localStorage.getItem('myTransactions')) || [];
    let budgetLimit = parseFloat(localStorage.getItem('myBudget')) || 0;
    let nextId = transactions.length > 0 ? Math.max(...transactions.map(t => t.id)) + 1 : 1;
    let myChart = null;

    const body = document.body;
    const els = {
        amount: document.getElementById('amountInput'), desc: document.getElementById('descInput'),
        category: document.getElementById('categorySelect'), submit: document.getElementById('submitBtn'),
        history: document.getElementById('historyList'), balance: document.getElementById('balanceValue'),
        budgetInput: document.getElementById('budgetInput'), budgetInfo: document.getElementById('budgetInfo'),
        progressFill: document.getElementById('progressFill'), chart: document.getElementById('myChart'),
        budgetLabelText: document.getElementById('budgetLabel')
    };

    function formatAmount(usdAmount) {
        const symbols = { RUB: '₽', BYN: 'Br', USD: '$', EUR: '€' };
        const converted = usdAmount * (EXCHANGE_RATES[currentCurrency] || 1);
        return `${symbols[currentCurrency]}${new Intl.NumberFormat('en-US', { useGrouping: false, maximumFractionDigits: 2 }).format(converted)}`;
    }

    function saveData() {
        localStorage.setItem('myTransactions', JSON.stringify(transactions));
        localStorage.setItem('myBudget', budgetLimit);
    }

    // --- ГЛАВНАЯ ФУНКЦИЯ ПЕРЕВОДА ---
    function updateLanguage() {
        const t = translations[currentLang];
        
        // Перевод заголовков и кнопок
        if(document.getElementById('incomeLabel')) document.getElementById('incomeLabel').textContent = t.income;
        if(document.getElementById('expenseLabel')) document.getElementById('expenseLabel').textContent = t.expense;
        if(document.getElementById('balanceLabel')) document.getElementById('balanceLabel').textContent = t.balance;
        if(document.getElementById('historyTitle')) document.getElementById('historyTitle').textContent = t.historyTitle;
        if(document.getElementById('submitBtn')) document.getElementById('submitBtn').textContent = t.submit;
        if(document.getElementById('clearAllBtn')) document.getElementById('clearAllBtn').textContent = t.clearAll;
        if(document.getElementById('typeIncome')) document.getElementById('typeIncome').textContent = t.typeIncome;
        if(document.getElementById('typeExpense')) document.getElementById('typeExpense').textContent = t.typeExpense;
        if(document.getElementById('themeToggle')) document.getElementById('themeToggle').textContent = body.classList.contains('dark') ? t.themeLight : t.themeDark;
        
        // Перевод поля бюджета
        if (els.budgetLabelText) els.budgetLabelText.textContent = t.budgetLabel;
        
        // Перевод выпадающего списка категорий
        const catSelect = els.category;
        if (catSelect) {
            catSelect.options[0].text = '📦 ' + t.catOther;
            catSelect.options[1].text = '🍔 ' + t.catFood;
            catSelect.options[2].text = '🚗 ' + t.catTransport;
            catSelect.options[3].text = '🎮 ' + t.catFun;
            catSelect.options[4].text = '💊 ' + t.catHealth;
            catSelect.options[5].text = '💼 ' + t.catSalary;
        }

        // Подсветка активного языка
        document.getElementById('langRu').classList.toggle('active', currentLang === 'ru');
        document.getElementById('langBe').classList.toggle('active', currentLang === 'be');
        document.getElementById('langEn').classList.toggle('active', currentLang === 'en');
        
        updateUI(); // Перерисовываем историю с новым языком
    }

    function updateUI() {
        let incomeUSD = 0, expenseUSD = 0;
        transactions.forEach(t => t.type === 'income' ? incomeUSD += t.amountUSD : expenseUSD += t.amountUSD);
        const balanceUSD = incomeUSD - expenseUSD;
        els.balance.textContent = formatAmount(balanceUSD);

        const expenseInCurrency = expenseUSD * (EXCHANGE_RATES[currentCurrency] || 1);
        els.budgetInput.value = budgetLimit > 0 ? budgetLimit : '';
        if (budgetLimit > 0) {
            const percent = Math.min((expenseInCurrency / budgetLimit) * 100, 100);
            const left = budgetLimit - expenseInCurrency;
            els.progressFill.style.width = `${percent}%`;
            els.progressFill.style.background = left < 0 ? '#f87171' : '#34d399';
            els.budgetInfo.textContent = left >= 0 
                ? `${translations[currentLang].budgetLeft}: ${formatAmount(left / (EXCHANGE_RATES[currentCurrency] || 1))}`
                : `${translations[currentLang].budgetOver} ${formatAmount(Math.abs(left) / (EXCHANGE_RATES[currentCurrency] || 1))}`;
        } else {
            els.progressFill.style.width = '0%';
            els.budgetInfo.textContent = '';
        }

        // Отрисовка истории
        if (transactions.length === 0) {
            els.history.innerHTML = `<li class="history-item" style="justify-content:center; opacity:0.6;">${translations[currentLang].historyEmpty}</li>`;
        } else {
            els.history.innerHTML = [...transactions].sort((a,b)=>b.id-a.id).map(t => `
                <li class="history-item ${t.type === 'income' ? 'income-item' : 'expense-item'}">
                    <span class="history-desc">${t.category === 'food' ? '🍔' : t.category === 'transport' ? '🚗' : t.category === 'fun' ? '🎮' : t.category === 'health' ? '💊' : t.category === 'salary' ? '💼' : '📦'} ${t.desc || translations[currentLang].noDesc}</span>
                    <span class="history-amount">${t.type === 'income' ? '+' : '−'} ${formatAmount(t.amountUSD)}</span>
                    <button class="delete-btn" onclick="deleteTx(${t.id})" title="${translations[currentLang].deleteTitle}">✕</button>
                </li>
            `).join('');
        }

        // Отрисовка графика
        const expensesByCategory = {};
        transactions.filter(t => t.type === 'expense').forEach(t => {
            expensesByCategory[t.category] = (expensesByCategory[t.category] || 0) + t.amountUSD;
        });
        
        const t = translations[currentLang];
        const catNames = { food: t.catFood + ' 🍔', transport: t.catTransport + ' 🚗', fun: t.catFun + ' 🎮', health: t.catHealth + ' 💊', other: t.catOther + ' 📦' };
        const labels = Object.keys(expensesByCategory).map(k => catNames[k] || k);
        const data = Object.values(expensesByCategory).map(v => v * (EXCHANGE_RATES[currentCurrency] || 1));

        if (myChart) myChart.destroy();
        if (data.length > 0) {
            myChart = new Chart(els.chart, {
                type: 'doughnut',
                data: { labels: labels, datasets: [{ data: data, backgroundColor: ['#f87171', '#fbbf24', '#34d399', '#60a5fa', '#a78bfa'], borderWidth: 0 }] },
                options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'right', labels: { color: body.classList.contains('dark') ? '#fff' : '#000' } } } }
            });
        }
    }

    // --- ДОБАВЛЕНИЕ С ПРОВЕРКОЙ НА БАЛАНС ---
    function addTx() {
        const amount = parseFloat(els.amount.value);
        if (isNaN(amount) || amount <= 0) {
            alert(translations[currentLang].alertAmount);
            return;
        }

        if (currentType === 'expense') {
            let incomeUSD = 0, expenseUSD = 0;
            transactions.forEach(t => t.type === 'income' ? incomeUSD += t.amountUSD : expenseUSD += t.amountUSD);
            const balanceUSD = incomeUSD - expenseUSD;
            const amountUSD = amount / (EXCHANGE_RATES[currentCurrency] || 1);
            
            if (amountUSD > balanceUSD) {
                alert(`${translations[currentLang].alertNoMoney} ${formatAmount(balanceUSD)}`);
                return; // Блокируем добавление
            }
        }

        transactions.push({
            id: nextId++, type: currentType,
            amountUSD: amount / (EXCHANGE_RATES[currentCurrency] || 1),
            desc: els.desc.value.trim(), category: els.category.value
        });
        els.amount.value = ''; els.desc.value = '';
        saveData(); updateUI();
    }

    window.deleteTx = function(id) {
        transactions = transactions.filter(t => t.id !== id);
        saveData(); updateUI();
    };

    // --- ЭКСПОРТ/ИМПОРТ ---
    document.getElementById('exportBtn').addEventListener('click', () => {
        const csv = ['id,type,amountUSD,desc,category', ...transactions.map(t => `${t.id},${t.type},${t.amountUSD},"${t.desc}",${t.category}`)].join('\n');
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = 'finance_export.csv';
        link.click();
    });

    document.getElementById('importInput').addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (ev) => {
            try {
                const rows = ev.target.result.split('\n').slice(1);
                rows.forEach(row => {
                    if (!row.trim()) return;
                    const [id, type, amountUSD, desc, category] = row.split(',');
                    const cleanDesc = desc ? desc.replace(/^"|"$/g, '') : '';
                    transactions.push({ id: nextId++, type, amountUSD: parseFloat(amountUSD), desc: cleanDesc, category: category || 'other' });
                });
                saveData(); updateUI();
                alert('Данные импортированы!');
            } catch (err) { alert('Ошибка чтения файла'); }
        };
        reader.readAsText(file);
    });

    // --- ОБРАБОТЧИКИ СОБЫТИЙ ---
    els.budgetInput.addEventListener('input', (e) => { budgetLimit = parseFloat(e.target.value) || 0; saveData(); updateUI(); });
    els.submit.addEventListener('click', addTx);
    
    document.getElementById('typeIncome').addEventListener('click', () => { 
        currentType = 'income'; 
        document.getElementById('typeIncome').classList.add('active'); 
        document.getElementById('typeExpense').classList.remove('active'); 
    });
    
    document.getElementById('typeExpense').addEventListener('click', () => { 
        currentType = 'expense'; 
        document.getElementById('typeExpense').classList.add('active'); 
        document.getElementById('typeIncome').classList.remove('active'); 
    });
    
    document.getElementById('clearAllBtn').addEventListener('click', () => { 
        if(confirm(translations[currentLang].clearAll + '?')) { 
            transactions = []; 
            saveData(); 
            updateUI(); 
        } 
    });
    
    document.getElementById('themeToggle').addEventListener('click', () => { 
        body.classList.toggle('dark'); 
        body.classList.toggle('light'); 
        updateLanguage(); 
    });
    
    document.getElementById('currencySelect').addEventListener('change', (e) => { 
        currentCurrency = e.target.value; 
        updateUI(); 
    });

    // Переключатели языков
    document.getElementById('langRu').addEventListener('click', () => { currentLang = 'ru'; updateLanguage(); });
    document.getElementById('langBe').addEventListener('click', () => { currentLang = 'be'; updateLanguage(); });
    document.getElementById('langEn').addEventListener('click', () => { currentLang = 'en'; updateLanguage(); });

    // Запуск
    updateLanguage();

    // PWA
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('sw.js').catch(err => console.log('SW не зарегистрирован', err));
    }
})();
