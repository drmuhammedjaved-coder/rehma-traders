/* ==========================================================================
   REHMA TRADERS - Billing & Inventory PWA (Complete app.js)
   ========================================================================== */

let rateList = JSON.parse(localStorage.getItem('rehma_ratelist')) || [
  { code: '2017594941000', nameEn: '3 Pcs Chab', nameUr: '3 پیس چھاب', rate: 300 },
  { code: '2011476521000', nameEn: 'Single Chab', nameUr: 'سنگل چھاب', rate: 190 },
  { code: '2011476521000', nameEn: 'Naan Chab', nameUr: 'نان چھاب', rate: 200 },
  { code: '2017598841000', nameEn: 'Small Box Round', nameUr: 'سمال باکس راؤنڈ', rate: 220 },
  { code: '2019580141000', nameEn: 'Medium Box Round', nameUr: 'میڈیم باکس راؤنڈ', rate: 280 },
  { code: '2013147621000', nameEn: 'Large Box Round', nameUr: 'لارج باکس راؤنڈ', rate: 380 },
  { code: '2019580141000', nameEn: 'Square Small', nameUr: 'اسکوائر سمال', rate: 280 },
  { code: '2013147621000', nameEn: 'Square Large', nameUr: 'اسکوائر لارج', rate: 380 },
  { code: '2011476821000', nameEn: 'Gloves Pair', nameUr: 'گلوز پیئر', rate: 155 },
  { code: '2017447641000', nameEn: 'Fridge Handle Cover', nameUr: 'فریج ہینڈل کور', rate: 90 },
  { code: '', nameEn: 'Port Holder', nameUr: 'پارف ہولڈر', rate: 70 },
  { code: '', nameEn: 'Tea Cozy Small', nameUr: 'ٹی کوزی سمال', rate: 220 },
  { code: '', nameEn: 'Tea Cozy Big', nameUr: 'ٹی کوزی بگ', rate: 250 },
  { code: '', nameEn: 'Iron Cover Cut', nameUr: 'آئرن کور کٹ', rate: 430 },
  { code: '1036001001585', nameEn: 'Iron Cover W/ Cut', nameUr: 'آئرن کور ود کٹ', rate: 450 }
];

let billsHistory = JSON.parse(localStorage.getItem('rehma_bills')) || [];
let billItems = [];
let currentLang = 'en';

// Undo / Redo State Management
let appStateHistory = [];
let historyIndex = -1;
let isRestoring = false;

window.addEventListener('DOMContentLoaded', () => {
  initApp();
  setTimeout(saveAppState, 500);

  document.addEventListener('input', saveAppState);
  document.addEventListener('change', saveAppState);
});

function initApp() {
  renderRateList();
  renderMultiItemSelector();
  renderLedger();
  updateDashboardStats();
  generateNextBillNumber();
}

/* --------------------------------------------------------------------------
   ⌨️ ENTER KEY NAVIGATION (Same Column, Next Row) & UNDO/REDO LOGIC
   -------------------------------------------------------------------------- */
window.addEventListener('keydown', function(e) {
  if (e.key === 'Enter') {
    const activeEl = document.activeElement;
    if (activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'SELECT')) {
      const currentTd = activeEl.closest('td');
      const currentRow = activeEl.closest('tr');

      if (currentTd && currentRow) {
        e.preventDefault();
        e.stopPropagation();
        
        const cells = Array.from(currentRow.children);
        const colIndex = cells.indexOf(currentTd);
        const nextRow = currentRow.nextElementSibling;

        if (nextRow) {
          const targetCells = Array.from(nextRow.children);
          const targetTd = targetCells[colIndex];
          const targetInput = targetTd ? targetTd.querySelector('input, select') : null;
          if (targetInput) {
            targetInput.focus();
            if (targetInput.select) targetInput.select();
            return false;
          }
        }
      } else {
        // عام فارم فیلڈز کے لیے
        e.preventDefault();
        const allInputs = Array.from(document.querySelectorAll('input:not([type="hidden"]), select'));
        const currentIndex = allInputs.indexOf(activeEl);
        if (currentIndex > -1 && currentIndex < allInputs.length - 1) {
          allInputs[currentIndex + 1].focus();
          if (allInputs[currentIndex + 1].select) allInputs[currentIndex + 1].select();
        }
      }
    }
  }
}, true);

