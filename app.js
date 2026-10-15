let newWorkerWaiting = null;
let isUnsavedChanges = false;

// Undo / Redo History Stack
let undoStack = [];
let redoStack = [];

let defaultItems = [
  { nameEn: '3 Pcs Chab', nameUr: 'تھری پیس چاپ', code: '2017594941000', rate: 300, stock: 50 },
  { nameEn: 'Single Chab', nameUr: 'سنگل چاپ', code: '2011476521000', rate: 190, stock: 40 },
  { nameEn: 'Naan Chab', nameUr: 'نآن چاپ', code: '2011476521000', rate: 200, stock: 35 },
  { nameEn: 'Small Box Round', nameUr: 'چھوٹا باکس گول', code: '2017598841000', rate: 220, stock: 20 },
  { nameEn: 'Medium Box Round', nameUr: 'میڈیم باکس گول', code: '2019580141000', rate: 280, stock: 15 },
  { nameEn: 'Large Box Round', nameUr: 'بڑا باکس گول', code: '2013147621000', rate: 380, stock: 10 },
  { nameEn: 'Square Small', nameUr: 'چورس چھوٹا', code: '2019580141000', rate: 280, stock: 25 },
  { nameEn: 'Square Large', nameUr: 'چورس بڑا', code: '2013147621000', rate: 380, stock: 12 },
  { nameEn: 'Gloves Pair', nameUr: 'دستانے جوڑی', code: '2011476821000', rate: 155, stock: 60 },
  { nameEn: 'Fridge Handle Cover', nameUr: 'فرج ہینڈل کور', code: '2017447641000', rate: 90, stock: 30 },
  { nameEn: 'Port Holder', nameUr: 'پورٹ ہولڈر', code: '', rate: 70, stock: 100 },
  { nameEn: 'Tea Cozy Small', nameUr: 'ٹی کوزی چھوٹا', code: '', rate: 220, stock: 18 },
  { nameEn: 'Tea Cozy Big', nameUr: 'ٹی کوزی بڑا', code: '', rate: 250, stock: 14 },
  { nameEn: 'Iron Cover Cut', nameUr: 'آئرن کور کٹ', code: '', rate: 430, stock: 22 },
  { nameEn: 'Iron Cover W/ Cut', nameUr: 'آئرن کور ود کٹ', code: '1036001001585', rate: 450, stock: 25 }
];

let itemsList = [];
let dbBills = [];
let currentBillItems = [];
let currentPendingBillObj = null;

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('sw.js').then(reg => {
      reg.addEventListener('updatefound', () => {
        const installingWorker = reg.installing;
        installingWorker.addEventListener('statechange', () => {
          if (installingWorker.state === 'installed' && navigator.serviceWorker.controller) {
            newWorkerWaiting = installingWorker;
            document.getElementById('updateBanner').style.display = 'block';
          }
        });
      });
    }).catch(() => {});
  });
}

function applyAppUpdate() {
  if (newWorkerWaiting) newWorkerWaiting.postMessage({ action: 'skipWaiting' });
  window.location.reload();
}

function pushStateToUndo() {
  undoStack.push(JSON.stringify(itemsList));
  redoStack = []; // Clear redo stack on new action
  if (undoStack.length > 30) undoStack.shift(); // Max 30 undo steps
}

function undoAction() {
  if (undoStack.length === 0) { alert("واپس جانے کے لیے کوئی ہسٹری نہیں ہے۔ (Nothing to Undo)"); return; }
  redoStack.push(JSON.stringify(itemsList));
  itemsList = JSON.parse(undoStack.pop());
  renderMultiItemBox();
  renderRateListTable();
  renderStockReportTable();
  isUnsavedChanges = true;
}

function redoAction() {
  if (redoStack.length === 0) { alert("آگے جانے کے لیے کوئی ڈیٹا نہیں ہے۔ (Nothing to Redo)"); return; }
  undoStack.push(JSON.stringify(itemsList));
  itemsList = JSON.parse(redoStack.pop());
  renderMultiItemBox();
  renderRateListTable();
  renderStockReportTable();
  isUnsavedChanges = true;
}

