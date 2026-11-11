(function() {
    const EXCHANGE_RATES = { USD: 1, BYN: 2.9476, RUB: 80.5573, EUR: 0.9200 };
    const translations = {
        ru: { income: 'Доходы', expense: 'Затраты', balance: 'Баланс', historyTitle: 'История', themeDark: '🌙 Тёмная', themeLight: '☀️ Светлая', submit: 'Добавить', clearAll: '🗑 Очистить', typeIncome: '+ Доход', typeExpense: '− Расход', historyEmpty: 'Нет операций', records: 'записей', budgetLabel: 'Лимит на месяц', budgetLeft: 'Осталось', budgetOver: 'Перерасход!', alertNoMoney: 'Недостаточно средств! На балансе: ', alertAmount: 'Введите сумму больше нуля!', noDesc: 'Без описания', deleteTitle: 'Удалить', catOther: 'Другое', catFood: 'Еда', catTransport: 'Транспорт', catFun: 'Развлечения', catHealth: 'Здоровье', catSalary: 'Зарплата', allTime: 'Все время', month: 'Месяц', week: 'Неделя', heatmap: 'Карта расходов', chartExpenses: 'Расходы' },
        be: { income: 'Даходы', expense: 'Затраты', balance: 'Баланс', historyTitle: 'Гісторыя', themeDark: '🌙 Цёмная', themeLight: '☀️ Светлая', submit: 'Дадаць', clearAll: '🗑 Ачысціць', typeIncome: '+ Даход', typeExpense: '− Затрата', historyEmpty: 'Няма аперацый', records: 'запісаў', budgetLabel: 'Ліміт на месяц', budgetLeft: 'Засталося', budgetOver: 'Перавыдаткі!', alertNoMoney: 'Недастаткова сродкаў! На балянсе: ', alertAmount: 'Увядзіце суму больш за нуль!', noDesc: 'Без апісання', deleteTitle: 'Выдаліць', catOther: 'Іншае', catFood: 'Ежа', catTransport: 'Транспарт', catFun: 'Забавы', catHealth: 'Здароўе', catSalary: 'Зарплата', allTime: 'Увесь час', month: 'Месяц', week: 'Тыдзень', heatmap: 'Карта выдаткаў', chartExpenses: 'Выдаткі' },
        en: { income: 'Income', expense: 'Expenses', balance: 'Balance', historyTitle: 'History', themeDark: '🌙 Dark', themeLight: '☀️ Light', submit: 'Add', clearAll: '🗑 Clear', typeIncome: '+ Income', typeExpense: '− Expense', historyEmpty: 'No transactions', records: 'records', budgetLabel: 'Monthly Budget', budgetLeft: 'Left', budgetOver: 'Overspent!', alertNoMoney: 'Insufficient funds! Balance: ', alertAmount: 'Enter an amount greater than zero!', noDesc: 'No description', deleteTitle: 'Delete', catOther: 'Other', catFood: 'Food', catTransport: 'Transport', catFun: 'Fun', catHealth: 'Health', catSalary: 'Salary', allTime: 'All time', month: 'Month', week: 'Week', heatmap: 'Expense heatmap', chartExpenses: 'Expenses' }
    };

    let currentLang = 'ru', currentCurrency = 'BYN', currentType = 'income', currentPeriod = 'all';
    let transactions = JSON.parse(localStorage.getItem('myTransactions')) || [];
    let budgetLimit = parseFloat(localStorage.getItem('myBudget')) || 0;
    let nextId = transactions.length > 0 ? Math.max(...transactions.map(t => t.id)) + 1 : 1;
    let pieChart = null, barChart = null;

    const body = document.body;
    
    // Безопасный поиск элементов
    const $ = (id) => document.getElementById(id);
    const els = {
        amount: $('amountInput'), desc: $('descInput'),
        category: $('categorySelect'), submit: $('submitBtn'),
        history: $('historyList'), balance: $('balanceValue'),
        budgetInput: $('budgetInput'), budgetInfo: $('budgetInfo'),
        progressFill: $('progressFill'), pieChart: $('pieChart'),
        barChart: $('barChart'), heatmap: $('heatmapGrid'), keyboard: $('customKeyboard')
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

    // ГЛАВНАЯ ФУНКЦИЯ ПЕРЕВОДА
    function updateLanguage() {
        const t = translations[currentLang];
        
        if ($('incomeLabel')) $('incomeLabel').textContent = t.income;
        if ($('expenseLabel')) $('expenseLabel').textContent = t.expense;
        if ($('balanceLabel')) $('balanceLabel').textContent = t.balance;
        if ($('historyTitle')) $('historyTitle').textContent = t.historyTitle;
        if ($('heatmapTitle')) $('heatmapTitle').textContent = t.heatmap;
        if ($('budgetLabel')) $('budgetLabel').textContent = t.budgetLabel;
        if ($('submitBtn')) $('submitBtn').textContent = t.submit;
        if ($('clearAllBtn')) $('clearAllBtn').textContent = t.clearAll;
        if ($('typeIncome')) $('typeIncome').textContent = t.typeIncome;
        if ($('typeExpense')) $('typeExpense').textContent = t.typeExpense;
        if ($('themeToggle')) $('themeToggle').textContent = body.classList.contains('dark') ? t.themeLight : t.themeDark;
        
        if ($('perAll')) $('perAll').textContent = t.allTime;
        if ($('perMonth')) $('perMonth').textContent = t.month;
        if ($('perWeek')) $('perWeek').textContent = t.week;
        
        if (els.category) {
            els.category.options[0].text = '📦 ' + t.catOther;
            els.category.options[1].text = '🍔 ' + t.catFood;
            els.category.options[2].text = '🚗 ' + t.catTransport;
            els.category.options[3].text = '🎮 ' + t.catFun;
            els.category.options[4].text = '💊 ' + t.catHealth;
            els.category.options[5].text = '💼 ' + t.catSalary;
        }

        if ($('langRu')) $('langRu').classList.toggle('active', currentLang === 'ru');
        if ($('langBe')) $('langBe').classList.toggle('active', currentLang === 'be');
        if ($('langEn')) $('langEn').classList.toggle('active', currentLang === 'en');
        
        updateUI();
    }

    function animateBalance(from, to) {
        const el = els.balance;
        if (!el) return;
        const start = performance.now();
        const duration = 500;
        const symbol = { RUB: '₽', BYN: 'Br', USD: '$', EUR: '€' }[currentCurrency];
        
        function step(now) {
            const progress = Math.min((now - start) / duration, 1);
            const current = from + (to - from) * progress;
            el.textContent = `${symbol}${new Intl.NumberFormat('en-US', { useGrouping: false, maximumFractionDigits: 2 }).format(current)}`;
            if (progress < 1) requestAnimationFrame(step);
            else el.textContent = formatAmount(to / (EXCHANGE_RATES[currentCurrency] || 1));
        }
        requestAnimationFrame(step);
    }

    function updateUI() {
        if (!els.balance) return;

        let incomeUSD = 0, expenseUSD = 0;
        transactions.forEach(t => t.type === 'income' ? incomeUSD += t.amountUSD : expenseUSD += t.amountUSD);
        const balanceUSD = incomeUSD - expenseUSD;
        
        const currentVal = parseFloat(els.balance.textContent.replace(/[^0-9.-]+/g,"")) / (EXCHANGE_RATES[currentCurrency] || 1) || 0;
        const targetVal = balanceUSD * (EXCHANGE_RATES[currentCurrency] || 1);
        animateBalance(currentVal * (EXCHANGE_RATES[currentCurrency] || 1), targetVal);

        els.balance.style.color = balanceUSD < 0 ? '#f87171' : '';

        // Бюджет
        if (els.budgetInput && els.budgetInfo && els.progressFill) {
            const expenseInCurrency = expenseUSD * (EXCHANGE_RATES[currentCurrency] || 1);
            els.budgetInput.value = budgetLimit > 0 ? budgetLimit : '';
            if (budgetLimit > 0) {
                const percent = Math.min((expenseInCurrency / budgetLimit) * 100, 100);
                const left = budgetLimit - expenseInCurrency;
                els.progressFill.style.width = `${percent}%`;
                els.progressFill.style.background = left < 0 ? '#f87171' : (percent > 80 ? '#fbbf24' : '#34d399');
                els.budgetInfo.textContent = left >= 0 
                    ? `${translations[currentLang].budgetLeft}: ${formatAmount(left / (EXCHANGE_RATES[currentCurrency] || 1))}`
                    : `${translations[currentLang].budgetOver} ${formatAmount(Math.abs(left) / (EXCHANGE_RATES[currentCurrency] || 1))}`;
            } else {
                els.progressFill.style.width = '0%';
                els.budgetInfo.textContent = '';
            }
        }

        // Фильтрация по периодам
        const now = new Date();
        let filteredTxs = transactions;
        if (currentPeriod === 'month') {
            filteredTxs = transactions.filter(t => {
                const d = new Date(t.date);
                return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
            });
        } else if (currentPeriod === 'week') {
            const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            filteredTxs = transactions.filter(t => new Date(t.date) >= weekAgo);
        }

        // История
        if (els.history) {
            if (filteredTxs.length === 0) {
                els.history.innerHTML = `<li class="history-item" style="justify-content:center; opacity:0.6;">${translations[currentLang].historyEmpty}</li>`;
            } else {
                const grouped = filteredTxs.reduce((acc, t) => {
                    const date = new Date(t.date).toLocaleDateString(currentLang === 'en' ? 'en-US' : 'ru-RU', { day: 'numeric', month: 'long' });
                    if (!acc[date]) acc[date] = [];
                    acc[date].push(t);
                    return acc;
                }, {});

                let html = '';
                Object.keys(grouped).forEach(date => {
                    html += `<li style="margin-top:10px; font-size:0.8rem; color:var(--text-muted); font-weight:bold;">${date}</li>`;
                    html += grouped[date].sort((a,b)=>b.id-a.id).map(t => `
                        <li class="history-item ${t.type === 'income' ? 'income-item' : 'expense-item'}" onmousedown="swipeStart(event, ${t.id})" ontouchstart="swipeStart(event, ${t.id})">
                            <div class="swipe-delete" onclick="deleteTx(${t.id})">✕</div>
                            <div class="history-content">
                                <span class="history-desc">${t.category === 'food' ? '🍔' : t.category === 'transport' ? '🚗' : t.category === 'fun' ? '🎮' : t.category === 'health' ? '💊' : t.category === 'salary' ? '💼' : '📦'} ${t.desc || translations[currentLang].noDesc}</span>
                                <span class="history-amount">${t.type === 'income' ? '+' : '−'} ${formatAmount(t.amountUSD)}</span>
                            </div>
                        </li>
                    `).join('');
                });
                els.history.innerHTML = html;
            }
        }

        // Графики
        if (els.pieChart && typeof Chart !== 'undefined') {
            const expensesByCategory = {};
            filteredTxs.filter(t => t.type === 'expense').forEach(t => {
                expensesByCategory[t.category] = (expensesByCategory[t.category] || 0) + t.amountUSD;
            });
            
            const t = translations[currentLang];
            const catNames = { food: t.catFood, transport: t.catTransport, fun: t.catFun, health: t.catHealth, other: t.catOther };
            const labels = Object.keys(expensesByCategory).map(k => catNames[k] || k);
            const dataPie = Object.values(expensesByCategory).map(v => v * (EXCHANGE_RATES[currentCurrency] || 1));

            if (pieChart) pieChart.destroy();
            if (dataPie.length > 0) {
                pieChart = new Chart(els.pieChart, {
                    type: 'doughnut',
                    data: { labels: labels, datasets: [{ data: dataPie, backgroundColor: ['#f87171', '#fbbf24', '#34d399', '#60a5fa', '#a78bfa'], borderWidth: 0 }] },
                    options: { responsive: true, maintainAspectRatio: false, animation: { animateRotate: true }, plugins: { legend: { position: 'right', labels: { color: body.classList.contains('dark') ? '#fff' : '#000' } }, tooltip: { callbacks: { label: function(context) { let label = context.label || ''; if (label) { label += ': '; } if (context.parsed !== null) { label += formatAmount(context.parsed / (EXCHANGE_RATES[currentCurrency] || 1)); } return label; } } } } }
                });
            }

            // Столбчатая
            const expensesByDay = {};
            filteredTxs.filter(t => t.type === 'expense').forEach(t => {
                const day = new Date(t.date).getDate();
                expensesByDay[day] = (expensesByDay[day] || 0) + t.amountUSD;
            });
            
            const days = Array.from({length: 31}, (_, i) => i + 1);
            const dataBar = days.map(d => (expensesByDay[d] || 0) * (EXCHANGE_RATES[currentCurrency] || 1));

            if (barChart) barChart.destroy();
            if (els.barChart) {
                barChart = new Chart(els.barChart, {
                    type: 'bar',
                    data: {
                        labels: days,
                        datasets: [{ label: t.chartExpenses, data: dataBar, backgroundColor: '#818cf8', borderRadius: 4 }]
                    },
                    options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { x: { ticks: { color: body.classList.contains('dark') ? '#aaa' : '#333' } }, y: { ticks: { color: body.classList.contains('dark') ? '#aaa' : '#333' } } } }
                });
            }
        }

        // Тепловая карта
        if (els.heatmap) {
            els.heatmap.innerHTML = '';
            const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
            const dailyExpenses = {};
            transactions.filter(t => t.type === 'expense').forEach(t => {
                const d = new Date(t.date);
                if (d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()) {
                    const day = d.getDate();
                    dailyExpenses[day] = (dailyExpenses[day] || 0) + (t.amountUSD * (EXCHANGE_RATES[currentCurrency] || 1));
                }
            });

            const maxExp = Math.max(...Object.values(dailyExpenses), 1);
            for (let i = 1; i <= daysInMonth; i++) {
                const exp = dailyExpenses[i] || 0;
                const intensity = exp / maxExp;
                const cell = document.createElement('div');
                cell.className = 'heatmap-cell';
                cell.style.background = intensity > 0 ? `rgba(129, 140, 248, ${0.2 + intensity * 0.8})` : 'rgba(255, 255, 255, 0.1)';
                cell.setAttribute('data-tooltip', `${i}: ${formatAmount(exp / (EXCHANGE_RATES[currentCurrency] || 1))}`);
                els.heatmap.appendChild(cell);
            }
        }
    }

    // Свайпы
    let startX = 0;
    window.swipeStart = function(e, id) {
        startX = e.touches ? e.touches[0].clientX : e.clientX;
        const item = e.currentTarget;
        
        const moveHandler = (ev) => {
            const currentX = ev.touches ? ev.touches[0].clientX : ev.clientX;
            if (startX - currentX > 50) item.classList.add('swiped');
            else if (currentX - startX > 50) item.classList.remove('swiped');
        };
        
        const endHandler = () => {
            document.removeEventListener('mousemove', moveHandler);
            document.removeEventListener('mouseup', endHandler);
            document.removeEventListener('touchmove', moveHandler);
            document.removeEventListener('touchend', endHandler);
        };
        
        document.addEventListener('mousemove', moveHandler);
        document.addEventListener('mouseup', endHandler);
        document.addEventListener('touchmove', moveHandler);
        document.addEventListener('touchend', endHandler);
    };

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
                return;
            }
        }

        transactions.push({
            id: nextId++, type: currentType,
            amountUSD: amount / (EXCHANGE_RATES[currentCurrency] || 1),
            desc: els.desc.value.trim(), category: els.category.value,
            date: new Date().toISOString()
        });
        els.amount.value = ''; els.desc.value = '';
        saveData(); updateUI();
    }

    window.deleteTx = function(id) {
        transactions = transactions.filter(t => t.id !== id);
        saveData(); updateUI();
    };

    // Клавиатура
    if (els.amount && els.keyboard) {
        els.amount.addEventListener('focus', () => els.keyboard.classList.add('active'));
        document.addEventListener('click', (e) => {
            if (!els.amount.contains(e.target) && !els.keyboard.contains(e.target)) {
                els.keyboard.classList.remove('active');
            }
        });
        document.querySelectorAll('.kb-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const val = e.target.dataset.val;
                if (val === 'back') els.amount.value = els.amount.value.slice(0, -1);
                else els.amount.value += val;
            });
        });
    }

    // Экспорт/Импорт
    if ($('exportBtn')) {
        $('exportBtn').addEventListener('click', () => {
            const csv = ['id,type,amountUSD,desc,category,date', ...transactions.map(t => `${t.id},${t.type},${t.amountUSD},"${t.desc}",${t.category},${t.date}`)].join('\n');
            const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = 'finance_export.csv';
            link.click();
        });
    }

    if ($('importInput')) {
        $('importInput').addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = (ev) => {
                try {
                    const rows = ev.target.result.split('\n').slice(1);
                    rows.forEach(row => {
                        if (!row.trim()) return;
                        const [id, type, amountUSD, desc, category, date] = row.split(',');
                        const cleanDesc = desc ? desc.replace(/^"|"$/g, '') : '';
                        transactions.push({ id: nextId++, type, amountUSD: parseFloat(amountUSD), desc: cleanDesc, category: category || 'other', date: date || new Date().toISOString() });
                    });
                    saveData(); updateUI();
                    alert('Данные импортированы!');
                } catch (err) { alert('Ошибка чтения файла'); }
            };
            reader.readAsText(file);
        });
    }

    // Обработчики
    if (els.budgetInput) els.budgetInput.addEventListener('input', (e) => { budgetLimit = parseFloat(e.target.value) || 0; saveData(); updateUI(); });
    if (els.submit) els.submit.addEventListener('click', addTx);
    
    if ($('typeIncome')) $('typeIncome').addEventListener('click', () => { currentType = 'income'; $('typeIncome').classList.add('active'); $('typeExpense').classList.remove('active'); });
    if ($('typeExpense')) $('typeExpense').addEventListener('click', () => { currentType = 'expense'; $('typeExpense').classList.add('active'); $('typeIncome').classList.remove('active'); });
    
    if ($('clearAllBtn')) $('clearAllBtn').addEventListener('click', () => { if(confirm(translations[currentLang].clearAll + '?')) { transactions = []; saveData(); updateUI(); } });
    if ($('themeToggle')) $('themeToggle').addEventListener('click', () => { body.classList.toggle('dark'); body.classList.toggle('light'); updateLanguage(); });
    if ($('currencySelect')) $('currencySelect').addEventListener('change', (e) => { currentCurrency = e.target.value; updateUI(); });

    if ($('langRu')) $('langRu').addEventListener('click', () => { currentLang = 'ru'; updateLanguage(); });
    if ($('langBe')) $('langBe').addEventListener('click', () => { currentLang = 'be'; updateLanguage(); });
    if ($('langEn')) $('langEn').addEventListener('click', () => { currentLang = 'en'; updateLanguage(); });

    document.querySelectorAll('.period-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            document.querySelectorAll('.period-btn').forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            currentPeriod = e.target.dataset.period;
            updateUI();
        });
    });

    updateLanguage();

    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('sw.js').catch(err => console.log('SW не зарегистрирован', err));
    }
})();