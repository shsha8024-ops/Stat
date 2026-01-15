import { qs, todayISO, escapeHtml, getCurrencySymbol, uid, parseMoney } from './utils.js';
import { loadApp, saveApp, getClient, getInvoices, getStatement, defaultStatement, ensureClientHasFirstInvoice } from './storage.js';
import { exportWorkbook, tableDomToAoA, payloadToAoA, sumAmountFromPayload } from './exports.js';
import { TableEditor } from './table-editor.js';
import { downloadClientPdf } from './pdf-export.js';

let clientId = null;
let activeInvoiceId = null;

let t1Editor = null;
let t2Editor = null;

const el = {
  clientLine: document.getElementById('clientLine'),

  invCount: document.getElementById('invCount'),
  invSelect: document.getElementById('invSelect'),
  invList: document.getElementById('invList'),

  btnNewInv: document.getElementById('btnNewInv'),
  btnRenameInv: document.getElementById('btnRenameInv'),
  btnDeleteInv: document.getElementById('btnDeleteInv'),
  btnExportClientXlsx: document.getElementById('btnExportClientXlsx'),

  pdfFrom: document.getElementById('pdfFrom'),
  pdfTo: document.getElementById('pdfTo'),
  btnPdfRange: document.getElementById('btnPdfRange'),
  btnPdfAll: document.getElementById('btnPdfAll'),
  pdfDoc: document.getElementById('pdfDoc'),

  invPill: document.getElementById('invPill'),
  curPill: document.getElementById('curPill'),
  invDate: document.getElementById('invDate'),

  subtitle: document.getElementById('subtitle'),

  btnPrintTab: document.getElementById('btnPrintTab'),
  btnPrintAll: document.getElementById('btnPrintAll'),
  btnXlsxTab: document.getElementById('btnXlsxTab'),
  btnXlsxAll: document.getElementById('btnXlsxAll'),

  sum1: document.getElementById('sum1'),
  sum2: document.getElementById('sum2'),
  f1: document.getElementById('f1'),
  f2: document.getElementById('f2'),
  f3: document.getElementById('f3'),

  t1AddRow: document.getElementById('t1AddRow'),
  t1DelRow: document.getElementById('t1DelRow'),
  t1AddCol: document.getElementById('t1AddCol'),
  t1AddColAfter: document.getElementById('t1AddColAfter'),
  t1DelCol: document.getElementById('t1DelCol'),

  t2AddRow: document.getElementById('t2AddRow'),
  t2DelRow: document.getElementById('t2DelRow'),
  t2AddCol: document.getElementById('t2AddCol'),
  t2AddColAfter: document.getElementById('t2AddColAfter'),
  t2DelCol: document.getElementById('t2DelCol'),
};

let saveTimer = null;
function saveSoon(){
  window.clearTimeout(saveTimer);
  saveTimer = window.setTimeout(saveActiveInvoice, 250);
}
function flushSave(){
  window.clearTimeout(saveTimer);
  saveActiveInvoice();
}

function currentCurrency(){
  const app = loadApp();
  const c = getClient(app, clientId);
  return getCurrencySymbol(c?.currency || '$');
}


function compareISO(a, b){
  return String(a || '').localeCompare(String(b || ''));
}

function inRange(dateISO, fromISO, toISO){
  const d = String(dateISO || '');
  if(!d) return false;
  if(fromISO && compareISO(d, fromISO) < 0) return false;
  if(toISO && compareISO(d, toISO) > 0) return false;
  return true;
}

function tableFromPayload(payload, totalLabel, totalValue){
  const headers = Array.isArray(payload?.headerTitles) ? payload.headerTitles : [];
  const rows = Array.isArray(payload?.rows) ? payload.rows : [];

  const thead = `<thead><tr>${headers.map(h => `<th>${escapeHtml(h)}</th>`).join('')}</tr></thead>`;
  const tbody = `<tbody>${rows.map(r => `<tr>${headers.map((_, i) => `<td>${escapeHtml(r?.[i] ?? '')}</td>`).join('')}</tr>`).join('')}</tbody>`;

  const tfoot = `<tfoot><tr>${
    headers.map((_, i) => {
      if(i === headers.length - 2) return `<td>${escapeHtml(totalLabel)}</td>`;
      if(i === headers.length - 1) return `<td>${escapeHtml(totalValue)}</td>`;
      return `<td></td>`;
    }).join('')
  }</tr></tfoot>`;

  return `<table class="table">${thead}${tbody}${tfoot}</table>`;
}