function switchView(targetId) {
  if (targetId === 'mainDashboardMenu' && isUnsavedChanges) {
    let confirmLeave = confirm("⚠️ آپ نے تبدیلیاں سیو نہیں کیں۔ کیا آپ بغیر سیو کیے ڈیش بورڈ پر واپس جانا چاہتے ہیں؟");
    if (!confirmLeave) return;
  }

  if (targetId === 'mainDashboardMenu') {
    isUnsavedChanges = false;
    try {
      itemsList = JSON.parse(localStorage.getItem('rehma_items')) || defaultItems;
      dbBills = JSON.parse(localStorage.getItem('rehma_bills')) || [];
    } catch(e){}
    renderMultiItemBox();
    renderRateListTable();
    renderStockReportTable();
    updateDashboard();
    renderLedger(dbBills);
  }

  const sections = ['mainDashboardMenu', 'sectionBill', 'sectionRateList', 'sectionStock', 'sectionLedger'];
  sections.forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      el.style.display = (id === targetId) ? 'block' : 'none';
    }
  });
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

document.addEventListener('DOMContentLoaded', () => {
  try {
    itemsList = JSON.parse(localStorage.getItem('rehma_items')) || defaultItems;
    dbBills = JSON.parse(localStorage.getItem('rehma_bills')) || [];
  } catch (e) {
    itemsList = defaultItems;
    dbBills = [];
  }

  renderMultiItemBox();
  renderRateListTable();
  renderStockReportTable();
  updateDashboard();
  renderLedger(dbBills);
  updateNextBillNo();
});

async function pickContact() {
  if ('contacts' in navigator && 'ContactsManager' in window) {
    try {
      const contacts = await navigator.contacts.select(['name', 'tel'], { multiple: false });
      if (contacts && contacts.length > 0) {
        if (contacts[0].name) document.getElementById('custName').value = contacts[0].name[0];
        if (contacts[0].tel) document.getElementById('custPhone').value = contacts[0].tel[0];
      }
    } catch (err) {}
  } else {
    alert("موبائل کنٹیکٹ سپورٹ نہیں ہے۔");
  }
}

function updateNextBillNo() {
  const el = document.getElementById('nextBillNo');
  if (el) el.innerText = 'INV-' + (dbBills.length + 1001);
}

function renderMultiItemBox() {
  const box = document.getElementById('multiItemBox');
  if (!box) return;
  box.innerHTML = '';
  itemsList.forEach((item, idx) => {
    let displayName = item.nameUr || item.nameEn;
    let currStock = (item.stock !== undefined) ? item.stock : 0;
    let isOutOfStock = currStock <= 0;
    let stockBadge = isOutOfStock ? `<span style="color:#ef4444; font-weight:bold;">⚠️ (ختم)</span>` : `<span style="color:#34d399;">[${currStock}]</span>`;

    box.innerHTML += `
      <div class="multi-item-row" style="${isOutOfStock ? 'opacity:0.6;' : ''}">
        <label style="font-size:12px; cursor:pointer;">
          <input type="checkbox" class="item-checkbox" value="${idx}" ${isOutOfStock ? 'disabled' : ''} style="width:auto; margin-left:6px;">
          ${displayName} ${stockBadge}
        </label>
        <span style="font-size:12px; color:var(--gold-primary); font-weight:bold;">Rs. ${item.rate}</span>
      </div>
    `;
  });
}

function addSelectedMultipleItems() {
  const checkboxes = document.querySelectorAll('.item-checkbox:checked');
  if (checkboxes.length === 0) { alert("براہ کرم آئٹم چنیں۔"); return; }

  checkboxes.forEach(cb => {
    let idx = cb.value;
    let item = itemsList[idx];
    if (item) {
      currentBillItems.push({
        itemIndex: idx, nameEn: item.nameEn, nameUr: item.nameUr, code: item.code || '---', qty: 1, rate: item.rate, total: item.rate
      });
    }
    cb.checked = false;
  });
  renderCurrentBillTable();
  calculateBillTotals();
}

