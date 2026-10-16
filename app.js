/* ==========================================================================
   REHMA TRADERS - Billing & Inventory PWA (Complete app.js)
   ========================================================================== */

let rateList = JSON.parse(localStorage.getItem('rehma_ratelist')) || [
  { code: '2017594941000', nameEn: '3 Pcs Chab', nameUr: '3 پیس چھاب', rate: 300, stock: 50 },
  { code: '2011476521000', nameEn: 'Single Chab', nameUr: 'سنگل چھاب', rate: 190, stock: 40 },
  { code: '2011476521000', nameEn: 'Naan Chab', nameUr: 'نان چھاب', rate: 200, stock: 35 },
  { code: '2017598841000', nameEn: 'Small Box Round', nameUr: 'سمال باکس راؤنڈ', rate: 220, stock: 25 },
  { code: '2019580141000', nameEn: 'Medium Box Round', nameUr: 'میڈیم باکس راؤنڈ', rate: 280, stock: 30 },
  { code: '2013147621000', nameEn: 'Large Box Round', nameUr: 'لارج باکس راؤنڈ', rate: 380, stock: 20 },
  { code: '2019580141000', nameEn: 'Square Small', nameUr: 'اسکوائر سمال', rate: 280, stock: 25 },
  { code: '2013147621000', nameEn: 'Square Large', nameUr: 'اسکوائر لارج', rate: 380, stock: 15 },
  { code: '2011476821000', nameEn: 'Gloves Pair', nameUr: 'گلوز پیئر', rate: 155, stock: 60 },
  { code: '2017447641000', nameEn: 'Fridge Handle Cover', nameUr: 'فریج ہینڈل کور', rate: 90, stock: 45 },
  { code: '', nameEn: 'Port Holder', nameUr: 'پارف ہولڈر', rate: 70, stock: 30 },
  { code: '', nameEn: 'Tea Cozy Small', nameUr: 'ٹی کوزی سمال', rate: 220, stock: 20 },
  { code: '', nameEn: 'Tea Cozy Big', nameUr: 'ٹی کوزی بگ', rate: 250, stock: 18 },
  { code: '', nameEn: 'Iron Cover Cut', nameUr: 'آئرن کور کٹ', rate: 430, stock: 12 },
  { code: '1036001001585', nameEn: 'Iron Cover W/ Cut', nameUr: 'آئرن کور ود کٹ', rate: 450, stock: 10 }
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
  renderStockTable();
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

function generateNextBillNumber() {
  const nextNo = 'INV-' + (1001 + billsHistory.length);
  const el = document.getElementById('nextBillNo');
  if (el) el.innerText = nextNo;
}

/* --------------------------------------------------------------------------
   📦 RENDER MULTI ITEM SELECTOR WITH STOCK INFO
   -------------------------------------------------------------------------- */
function renderMultiItemSelector() {
  const container = document.getElementById('multiItemBox');
  if (!container) return;
  container.innerHTML = '';
  rateList.forEach((item, idx) => {
    const div = document.createElement('div');
    div.className = 'multi-item-row';
    const stockQty = item.stock !== undefined ? item.stock : 50;
    div.innerHTML = `
      <div style="display:flex; align-items:center; gap:8px; flex:1;">
        <input type="checkbox" id="chk_item_${idx}" value="${item.code}" style="width:16px; height:16px; accent-color:var(--accent-main); cursor:pointer;">
        <label for="chk_item_${idx}" style="font-size:11px; cursor:pointer;">
          ${item.code ? item.code + ' - ' : ''}<strong>${currentLang === 'ur' ? item.nameUr : item.nameEn}</strong> 
          <span style="color:var(--accent-main);">(Rate: ${item.rate} | Stock: ${stockQty})</span>
        </label>
      </div>
      <input type="number" id="qty_item_${idx}" value="1" min="1" style="width:50px; padding:2px; text-align:center; font-size:11px;">
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
      <td><input type="number" value="${item.qty}" min="1" oninput="updateBillItemQty(${index}, this.value)" style="width:50px; text-align:center; padding:2px;"></td>
      <td><input type="number" value="${item.rate}" oninput="updateBillItemRate(${index}, this.value)" style="width:60px; text-align:center; padding:2px;"></td>
      <td>Rs. ${total}</td>
      <td><button class="btn-danger" onclick="removeBillItem(${index})" style="padding:2px 5px; font-size:10px;">❌</button></td>
    `;
    tbody.appendChild(tr);
  });
  calculateBillTotals();
}

function updateBillItemQty(index, val) {
  billItems[index].qty = parseFloat(val) || 0;
  calculateBillTotals();
}

function updateBillItemRate(index, val) {
  billItems[index].rate = parseFloat(val) || 0;
  calculateBillTotals();
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

  rateList.push({ code, nameEn: nameEn || nameUr, nameUr: nameUr || nameEn, rate: rate || 0, stock: 50 });
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
  renderStockTable();
  alert('Rates and Items saved successfully!');
}

/* --------------------------------------------------------------------------
   📦 STOCK & LEDGER
   -------------------------------------------------------------------------- */
function renderStockTable() {
  const tbody = document.querySelector('#stockReportTable tbody');
  if (!tbody) return;
  tbody.innerHTML = '';
  rateList.forEach((item, index) => {
    const stockQty = item.stock !== undefined ? item.stock : 50;
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${item.code}</td>
      <td>${currentLang === 'ur' ? item.nameUr : item.nameEn}</td>
      <td><input type="number" value="${stockQty}" oninput="updateStockQty(${index}, this.value)" style="width:70px; text-align:center; padding:2px;"></td>
    `;
    tbody.appendChild(tr);
  });
}

function updateStockQty(index, val) {
  rateList[index].stock = parseFloat(val) || 0;
  localStorage.setItem('rehma_ratelist', JSON.stringify(rateList));
}

function renderLedger() {
  const tbody = document.querySelector('#ledgerTable tbody');
  if (!tbody) return;
  tbody.innerHTML = '';
  
  billsHistory.forEach((bill, idx) => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><input type="checkbox" class="bill-select-chk" data-index="${idx}"></td>
      <td>${bill.billNo}</td>
      <td>${bill.custName}</td>
      <td>${bill.date}</td>
      <td>Rs. ${bill.netTotal}</td>
      <td><button class="btn-silver" onclick="viewBillDetails(${idx})" style="padding:2px 6px;">👁️</button></td>
    `;
    tbody.appendChild(tr);
  });
}

/* 📌 پرانے بل کا پریویو دکھانے والا فنکشن */
function viewBillDetails(index) {
  const bill = billsHistory[index];
  if (!bill) return;

  const contentDiv = document.getElementById('billPrintContent');
  let itemsHtml = `
    <div style="display:flex; justify-content:space-between; border-bottom:0.5px solid #000; padding-bottom:2px; margin-bottom:4px;">
      <span><strong>Bill #:</strong> ${bill.billNo}</span>
      <span><strong>Date:</strong> ${bill.date}</span>
    </div>
    <div style="margin-bottom:4px;">
      <span><strong>Customer:</strong> ${bill.custName} (${bill.custPhone || '-'})</span>
    </div>
    <table>
      <thead>
        <tr><th>Sr</th><th>Item</th><th>Qty</th><th>Rate</th><th>Total</th></tr>
      </thead>
      <tbody>
  `;

  let subTotal = 0;
  bill.items.forEach((item, idx) => {
    const t = item.rate * item.qty;
    subTotal += t;
    itemsHtml += `<tr><td>${idx+1}</td><td>${item.name}</td><td>${item.qty}</td><td>${item.rate}</td><td>${t}</td></tr>`;
  });

  itemsHtml += `
      </tbody>
    </table>
    <div style="margin-top:4px; text-align:right; font-size:8.5px; line-height:1.2;">
      <div>SubTotal: Rs. ${subTotal}</div>
      <div><strong>Net Total: Rs. ${bill.netTotal}</strong></div>
    </div>
  `;

  contentDiv.innerHTML = itemsHtml;
  document.getElementById('previewModal').style.display = 'block';
}

function filterLedger() {
  const query = document.getElementById('searchCust').value.toLowerCase();
  const rows = document.querySelectorAll('#ledgerTable tbody tr');
  rows.forEach(row => {
    const text = row.innerText.toLowerCase();
    row.style.display = text.includes(query) ? '' : 'none';
  });
}

function toggleSelectAllBills(chk) {
  document.querySelectorAll('.bill-select-chk').forEach(c => c.checked = chk.checked);
}

function deleteSelectedMarkedBills() {
  const chks = document.querySelectorAll('.bill-select-chk:checked');
  if (chks.length === 0) {
    alert('Please select bills to delete.');
    return;
  }
  if (confirm('Are you sure to delete selected bills?')) {
    const indices = Array.from(chks).map(c => parseInt(c.getAttribute('data-index'))).sort((a,b) => b - a);
    indices.forEach(idx => billsHistory.splice(idx, 1));
    localStorage.setItem('rehma_bills', JSON.stringify(billsHistory));
    renderLedger();
    updateDashboardStats();
  }
}

function updateDashboardStats() {
  const total = billsHistory.reduce((acc, b) => acc + (parseFloat(b.netTotal) || 0), 0);
  const dashSales = document.getElementById('dashSales');
  if (dashSales) dashSales.innerText = `Rs. ${total}`;
}

/* --------------------------------------------------------------------------
   🖨️ PREVIEW, PRINT & EXPORT
   -------------------------------------------------------------------------- */
function openBillPreview() {
  if (billItems.length === 0) {
    alert('Please add items to bill first!');
    return;
  }
  const custName = document.getElementById('custName').value || 'Cash Customer';
  const custPhone = document.getElementById('custPhone').value || '-';
  const prevBalance = parseFloat(document.getElementById('prevBalanceInput').value) || 0;
  const discount = parseFloat(document.getElementById('discountInput').value) || 0;
  const subTotal = billItems.reduce((acc, item) => acc + (item.rate * item.qty), 0);
  const netTotal = subTotal + prevBalance - discount;

  const contentDiv = document.getElementById('billPrintContent');
  let itemsHtml = `
    <div style="display:flex; justify-content:space-between; border-bottom:0.5px solid #000; padding-bottom:2px; margin-bottom:4px;">
      <span><strong>Customer:</strong> ${custName}</span>
      <span><strong>Date:</strong> ${new Date().toLocaleDateString()}</span>
    </div>
    <table>
      <thead>
        <tr><th>Sr</th><th>Item</th><th>Qty</th><th>Rate</th><th>Total</th></tr>
      </thead>
      <tbody>
  `;

  billItems.forEach((item, idx) => {
    itemsHtml += `<tr><td>${idx+1}</td><td>${item.name}</td><td>${item.qty}</td><td>${item.rate}</td><td>${item.rate * item.qty}</td></tr>`;
  });

  itemsHtml += `
      </tbody>
    </table>
    <div style="margin-top:4px; text-align:right; font-size:8.5px; line-height:1.2;">
      <div>SubTotal: Rs. ${subTotal}</div>
      ${prevBalance ? `<div>Prev Balance: Rs. ${prevBalance}</div>` : ''}
      ${discount ? `<div>Discount: Rs. ${discount}</div>` : ''}
      <div><strong>Net Total: Rs. ${netTotal}</strong></div>
    </div>
  `;

  contentDiv.innerHTML = itemsHtml;
  document.getElementById('previewModal').style.display = 'block';

  // Save to history & reduce stock
  const billRecord = {
    billNo: document.getElementById('nextBillNo').innerText,
    custName,
    custPhone,
    date: new Date().toLocaleDateString(),
    netTotal,
    items: [...billItems]
  };
  billsHistory.push(billRecord);
  localStorage.setItem('rehma_bills', JSON.stringify(billsHistory));
  
  // Update stock counts
  billItems.forEach(bi => {
    const match = rateList.find(r => (currentLang === 'ur' ? r.nameUr : r.nameEn) === bi.name);
    if (match) {
      match.stock = Math.max(0, (match.stock !== undefined ? match.stock : 50) - bi.qty);
    }
  });
  localStorage.setItem('rehma_ratelist', JSON.stringify(rateList));
  updateDashboardStats();
}

function closeBillPreview() {
  document.getElementById('previewModal').style.display = 'none';
}

function changePaperSize(sizeClass) {
  const container = document.getElementById('printableBillContainer');
  container.className = sizeClass;
}

function exportBillJpgAndShare() {
  const container = document.getElementById('printableBillContainer');
  html2canvas(container, { scale: 2 }).then(canvas => {
    const link = document.createElement('a');
    link.download = 'rehma-bill.jpg';
    link.href = canvas.toDataURL('image/jpeg', 0.9);
    link.click();
  });
}

function exportRateListJpg() {
  const container = document.getElementById('rateListCaptureArea');
  html2canvas(container, { scale: 2 }).then(canvas => {
    const link = document.createElement('a');
    link.download = 'rehma-ratelist.jpg';
    link.href = canvas.toDataURL('image/jpeg', 0.9);
    link.click();
  });
}

function executeFinalPrint() {
  window.print();
}

/* --------------------------------------------------------------------------
   🌐 LANGUAGE & BACKUP
   -------------------------------------------------------------------------- */
function toggleLanguage() {
  currentLang = currentLang === 'en' ? 'ur' : 'en';
  const body = document.body;
  const langBtn = document.getElementById('langToggleBtn');

  if (currentLang === 'ur') {
    body.classList.add('lang-ur');
    body.classList.remove('lang-en');
    if (langBtn) langBtn.innerText = '🌐 اردو';
  } else {
    body.classList.add('lang-en');
    body.classList.remove('lang-ur');
    if (langBtn) langBtn.innerText = '🌐 English';
  }
  renderMultiItemSelector();
  renderRateList();
}

function changeAppTheme(themeName) {
  document.body.className = document.body.className.replace(/theme-\w+/g, '') + ' theme-' + themeName;
}

function exportDataBackup() {
  const data = { ratelist: rateList, bills: billsHistory };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = 'rehma-traders-backup.json';
  link.click();
}

function importDataBackup(event) {
  const file = event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = function(e) {
    try {
      const data = JSON.parse(e.target.result);
      if (data.ratelist) {
        rateList = data.ratelist;
        localStorage.setItem('rehma_ratelist', JSON.stringify(rateList));
      }
      if (data.bills) {
        billsHistory = data.bills;
        localStorage.setItem('rehma_bills', JSON.stringify(billsHistory));
      }
      initApp();
      alert('Backup restored successfully!');
    } catch (err) {
      alert('Invalid backup file!');
    }
  };
  reader.readAsText(file);
}

function pickContact() {
  if ('contacts' in navigator && 'select' in navigator.contacts) {
    navigator.contacts.select(['name', 'tel'], {multiple: false}).then(contacts => {
      if (contacts && contacts.length > 0) {
        const contact = contacts[0];
        if (contact.name) document.getElementById('custName').value = contact.name[0];
        if (contact.tel) document.getElementById('custPhone').value = contact.tel[0];
      }
    }).catch(err => alert('Contact selection failed or cancelled.'));
  } else {
    alert('Contact Picker API is not supported on this browser/device.');
  }
}