function buildPdfForInvoices(app, client, invoices){
  const rangeFrom = el.pdfFrom?.value || '';
  const rangeTo = el.pdfTo?.value || '';
  const genAt = todayISO();

  const rangeLine = (rangeFrom || rangeTo)
    ? `المدة: ${rangeFrom || '...'} → ${rangeTo || '...'}`
    : 'المدة: كل الفواتير';

  const head = `
    <div class="pdfHeader">
      <h2>الغدير نقل و تخليص</h2>
      <div class="muted">كشف حساب العميل (PDF)</div>
      <div class="muted small">${escapeHtml(client.name || '')} — ${escapeHtml(client.phone || '')} — ${escapeHtml(client.location || '')}</div>
      <div class="muted small">${escapeHtml(rangeLine)} | تاريخ الإخراج: ${escapeHtml(genAt)}</div>
    </div>
  `;

  const parts = [];
  let grandS1 = 0;
  let grandS2 = 0;

  for(const inv of invoices){
    const stmt = app.statementsByInvoice[inv.id];
    if(!stmt) continue;

    const sym = stmt.meta?.currency || getCurrencySymbol(client.currency || '$');
    const s1 = sumAmountFromPayload(stmt.t1);
    const s2 = sumAmountFromPayload(stmt.t2);
    const bal = s1 - s2;

    grandS1 += s1;
    grandS2 += s2;

    const opsTable = tableFromPayload(stmt.t1, 'إجمالي العمليات', `${s1}${sym}`);
    const payTable = tableFromPayload(stmt.t2, 'مجموع القبوضات', `${s2}${sym}`);

    const finalTable = `
      <table class="table">
        <tr><th>إجمالي العمليات</th><td>${escapeHtml(`${s1}${sym}`)}</td></tr>
        <tr><th>مجموع القبوضات</th><td>${escapeHtml(`${s2}${sym}`)}</td></tr>
        <tr><th>الرصيد النهائي</th><td>${escapeHtml(`${bal}${sym}`)}</td></tr>
      </table>
    `;

    parts.push(`
      <div class="pdfSection">
        <div class="pdfTitle">
          <div class="name">${escapeHtml(inv.name || 'فاتورة')}</div>
          <div class="muted small">تاريخ الفاتورة: ${escapeHtml(inv.date || stmt.meta?.date || '-')}</div>
        </div>

        <h3 style="margin:10px 0 8px">العمليات</h3>
        ${opsTable}

        <h3 style="margin:12px 0 8px">القبوضات</h3>
        ${payTable}

        <h3 style="margin:12px 0 8px">الحساب النهائي</h3>
        ${finalTable}
      </div>
    `);
  }

  const sym = getCurrencySymbol(client.currency || '$');
  const grandBal = grandS1 - grandS2;

  const footer = `
    <div class="pdfSection">
      <div class="pdfTitle">
        <div class="name">الملخص النهائي</div>
        <div class="muted small">مجموع كل الفواتير المعروضة</div>
      </div>
      <div class="pdfKpis">
        <span class="pill">إجمالي العمليات: <b>${escapeHtml(`${grandS1}${sym}`)}</b></span>
        <span class="pill">مجموع القبوضات: <b>${escapeHtml(`${grandS2}${sym}`)}</b></span>
        <span class="pill">الرصيد النهائي: <b>${escapeHtml(`${grandBal}${sym}`)}</b></span>
      </div>
    </div>
  `;

  return head + parts.join('') + footer;
}

function printPdf(html){
  el.pdfDoc.innerHTML = html;
  document.body.classList.add('print-pdf');
  window.print();
}