function renderRateListTable() {
  const tbody = document.querySelector('#rateListTable tbody');
  if (!tbody) return;
  tbody.innerHTML = '';
  itemsList.forEach((item, idx) => {
    let itemName = item.nameUr || item.nameEn;
    tbody.innerHTML += `<tr>
      <td><input type="text" value="${item.code || ''}" oninput="updateItemCode(${idx}, this.value)" style="padding:4px; width:100%;"></td>
      <td><input type="text" value="${itemName}" oninput="updateItemName(${idx}, this.value)" style="padding:4px; width:100%;"></td>
      <td><input type="number" value="${item.rate}" oninput="updateItemRate(${idx}, this.value)" style="padding:4px; width:70px;"></td>
      <td class="no-print-col"><button type="button" onclick="deleteRateListItem(${idx})" style="background:#ef4444; color:#fff; border:none; padding:4px 8px; border-radius:4px;">❌</button></td>
    </tr>`;
  });
}

function renderStockReportTable() {
  const tbody = document.querySelector('#stockReportTable tbody');
  if (!tbody) return;
  tbody.innerHTML = '';
  itemsList.forEach((item, idx) => {
    let itemName = item.nameUr || item.nameEn;
    let currStock = (item.stock !== undefined) ? item.stock : 0;
    tbody.innerHTML += `<tr>
      <td>${item.code || '---'}</td>
      <td>${itemName}</td>
      <td><input type="number" value="${currStock}" oninput="updateItemStock(${idx}, this.value)" style="padding:4px; width:70px; text-align:center;"></td>
    </tr>`;
  });
}

function updateItemCode(idx, val) { pushStateToUndo(); itemsList[idx].code = val.trim(); isUnsavedChanges = true; }
function updateItemName(idx, val) { pushStateToUndo(); itemsList[idx].nameUr = val.trim(); itemsList[idx].nameEn = val.trim(); isUnsavedChanges = true; }
function updateItemRate(idx, val) { pushStateToUndo(); itemsList[idx].rate = parseFloat(val) || 0; isUnsavedChanges = true; }
function updateItemStock(idx, val) { pushStateToUndo(); itemsList[idx].stock = parseInt(val) || 0; isUnsavedChanges = true; }

function savePermanentRatesList() {
  localStorage.setItem('rehma_items', JSON.stringify(itemsList));
  isUnsavedChanges = false;
  renderMultiItemBox();
  renderRateListTable();
  renderStockReportTable();
  alert("کامیابی سے سیو ہو گیا!");
}

function deleteRateListItem(idx) {
  pushStateToUndo();
  itemsList.splice(idx, 1);
  savePermanentRatesList();
}

function addNewItem() {
  const nameUr = document.getElementById('newItemNameUr').value.trim();
  const nameEn = document.getElementById('newItemNameEn').value.trim();
  const code = document.getElementById('newItemCode').value.trim();
  const rate = parseFloat(document.getElementById('newItemRate').value);
  if ((nameUr || nameEn) && !isNaN(rate)) {
    pushStateToUndo();
    itemsList.push({ nameEn: nameEn || nameUr, nameUr: nameUr || nameEn, code, rate, stock: 10 });
    savePermanentRatesList();
    document.getElementById('newItemNameUr').value = '';
    document.getElementById('newItemNameEn').value = '';
    document.getElementById('newItemCode').value = '';
    document.getElementById('newItemRate').value = '';
  }
}

function renderCurrentBillTable() {
  const tbody = document.querySelector('#billItemsTable tbody');
  if (!tbody) return;
  tbody.innerHTML = '';
  currentBillItems.forEach((i, idx) => {
    let nameShow = i.nameUr || i.nameEn;
    tbody.innerHTML += `<tr>
      <td>${idx + 1}</td>
      <td><input type="text" value="${i.code}" oninput="currentBillItems[${idx}].code=this.value" style="width:70px; padding:3px;"></td>
      <td>${nameShow}</td>
      <td><input type="number" value="${i.qty}" min="1" oninput="updateQty(${idx}, this.value)" style="width:50px; padding:3px;"></td>
      <td><input type="number" value="${i.rate}" oninput="updateRate(${idx}, this.value)" style="width:60px; padding:3px;"></td>
      <td>Rs. ${i.total}</td>
      <td><button type="button" onclick="currentBillItems.splice(${idx},1); renderCurrentBillTable(); calculateBillTotals();" style="background:#ef4444; color:#fff; border:none; padding:2px 6px;">❌</button></td>
    </tr>`;
  });
}