function saveAppState() {
  if (isRestoring) return;
  const state = {};
  document.querySelectorAll('input, select').forEach((el, idx) => {
    const key = el.id || ('field_' + idx);
    state[key] = el.value;
  });

  if (historyIndex < appStateHistory.length - 1) {
    appStateHistory = appStateHistory.slice(0, historyIndex + 1);
  }
  appStateHistory.push(state);
  historyIndex = appStateHistory.length - 1;
}

function triggerUndoAction() {
  if (historyIndex > 0) {
    historyIndex--;
    restoreAppState(appStateHistory[historyIndex]);
  }
}

function triggerRedoAction() {
  if (historyIndex < appStateHistory.length - 1) {
    historyIndex++;
    restoreAppState(appStateHistory[historyIndex]);
  }
}

function restoreAppState(state) {
  if (!state) return;
  isRestoring = true;
  document.querySelectorAll('input, select').forEach((el, idx) => {
    const key = el.id || ('field_' + idx);
    if (state[key] !== undefined) {
      el.value = state[key];
      el.dispatchEvent(new Event('input', { bubbles: true }));
      el.dispatchEvent(new Event('change', { bubbles: true }));
    }
  });
  setTimeout(() => { isRestoring = false; }, 100);
}

/* --------------------------------------------------------------------------
   ⚙️ VIEW SWITCHING & NAVIGATION
   -------------------------------------------------------------------------- */
function switchView(viewId) {
  document.querySelectorAll('.section').forEach(sec => sec.classList.add('hidden-section'));
  const target = document.getElementById(viewId);
  if (target) {
    target.classList.remove('hidden-section');
  }
  if (viewId === 'sectionRateList') renderRateList();
  if (viewId === 'sectionStock') renderStockTable();
  if (viewId === 'sectionLedger') renderLedger();
}

/* --------------------------------------------------------------------------
   📝 BILLING & ITEMS LOGIC
   -------------------------------------------------------------------------- */
function generateNextBillNumber() {
  const nextNo = 'INV-' + (1001 + billsHistory.length);
  const el = document.getElementById('nextBillNo');
  if (el) el.innerText = nextNo;
}

function renderMultiItemSelector() {
  const container = document.getElementById('multiItemBox');
  if (!container) return;
  container.innerHTML = '';
  rateList.forEach((item, idx) => {
    const div = document.createElement('div');
    div.style.cssText = 'display:flex; align-items:center; gap:8px; margin:4px 0; background:var(--bg-dark); padding:6px; border-radius:6px;';
    div.innerHTML = `
      <input type="checkbox" id="chk_item_${idx}" value="${item.code}" style="width:20px; height:20px; accent-color:var(--accent-main);">
      <label for="chk_item_${idx}" style="flex:1; font-size:12px; cursor:pointer;">${item.code ? item.code + ' - ' : ''}${currentLang === 'ur' ? item.nameUr : item.nameEn} (Rs. ${item.rate})</label>
      <input type="number" id="qty_item_${idx}" value="1" min="1" style="width:60px; padding:4px; text-align:center;">
    `;
    container.appendChild(div);
  });
}

function addSelectedMultipleItems() {
  rateList.forEach((item, idx) => {
    const chk = document.getElementById(`chk_item_${idx}`);
    const qtyInput = document.getElementById(`qty_item_${idx}`);
    if (chk && chk.checked) {
      const qty = parseFloat(qtyInput.value) || 1;
      const itemName = currentLang === 'ur' ? item.nameUr : item.nameEn;
      const existing = billItems.find(i => i.name === itemName);
      if (existing) {
        existing.qty += qty;
      } else {
        billItems.push({
          code: item.code,
          name: itemName,
          rate: item.rate,
          qty: qty
        });
      }
      chk.checked = false;
      qtyInput.value = '1';
    }
  });
  renderBillItemsTable();
}