function calc(){
  const sym = currentCurrency();

  let s1 = 0, s2 = 0;
  document.querySelectorAll('#t1 tbody td.amount').forEach(td => s1 += parseMoney(td.innerText));
  document.querySelectorAll('#t2 tbody td.amount').forEach(td => s2 += parseMoney(td.innerText));

  el.sum1.innerText = `${s1}${sym}`;
  el.sum2.innerText = `${s2}${sym}`;
  el.f1.innerText = `${s1}${sym}`;
  el.f2.innerText = `${s2}${sym}`;
  el.f3.innerText = `${(s1 - s2)}${sym}`;
}

function setTabs(){
  const btns = document.querySelectorAll('.tabBtn');
  const tabs = document.querySelectorAll('.tab');
  btns.forEach(b => b.addEventListener('click', () => {
    btns.forEach(x => x.classList.remove('active'));
    tabs.forEach(x => x.classList.remove('active'));
    b.classList.add('active');
    document.getElementById(b.dataset.tab).classList.add('active');
  }));
}

function printCurrentTab(){
  calc();
  document.body.classList.add('print-current');
  window.print();
}
function printAll(){
  calc();
  document.body.classList.remove('print-current');
  window.print();
}
window.addEventListener('afterprint', () => {
  document.body.classList.remove('print-current');
  document.body.classList.remove('print-pdf');
  if(el.pdfDoc) el.pdfDoc.innerHTML = '';
});

function renderInvoiceHeader(){
  const app = loadApp();
  const c = getClient(app, clientId);
  const inv = getInvoices(app, clientId).find(x => x.id === activeInvoiceId);

  el.clientLine.textContent = `${c?.name || ''} — ${c?.phone || ''} — ${c?.location || ''}`;
  el.invPill.innerHTML = `فاتورة: <b>${escapeHtml(inv?.name || '-')}</b>`;
  el.curPill.innerText = currentCurrency();
  el.subtitle.innerText = `الغدير نقل و تخليص — ${c?.name || ''} — ${inv?.name || ''}`;
}

function renderInvoicesUI(){
  const app = loadApp();
  const list = getInvoices(app, clientId);
  el.invCount.textContent = String(list.length);

  el.invSelect.innerHTML = '';
  for(const inv of list){
    const opt = document.createElement('option');
    opt.value = inv.id;
    opt.textContent = `${inv.name} — ${inv.date || ''}`;
    el.invSelect.appendChild(opt);
  }
  el.invSelect.value = activeInvoiceId || (list[0]?.id || '');

  el.invList.innerHTML = '';
  for(const inv of list){
    const div = document.createElement('div');
    div.className = 'invItem' + (inv.id === activeInvoiceId ? ' active' : '');
    div.innerHTML = `
      <div>
        <div class="invName">${escapeHtml(inv.name)}</div>
        <div class="invMeta">تاريخ: ${escapeHtml(inv.date || '-')}</div>
      </div>
      <span class="pill">فتح</span>
    `;
    div.addEventListener('click', () => selectInvoice(inv.id));
    el.invList.appendChild(div);
  }
}

function buildEditors(){
  t1Editor = new TableEditor({
    tableId: 't1',
    minCols: 6,
    getCurrencySymbol: currentCurrency,
    onChange: () => {
      t1Editor.updateFooterColspan('t1FootLabel');
      calc();
      saveSoon();
    }
  });

  t2Editor = new TableEditor({
    tableId: 't2',
    minCols: 6,
    getCurrencySymbol: currentCurrency,
    onChange: () => {
      t2Editor.updateFooterColspan('t2FootLabel');
      calc();
      saveSoon();
    }
  });

  el.t1AddRow.onclick = () => t1Editor.addRow();
  el.t1DelRow.onclick = () => t1Editor.removeSelectedRow();
  el.t1AddCol.onclick = () => { t1Editor.addColumn(true); t1Editor.updateFooterColspan('t1FootLabel'); calc(); saveSoon(); };
  el.t1AddColAfter.onclick = () => { t1Editor.addColumnAfterSelected(); t1Editor.updateFooterColspan('t1FootLabel'); calc(); saveSoon(); };
  el.t1DelCol.onclick = () => { t1Editor.removeSelectedColumn(); t1Editor.updateFooterColspan('t1FootLabel'); calc(); saveSoon(); };

  el.t2AddRow.onclick = () => t2Editor.addRow();
  el.t2DelRow.onclick = () => t2Editor.removeSelectedRow();
  el.t2AddCol.onclick = () => { t2Editor.addColumn(true); t2Editor.updateFooterColspan('t2FootLabel'); calc(); saveSoon(); };
  el.t2AddColAfter.onclick = () => { t2Editor.addColumnAfterSelected(); t2Editor.updateFooterColspan('t2FootLabel'); calc(); saveSoon(); };
  el.t2DelCol.onclick = () => { t2Editor.removeSelectedColumn(); t2Editor.updateFooterColspan('t2FootLabel'); calc(); saveSoon(); };
}

