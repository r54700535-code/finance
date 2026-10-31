(function() {
    const EXCHANGE_RATES = { USD: 1, BYN: 2.9476, RUB: 80.5573, EUR: 0.9200 };
    const translations = {
        ru: { income: 'Доходы', expense: 'Затраты', balance: 'Баланс', historyTitle: 'История', themeDark: '🌙 Тёмная', themeLight: '☀️ Светлая', submit: 'Добавить', clearAll: '🗑 Очистить', typeIncome: '+ Доход', typeExpense: '− Расход', historyEmpty: 'Нет операций', records: 'записей', budgetLabel: 'Лимит на месяц', budgetLeft: 'Осталось', budgetOver: 'Перерасход!' },
        be: { income: 'Даходы', expense: 'Затраты', balance: 'Баланс', historyTitle: 'Гісторыя', themeDark: '🌙 Цёмная', themeLight: '☀️ Светлая', submit: 'Дадаць', clearAll: '🗑 Ачысціць', typeIncome: '+ Даход', typeExpense: '− Затрата', historyEmpty: 'Няма аперацый', records: 'запісаў', budgetLabel: 'Ліміт на месяц', budgetLeft: 'Засталося', budgetOver: 'Перавыдаткі!' },
        en: { income: 'Income', expense: 'Expenses', balance: 'Balance', historyTitle: 'History', themeDark: '🌙 Dark', themeLight: '☀️ Light', submit: 'Add', clearAll: '🗑 Clear', typeIncome: '+ Income', typeExpense: '− Expense', historyEmpty: 'No transactions', records: 'records', budgetLabel: 'Monthly Budget', budgetLeft: 'Left', budgetOver: 'Overspent!' }
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
        progressFill: document.getElementById('progressFill'), chart: document.getElementById('myChart')
    };

    // --- УТИЛИТЫ ---
    function formatAmount(usdAmount) {
        const symbols = { RUB: '₽', BYN: 'Br', USD: '$', EUR: '€' };
        const converted = usdAmount * (EXCHANGE_RATES[currentCurrency] || 1);
        return `${symbols[currentCurrency]}${new Intl.NumberFormat('en-US', { useGrouping: false, maximumFractionDigits: 2 }).format(converted)}`;
    }

    function saveData() {
        localStorage.setItem('myTransactions', JSON.stringify(transactions));
        localStorage.setItem('myBudget', budgetLimit);
    }

    // --- ОТРИСОВКА ---
    function updateUI() {
        // 1. Подсчёт баланса
        let incomeUSD = 0, expenseUSD = 0;
        transactions.forEach(t => t.type === 'income' ? incomeUSD += t.amountUSD : expenseUSD += t.amountUSD);
        els.balance.textContent = formatAmount(incomeUSD - expenseUSD);

        // 2. Бюджет
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

        // 3. История
        if (transactions.length === 0) {
            els.history.innerHTML = `<li class="history-item" style="justify-content:center; opacity:0.6;">${translations[currentLang].historyEmpty}</li>`;
        } else {
            els.history.innerHTML = [...transactions].sort((a,b)=>b.id-a.id).map(t => `
                <li class="history-item ${t.type === 'income' ? 'income-item' : 'expense-item'}">
                    <span class="history-desc">${t.category === 'food' ? '🍔' : t.category === 'transport' ? '🚗' : t.category === 'fun' ? '🎮' : t.category === 'health' ? '💊' : t.category === 'salary' ? '💼' : '📦'} ${t.desc || 'Без описания'}</span>
                    <span class="history-amount">${t.type === 'income' ? '+' : '−'} ${formatAmount(t.amountUSD)}</span>
                    <button class="delete-btn" onclick="deleteTx(${t.id})">✕</button>
                </li>
            `).join('');
        }

        // 4. График (Круговая диаграмма расходов по категориям)
        const expensesByCategory = {};
        transactions.filter(t => t.type === 'expense').forEach(t => {
            expensesByCategory[t.category] = (expensesByCategory[t.category] || 0) + t.amountUSD;
        });
        
        const catNames = { food: 'Еда 🍔', transport: 'Транспорт 🚗', fun: 'Развлечения 🎮', health: 'Здоровье 💊', other: 'Другое 📦' };
        const labels = Object.keys(expensesByCategory).map(k => catNames[k] || k);
        const data = Object.values(expensesByCategory).map(v => v * (EXCHANGE_RATES[currentCurrency] || 1));

        if (myChart) myChart.destroy();
        if (data.length > 0) {
            myChart = new Chart(els.chart, {
                type: 'doughnut',
                data: {
                    labels: labels,
                    datasets: [{ data: data, backgroundColor: ['#f87171', '#fbbf24', '#34d399', '#60a5fa', '#a78bfa'], borderWidth: 0 }]
                },
                options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'right', labels: { color: body.classList.contains('dark') ? '#fff' : '#000' } } } }
            });
        }
    }

    // --- ДЕЙСТВИЯ ---
    function addTx() {
        const amount = parseFloat(els.amount.value);
        if (isNaN(amount) || amount <= 0) return;
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
                const rows = ev.target.result.split('\n').slice(1); // пропускаем заголовок
                rows.forEach(row => {
                    if (!row.trim()) return;
                    const [id, type, amountUSD, desc, category] = row.split(',');
                    // Очищаем desc от кавычек
                    const cleanDesc = desc ? desc.replace(/^"|"$/g, '') : '';
                    transactions.push({ id: nextId++, type, amountUSD: parseFloat(amountUSD), desc: cleanDesc, category: category || 'other' });
                });
                saveData(); updateUI();
                alert('Данные успешно импортированы!');
            } catch (err) { alert('Ошибка чтения файла'); }
        };
        reader.readAsText(file);
    });

    // --- ИНИЦИАЛИЗАЦИЯ ---
    els.budgetInput.addEventListener('input', (e) => { budgetLimit = parseFloat(e.target.value) || 0; saveData(); updateUI(); });
    els.submit.addEventListener('click', addTx);
    document.getElementById('typeIncome').addEventListener('click', () => { currentType = 'income'; document.getElementById('typeIncome').classList.add('active'); document.getElementById('typeExpense').classList.remove('active'); });
    document.getElementById('typeExpense').addEventListener('click', () => { currentType = 'expense'; document.getElementById('typeExpense').classList.add('active'); document.getElementById('typeIncome').classList.remove('active'); });
    document.getElementById('clearAllBtn').addEventListener('click', () => { if(confirm('Удалить все записи?')) { transactions = []; saveData(); updateUI(); } });
    document.getElementById('themeToggle').addEventListener('click', () => { body.classList.toggle('dark'); body.classList.toggle('light'); updateUI(); });
    document.getElementById('currencySelect').addEventListener('change', (e) => { currentCurrency = e.target.value; updateUI(); });

    updateUI();

    // Регистрация Service Worker для PWA
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('sw.js').catch(err => console.log('SW не зарегистрирован', err));
    }
})();