let currentLang = 'en';
let newWorkerWaiting = null;

const dict = {
  en: {
    proprietor: "Proprietor:",
    totalSales: "Total Sales",
    todaySales: "Daily Sales",
    weeklySales: "Weekly Sales",
    monthlySales: "Monthly Sales",
    balance: "Total Balance",
    createNewBill: "Create New Bill",
    pickContact: "📱 Contacts",
    add: "Add Item",
    srNo: "Sr #",
    code: "Code",
    item: "Item Description",
    qty: "Qty",
    rate: "Rate",
    total: "Total",
    action: "Action",
    netTotal: "Net Total:",
    previewBtn: "Print Preview & Confirm",
    rateListHeader: "Rate List & Items Management",
    shareRateList: "Share Rate List as HD Image (JPG)",
    addItem: "Add Item",
    ledgerHeader: "Customer Ledger & History",
    billNoHeader: "Bill #",
    custHeader: "Customer",
    dateHeader: "Date & Time",
    amountHeader: "Total Amount",
    backup: "Download Ledger Backup"
  },
  ur: {
    proprietor: "پروپرائٹر:",
    totalSales: "کل سیل",
    todaySales: "آج کی سیل",
    weeklySales: "ہفتہ وار سیل",
    monthlySales: "ماہانہ سیل",
    balance: "کل ادھار",
    createNewBill: "نیا بل بنائیں",
    pickContact: "📱 فون بک",
    add: "آئٹم شامل کریں",
    srNo: "نمبر شمار",
    code: "کوڈ",
    item: "تفصیل سامان",
    qty: "تعداد",
    rate: "ریٹ",
    total: "کل رقم",
    action: "ایکشن",
    netTotal: "صافی رقم / کل بل:",
    previewBtn: "بل پریویو اور پرنٹ کریں",
    rateListHeader: "ریٹ لسٹ و آئٹم مینجمنٹ",
    shareRateList: "ریٹ لسٹ تصویری شکل (JPG) میں شیئر کریں",
    addItem: "آئٹم شامل کریں",
    ledgerHeader: "کسٹمر لیجر و بل ہسٹری",
    billNoHeader: "بل نمبر",
    custHeader: "کسٹمر",
    dateHeader: "تاریخ و وقت",
    amountHeader: "کل رقم",
    backup: "بیک اپ ڈاؤن لوڈ کریں"
  }
};

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
  { nameEn: 'Iron Cover W/ Cut', nameUr: '1036001001585', rate: 450, stock: 25 }
];

let itemsList = [];
let dbBills = [];
let currentBillItems = [];
let currentPendingBillObj = null;

let globalUndoStack = [];
let globalRedoStack = [];

function changeAppTheme(themeName) {
  document.body.className = document.body.className.replace(/theme-\w+/g, '').trim();
  if (themeName !== 'blue') {
    document.body.classList.add(`theme-${themeName}`);
  }
  localStorage.setItem('rehma_theme', themeName);
}

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('sw.js').then(reg => {
      reg.addEventListener('updatefound', () => {
        const installingWorker = reg.installing;
        installingWorker.addEventListener('statechange', () => {
          if (installingWorker.state === 'installed' && navigator.serviceWorker.controller) {
            newWorkerWaiting = installingWorker;
            showUpdateBanner();
          }
        });
      });
    }).catch(() => {});
  });
}

function showUpdateBanner() {
  const banner = document.getElementById('updateBanner');
  if (banner) banner.style.display = 'block';
}

function applyAppUpdate() {
  if (newWorkerWaiting) {
    newWorkerWaiting.postMessage({ action: 'skipWaiting' });
  }
  window.location.reload();
}

function safeRestoreAppCode() {
  if (confirm("کیا آپ ایپ کا کوڈ ڈیفالٹ حالت پر بحال کرنا چاہتے ہیں؟\n\nواضح رہے کہ آپ کے کسٹمرز کا ڈیٹا اور بل ہسٹری محفوظ رہے گی اور ڈیلیٹ نہیں ہوگی۔")) {
    if ('caches' in window) {
      caches.keys().then(names => {
        names.forEach(name => caches.delete(name));
      });
    }
    navigator.serviceWorker?.getRegistrations().then(regs => {
      regs.forEach(r => r.unregister());
    });
    alert("ایپ کا کوڈ ری سیٹ ہو گیا ہے۔ صفحہ دوبارہ لوڈ ہو رہا ہے۔");
    window.location.reload(true);
  }
}