function loadInvoiceIntoUI(invoiceId){
  const app = loadApp();
  const c = getClient(app, clientId);
  const inv = getInvoices(app, clientId).find(x => x.id === invoiceId);
  if(!c || !inv) return;

  const sym = currentCurrency();
  const stmt = getStatement(app, invoiceId) || defaultStatement(c.currency || '$', inv.name);

  stmt.meta ||= {};
  stmt.meta.currency = sym;
  stmt.meta.invoiceName = inv.name;
  stmt.meta.date ||= inv.date || todayISO();

  t1Editor.build(stmt.t1, sym);
  t2Editor.build(stmt.t2, sym);

  t1Editor.updateFooterColspan('t1FootLabel');
  t2Editor.updateFooterColspan('t2FootLabel');

  el.invDate.value = stmt.meta.date;
  renderInvoiceHeader();
  calc();
}

function saveActiveInvoice(){
  if(!clientId || !activeInvoiceId) return;

  const app = loadApp();
  const c = getClient(app, clientId);
  const inv = getInvoices(app, clientId).find(x => x.id === activeInvoiceId);
  if(!c || !inv) return;

  const sym = currentCurrency();
  const stmt = app.statementsByInvoice[activeInvoiceId] || defaultStatement(c.currency || '$', inv.name);

  stmt.meta ||= {};
  stmt.meta.currency = sym;
  stmt.meta.invoiceName = inv.name;
  stmt.meta.period = 'مفتوحة';
  stmt.meta.date = el.invDate.value || inv.date || todayISO();

  inv.date = stmt.meta.date;

  stmt.t1 = t1Editor.serialize();
  stmt.t2 = t2Editor.serialize();

  app.statementsByInvoice[activeInvoiceId] = stmt;
  saveApp(app);

  renderInvoicesUI();
  renderInvoiceHeader();
}

function selectInvoice(invoiceId){
  if(invoiceId === activeInvoiceId) return;
  flushSave();
  activeInvoiceId = invoiceId;
  renderInvoicesUI();
  loadInvoiceIntoUI(invoiceId);
}

function newInvoice(){
  const app = loadApp();
  const c = getClient(app, clientId);
  if(!c) return;

  const list = getInvoices(app, clientId);
  const nextNo = list.length + 1;

  const name = (prompt('اسم الفاتورة/الكشف؟', `فاتورة ${nextNo}`) || `فاتورة ${nextNo}`).trim();
  const date = (prompt('تاريخ الفاتورة (YYYY-MM-DD)', todayISO()) || todayISO()).trim();

  const invId = uid('inv');
  list.push({ id: invId, name, date, createdAt: Date.now() });
  app.invoicesByClient[clientId] = list;

  app.statementsByInvoice[invId] = defaultStatement(c.currency || '$', name);
  app.statementsByInvoice[invId].meta.date = date;

  saveApp(app);
  activeInvoiceId = invId;

  renderInvoicesUI();
  loadInvoiceIntoUI(invId);
}

function renameInvoice(){
  const app = loadApp();
  const inv = getInvoices(app, clientId).find(x => x.id === activeInvoiceId);
  if(!inv) return;

  const name = (prompt('اسم جديد:', inv.name) || inv.name).trim();
  inv.name = name;

  const stmt = getStatement(app, activeInvoiceId);
  if(stmt?.meta) stmt.meta.invoiceName = name;

  saveApp(app);
  renderInvoicesUI();
  renderInvoiceHeader();
}