function updateQty(idx, val) {
  let q = parseInt(val) || 1;
  currentBillItems[idx].qty = q;
  currentBillItems[idx].total = q * currentBillItems[idx].rate;
  calculateBillTotals();
}
function updateRate(idx, val) {
  let r = parseFloat(val) || 0;
  currentBillItems[idx].rate = r;
  currentBillItems[idx].total = currentBillItems[idx].qty * r;
  calculateBillTotals();
}

function calculateBillTotals() {
  let subtotal = currentBillItems.reduce((sum, i) => sum + i.total, 0);
  let discount = parseFloat(document.getElementById('discountInput').value) || 0;
  let prevBalance = parseFloat(document.getElementById('prevBalanceInput').value) || 0;
  let netTotal = (subtotal - discount) + prevBalance;
  document.getElementById('grandTotalTxt').innerText = 'Rs. ' + netTotal;
}

function openBillPreview() {
  const name = document.getElementById('custName').value.trim();
  const phone = document.getElementById('custPhone').value.trim();
  const discount = parseFloat(document.getElementById('discountInput').value) || 0;
  const manualPrevBalance = parseFloat(document.getElementById('prevBalanceInput').value) || 0;

  if (!name || currentBillItems.length === 0) { alert("نام اور آئٹم درج کریں۔"); return; }
  let subtotal = currentBillItems.reduce((sum, i) => sum + i.total, 0);
  let netBillAmount = (subtotal - discount) + manualPrevBalance;
  const now = new Date();
  const dateStr = now.toLocaleDateString('en-GB') + ' ' + now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  currentPendingBillObj = {
    id: 'INV-' + (dbBills.length + 1001),
    customer: name, phone: phone, date: dateStr, timestamp: now.getTime(),
    items: [...currentBillItems], subtotal: subtotal, discount: discount, netAmount: netBillAmount, prevBalance: manualPrevBalance
  };

  renderBillToPrintArea(currentPendingBillObj);
  document.getElementById('previewModal').style.display = 'block';
}

function closeBillPreview() { document.getElementById('previewModal').style.display = 'none'; }
function changePaperSize(val) { document.getElementById('printableBillContainer').className = val; }

function executeFinalPrint() {
  if (!currentPendingBillObj) return;
  currentPendingBillObj.items.forEach(bItem => {
    if (bItem.itemIndex !== undefined && itemsList[bItem.itemIndex]) {
      let currentStk = itemsList[bItem.itemIndex].stock || 0;
      itemsList[bItem.itemIndex].stock = Math.max(0, currentStk - bItem.qty);
    }
  });
  localStorage.setItem('rehma_items', JSON.stringify(itemsList));
  dbBills.push(currentPendingBillObj);
  localStorage.setItem('rehma_bills', JSON.stringify(dbBills));

  window.print();
  closeBillPreview();
  currentBillItems = [];
  renderCurrentBillTable();
  document.getElementById('custName').value = '';
  document.getElementById('custPhone').value = '';
  document.getElementById('discountInput').value = '';
  document.getElementById('prevBalanceInput').value = '';
  document.getElementById('grandTotalTxt').innerText = 'Rs. 0';
  updateDashboard();
  renderLedger(dbBills);
  renderStockReportTable();
  updateNextBillNo();
  switchView('mainDashboardMenu');
}

function exportRateListJpg() {
  const area = document.getElementById('rateListCaptureArea');
  if (!area) return;
  document.querySelectorAll('.no-print-col').forEach(el => el.style.display = 'none');
  html2canvas(area, { scale: 2, useCORS: true }).then(canvas => {
    document.querySelectorAll('.no-print-col').forEach(el => el.style.display = '');
    canvas.toBlob(blob => {
      const a = document.createElement('a');
      a.href = canvas.toDataURL('image/jpeg');
      a.download = `RehmaTraders_RateList.jpg`;
      a.click();
    });
  });
}

function exportBillJpgAndShare() {
  const container = document.getElementById('printableBillContainer');
  if (!container) return;
  html2canvas(container, { scale: 2, useCORS: true }).then(canvas => {
    canvas.toBlob(blob => {
      const a = document.createElement('a');
      a.href = canvas.toDataURL('image/jpeg');
      a.download = `${currentPendingBillObj.id}.jpg`;
      a.click();
    });
  });
}