function switchView(targetId) {
  const sections = ['mainDashboardMenu', 'sectionBill', 'sectionRateList', 'sectionStock', 'sectionLedger'];
  sections.forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      if (id === targetId) {
        el.classList.remove('hidden-section');
      } else {
        el.classList.add('hidden-section');
      }
    }
  });

  if (targetId === 'mainDashboardMenu') {
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
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function captureGlobalState() {
  return JSON.stringify({
    itemsList: itemsList,
    dbBills: dbBills,
    currentBillItems: currentBillItems,
    custName: document.getElementById('custName')?.value || '',
    custPhone: document.getElementById('custPhone')?.value || '',
    prevBalance: document.getElementById('prevBalanceInput')?.value || '',
    discount: document.getElementById('discountInput')?.value || ''
  });
}

function registerGlobalChange() {
  globalUndoStack.push(captureGlobalState());
  if (globalUndoStack.length > 30) globalUndoStack.shift();
  globalRedoStack = [];
}

function applyGlobalState(stateStr) {
  if (!stateStr) return;
  const state = JSON.parse(stateStr);
  itemsList = state.itemsList || [];
  dbBills = state.dbBills || [];
  currentBillItems = state.currentBillItems || [];

  if (document.getElementById('custName')) document.getElementById('custName').value = state.custName;
  if (document.getElementById('custPhone')) document.getElementById('custPhone').value = state.custPhone;
  if (document.getElementById('prevBalanceInput')) document.getElementById('prevBalanceInput').value = state.prevBalance;
  if (document.getElementById('discountInput')) document.getElementById('discountInput').value = state.discount;

  localStorage.setItem('rehma_items', JSON.stringify(itemsList));
  localStorage.setItem('rehma_bills', JSON.stringify(dbBills));

  renderMultiItemBox();
  renderRateListTable();
  renderStockReportTable();
  renderCurrentBillTable();
  calculateBillTotals();
  updateDashboard();
  renderLedger(dbBills);
}

function triggerGlobalUndo() {
  if (globalUndoStack.length === 0) {
    alert("مزید پیچھے (Undo) نہیں جایا جا سکتا۔");
    return;
  }
  globalRedoStack.push(captureGlobalState());
  const prevState = globalUndoStack.pop();
  applyGlobalState(prevState);
}

function triggerGlobalRedo() {
  if (globalRedoStack.length === 0) {
    alert("مزید آگے (Redo) نہیں جایا جا سکتا۔");
    return;
  }
  globalUndoStack.push(captureGlobalState());
  const nextState = globalRedoStack.pop();
  applyGlobalState(nextState);
}

document.addEventListener('DOMContentLoaded', () => {
  try {
    itemsList = JSON.parse(localStorage.getItem('rehma_items')) || defaultItems;
    dbBills = JSON.parse(localStorage.getItem('rehma_bills')) || [];
  } catch (e) {
    itemsList = defaultItems;
    dbBills = [];
  }

  const savedTheme = localStorage.getItem('rehma_theme') || 'blue';
  const themeSelect = document.getElementById('themeSelector');
  if (themeSelect) themeSelect.value = savedTheme;
  changeAppTheme(savedTheme);

  switchView('mainDashboardMenu');
  renderMultiItemBox();
  renderRateListTable();
  renderStockReportTable();
  updateDashboard();
  renderLedger(dbBills);
  updateNextBillNo();
});

function toggleLanguage() {
  registerGlobalChange();
  currentLang = currentLang === 'en' ? 'ur' : 'en';
  document.body.className = document.body.className.replace(/lang-\w+/g, '').trim();
  document.body.classList.add(currentLang === 'en' ? 'lang-en' : 'lang-ur');
  
  const btn = document.getElementById('langToggleBtn');
  if (btn) btn.innerText = currentLang === 'en' ? '🌐 Switch to اردو' : '🌐 Switch to English';

  document.querySelectorAll('[data-key]').forEach(el => {
    const key = el.getAttribute('data-key');
    if (dict[currentLang] && dict[currentLang][key]) {
      el.innerText = dict[currentLang][key];
    }
  });

  renderMultiItemBox();
  renderRateListTable();
  renderStockReportTable();
  renderCurrentBillTable();
}

async function pickContact() {
  if ('contacts' in navigator && 'ContactsManager' in window) {
    try {
      const contacts = await navigator.contacts.select(['name', 'tel'], { multiple: false });
      if (contacts && contacts.length > 0) {
        registerGlobalChange();
        if (contacts[0].name && contacts[0].name[0]) document.getElementById('custName').value = contacts[0].name[0];
        if (contacts[0].tel && contacts[0].tel[0]) document.getElementById('custPhone').value = contacts[0].tel[0];
      }
    } catch (err) {}
  } else {
    alert("موبائل کنٹیکٹ پکر سپورٹ نہیں ہے، نام خود ٹائپ کریں۔");
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
    let displayName = currentLang === 'ur' ? item.nameUr : item.nameEn;
    let codeStr = item.code ? ` (${item.code})` : '';
    let currStock = (item.stock !== undefined) ? item.stock : 0;
    
    let isOutOfStock = currStock <= 0;
    let stockBadge = isOutOfStock 
      ? `<span style="color:#ef4444; font-weight:bold; margin-left:8px;">⚠️ (مال ختم ہے)</span>` 
      : `<span style="color:#34d399; margin-left:8px;">[Stock: ${currStock}]</span>`;

    box.innerHTML += `
      <div class="multi-item-row" style="${isOutOfStock ? 'opacity:0.6;' : ''}">
        <label style="font-size:12px; cursor:pointer;">
          <input type="checkbox" class="item-checkbox" value="${idx}" ${isOutOfStock ? 'disabled' : ''} style="width:auto; margin-right:6px;">
          ${displayName}${codeStr} ${stockBadge}
        </label>
        <span style="font-size:12px; color:var(--accent-main); font-weight:bold;">Rs. ${item.rate}</span>
      </div>
    `;
  });
}