function deleteInvoice(){
  const app = loadApp();
  const list = getInvoices(app, clientId);
  const inv = list.find(x => x.id === activeInvoiceId);
  if(!inv) return;

  if(!confirm(`حذف "${inv.name}"؟`)) return;

  flushSave();
  app.invoicesByClient[clientId] = list.filter(x => x.id !== activeInvoiceId);
  delete app.statementsByInvoice[activeInvoiceId];

  ensureClientHasFirstInvoice(app, clientId);
  saveApp(app);

  const nextList = getInvoices(app, clientId);
  activeInvoiceId = nextList[0].id;

  renderInvoicesUI();
  loadInvoiceIntoUI(activeInvoiceId);
  if(el.pdfFrom) el.pdfFrom.value = todayISO();
  if(el.pdfTo) el.pdfTo.value = todayISO();
}

function exportTabXlsx(){
  calc();
  const date = el.invDate.value || todayISO();

  const activeBtn = document.querySelector('.tabBtn.active');
  const tabId = activeBtn?.dataset.tab || 'ops';

  const app = loadApp();
  const c = getClient(app, clientId);
  const inv = getInvoices(app, clientId).find(x => x.id === activeInvoiceId);

  const who = (c?.name || 'عميل').replace(/\s+/g,'_');
  const invName = (inv?.name || 'فاتورة').replace(/\s+/g,'_');

  if(tabId === 'ops'){
    exportWorkbook(
      [{ name:'العمليات', aoa: tableDomToAoA(document.getElementById('t1'), 'إجمالي العمليات', el.sum1.innerText) }],
      `عمليات_${who}_${invName}_${date}.xlsx`
    );
    return;
  }
  if(tabId === 'pay'){
    exportWorkbook(
      [{ name:'القبوضات', aoa: tableDomToAoA(document.getElementById('t2'), 'مجموع القبوضات', el.sum2.innerText) }],
      `قبوضات_${who}_${invName}_${date}.xlsx`
    );
    return;
  }
  exportWorkbook(
    [{ name:'الحساب النهائي', aoa: [['البند','القيمة'],['إجمالي العمليات', el.f1.innerText],['مجموع القبوضات', el.f2.innerText],['الرصيد النهائي', el.f3.innerText]] }],
    `نهائي_${who}_${invName}_${date}.xlsx`
  );
}

function exportInvoiceXlsx(){
  flushSave();
  const app = loadApp();
  const c = getClient(app, clientId);
  const inv = getInvoices(app, clientId).find(x => x.id === activeInvoiceId);
  const stmt = getStatement(app, activeInvoiceId);
  if(!c || !inv || !stmt) return;

  const who = (c.name || 'عميل').replace(/\s+/g,'_');
  const invName = (inv.name || 'فاتورة').replace(/\s+/g,'_');
  const date = stmt.meta?.date || todayISO();
  const sym = stmt.meta?.currency || currentCurrency();

  const s1 = sumAmountFromPayload(stmt.t1);
  const s2 = sumAmountFromPayload(stmt.t2);
  const bal = s1 - s2;

  exportWorkbook(
    [
      { name:'العمليات', aoa: payloadToAoA(stmt.t1, 'إجمالي العمليات', sym) },
      { name:'القبوضات', aoa: payloadToAoA(stmt.t2, 'مجموع القبوضات', sym) },
      { name:'الحساب النهائي', aoa: [['البند','القيمة'],['إجمالي العمليات',`${s1}${sym}`],['مجموع القبوضات',`${s2}${sym}`],['الرصيد النهائي',`${bal}${sym}`]] },
    ],
    `فاتورة_${who}_${invName}_${date}.xlsx`
  );
}

