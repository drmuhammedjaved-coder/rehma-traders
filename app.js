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
  { nameEn: 'Iron Cover W/ Cut', nameUr: 'آئرن کور ود کٹ', code: '1036001001585', rate: 450, stock: 25 }
];

let itemsList = [];
let dbBills = [];
let currentBillItems = [];
let currentPendingBillObj = null;

let globalUndoStack = [];
let globalRedoStack = [];

// --- PWA Service Worker & In-App Update Handling ---
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

// --- Safe Restore Code Functionality ---
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

  renderMultiItemBox();
  renderRateListTable();
  updateDashboard();
  renderLedger(dbBills);
  updateNextBillNo();
});

function toggleLanguage() {
  registerGlobalChange();
  currentLang = currentLang === 'en' ? 'ur' : 'en';
  document.body.className = currentLang === 'en' ? 'lang-en' : 'lang-ur';
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
          ${displayName}${codeStr}${stockBadge}
        </label>
        <span style="font-size:12px; color:var(--gold-primary); font-weight:bold;">Rs. ${item.rate}</span>
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

// --- ریٹ لسٹ ٹیبل اور پرماننٹ سیو بٹن ---
function renderRateListTable() {
  const tbody = document.querySelector('#rateListTable tbody');
  if (!tbody) return;
  tbody.innerHTML = '';

  let isUr = currentLang === 'ur';
  document.getElementById('rlTitle').innerText = isUr ? 'رحمہ ٹریڈرز - سرکاری ریٹ لسٹ' : 'REHMA TRADERS - OFFICIAL RATE LIST';
  document.getElementById('rlSub').innerText = isUr ? 'پروپرائٹر: محمد جاوید | 📱 0307-4015100' : 'Proprietor: Muhammad Javed | 📱 0307-4015100';

  itemsList.forEach((item, idx) => {
    let itemName = isUr ? item.nameUr : item.nameEn;
    let currStock = (item.stock !== undefined) ? item.stock : 0;
    let stockWarningStyle = currStock <= 0 ? 'background:#fca5a5; color:#7f1d1d; font-weight:bold;' : '';

    tbody.innerHTML += `<tr>
      <td style="border:1px solid #000; padding:4px;"><input type="text" value="${item.code \vert{}\vert{} ''}" oninput="updateItemCode(${idx}, this.value)" style="padding:4px; margin:0; width:100%; border:1px solid #ccc; background:#fff; color:#000;"></td>
      <td style="border:1px solid #000; padding:4px;"><input type="text" value="${itemName}" oninput="updateItemName(${idx}, this.value)" style="padding:4px; margin:0; width:100%; border:1px solid #ccc; background:#fff; color:#000;"></td>
      <td style="border:1px solid #000; padding:4px;"><input type="number" value="${item.rate}" oninput="updateItemRate(${idx}, this.value)" style="padding:4px; margin:0; width:70px; border:1px solid #ccc; background:#fff; color:#000;"></td>
      <td style="border:1px solid #000; padding:4px;"><input type="number" value="${currStock}" oninput="updateItemStock(${idx}, this.value)" style="padding:4px; margin:0; width:60px; border:1px solid #ccc; background:#fff; color:#000; ${stockWarningStyle}"></td>
      <td class="no-print-col" style="border:1px solid #000; padding:4px; white-space:nowrap;">
        <button onclick="saveSingleItemRateDirectly(${idx})" style="background:#d4af37; color:#000; border:none; padding:4px 8px; border-radius:4px; cursor:pointer; font-weight:bold; margin-right:4px;">💾 Save</button>
        <button onclick="deleteRateListItem(${idx})" style="background:#ef4444; color:#fff; border:none; padding:4px 8px; border-radius:4px; cursor:pointer;">❌</button>
      </td>
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

function saveSingleItemRateDirectly(idx) {
  savePermanentRatesList();
  alert(currentLang === 'ur' ? "آئٹم کا ریٹ اور معلومات کامیابی سے پرماننٹ سیو ہو گئی ہیں!" : "Item rate and info saved permanently!");
}

function deleteRateListItem(idx) { registerGlobalChange(); itemsList.splice(idx, 1); savePermanentRatesList(); renderRateListTable(); }

function savePermanentRatesList() {
  localStorage.setItem('rehma_items', JSON.stringify(itemsList));
  renderMultiItemBox();
  renderRateListTable();
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
  const stock = parseInt(document.getElementById('newItemStock').value) || 0;

  if ((nameEn || nameUr) && !isNaN(rate)) {
    registerGlobalChange();
    itemsList.push({ nameEn: nameEn || nameUr, nameUr: nameUr || nameEn, code, rate, stock });
    savePermanentRatesList();
    document.getElementById('newItemNameEn').value = '';
    document.getElementById('newItemNameUr').value = '';
    document.getElementById('newItemCode').value = '';
    document.getElementById('newItemRate').value = '';
    document.getElementById('newItemStock').value = '';
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
      <td><input type="text" value="${i.code}" oninput="updateBillItemCode(${idx}, this.value)" style="padding:4px; width:80px; text-align:center; border:1px solid var(--border-dark); background:#0b0f19; color:var(--text-bright); border-radius:4px;"></td>
      <td>${nameShow}</td>
      <td><input type="number" value="${i.qty}" min="1" oninput="updateBillItemQty(${idx}, this.value)" style="padding:4px; width:60px; text-align:center; border:1px solid var(--border