function renderBillToPrintArea(b) {
  let itemsRows = b.items.map((it, idx) => `<tr>
    <td style="border:1px solid #000; padding:3px;">${idx + 1}</td>
    <td style="border:1px solid #000; padding:3px;">${it.nameUr || it.nameEn}</td>
    <td style="border:1px solid #000; padding:3px;">${it.code}</td>
    <td style="border:1px solid #000; padding:3px;">${it.qty}</td>
    <td style="border:1px solid #000; padding:3px;">${it.rate}</td>
    <td style="border:1px solid #000; padding:3px;">Rs. ${it.total}</td>
  </tr>`).join('');

  document.getElementById('billPrintContent').innerHTML = `
    <div style="display:flex; justify-content:space-between; font-size:11px; margin-bottom:6px;">
      <div><strong>بل #:</strong> ${b.id}<br><strong>کسٹمر:</strong> ${b.customer}</div>
      <div><strong>تاریخ:</strong> ${b.date}</div>
    </div>
    <table style="width:100%; border-collapse:collapse; text-align:center; font-size:10.5px;">
      <thead><tr style="background:#eee;"><th>#</th><th>تفصیل</th><th>کوڈ</th><th>تعداد</th><th>ریٹ</th><th>کل قیمت</th></tr></thead>
      <tbody>${itemsRows}</tbody>
    </table>
    <div style="text-align:right; font-size:11px; margin-top:6px;">
      <p style="margin:2px 0;">ٹوٹل رقم: Rs. ${b.subtotal}</p>
      <p style="margin:2px 0; font-weight:bold; color:#d4af37;">صافی رقم: Rs. ${b.netAmount}</p>
    </div>
  `;
}

function updateDashboard() {
  let totalSales = dbBills.reduce((s, b) => s + (b.netAmount || 0), 0);
  const todayStr = new Date().toLocaleDateString('en-GB');
  let todaySales = dbBills.filter(b => b.date && b.date.startsWith(todayStr)).reduce((s, b) => s + (b.netAmount || 0), 0);
  
  if (document.getElementById('dashSales')) document.getElementById('dashSales').innerText = 'Rs. ' + totalSales;
  if (document.getElementById('dashTodaySales')) document.getElementById('dashTodaySales').innerText = 'Rs. ' + todaySales;
}

function renderLedger(data) {
  const tbody = document.querySelector('#ledgerTable tbody');
  if (!tbody) return;
  tbody.innerHTML = '';
  data.forEach((b, idx) => {
    tbody.innerHTML += `<tr>
      <td>${b.id}</td><td>${b.customer}</td><td>${b.date}</td><td>Rs. ${b.netAmount}</td>
      <td><button onclick="previewHistoryBill(${idx})" style="padding:3px 6px; font-size:11px;">👁️ بل دیکھیں</button></td>
    </tr>`;
  });
}

function previewHistoryBill(index) {
  const bill = dbBills[index];
  if (!bill) return;
  currentPendingBillObj = bill;
  renderBillToPrintArea(bill);
  document.getElementById('previewModal').style.display = 'block';
}

function filterLedger() {
  const query = document.getElementById('searchCust').value.toLowerCase();
  renderLedger(dbBills.filter(b => b.customer.toLowerCase().includes(query)));
}

function exportDataBackup() {
  const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify({ bills: dbBills, items: itemsList }));
  const a = document.createElement('a');
  a.setAttribute("href", dataStr);
  a.setAttribute("download", `RehmaTraders_Backup.json`);
  document.body.appendChild(a); a.click(); a.remove();
}

function importDataBackup(event) {
  const file = event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = function(e) {
    try {
      const d = JSON.parse(e.target.result);
      if (d.bills) dbBills = d.bills;
      if (d.items) itemsList = d.items;
      localStorage.setItem('rehma_bills', JSON.stringify(dbBills));
      localStorage.setItem('rehma_items', JSON.stringify(itemsList));
      window.location.reload();
    } catch (err) { alert("فائل درست نہیں ہے۔"); }
  };
  reader.readAsText(file);
}