function exportAllClientInvoicesXlsx(){
  flushSave();
  const app = loadApp();
  const c = getClient(app, clientId);
  const invs = getInvoices(app, clientId);
  if(!c) return;

  const who = (c.name || 'عميل').replace(/\s+/g,'_');
  const date = todayISO();

  const sheets = [];
  for(const inv of invs){
    const stmt = getStatement(app, inv.id);
    if(!stmt) continue;
    const sym = stmt.meta?.currency || currentCurrency();

    const s1 = sumAmountFromPayload(stmt.t1);
    const s2 = sumAmountFromPayload(stmt.t2);
    const bal = s1 - s2;

    sheets.push({ name:`${inv.name}-عمليات`, aoa: payloadToAoA(stmt.t1, 'إجمالي العمليات', sym) });
    sheets.push({ name:`${inv.name}-قبوضات`, aoa: payloadToAoA(stmt.t2, 'مجموع القبوضات', sym) });
    sheets.push({ name:`${inv.name}-نهائي`, aoa: [['البند','القيمة'],['إجمالي العمليات',`${s1}${sym}`],['مجموع القبوضات',`${s2}${sym}`],['الرصيد النهائي',`${bal}${sym}`]] });
  }

  exportWorkbook(sheets, `كل_فواتير_${who}_${date}.xlsx`);
}

el.invSelect.addEventListener('change', () => selectInvoice(el.invSelect.value));
el.btnNewInv.addEventListener('click', newInvoice);
el.btnRenameInv.addEventListener('click', () => { flushSave(); renameInvoice(); });
el.btnDeleteInv.addEventListener('click', () => { flushSave(); deleteInvoice(); });
el.invDate.addEventListener('input', () => { calc(); saveSoon(); });

el.btnPrintTab.addEventListener('click', printCurrentTab);
el.btnPrintAll.addEventListener('click', printAll);
el.btnXlsxTab.addEventListener('click', exportTabXlsx);
el.btnXlsxAll.addEventListener('click', exportInvoiceXlsx);
el.btnExportClientXlsx.addEventListener('click', exportAllClientInvoicesXlsx);

el.btnPdfAll.addEventListener('click', async () => {
  flushSave();
  const app = loadApp();
  const c = getClient(app, clientId);
  if(!c) return;

  const invs = getInvoices(app, clientId)
    .slice()
    .sort((a,b) => String(a.date||'').localeCompare(String(b.date||'')))
    .map(inv => ({ ...inv, statement: app.statementsByInvoice[inv.id] }));

  await downloadClientPdf({
    client: c,
    invoices: invs,
    fromISO: '',
    toISO: '',
    title: 'الغدير نقل و تخليص',
  });
});

el.btnPdfRange.addEventListener('click', async () => {
  flushSave();
  const fromISO = el.pdfFrom?.value || '';
  const toISO = el.pdfTo?.value || '';

  const app = loadApp();
  const c = getClient(app, clientId);
  if(!c) return;

  const invs = getInvoices(app, clientId)
    .filter(inv => inRange(inv.date || app.statementsByInvoice?.[inv.id]?.meta?.date, fromISO, toISO))
    .sort((a,b) => String(a.date||'').localeCompare(String(b.date||'')))
    .map(inv => ({ ...inv, statement: app.statementsByInvoice[inv.id] }));

  if(invs.length === 0){
    alert('لا توجد فواتير ضمن هذا المدى.');
    return;
  }

  await downloadClientPdf({
    client: c,
    invoices: invs,
    fromISO,
    toISO,
    title: 'الغدير نقل و تخليص',
  });
});


window.addEventListener('beforeunload', flushSave);

(function boot(){
  clientId = qs('client');
  if(!clientId){
    window.location.href = 'index.html';
    return;
  }

  const app = loadApp();
  const c = getClient(app, clientId);
  if(!c){
    window.location.href = 'index.html';
    return;
  }

  ensureClientHasFirstInvoice(app, clientId);
  saveApp(app);

  const list = getInvoices(app, clientId);
  activeInvoiceId = list[0].id;

  setTabs();
  buildEditors();
  renderInvoicesUI();
  loadInvoiceIntoUI(activeInvoiceId);
  if(el.pdfFrom) el.pdfFrom.value = todayISO();
  if(el.pdfTo) el.pdfTo.value = todayISO();
})();