function addSelectedMultipleItems() {
  const checkboxes = document.querySelectorAll('.item-checkbox:checked');
  if (checkboxes.length === 0) {
    alert("براہ کرم کم از کم ایک آئٹم چنیں۔");
    return;
  }

  registerGlobalChange();

  checkboxes.forEach(cb => {
    let idx = cb.value;
    let item = itemsList[idx];
    if (item) {
      currentBillItems.push({
        itemIndex: idx,
        nameEn: item.nameEn,
        nameUr: item.nameUr,
        code: item.code || '---',
        qty: 1,
        rate: item.rate,
        total: item.rate * 1
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

  let isUr = currentLang === 'ur';
  const titleEl = document.getElementById('rlTitle');
  const subEl = document.getElementById('rlSub');
  if (titleEl) titleEl.innerText = isUr ? 'رحمہ ٹریڈرز - سرکاری ریٹ لسٹ' : 'REHMA TRADERS - OFFICIAL RATE LIST';
  if (subEl) subEl.innerText = isUr ? 'پروپرائٹر: محمد جاوید | 📱 0307-4015100' : 'Proprietor: Muhammad Javed | 📱 0307-4015100';

  itemsList.forEach((item, idx) => {
    let itemName = isUr ? item.nameUr : item.nameEn;

    tbody.innerHTML += `<tr>
      <td style="border:1px solid #000; padding:4px;"><input type="text" value="${item.code || ''}" oninput="updateItemCode(${idx}, this.value)" style="padding:4px; margin:0; width:100%; border:1px solid #ccc; background:#fff; color:#000;"></td>
      <td style="border:1px solid #000; padding:4px;"><input type="text" value="${itemName}" oninput="updateItemName(${idx}, this.value)" style="padding:4px; margin:0; width:100%; border:1px solid #ccc; background:#fff; color:#000;"></td>
      <td style="border:1px solid #000; padding:4px;"><input type="number" value="${item.rate}" oninput="updateItemRate(${idx}, this.value)" style="padding:4px; margin:0; width:70px; border:1px solid #ccc; background:#fff; color:#000;"></td>
      <td class="no-print-col" style="border:1px solid #000; padding:4px; white-space:nowrap;">
        <button type="button" onclick="deleteRateListItem(${idx})" style="background:#ef4444; color:#fff; border:none; padding:6px 10px; border-radius:4px; cursor:pointer; font-size:12px;">❌</button>
      </td>
    </tr>`;
  });
}

function renderStockReportTable() {
  const tbody = document.querySelector('#stockReportTable tbody');
  if (!tbody) return;
  tbody.innerHTML = '';

  itemsList.forEach((item, idx) => {
    let itemName = currentLang === 'ur' ? item.nameUr : item.nameEn;
    let currStock = (item.stock !== undefined) ? item.stock : 0;
    let stockWarningStyle = currStock <= 0 ? 'color:#ef4444; font-weight:bold;' : 'color:#34d399; font-weight:bold;';

    tbody.innerHTML += `<tr>
      <td>${item.code || '---'}</td>
      <td>${itemName}</td>
      <td><input type="number" value="${currStock}" oninput="updateItemStock(${idx}, this.value)" style="padding:6px; width:80px; text-align:center; background:var(--bg-dark); color:var(--text-bright); border:1px solid var(--border-dark); border-radius:4px; ${stockWarningStyle}"></td>
    </tr>`;
  });
}

function updateItemCode(idx, val) { registerGlobalChange(); itemsList[idx].code = val.trim(); }
function updateItemName(idx, val) { 
  registerGlobalChange();
  if (currentLang === 'ur') itemsList[idx].nameUr = val.trim(); 
  else itemsList[idx].nameEn = val.trim(); 
}
function updateItemRate(idx, val) { registerGlobalChange(); itemsList[idx].rate = parseFloat(val) || 0; }
function updateItemStock(idx, val) { registerGlobalChange(); itemsList[idx].stock = parseInt(val) || 0; }

function deleteRateListItem(idx) { 
  registerGlobalChange(); 
  itemsList.splice(idx, 1); 
  localStorage.setItem('rehma_items', JSON.stringify(itemsList));
  renderMultiItemBox();
  renderRateListTable();
  renderStockReportTable(); 
}

function savePermanentRatesList() {
  localStorage.setItem('rehma_items', JSON.stringify(itemsList));
  renderMultiItemBox();
  renderRateListTable();
  renderStockReportTable();
  alert(currentLang === 'ur' ? "تمام ریٹس اور اسٹاک مستقل محفوظ ہو گئے ہیں!" : "All rates and stock saved permanently!");
}

function exportRateListJpg() {
  const area = document.getElementById('rateListCaptureArea');
  if (!area) return;

  document.querySelectorAll('.no-print-col').forEach(el => el.style.display = 'none');

  html2canvas(area, { scale: 2, useCORS: true, allowTaint: true }).then(canvas => {
    document.querySelectorAll('.no-print-col').forEach(el => el.style.display = '');

    canvas.toBlob(blob => {
      const file = new File([blob], `RehmaTraders_RateList_${currentLang}.jpg`, { type: 'image/jpeg' });
      if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
        navigator.share({
          files: [file],
          title: 'REHMA TRADERS Rate List',
          text: 'Official Rate List'
        });
      } else {
        const a = document.createElement('a');
        a.href = canvas.toDataURL('image/jpeg');
        a.download = `RehmaTraders_RateList_${currentLang}.jpg`;
        a.click();
      }
    });
  });
}

function addNewItem() {
  const nameEn = document.getElementById('newItemNameEn').value.trim();
  const nameUr = document.getElementById('newItemNameUr').value.trim();
  const code = document.getElementById('newItemCode').value.trim();
  const rate = parseFloat(document.getElementById('newItemRate').value);

  if ((nameEn || nameUr) && !isNaN(rate)) {
    registerGlobalChange();
    itemsList.push({ nameEn: nameEn || nameUr, nameUr: nameUr || nameEn, code, rate, stock: 10 });
    savePermanentRatesList();
    document.getElementById('newItemNameEn').value = '';
    document.getElementById('newItemNameUr').value = '';
    document.getElementById('newItemCode').value = '';
    document.getElementById('newItemRate').value = '';
  }
}

function removeBillItem(index) {
  registerGlobalChange();
  currentBillItems.splice(index, 1);
  renderCurrentBillTable();
  calculateBillTotals();
}

function renderCurrentBillTable() {
  const tbody = document.querySelector('#billItemsTable tbody');
  if (!tbody) return;
  tbody.innerHTML = '';
  currentBillItems.forEach((i, idx) => {
    let nameShow = currentLang === 'ur' ? i.nameUr : i.nameEn;
    tbody.innerHTML += `<tr>
      <td>${idx + 1}</td>
      <td><input type="text" value="${i.code}" oninput="updateBillItemCode(${idx}, this.value)" style="padding:4px; width:80px; text-align:center; border:1px solid var(--border-dark); background:var(--bg-dark); color:var(--text-bright); border-radius:4px;"></td>
      <td>${nameShow}</td>
      <td><input type="number" value="${i.qty}" min="1" oninput="updateBillItemQty(${idx}, this.value)" style="padding:4px; width:60px; text-align:center; border:1px solid var(--border-dark); background:var(--bg-dark); color:var(--text-bright); border-radius:4px;"></td>
      <td><input type="number" value="${i.rate}" oninput="updateBillItemRate(${idx}, this.value)" style="padding:4px; width:70px; text-align:center; border:1px solid var(--border-dark); background:var(--bg-dark); color:var(--text-bright); border-radius:4px;"></td>
      <td>Rs. ${i.total}</td>
      <td><button type="button" onclick="removeBillItem(${idx})" style="background:#ef4444; color:#fff; border:none; padding:4px 8px; border-radius:4px; cursor:pointer; font-weight:bold;">❌</button></td>
    </tr>`;
  });
}

function updateBillItemCode(idx, val) { registerGlobalChange(); currentBillItems[idx].code = val.trim(); }
function updateBillItemQty(idx, val) {
  registerGlobalChange();
  let newQty = parseInt(val) || 1;
  currentBillItems[idx].qty = newQty;
  currentBillItems[idx].total = newQty * currentBillItems[idx].rate;
  calculateBillTotals();
}

function updateBillItemRate(idx, val) {
  registerGlobalChange();
  let newRate = parseFloat(val) || 0;
  currentBillItems[idx].rate = newRate;
  currentBillItems[idx].total = currentBillItems[idx].qty * newRate;
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

  if (!name || currentBillItems.length === 0) {
    alert("براہ کرم کسٹمر کا نام اور کم از کم ایک آئٹم شامل کریں۔");
    return;
  }

  let subtotal = currentBillItems.reduce((sum, i) => sum + i.total, 0);
  let netBillAmount = (subtotal - discount) + manualPrevBalance;

  const now = new Date();
  const dateStr = now.toLocaleDateString('en-GB') + ' ' + now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  currentPendingBillObj = {
    id: 'INV-' + (dbBills.length + 1001),
    customer: name,
    phone: phone,
    date: dateStr,
    timestamp: now.getTime(),
    items: [...currentBillItems],
    subtotal: subtotal,
    discount: discount,
    netAmount: netBillAmount,
    prevBalance: manualPrevBalance
  };

  renderBillToPrintArea(currentPendingBillObj);
  document.getElementById('previewModal').style.display = 'block';
}

function closeBillPreview() {
  document.getElementById('previewModal').style.display = 'none';
}

function changePaperSize(val) {
  const container = document.getElementById('printableBillContainer');
  if (container) container.className = val;
}

function executeFinalPrint() {
  if (!currentPendingBillObj) return;

  registerGlobalChange();

  currentPendingBillObj.items.forEach(bItem => {
    if (bItem.itemIndex !== undefined && itemsList[bItem.itemIndex]) {
      let currentStk = itemsList[bItem.itemIndex].stock || 0;
      let newStk = currentStk - bItem.qty;
      itemsList[bItem.itemIndex].stock = newStk < 0 ? 0 : newStk;
    }
  });

  localStorage.setItem('rehma_items', JSON.stringify(itemsList));

  dbBills.push(currentPendingBillObj);
  localStorage.setItem('rehma_bills', JSON.stringify(dbBills));

  window.print();

  document.getElementById('previewModal').style.display = 'none';

  currentBillItems = [];
  renderCurrentBillTable();
  document.getElementById('custName').value = '';
  document.getElementById('custPhone').value = '';
  document.getElementById('discountInput').value = '';
  document.getElementById('prevBalanceInput').value = '';
  document.getElementById('grandTotalTxt').innerText = 'Rs. 0';

  updateDashboard();
  renderLedger(dbBills);
  renderRateListTable();
  renderStockReportTable();
  updateNextBillNo();
  currentPendingBillObj = null;
  switchView('mainDashboardMenu');
}

function exportBillJpgAndShare() {
  const container = document.getElementById('printableBillContainer');
  if (!container) return;

  html2canvas(container, { 
    scale: 2, 
    useCORS: true, 
    allowTaint: true,
    logging: false
  }).then(canvas => {
    canvas.toBlob(blob => {
      const file = new File([blob], `${currentPendingBillObj ? currentPendingBillObj.id : 'Bill'}.jpg`, { type: 'image/jpeg' });
      if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
        navigator.share({
          files: [file],
          title: 'REHMA TRADERS Invoice',
          text: `Bill for ${currentPendingBillObj ? currentPendingBillObj.customer : ''}`
        });
      } else {
        const a = document.createElement('a');
        a.href = canvas.toDataURL('image/jpeg');
        a.download = `${currentPendingBillObj ? currentPendingBillObj.id : 'Bill'}.jpg`;
        a.click();
      }
    });
  });
}

function previewHistoryBill(index) {
  const bill = dbBills[index];
  if (!bill) return;
  currentPendingBillObj = bill;
  renderBillToPrintArea(bill);
  document.getElementById('previewModal').style.display = 'block';
}

function cloneAndRepeatBill(index) {
  const bill = dbBills[index];
  if (!bill) return;

  registerGlobalChange();

  document.getElementById('custName').value = bill.customer || '';
  document.getElementById('custPhone').value = bill.phone || '';
  document.getElementById('prevBalanceInput').value = '';
  currentBillItems = bill.items.map(i => ({ ...i }));

  renderCurrentBillTable();
  calculateBillTotals();
  switchView('sectionBill');
}

function renderBillToPrintArea(b) {
  let isUr = currentLang === 'ur';

  document.getElementById('billHeaderTitle').innerText = isUr ? 'رحمہ ٹریڈرز' : 'REHMA TRADERS';
  document.getElementById('billPropLabel').innerText = isUr ? 'پروپرائٹر:' : 'Proprietor:';

  let headersHtml = isUr ? `
    <th style="border:1px solid #000; padding:4px;">نمبر شمار</th>
    <th style="border:1px solid #000; padding:4px;">تفصیل سامان</th>
    <th style="border:1px solid #000; padding:4px;">آئٹم کوڈ</th>
    <th style="border:1px solid #000; padding:4px;">تعداد</th>
    <th style="border:1px solid #000; padding:4px;">ریٹ</th>
    <th style="border:1px solid #000; padding:4px;">کل رقم</th>
  ` : `
    <th style="border:1px solid #000; padding:4px;">Sr #</th>
    <th style="border:1px solid #000; padding:4px;">Item Description</th>
    <th style="border:1px solid #000; padding:4px;">Item Code</th>
    <th style="border:1px solid #000; padding:4px;">Qty</th>
    <th style="border:1px solid #000; padding:4px;">Rate</th>
    <th style="border:1px solid #000; padding:4px;">Total</th>
  `;

  let itemsRows = b.items.map((it, idx) => {
    let itemTitle = isUr ? it.nameUr : it.nameEn;
    return `<tr>
      <td style="border:1px solid #000; padding:4px;">${idx + 1}</td>
      <td style="border:1px solid #000; padding:4px;">${itemTitle}</td>
      <td style="border:1px solid #000; padding:4px;">${it.code}</td>
      <td style="border:1px solid #000; padding:4px;">${it.qty}</td>
      <td style="border:1px solid #000; padding:4px;">${it.rate}</td>
      <td style="border:1px solid #000; padding:4px;">Rs. ${it.total}</td>
    </tr>`;
  }).join('');

  let labels = isUr ? {
    billNo: 'بل نمبر:',
    cust: 'مشتری/کسٹمر:',
    date: 'تاریخ و وقت:',
    subtotal: 'موجودہ بل کل رقم:',
    disc: 'ڈسکاؤنٹ:',
    net: 'صافی رقم / کل بل:',
    prev: 'سابقہ ادھار:'
  } : {
    billNo: 'Bill #:',
    cust: 'Customer:',
    date: 'Date & Time:',
    subtotal: 'Subtotal:',
    disc: 'Discount:',
    net: 'Net Total:',
    prev: 'Previous Balance:'
  };

  let prevBalHtml = b.prevBalance > 0 ? `<p style="margin:2px 0; color:#555;">${labels.prev} Rs. ${b.prevBalance}</p>` : '';

  document.getElementById('billPrintContent').innerHTML = `
    <div style="display:flex; justify-content:space-between; margin-bottom:8px; font-size:12px;">
      <div><strong>${labels.billNo}</strong> ${b.id}<br><strong>${labels.cust}</strong> ${b.customer} (${b.phone || 'N/A'})</div>
      <div style="text-align:right;"><strong>${labels.date}</strong> ${b.date}</div>
    </div>
    
    <table style="width:100%; border-collapse:collapse; margin:8px 0; text-align:center; font-size:11px;">
      <thead><tr style="background:#f2f2f2;">${headersHtml}</tr></thead>
      <tbody>${itemsRows}</tbody>
    </table>

    <div style="width:230px; margin-left:auto; text-align:right; font-size:11px; margin-top:8px;">
      <p style="margin:2px 0;">${labels.subtotal} Rs. ${b.subtotal}</p>
      <p style="margin:2px 0;">${labels.disc} Rs. ${b.discount}</p>
      ${prevBalHtml}
      <hr style="border:0.5px solid #000; margin:4px 0;">
      <p style="margin:2px 0; font-size:13px; font-weight:bold; color:#d4af37;">${labels.net} Rs. ${b.netAmount}</p>
    </div>
  `;
}

function updateDashboard() {
  let totalSales = dbBills.reduce((s, b) => s + (b.netAmount || 0), 0);

  const now = new Date();
  const todayStr = now.toLocaleDateString('en-GB');

  let todaySales = dbBills.filter(b => b.date && b.date.startsWith(todayStr)).reduce((s, b) => s + (b.netAmount || 0), 0);

  const oneWeekAgo = now.getTime() - (7 * 24 * 60 * 60 * 1000);
  let weeklySales = dbBills.filter(b => b.timestamp && b.timestamp >= oneWeekAgo).reduce((s, b) => s + (b.netAmount || 0), 0);

  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();
  let monthlySales = dbBills.filter(b => {
    if (!b.timestamp) return false;
    let d = new Date(b.timestamp);
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
  }).reduce((s, b) => s + (b.netAmount || 0), 0);

  if (document.getElementById('dashSales')) document.getElementById('dashSales').innerText = 'Rs. ' + totalSales;
  if (document.getElementById('dashTodaySales')) document.getElementById('dashTodaySales').innerText = 'Rs. ' + todaySales;
  if (document.getElementById('dashWeeklySales')) document.getElementById('dashWeeklySales').innerText = 'Rs. ' + weeklySales;
  if (document.getElementById('dashMonthlySales')) document.getElementById('dashMonthlySales').innerText = 'Rs. ' + monthlySales;
}

function renderLedger(data) {
  const tbody = document.querySelector('#ledgerTable tbody');
  if (!tbody) return;
  tbody.innerHTML = '';
  data.forEach((b, idx) => {
    tbody.innerHTML += `<tr>
      <td><input type="checkbox" class="bill-select-checkbox" value="${idx}" style="width:auto;"></td>
      <td>${b.id}</td>
      <td><strong onclick="filterByCustomer('${b.customer}')" style="cursor:pointer; color:var(--accent-main);">${b.customer}</strong></td>
      <td>${b.date}</td>
      <td style="color:var(--accent-main); font-weight:bold;">Rs. ${b.netAmount}</td>
      <td>
        <button type="button" class="btn-silver" onclick="previewHistoryBill(${idx})" style="padding:4px 8px; font-size:11px; margin-right:4px;">👁️ Preview</button>
        <button type="button" class="btn-gold" onclick="cloneAndRepeatBill(${idx})" style="padding:4px 8px; font-size:11px;">🔄 Repeat</button>
      </td>
    </tr>`;
  });
  const selectAllCb = document.getElementById('selectAllBillsCheckbox');
  if (selectAllCb) selectAllCb.checked = false;
}

function toggleSelectAllBills(masterCb) {
  const checkboxes = document.querySelectorAll('.bill-select-checkbox');
  checkboxes.forEach(cb => {
    cb.checked = masterCb.checked;
  });
}

function deleteSelectedMarkedBills() {
  const checkboxes = document.querySelectorAll('.bill-select-checkbox:checked');
  if (checkboxes.length === 0) {
    alert("براہ کرم ڈیلیٹ کرنے کے لیے کم از کم ایک بل مارک (ٹک) کریں۔");
    return;
  }

  if (confirm(`کیا آپ واقعی منتخب کردہ ${checkboxes.length} بل ہسٹری سے حذف کرنا چاہتے ہیں؟`)) {
    registerGlobalChange();

    let indicesToDelete = Array.from(checkboxes).map(cb => parseInt(cb.value));
    
    // بڑی انڈیکس سے چھوٹی انڈیکس کی طرف فلٹر کریں تاکہ ارے انڈیکس خراب نہ ہوں
    indicesToDelete.sort((a, b) => b - a);

    indicesToDelete.forEach(idx => {
      dbBills.splice(idx, 1);
    });

    localStorage.setItem('rehma_bills', JSON.stringify(dbBills));
    updateDashboard();
    renderLedger(dbBills);
    updateNextBillNo();
    alert("منتخب کردہ بل کامیابی سے حذف کر دیے گئے ہیں!");
  }
}

function filterLedger() {
  const query = document.getElementById('searchCust').value.toLowerCase();
  const filtered = dbBills.filter(b => b.customer && b.customer.toLowerCase().includes(query));
  renderLedger(filtered);
}

function filterByCustomer(custName) {
  document.getElementById('searchCust').value = custName;
  filterLedger();
}

function exportDataBackup() {
  const fullBackupData = {
    bills: dbBills,
    items: itemsList,
    exportDate: new Date().toISOString()
  };
  const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(fullBackupData, null, 2));
  const dlAnchorElem = document.createElement('a');
  dlAnchorElem.setAttribute("href", dataStr);
  dlAnchorElem.setAttribute("download", `RehmaTraders_FullBackup_${new Date().toLocaleDateString('en-GB').replace(/\//g, '-')}.json`);
  document.body.appendChild(dlAnchorElem);
  dlAnchorElem.click();
  dlAnchorElem.remove();
}

function importDataBackup(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function(e) {
    try {
      const importedData = JSON.parse(e.target.result);
      if (importedData && (importedData.bills || Array.isArray(importedData))) {
        if (Array.isArray(importedData)) {
          dbBills = importedData;
        } else {
          dbBills = importedData.bills || dbBills;
          if (importedData.items) itemsList = importedData.items;
        }
        localStorage.setItem('rehma_bills', JSON.stringify(dbBills));
        localStorage.setItem('rehma_items', JSON.stringify(itemsList));
        
        renderMultiItemBox();
        renderRateListTable();
        renderStockReportTable();
        updateDashboard();
        renderLedger(dbBills);
        updateNextBillNo();
        alert("آپ کا تمام بیک اپ ڈیٹا (بلز + ریٹس + اسٹاک) کامیابی سے بحال ہو گیا ہے!");
      } else {
        alert("فائل کی فارمیٹ درست نہیں ہے۔");
      }
    } catch (err) {
      alert("بیک اپ فائل پڑھنے میں غلطی ہوئی۔");
    }
  };
  reader.readAsText(file);
}