function renderBillItemsTable() {
  const tbody = document.querySelector('#billItemsTable tbody');
  if (!tbody) return;
  tbody.innerHTML = '';
  
  billItems.forEach((item, index) => {
    const total = item.rate * item.qty;
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${index + 1}</td>
      <td>${item.code}</td>
      <td>${item.name}</td>
      <td><input type="number" value="${item.qty}" min="1" oninput="updateBillItemQty(${index}, this.value)" style="width:60px; text-align:center; padding:2px;"></td>
      <td><input type="number" value="${item.rate}" oninput="updateBillItemRate(${index}, this.value)" style="width:70px; text-align:center; padding:2px;"></td>
      <td>Rs. ${total}</td>
      <td><button class="btn-danger" onclick="removeBillItem(${index})" style="padding:2px 6px; font-size:10px;">❌</button></td>
    `;
    tbody.appendChild(tr);
  });
  calculateBillTotals();
}

function updateBillItemQty(index, val) {
  billItems[index].qty = parseFloat(val) || 0;
  renderBillItemsTable();
}

function updateBillItemRate(index, val) {
  billItems[index].rate = parseFloat(val) || 0;
  renderBillItemsTable();
}

function removeBillItem(index) {
  billItems.splice(index, 1);
  renderBillItemsTable();
}

function calculateBillTotals() {
  const subTotal = billItems.reduce((acc, item) => acc + (item.rate * item.qty), 0);
  const prevBalance = parseFloat(document.getElementById('prevBalanceInput').value) || 0;
  const discount = parseFloat(document.getElementById('discountInput').value) || 0;
  const netTotal = subTotal + prevBalance - discount;

  const grandTotalTxt = document.getElementById('grandTotalTxt');
  if (grandTotalTxt) grandTotalTxt.innerText = `Rs. ${netTotal}`;
}

/* --------------------------------------------------------------------------
   ⚙️ RATE LIST MANAGEMENT
   -------------------------------------------------------------------------- */
function renderRateList() {
  const tbody = document.querySelector('#rateListTable tbody');
  if (!tbody) return;
  tbody.innerHTML = '';

  rateList.forEach((item, index) => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td style="border:1px solid #000; color:#000;"><input type="text" value="${item.code}" oninput="updateRateField(${index}, 'code', this.value)" style="width:90%; background:transparent; border:none; text-align:center; color:#000; font-weight:bold;"></td>
      <td style="border:1px solid #000; color:#000;"><input type="text" value="${currentLang === 'ur' ? item.nameUr : item.nameEn}" oninput="updateRateField(${index}, '${currentLang === 'ur' ? 'nameUr' : 'nameEn'}', this.value)" style="width:95%; background:transparent; border:none; text-align:center; color:#000;"></td>
      <td style="border:1px solid #000; color:#000;"><input type="number" value="${item.rate}" oninput="updateRateField(${index}, 'rate', this.value)" style="width:90%; background:transparent; border:none; text-align:center; color:#000; font-weight:bold;"></td>
      <td class="no-print-col" style="border:1px solid #000; color:#000;"><button class="btn-danger" onclick="deleteRateItem(${index})" style="padding:2px 6px;">🗑️</button></td>
    `;
    tbody.appendChild(tr);
  });
}

function updateRateField(index, field, value) {
  if (field === 'rate') {
    rateList[index][field] = parseFloat(value) || 0;
  } else {
    rateList[index][field] = value;
  }
  localStorage.setItem('rehma_ratelist', JSON.stringify(rateList));
}

function addNewItem() {
  const nameEn = document.getElementById('newItemNameEn').value.trim();
  const nameUr = document.getElementById('newItemNameUr').value.trim();
  const code = document.getElementById('newItemCode').value.trim();
  const rate = parseFloat(document.getElementById('newItemRate').value);

  if (!nameEn && !nameUr) {
    alert('Please enter item name!');
    return;
  }

  rateList.push({ code, nameEn: nameEn || nameUr, nameUr: nameUr || nameEn, rate: rate || 0 });
  savePermanentRatesList();
  
  document.getElementById('newItemNameEn').value = '';
  document.getElementById('newItemNameUr').value = '';
  document.getElementById('newItemCode').value = '';
  document.getElementById('newItemRate').value = '';
}

function deleteRateItem(index) {
  rateList.splice(index, 1);
  savePermanentRatesList();
}

function savePermanentRatesList() {
  localStorage.setItem('rehma_ratelist', JSON.stringify(rateList));
  renderRateList();
  renderMultiItemSelector();
  alert('Rates and Items saved successfully!');
}

/* --------------------------------------------------------------------------
   📦 STOCK & LEDGER
   -------------------------------------------------------------------------- */
function renderStockTable() {
  const tbody = document.querySelector('#stockReportTable tbody');
  if (!tbody) return;
  tbody.innerHTML = '';
  rateList.forEach(item => {
    const tr = document.createElement('tr');
    tr.innerHTML = `<td>${item.code}</td><td>${currentLang === 'ur' ? item.nameUr : item.nameEn}</td><td>Unlimited / Available</td>`;
    tbody.appendChild(tr);
  });
}

function renderLedger() {
  const tbody = document.querySelector('#ledgerTable tbody');
  if (!tbody) return;
  tbody.innerHTML = '';
  
  billsHistory.forEach((
