(function() {
    const RATES = { USD: 1, BYN: 2.9476, RUB: 80.5573, EUR: 0.9200 };
    const T = {
        ru: { inc:'Доходы', exp:'Затраты', bal:'Баланс', hist:'История', thD:'🌙 Тёмная', thL:'☀️ Светлая', add:'Добавить', clr:'🗑 Очистить', tInc:'+ Доход', tExp:'− Расход', emp:'Нет операций', bL:'Лимит на месяц', bLeft:'Осталось', bOver:'Перерасход!', noM:'Недостаточно средств! На балансе: ', noA:'Введите сумму > 0!', noD:'Без описания', cO:'Другое', cF:'Еда', cT:'Транспорт', cFu:'Развлечения', cH:'Здоровье', cS:'Зарплата', aT:'Все время', mo:'Месяц', we:'Неделя', hm:'Карта расходов', chE:'Расходы' },
        be: { inc:'Даходы', exp:'Затраты', bal:'Баланс', hist:'Гісторыя', thD:'🌙 Цёмная', thL:'☀️ Светлая', add:'Дадаць', clr:'🗑 Ачысціць', tInc:'+ Даход', tExp:'− Затрата', emp:'Няма аперацый', bL:'Ліміт на месяц', bLeft:'Засталося', bOver:'Перавыдаткі!', noM:'Недастаткова сродкаў! На балянсе: ', noA:'Увядзіце суму > 0!', noD:'Без апісання', cO:'Іншае', cF:'Ежа', cT:'Транспарт', cFu:'Забавы', cH:'Здароўе', cS:'Зарплата', aT:'Увесь час', mo:'Месяц', we:'Тыдзень', hm:'Карта выдаткаў', chE:'Выдаткі' },
        en: { inc:'Income', exp:'Expenses', bal:'Balance', hist:'History', thD:'🌙 Dark', thL:'☀️ Light', add:'Add', clr:'🗑 Clear', tInc:'+ Income', tExp:'− Expense', emp:'No transactions', bL:'Monthly Budget', bLeft:'Left', bOver:'Overspent!', noM:'Insufficient funds! Balance: ', noA:'Enter amount > 0!', noD:'No description', cO:'Other', cF:'Food', cT:'Transport', cFu:'Fun', cH:'Health', cS:'Salary', aT:'All time', mo:'Month', we:'Week', hm:'Expense heatmap', chE:'Expenses' }
    };

    let lang='ru', curr='BYN', type='income', per='all';
    let txs = JSON.parse(localStorage.getItem('myTxs')) || [];
    let bUSD = parseFloat(localStorage.getItem('myB')) || 0; 
    let nId = txs.length ? Math.max(...txs.map(t=>t.id))+1 : 1;
    let pC=null, bC=null, sx=0;

    const $ = id => document.getElementById(id);
    const s = { am:$('amountInput'), ds:$('descInput'), cat:$('categorySelect'), sub:$('submitBtn'), hL:$('historyList'), bal:$('balanceValue'), bI:$('budgetInput'), bF:$('budgetInfo'), pF:$('progressFill'), pC:$('pieChart'), bC:$('barChart'), hm:$('heatmapGrid') };

    const fmt = u => {
        const sym = {RUB:'₽', BYN:'Br', USD:'$', EUR:'€'}[curr];
        return sym + new Intl.NumberFormat('en-US',{useGrouping:false,maximumFractionDigits:2}).format(u * RATES[curr]);
    };
    const save = () => { localStorage.setItem('myTxs',JSON.stringify(txs)); localStorage.setItem('myB',bUSD); };

    function updLang() {
        const t = T[lang];
        ['inc','exp','bal','hist','hm'].forEach(k => { const el=$(k+'Title')||$(k+'Label'); if(el) el.textContent=t[k]; });
        if($('budgetLabel')) $('budgetLabel').textContent=t.bL;
        if($('submitBtn')) $('submitBtn').textContent=t.add;
        if($('clearAllBtn')) $('clearAllBtn').textContent=t.clr;
        if($('typeIncome')) $('typeIncome').textContent=t.tInc;
        if($('typeExpense')) $('typeExpense').textContent=t.tExp;
        if($('themeToggle')) $('themeToggle').textContent=document.body.classList.contains('dark')?t.thL:t.thD;
        if($('perAll')) $('perAll').textContent=t.aT;
        if($('perMonth')) $('perMonth').textContent=t.mo;
        if($('perWeek')) $('perWeek').textContent=t.we;
        if(s.cat) { s.cat.options[0].text='📦 '+t.cO; s.cat.options[1].text='🍔 '+t.cF; s.cat.options[2].text='🚗 '+t.cT; s.cat.options[3].text='🎮 '+t.cFu; s.cat.options[4].text='💊 '+t.cH; s.cat.options[5].text='💼 '+t.cS; }
        ['Ru','Be','En'].forEach(l => { const el=$('lang'+l); if(el) el.classList.toggle('active', lang===l.toLowerCase()); });
        updUI();
    }

    function animBal(f, to) {
        if(!s.bal) return;
        const st=performance.now(), dur=500, sym={RUB:'₽',BYN:'Br',USD:'$',EUR:'€'}[curr];
        const step = now => {
            const p=Math.min((now-st)/dur,1), c=f+(to-f)*p;
            s.bal.textContent = sym + new Intl.NumberFormat('en-US',{useGrouping:false,maximumFractionDigits:2}).format(c);
            if(p<1) requestAnimationFrame(step);
            else s.bal.textContent = fmt(to/RATES[curr]);
        };
        requestAnimationFrame(step);
    }

    function updUI() {
        if(!s.bal) return;
        let inc=0, exp=0;
        txs.forEach(t=>t.type==='income'?inc+=t.amountUSD:exp+=t.amountUSD);
        const balUSD = inc - exp;
        
        const curV = parseFloat(s.bal.textContent.replace(/[^0-9.-]+/g,""))/RATES[curr] || 0;
        animBal(curV*RATES[curr], balUSD*RATES[curr]);
        s.bal.style.color = balUSD<0 ? '#f87171' : '';

        if(s.bI && s.bF && s.pF) {
            const eInC = exp*RATES[curr], bInC = bUSD*RATES[curr];
            if(bUSD>0) {
                s.bI.value = bInC.toFixed(2);
                const pc = Math.min((eInC/bInC)*100,100), lft = bInC-eInC;
                s.pF.style.width = pc+'%';
                s.pF.style.background = lft<0?'#f87171':(pc>80?'#fbbf24':'#34d399');
                s.bF.textContent = lft>=0 ? `${T[lang].bLeft}: ${fmt(lft/RATES[curr])}` : `${T[lang].bOver} ${fmt(Math.abs(lft)/RATES[curr])}`;
            } else { s.bI.value=''; s.pF.style.width='0%'; s.bF.textContent=''; }
        }

        const now = new Date();
        let fTxs = txs;
        if(per==='month') fTxs = txs.filter(t=>{const d=new Date(t.date);return d.getMonth()===now.getMonth()&&d.getFullYear()===now.getFullYear();});
        if(per==='week') { const wA=new Date(now.getTime()-7*24*60*60*1000); fTxs=txs.filter(t=>new Date(t.date)>=wA); }

        if(s.hL) {
            if(!fTxs.length) s.hL.innerHTML = `<li class="history-item" style="justify-content:center;opacity:0.6;">${T[lang].emp}</li>`;
            else {
                const grp = fTxs.reduce((a,t)=>{
                    const d = new Date(t.date).toLocaleDateString(lang==='en'?'en-US':'ru-RU',{day:'numeric',month:'long'});
                    (a[d]=a[d]||[]).push(t); return a;
                },{});
                let h='';
                Object.keys(grp).forEach(d=>{
                    h+=`<li style="margin-top:10px;font-size:0.8rem;color:var(--text-muted);font-weight:bold;">${d}</li>`;
                    h+=grp[d].sort((a,b)=>b.id-a.id).map(t=>`
                        <li class="history-item ${t.type==='income'?'income-item':'expense-item'}" onmousedown="swipe(event,${t.id})" ontouchstart="swipe(event,${t.id})">
                            <div class="swipe-delete" onclick="delTx(${t.id})">✕</div>
                            <div class="history-content">
                                <span class="history-desc">${t.category==='food'?'🍔':t.category==='transport'?'🚗':t.category==='fun'?'🎮':t.category==='health'?'💊':t.category==='salary'?'💼':'📦'} ${t.desc||T[lang].noD}</span>
                                <span class="history-amount">${t.type==='income'?'+':'−'} ${fmt(t.amountUSD)}</span>
                            </div>
                        </li>
                    `).join('');
                });
                s.hL.innerHTML = h;
            }
        }

        if(s.pC && typeof Chart!=='undefined') {
            const eC = {}; fTxs.filter(t=>t.type==='expense').forEach(t=>{eC[t.category]=(eC[t.category]||0)+t.amountUSD;});
            const cN={food:T[lang].cF,transport:T[lang].cT,fun:T[lang].cFu,health:T[lang].cH,other:T[lang].cO};
            const lbls = Object.keys(eC).map(k=>cN[k]||k), dat = Object.values(eC).map(v=>v*RATES[curr]);
            if(pC) pC.destroy();
            if(dat.length) pC=new Chart(s.pC,{type:'doughnut',data:{labels:lbls,datasets:[{data:dat,backgroundColor:['#f87171','#fbbf24','#34d399','#60a5fa','#a78bfa'],borderWidth:0}]},options:{responsive:true,maintainAspectRatio:false,animation:{animateRotate:true},plugins:{legend:{position:'right',labels:{color:document.body.classList.contains('dark')?'#fff':'#000'}},tooltip:{callbacks:{label:c=>`${c.label}: ${fmt(c.parsed/RATES[curr])}`}}}}});

            const eD={}; fTxs.filter(t=>t.type==='expense').forEach(t=>{const d=new Date(t.date).getDate();eD[d]=(eD[d]||0)+t.amountUSD;});
            const days=Array.from({length:31},(_,i)=>i+1), datB=days.map(d=>(eD[d]||0)*RATES[curr]);
            if(bC) bC.destroy();
            if(s.bC) bC=new Chart(s.bC,{type:'bar',data:{labels:days,datasets:[{label:T[lang].chE,data:datB,backgroundColor:'#818cf8',borderRadius:4}]},options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false}},scales:{x:{ticks:{color:'#aaa'}},y:{ticks:{color:'#aaa'}}}}});
        }

        if(s.hm) {
            s.hm.innerHTML='';
            const dIM = new Date(now.getFullYear(),now.getMonth()+1,0).getDate(), dEx={};
            txs.filter(t=>t.type==='expense').forEach(t=>{const d=new Date(t.date);if(d.getMonth()===now.getMonth()&&d.getFullYear()===now.getFullYear())dEx[d.getDate()]=(dEx[d.getDate()]||0)+t.amountUSD*RATES[curr];});
            const mE = Math.max(...Object.values(dEx),1);
            for(let i=1;i<=dIM;i++){
                const ex=dEx[i]||0, inten=ex/mE, cell=document.createElement('div');
                cell.className='heatmap-cell';
                cell.style.background = inten>0?`rgba(129,140,248,${0.2+inten*0.8})`:'rgba(255,255,255,0.1)';
                cell.setAttribute('data-tooltip',`${i}: ${fmt(ex/RATES[curr])}`);
                s.hm.appendChild(cell);
            }
        }
    }

    window.swipe = function(e,id) {
        sx = e.touches ? e.touches[0].clientX : e.clientX;
        const item = e.currentTarget;
        const move = ev => {
            const cx = ev.touches ? ev.touches[0].clientX : ev.clientX;
            if(sx-cx>50) item.classList.add('swiped');
            else if(cx-sx>50) item.classList.remove('swiped');
        };
        const end = () => {
            document.removeEventListener('mousemove',move); document.removeEventListener('mouseup',end);
            document.removeEventListener('touchmove',move); document.removeEventListener('touchend',end);
        };
        document.addEventListener('mousemove',move); document.addEventListener('mouseup',end);
        document.addEventListener('touchmove',move); document.addEventListener('touchend',end);
    };

    function addTx() {
        const a = parseFloat(s.am.value);
        if(isNaN(a)||a<=0) { alert(T[lang].noA); return; }
        if(type==='expense') {
            let inc=0, exp=0; txs.forEach(t=>t.type==='income'?inc+=t.amountUSD:exp+=t.amountUSD);
            const aUSD = a/RATES[curr];
            if(aUSD > inc-exp) { alert(`${T[lang].noM} ${fmt(inc-exp)}`); return; }
        }
        txs.push({id:nId++, type, amountUSD:a/RATES[curr], desc:s.ds.value.trim(), category:s.cat.value, date:new Date().toISOString()});
        s.am.value=''; s.ds.value='';
        save(); updUI();
    }

    window.delTx = function(id) { txs = txs.filter(t=>t.id!==id); save(); updUI(); };

    if($('exportBtn')) $('exportBtn').onclick = () => {
        const csv = ['id,type,amountUSD,desc,category,date',...txs.map(t=>`${t.id},${t.type},${t.amountUSD},"${t.desc}",${t.category},${t.date}`)].join('\n');
        const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([csv],{type:'text/csv;charset=utf-8;'})); a.download = 'finance_export.csv'; a.click();
    };

    if($('importInput')) $('importInput').onchange = (e) => {
        const f = e.target.files[0]; if(!f) return;
        const r = new FileReader();
        r.onload = ev => {
            try {
                ev.target.result.split('\n').slice(1).forEach(row => {
                    if(!row.trim()) return;
                    const [id,ty,aU,d,c,dt] = row.split(',');
                    txs.push({id:nId++, type:ty, amountUSD:parseFloat(aU), desc:(d||'').replace(/^"|"$/g,''), category:c||'other', date:dt||new Date().toISOString()});
                });
                save(); updUI(); alert('Импорт успешен!');
            } catch(err) { alert('Ошибка файла'); }
        };
        r.readAsText(f);
    };

    if(s.bI) s.bI.oninput = (e) => {
        bUSD = (parseFloat(e.target.value)||0) / RATES[curr]; save();
        let inc=0, exp=0; txs.forEach(t=>t.type==='income'?inc+=t.amountUSD:exp+=t.amountUSD);
        const eInC=exp*RATES[curr], bInC=bUSD*RATES[curr];
        if(bUSD>0 && s.bF && s.pF) {
            const pc = Math.min((eInC/bInC)*100,100), lft = bInC-eInC;
            s.pF.style.width=pc+'%'; s.pF.style.background = lft<0?'#f87171':(pc>80?'#fbbf24':'#34d399');
            s.bF.textContent = lft>=0 ? `${T[lang].bLeft}: ${fmt(lft/RATES[curr])}` : `${T[lang].bOver} ${fmt(Math.abs(lft)/RATES[curr])}`;
        }
    };

    if(s.sub) s.sub.onclick = addTx;
    if($('typeIncome')) $('typeIncome').onclick = () => { type='income'; $('typeIncome').classList.add('active'); $('typeExpense').classList.remove('active'); };
    if($('typeExpense')) $('typeExpense').onclick = () => { type='expense'; $('typeExpense').classList.add('active'); $('typeIncome').classList.remove('active'); };
    if($('clearAllBtn')) $('clearAllBtn').onclick = () => { if(confirm(T[lang].clr+'?')) { txs=[]; save(); updUI(); } };
    if($('themeToggle')) $('themeToggle').onclick = () => { document.body.classList.toggle('dark'); document.body.classList.toggle('light'); updLang(); };
    if($('currencySelect')) $('currencySelect').onchange = (e) => { curr=e.target.value; updUI(); };
    ['Ru','Be','En'].forEach(l => { const el=$('lang'+l); if(el) el.onclick = () => { lang=l.toLowerCase(); updLang(); }; });
    
    document.querySelectorAll('.period-btn').forEach(btn => {
        btn.onclick = (e) => {
            document.querySelectorAll('.period-btn').forEach(b=>b.classList.remove('active'));
            e.target.classList.add('active'); per=e.target.dataset.period; updUI();
        };
    });

    updLang();
    if('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js').catch(()=>{});
})();