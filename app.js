/* ==========================================================================
   REHMA TRADERS - Complete & Final app.js (Original UI + Flexible Print + 15 Items)
   ========================================================================== */

const defaultRateList = [
  { code: '2017594941000', nameEn: '3 Pcs Chab', nameUr: '3 پیس چھاب', rate: 300, stock: 50 },
  { code: '2011476521000', nameEn: 'Single Chab', nameUr: 'سنگل چھاب', rate: 190, stock: 40 },
  { code: '2011476521000', nameEn: 'Naan Chab', nameUr: 'نان چھاب', rate: 200, stock: 35 },
  { code: '2017598841000', nameEn: 'Small Box Round', nameUr: 'سمال باکس راؤنڈ', rate: 220, stock: 25 },
  { code: '2019580141000', nameEn: 'Medium Box Round', nameUr: 'میڈیم باکس راؤنڈ', rate: 280, stock: 30 },
  { code: '2013147621000', nameEn: 'Large Box Round', nameUr: 'لارج باکس راؤنڈ', rate: 380, stock: 20 },
  { code: '2019580141000', nameEn: 'Square Small', nameUr: 'اسکوائر سمال', rate: 280, stock: 25 },
  { code: '2013147621000', nameEn: 'Square Large', nameUr: 'اسکوائر لارج', rate: 380, stock: 15 },
  { code: '2011476821000', nameEn: 'Oven Gloves Pair', nameUr: 'اوون گلوز پیئر', rate: 155, stock: 60 },
  { code: '2017447641000', nameEn: 'Fridge Handle Cover', nameUr: 'فریج ہینڈل کور', rate: 90, stock: 45 },
  { code: '2017447657000', nameEn: 'Iron Board Cover Small', nameUr: 'آئرن بورڈ کور سمال', rate: 250, stock: 30 },
  { code: '2017447658000', nameEn: 'Iron Board Cover Large', nameUr: 'آئرن بورڈ کور لارج', rate: 350, stock: 25 },
  { code: '2017447653000', nameEn: 'Tea Cozy Small', nameUr: 'ٹی کوزی سمال', rate: 150, stock: 40 },
  { code: '2017447659000', nameEn: 'Tea Cozy Large', nameUr: 'ٹی کوزی لارج', rate: 220, stock: 30 },
  { code: '2017447652000', nameEn: 'Pot Holders / Direct', nameUr: 'پاٹ ہولڈر / ڈائریکٹ', rate: 120, stock: 50 }
];

let storedList = JSON.parse(localStorage.getItem('rehma_ratelist'));
if (!storedList || !Array.isArray(storedList) || storedList.length === 0) {
  storedList = JSON.parse(JSON.stringify(defaultRateList));
  localStorage.setItem('rehma_ratelist', JSON.stringify(storedList));
}

let rateList = storedList;
let billsHistory = JSON.parse(localStorage.getItem('rehma_bills')) || [];
let billItems = [];
let currentLang = 'en';
let activeViewingBillIndex = null;

let undoStack = [];
let redoStack = [];

window.addEventListener('DOMContentLoaded', () => {
  initApp();
  const savedTheme = localStorage.getItem('rehma_theme') || 'navy';
  changeAppTheme(savedTheme, false);
  saveStateToHistory();
});

function initApp() {
  renderRateList();
  renderMultiItemSelector();
  renderStockTable();
  renderLedger();
  updateDashboardStats();
  generateNextBillNumber();
}

function confirmResetToDefaultApp() {
  const confirmation = confirm("⚠️ کیا آپ واقعی ریٹ لسٹ اور ایپ کا اسٹرکچر ڈیفالٹ پر ریستور کرنا چاہتے ہیں؟\n\n(نوٹ: آپ کے پرانے کسٹمر بلز اور لیجر کا ڈیٹا 100% محفوظ رہے گا)");
  
  if (confirmation) {
    rateList = JSON.parse(JSON.stringify(defaultRateList));
    localStorage.setItem('rehma_ratelist', JSON.stringify(rateList));
    
    if ('caches' in window) {
      caches.keys().then(names => {
        for (let name of names) caches.delete(name);
      });
    }

    initApp();
    alert('ریٹ لسٹ کامیابی سے ڈیفالٹ (15 اصل آئٹمز) پر ریستور ہو گئی ہے!');
  }
}

function saveStateToHistory() {
  const currentState = {
    custName: document.getElementById('custName') ? document.getElementById('custName').value : '',
    custPhone: document.getElementById('custPhone') ? document.getElementById('custPhone').value : '',
    prevBalance: document.getElementById('prevBalanceInput') ? document.getElementById('prevBalanceInput').value : '',
    discount: document.getElementById('discountInput') ? document.getElementById('discountInput').value : '',
    billItems: JSON.parse(JSON.stringify(billItems)),
    rateList: JSON.parse(JSON.stringify(rateList))
  };

  if (undoStack.length === 0 || JSON.stringify(undoStack[undoStack.length - 1]) !== JSON.stringify(currentState)) {
    undoStack.push(currentState);
    if (undoStack.length > 25) undoStack.shift();
    redoStack = [];
  }
}

function triggerUndo() {
  if (undoStack.length <= 1) {
    alert('Nothing more to undo!');
    return;
  }
  const currentState = undoStack.pop();
  redoStack.push(currentState);
  
  const prevState = undoStack[undoStack.length - 1];
  applyState(prevState);
}

function triggerRedo() {
  if (redoStack.length === 0) {
    alert('Nothing to redo!');
    return;
  }
  const nextState = redoStack.pop();
  undoStack.push(nextState);
  
  applyState(nextState);
}

function applyState(state) {
  if (!state) return;
  if (document.getElementById('custName')) document.getElementById('custName').value = state.custName || '';
  if (document.getElementById('custPhone')) document.getElementById('custPhone').value = state.custPhone || '';
  if (document.getElementById('prevBalanceInput')) document.getElementById('prevBalanceInput').value = state.prevBalance || '';
  if (document.getElementById('discountInput')) document.getElementById('discountInput').value = state.discount || '';
  
  billItems = JSON.parse(JSON.stringify(state.billItems || []));
  rateList = JSON.parse(JSON.stringify(state.rateList || rateList));

  renderBillItemsTable();
  renderRateList();
  renderMultiItemSelector();
  renderStockTable();
}

function getItemName(item) {
  if (!item) return '-';
  if (typeof item === 'string') return item;
  if (currentLang === 'ur') {
    return item.nameUr || item.name || item.itemName || item.nameEn || '-';
  } else {
    return item.nameEn || item.name || item.itemName || item.nameUr || '-';
  }
}

function getItemRate(item) {
  if (!item) return 0;
  return parseFloat(item.rate || item.itemRate || item.price || 0);
}

function getItemQty(item) {
  if (!item) return 0;
  return parseFloat(item.qty || item.quantity || item.itemQty || 0);
}

function getItemCode(item) {
  if (!item) return '-';
  return item.code || item.itemCode || '-';
}

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
    div.style.display = 'flex';
    div.style.alignItems = 'center';
    div.style.justifyContent = 'space-between';
    div.style.background = '#fff';
    div.style.padding = '6px 10px';
    div.style.border = '1px solid #e1e8ed';
    div.style.borderRadius = '4px';

    const stockQty = item.stock !== undefined ? item.stock : 50;
    const name = getItemName(item);
    const rate = getItemRate(item);
    const code = getItemCode(item);

    div.innerHTML = `
      <div style="display:flex; align-items:center; gap:8px; flex:1; overflow:hidden;">
        <input type="checkbox" id="chk_item_${idx}" value="${code}" style="width:16px; height:16px; accent-color:var(--accent-main); cursor:pointer;">
        <label for="chk_item_${idx}" style="font-size:12px; cursor:pointer; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;" title="${name}">
          <strong>${name}</strong> <span style="color:var(--accent-main); font-weight:bold;">(${rate} Rs)</span>
        </label>
      </div>
      <input type="number" id="qty_item_${idx}" value="1" min="1" inputmode="numeric" style="width:45px; padding:2px; text-align:center; font-size:12px;" onkeydown="handleInputKeydown(event)">
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
      const itemName = getItemName(item);
      const rate = getItemRate(item);
      const code = getItemCode(item);
      const existing = billItems.find(i => i.name === itemName);
      if (existing) {
        existing.qty += qty;
      } else {
        billItems.push({
          code: code,
          name: itemName,
          rate: rate,
          qty: qty
        });
      }
      chk.checked = false;
      qtyInput.value = '1';
    }
  });
  renderBillItemsTable();
  saveStateToHistory();
}

function renderBillItemsTable() {
  const tbody = document.querySelector('#billItemsTable tbody');
  if (!tbody) return;
  tbody.innerHTML = '';
  
  billItems.forEach((item, index) => {
    const itemName = getItemName(item);
    const itemRate = getItemRate(item);
    const itemQty = getItemQty(item);
    const itemCode = getItemCode(item);
    const total = itemRate * itemQty;

    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${index + 1}</td>
      <td>${itemName}</td>
      <td>${itemCode}</td>
      <td><input type="number" value="${itemQty}" min="1" inputmode="numeric" oninput="updateBillItemQty(${index}, this.value)" onkeydown="handleInputKeydown(event)" style="width:55px; text-align:center;"></td>
      <td><input type="number" value="${itemRate}" inputmode="numeric" oninput="updateBillItemRate(${index}, this.value)" onkeydown="handleInputKeydown(event)" style="width:70px; text-align:center;"></td>
      <td>Rs. ${total}</td>
      <td><button class="btn-danger" onclick="removeBillItem(${index})" style="padding:3px 8px; font-size:11px;">❌</button></td>
    `;
    tbody.appendChild(tr);
  });
  calculateBillTotals();
}

function handleInputKeydown(event) {
  if (event.key === 'Enter') {
    event.preventDefault();
    event.target.blur();
  }
}

function updateBillItemQty(index, val) {
  billItems[index].qty = parseFloat(val) || 0;
  calculateBillTotals();
  saveStateToHistory();
}

function updateBillItemRate(index, val) {
  billItems[index].rate = parseFloat(val) || 0;
  calculateBillTotals();
  saveStateToHistory();
}

function removeBillItem(index) {
  billItems.splice(index, 1);
  renderBillItemsTable();
  saveStateToHistory();
}

function calculateBillTotals() {
  const subTotal = billItems.reduce((acc, item) => acc + (getItemRate(item) * getItemQty(item)), 0);
  const prevBalanceInput = document.getElementById('prevBalanceInput');
  const discountInput = document.getElementById('discountInput');
  const prevBalance = prevBalanceInput ? (parseFloat(prevBalanceInput.value) || 0) : 0;
  const discount = discountInput ? (parseFloat(discountInput.value) || 0) : 0;
  const netTotal = subTotal + prevBalance - discount;

  const grandTotalTxt = document.getElementById('grandTotalTxt');
  if (grandTotalTxt) grandTotalTxt.innerText = `Rs. ${netTotal}`;
}

function renderRateList() {
  const tbody = document.querySelector('#rateListTable tbody');
  if (!tbody) return;
  tbody.innerHTML = '';

  rateList.forEach((item, index) => {
    const nameEn = item.nameEn || item.name || '';
    const nameUr = item.nameUr || '';
    const rate = getItemRate(item);
    const code = getItemCode(item);
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>
        <div style="display:flex; gap:5px;">
          <input type="text" value="${nameEn}" oninput="updateRateField(${index}, 'nameEn', this.value)" placeholder="English" style="width:50%;">
          <input type="text" value="${nameUr}" oninput="updateRateField(${index}, 'nameUr', this.value)" placeholder="اردو" style="width:50%;">
        </div>
      </td>
      <td><input type="text" value="${code !== '-' ? code : ''}" oninput="updateRateField(${index}, 'code', this.value)" style="width:90%; font-weight:bold;"></td>
      <td><input type="number" inputmode="numeric" value="${rate}" oninput="updateRateField(${index}, 'rate', this.value)" style="width:90%; font-weight:bold;"></td>
      <td class="no-print-col"><button class="btn-danger" onclick="deleteRateItem(${index})" style="padding:4px 8px;">🗑️</button></td>
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
  saveStateToHistory();
}

function addNewItem() {
  const nameEn = document.getElementById('newItemNameEn').value.trim();
  const nameUr = document.getElementById('newItemNameUr').value.trim();
  const code = document.getElementById('newItemCode').value.trim();
  const rate = parseFloat(document.getElementById('newItemRate').value);

  if (!nameEn && !nameUr) {
    alert('Please enter item name (English or Urdu)!');
    return;
  }

  rateList.push({ code, nameEn: nameEn || nameUr, nameUr: nameUr || nameEn, rate: rate || 0, stock: 50 });
  savePermanentRatesList();
  
  document.getElementById('newItemNameEn').value = '';
  document.getElementById('newItemNameUr').value = '';
  document.getElementById('newItemCode').value = '';
  document.getElementById('newItemRate').value = '';
  saveStateToHistory();
}

function deleteRateItem(index) {
  rateList.splice(index, 1);
  savePermanentRatesList();
  saveStateToHistory();
}

function savePermanentRatesList() {
  localStorage.setItem('rehma_ratelist', JSON.stringify(rateList));
  renderRateList();
  renderMultiItemSelector();
  renderStockTable();
  alert('All Rates and Stock successfully saved!');
}

function renderStockTable() {
  const tbody = document.querySelector('#stockReportTable tbody');
  if (!tbody) return;
  tbody.innerHTML = '';
  rateList.forEach((item, index) => {
    const stockQty = item.stock !== undefined ? item.stock : 50;
    const name = getItemName(item);
    const code = getItemCode(item);
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${name}</td>
      <td>${code}</td>
      <td><input type="number" inputmode="numeric" value="${stockQty}" oninput="updateStockQty(${index}, this.value)" style="width:80px; text-align:center;"></td>
    `;
    tbody.appendChild(tr);
  });
}

function updateStockQty(index, val) {
  rateList[index].stock = parseFloat(val) || 0;
  localStorage.setItem('rehma_ratelist', JSON.stringify(rateList));
  saveStateToHistory();
}

function getBillTotal(bill) {
  if (!bill) return 0;
  if (bill.netTotal !== undefined && bill.netTotal !== null && bill.netTotal !== "") return parseFloat(bill.netTotal);
  if (bill.grandTotal !== undefined && bill.grandTotal !== null) return parseFloat(bill.grandTotal);
  if (bill.total !== undefined && bill.total !== null) return parseFloat(bill.total);
  if (bill.subTotal !== undefined && bill.subTotal !== null) return parseFloat(bill.subTotal);

  const items = bill.items || bill.billItems || [];
  if (Array.isArray(items) && items.length > 0) {
    return items.reduce((acc, i) => acc + (getItemRate(i) * getItemQty(i)), 0);
  }
  return 0;
}

function renderLedger() {
  const tbody = document.querySelector('#ledgerTable tbody');
  if (!tbody) return;
  tbody.innerHTML = '';
  
  billsHistory.forEach((bill, idx) => {
    const customer = bill.custName || bill.customerName || bill.customer || 'Cash Customer';
    const totalAmount = getBillTotal(bill);
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><input type="checkbox" class="bill-select-chk" data-index="${idx}"></td>
      <td>${bill.billNo || 'INV-' + (1001 + idx)}</td>
      <td>${customer}</td>
      <td>${bill.date || '-'}</td>
      <td>Rs. ${totalAmount}</td>
      <td><button class="btn-silver" onclick="viewBillDetails(${idx})" style="padding:3px 8px;">👁️ View</button></td>
    `;
    tbody.appendChild(tr);
  });
}

// Bill Box HTML Builder
function buildSingleBillHtml(bill, exactBillNo) {
  const customerName = bill.custName || bill.customerName || bill.customer || 'Cash Customer';
  const phone = bill.custPhone || bill.phone || bill.customerPhone || '';
  const totalAmount = getBillTotal(bill);

  let itemsHtml = `
    <div style="border: 1px solid var(--accent-main); padding: 10px; border-radius: 6px; background: #fff; font-family: Arial, sans-serif; height:100%; box-sizing:border-box;">
      <div style="text-align: center; border-bottom: 2px solid var(--accent-gold); padding-bottom: 4px; margin-bottom: 6px;">
        <h3 style="margin: 0; color: var(--accent-main); font-size: 16px;">REHMA TRADERS</h3>
        <p style="margin: 0; font-size: 9.5px; color: #555;">Proprietor: Muhammad Javed | 📱 0307-4015100</p>
      </div>
      <div style="display: flex; justify-content: space-between; font-size: 10px; margin-bottom: 6px;">
        <span><strong>Customer:</strong> ${customerName} ${phone ? '(' + phone + ')' : ''}</span>
        <span><strong>Bill #:</strong> ${exactBillNo} | <strong>Date:</strong> ${bill.date || '-'}</span>
      </div>
      <table style="width: 100%; border-collapse: collapse; font-size: 10px;">
        <thead>
          <tr style="background: var(--accent-main); color: #fff;">
            <th style="padding: 4px; border: 1px solid var(--accent-main);">#</th>
            <th style="padding: 4px; border: 1px solid var(--accent-main); text-align: left;">Item Description</th>
            <th style="padding: 4px; border: 1px solid var(--accent-main); text-align: center;">Code</th>
            <th style="padding: 4px; border: 1px solid var(--accent-main); text-align: center;">Qty</th>
            <th style="padding: 4px; border: 1px solid var(--accent-main); text-align: right;">Rate</th>
            <th style="padding: 4px; border: 1px solid var(--accent-main); text-align: right;">Total</th>
          </tr>
        </thead>
        <tbody>
  `;

  let calculatedSubTotal = 0;
  const itemsList = bill.items || bill.billItems || [];
  if (Array.isArray(itemsList) && itemsList.length > 0) {
    itemsList.forEach((item, idx) => {
      const name = getItemName(item);
      const code = getItemCode(item);
      const rate = getItemRate(item);
      const qty = getItemQty(item);
      const rowTotal = rate * qty;
      calculatedSubTotal += rowTotal;
      itemsHtml += `
        <tr>
          <td style="padding: 3px; border: 1px solid #ddd; text-align: center;">${idx + 1}</td>
          <td style="padding: 3px; border: 1px solid #ddd;">${name}</td>
          <td style="padding: 3px; border: 1px solid #ddd; text-align: center;">${code}</td>
          <td style="padding: 3px; border: 1px solid #ddd; text-align: center;">${qty}</td>
          <td style="padding: 3px; border: 1px solid #ddd; text-align: right;">Rs. ${rate}</td>
          <td style="padding: 3px; border: 1px solid #ddd; text-align: right;">Rs. ${rowTotal}</td>
        </tr>
      `;
    });
  }

  const finalNet = totalAmount > 0 ? totalAmount : calculatedSubTotal;

  itemsHtml += `
        </tbody>
      </table>
      <div style="margin-top: 6px; text-align: right; font-size: 11px; font-weight: bold; color: var(--accent-main);">
        Grand Total: Rs. ${finalNet}
      </div>
    </div>
  `;
  return itemsHtml;
}

// Print 2 Selected Bills from Ledger with Layout Choice
function printSelectedTwoBillsOnA4() {
  const chks = document.querySelectorAll('.bill-select-chk:checked');
  if (chks.length !== 2) {
    alert('براہ کرم لیجر میں سے ایک صفحے پر پرنٹ کرنے کے لیے بالکل دو (2) بل منتخب کریں۔');
    return;
  }

  const index1 = parseInt(chks[0].getAttribute('data-index'));
  const index2 = parseInt(chks[1].getAttribute('data-index'));

  const bill1 = billsHistory[index1];
  const bill2 = billsHistory[index2];

  const format = prompt("پرنٹ کا لے آؤٹ منتخب کریں:\n1. Vertical (اوپر نیچے - Portrait)\n2. Horizontal (بائیں دائیں - Landscape)", "1");
  const isHoriz = (format === "2" || format?.toLowerCase().includes("horiz"));

  const dualPrintWindow = window.open('', '_blank');
  dualPrintWindow.document.write(`
    <html>
      <head>
        <title>Dual Bill Print - Rehma Traders</title>
        <style>
          @page { size: A4 ${isHoriz ? 'landscape' : 'portrait'}; margin: 8mm; }
          body { font-family: Arial, sans-serif; margin: 0; padding: 0; background: #fff; }
          .a4-container { width: 100%; height: 100%; display: flex; flex-direction: ${isHoriz ? 'row' : 'column'}; justify-content: space-between; gap: 10px; }
          .bill-box { ${isHoriz ? 'width: 48%; height: 100%;' : 'width: 100%; height: 48%;'} box-sizing: border-box; }
          .cut-line { ${isHoriz ? 'width: 2px; border-left: 2px dashed #888;' : 'height: 2px; border-bottom: 2px dashed #888;'} margin: auto; }
        </style>
      </head>
      <body onload="window.print(); window.close();">
        <div class="a4-container">
          <div class="bill-box">
            ${buildSingleBillHtml(bill1, bill1.billNo || ('INV-' + (1001 + index1)))}
          </div>
          <div class="cut-line"></div>
          <div class="bill-box">
            ${buildSingleBillHtml(bill2, bill2.billNo || ('INV-' + (1001 + index2)))}
          </div>
        </div>
      </body>
    </html>
  `);
  dualPrintWindow.document.close();
}

function viewBillDetails(index) {
  const bill = billsHistory[index];
  if (!bill) return;

  activeViewingBillIndex = index;
  const contentDiv = document.getElementById('billPrintContent');
  if (!contentDiv) return;

  const exactBillNo = bill.billNo || ('INV-' + (1001 + index));
  contentDiv.innerHTML = buildSingleBillHtml(bill, exactBillNo);
  
  const modal = document.getElementById('previewModal');
  if (modal) modal.style.display = 'block';
}

function executeCustomPrint() {
  if (activeViewingBillIndex === null || !billsHistory[activeViewingBillIndex]) {
    alert('کوئی بل سلیکٹ نہیں ہے!');
    return;
  }

  const bill = billsHistory[activeViewingBillIndex];
  const exactBillNo = bill.billNo || ('INV-' + (1001 + activeViewingBillIndex));
  const format = document.getElementById('printFormatSelect').value;

  const pWin = window.open('', '_blank');

  if (format === 'thermal') {
    pWin.document.write(`
      <html>
        <head><title>Thermal Receipt</title>
        <style>body { font-family: monospace; width: 72mm; margin: 0; padding: 5px; font-size: 11px; }</style>
        </head>
        <body onload="window.print(); window.close();">
          ${buildSingleBillHtml(bill, exactBillNo)}
        </body>
      </html>
    `);
  } else if (format === 'a4-dual-vert' || format === 'a4-dual-horiz') {
    const isHoriz = (format === 'a4-dual-horiz');
    pWin.document.write(`
      <html>
        <head>
          <title>Dual Bill Print</title>
          <style>
            @page { size: A4 ${isHoriz ? 'landscape' : 'portrait'}; margin: 8mm; }
            body { font-family: Arial, sans-serif; margin: 0; padding: 0; background: #fff; }
            .a4-container { width: 100%; height: 100%; display: flex; flex-direction: ${isHoriz ? 'row' : 'column'}; justify-content: space-between; gap: 10px; }
            .bill-box { ${isHoriz ? 'width: 48%; height: 100%;' : 'width: 100%; height: 48%;'} box-sizing: border-box; }
            .cut-line { ${isHoriz ? 'width: 2px; border-left: 2px dashed #888;' : 'height: 2px; border-bottom: 2px dashed #888;'} margin: auto; }
          </style>
        </head>
        <body onload="window.print(); window.close();">
          <div class="a4-container">
            <div class="bill-box">${buildSingleBillHtml(bill, exactBillNo)}</div>
            <div class="cut-line"></div>
            <div class="bill-box">${buildSingleBillHtml(bill, exactBillNo)}</div>
          </div>
        </body>
      </html>
    `);
  } else {
    pWin.document.write(`
      <html>
        <head>
          <title>A4 Bill Print</title>
          <style>
            @page { size: A4; margin: 15mm; }
            body { font-family: Arial, sans-serif; margin: 0; padding: 0; background: #fff; }
          </style>
        </head>
        <body onload="window.print(); window.close();">
          ${buildSingleBillHtml(bill, exactBillNo)}
        </body>
      </html>
    `);
  }
  pWin.document.close();
}

function repeatCurrentBill() {
  if (activeViewingBillIndex === null || !billsHistory[activeViewingBillIndex]) {
    alert('No bill selected for repeat!');
    return;
  }

  const oldBill = billsHistory[activeViewingBillIndex];
  const custNameVal = oldBill.custName || oldBill.customerName || oldBill.customer || '';
  const custPhoneVal = oldBill.custPhone || oldBill.phone || oldBill.customerPhone || '';

  if (document.getElementById('custName')) document.getElementById('custName').value = custNameVal;
  if (document.getElementById('custPhone')) document.getElementById('custPhone').value = custPhoneVal;
  
  const oldItems = oldBill.items || oldBill.billItems || [];
  billItems = [];

  if (Array.isArray(oldItems) && oldItems.length > 0) {
    oldItems.forEach(item => {
      billItems.push({
        code: getItemCode(item),
        name: getItemName(item),
        rate: getItemRate(item),
        qty: getItemQty(item)
      });
    });
  }

  generateNextBillNumber();
  closeBillPreview();
  switchView('sectionBill');
  renderBillItemsTable();
  saveStateToHistory();
  alert('Bill & All Items successfully loaded as a Repeat Bill!');
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
  const total = billsHistory.reduce((acc, b) => acc + getBillTotal(b), 0);
  const dashSales = document.getElementById('dashSales');
  if (dashSales) dashSales.innerText = `Rs. ${total}`;

  const todayStr = new Date().toLocaleDateString();
  const todaySales = billsHistory
    .filter(b => b.date === todayStr)
    .reduce((acc, b) => acc + getBillTotal(b), 0);
  
  const dashToday = document.getElementById('dashTodaySales');
  if (dashToday) dashToday.innerText = `Rs. ${todaySales}`;
}

function openBillPreview() {
  if (billItems.length === 0) {
    alert('Please add items to bill first!');
    return;
  }
  const custNameInput = document.getElementById('custName');
  const custName = (custNameInput && custNameInput.value.trim() !== '') ? custNameInput.value.trim() : 'Cash Customer';
  const custPhoneInput = document.getElementById('custPhone');
  const custPhone = custPhoneInput ? custPhoneInput.value : '';

  const prevBalanceInput = document.getElementById('prevBalanceInput');
  const discountInput = document.getElementById('discountInput');
  const prevBalance = prevBalanceInput ? (parseFloat(prevBalanceInput.value) || 0) : 0;
  const discount = discountInput ? (parseFloat(discountInput.value) || 0) : 0;
  const subTotal = billItems.reduce((acc, item) => acc + (getItemRate(item) * getItemQty(item)), 0);
  const netTotal = subTotal + prevBalance - discount;

  const currentBillNo = document.getElementById('nextBillNo') ? document.getElementById('nextBillNo').innerText : 'INV-1001';

  const billRecord = {
    billNo: currentBillNo,
    custName: custName,
    custPhone: custPhone,
    date: new Date().toLocaleDateString(),
    netTotal: netTotal,
    items: JSON.parse(JSON.stringify(billItems))
  };

  billsHistory.push(billRecord);
  localStorage.setItem('rehma_bills', JSON.stringify(billsHistory));
  
  billItems.forEach(bi => {
    const match = rateList.find(r => getItemName(r) === getItemName(bi));
    if (match) {
      match.stock = Math.max(0, (match.stock !== undefined ? match.stock : 50) - getItemQty(bi));
    }
  });
  localStorage.setItem('rehma_ratelist', JSON.stringify(rateList));
  updateDashboardStats();
  generateNextBillNumber();

  activeViewingBillIndex = billsHistory.length - 1;
  const contentDiv = document.getElementById('billPrintContent');
  if (contentDiv) contentDiv.innerHTML = buildSingleBillHtml(billRecord, currentBillNo);

  const modal = document.getElementById('previewModal');
  if (modal) modal.style.display = 'block';
  renderLedger();
}

function closeBillPreview() {
  const modal = document.getElementById('previewModal');
  if (modal) modal.style.display = 'none';
}

function exportRateListJpg() {
  const hiddenCard = document.createElement('div');
  hiddenCard.style.position = 'fixed';
  hiddenCard.style.left = '-9999px';
  hiddenCard.style.top = '0';
  hiddenCard.style.width = '600px';
  hiddenCard.style.backgroundColor = '#ffffff';
  hiddenCard.style.color = '#000000';
  hiddenCard.style.padding = '20px';
  hiddenCard.style.boxSizing = 'border-box';
  hiddenCard.style.fontFamily = 'Arial, sans-serif';

  let tableRowsHtml = '';
  rateList.forEach((item, index) => {
    const nameEn = item.nameEn || item.name || '';
    const nameUr = item.nameUr || '';
    const rate = getItemRate(item);
    const code = getItemCode(item);
    const bgCol = index % 2 === 0 ? '#f9f9f9' : '#ffffff';

    tableRowsHtml += `
      <tr style="background-color: ${bgCol};">
        <td style="padding: 6px 8px; border: 1px solid #ccc; text-align: center; font-size: 11px;">${index + 1}</td>
        <td style="padding: 6px 8px; border: 1px solid #ccc; font-size: 11px;"><strong>${nameEn}</strong> / ${nameUr}</td>
        <td style="padding: 6px 8px; border: 1px solid #ccc; text-align: center; font-size: 10px;">${code !== '-' ? code : ''}</td>
        <td style="padding: 6px 8px; border: 1px solid #ccc; text-align: right; font-size: 12px; font-weight: bold; color: var(--accent-main);">Rs. ${rate}</td>
      </tr>
    `;
  });

  hiddenCard.innerHTML = `
    <div style="text-align: center; border-bottom: 2px solid var(--accent-gold); padding-bottom: 10px; margin-bottom: 12px;">
      <h2 style="margin: 0; color: var(--accent-main); font-size: 20px; text-transform: uppercase;">REHMA TRADERS</h2>
      <p style="margin: 2px 0; font-size: 11px; color: #555;">Proprietor: Muhammad Javed | 📱 0307-4015100</p>
      <p style="margin: 4px 0 0 0; font-size: 12px; font-weight: bold; color: var(--accent-gold);">OFFICIAL RATE LIST / آفیشل ریٹ لسٹ</p>
    </div>
    <table style="width: 100%; border-collapse: collapse;">
      <thead>
        <tr style="background-color: var(--accent-main); color: #ffffff;">
          <th style="padding: 8px; border: 1px solid var(--accent-main); text-align: center; font-size: 11px;">#</th>
          <th style="padding: 8px; border: 1px solid var(--accent-main); text-align: left; font-size: 11px;">Item Description</th>
          <th style="padding: 8px; border: 1px solid var(--accent-main); text-align: center; font-size: 11px;">Code</th>
          <th style="padding: 8px; border: 1px solid var(--accent-main); text-align: right; font-size: 11px;">Rate</th>
        </tr>
      </thead>
      <tbody>
        ${tableRowsHtml}
      </tbody>
    </table>
    <div style="margin-top: 15px; border-top: 1px solid var(--accent-gold); padding-top: 8px; text-align: center; font-size: 10px; color: #666;">
      <p style="margin: 0; font-weight: bold;">رہما ٹریڈر - معیاری فیبرک مصنوعات</p>
    </div>
  `;

  document.body.appendChild(hiddenCard);

  if (window.html2canvas) {
    html2canvas(hiddenCard, { scale: 2, useCORS: true }).then(canvas => {
      document.body.removeChild(hiddenCard);
      canvas.toBlob(blob => {
        const file = new File([blob], 'rehma-ratelist.jpg', { type: 'image/jpeg' });
        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          navigator.share({
            files: [file],
            title: 'Rehma Traders Rate List',
            text: 'Official Rate List from Rehma Traders'
          }).catch(err => console.log('Sharing failed', err));
        } else {
          const link = document.createElement('a');
          link.download = 'rehma-ratelist.jpg';
          link.href = URL.createObjectURL(blob);
          link.click();
        }
      }, 'image/jpeg', 0.95);
    }).catch(err => {
      document.body.removeChild(hiddenCard);
      alert('Failed to generate rate list image.');
    });
  } else {
    document.body.removeChild(hiddenCard);
    alert('html2canvas library not loaded.');
  }
}

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

function changeAppTheme(themeName, save = true) {
  const body = document.body;
  body.classList.remove('theme-navy', 'theme-slate', 'theme-sage', 'theme-mocha', 'theme-indigo');
  body.classList.add('theme-' + themeName);
  
  if (save) {
    localStorage.setItem('rehma_theme', themeName);
  }
  
  const selectEl = document.getElementById('themeSelector');
  if (selectEl) selectEl.value = themeName;
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
      const rawData = JSON.parse(e.target.result);

      if (rawData.ratelist && Array.isArray(rawData.ratelist)) {
        rateList = rawData.ratelist;
        localStorage.setItem('rehma_ratelist', JSON.stringify(rateList));
      } else if (rawData.rateList && Array.isArray(rawData.rateList)) {
        rateList = rawData.rateList;
        localStorage.setItem('rehma_ratelist', JSON.stringify(rateList));
      }

      if (rawData.bills && Array.isArray(rawData.bills)) {
        billsHistory = rawData.bills;
        localStorage.setItem('rehma_bills', JSON.stringify(billsHistory));
      } else if (rawData.billsHistory && Array.isArray(rawData.billsHistory)) {
        billsHistory = rawData.billsHistory;
        localStorage.setItem('rehma_bills', JSON.stringify(billsHistory));
      } else if (Array.isArray(rawData)) {
        billsHistory = rawData;
        localStorage.setItem('rehma_bills', JSON.stringify(billsHistory));
      }

      initApp();

      if (typeof switchView === 'function') {
        switchView('mainDashboardMenu');
      }

      alert('مبارک ہو! بیک اپ کامیابی سے ریسٹور ہو گیا ہے۔');
    } catch (err) {
      alert('فائل پڑھنے میں مسئلہ آیا ہے۔ براہ کرم درست JSON بیک اپ فائل منتخب کریں۔');
    }
  };
  reader.readAsText(file);
}

function pickContact() {
  if ('contacts' in navigator && 'select' in navigator.contacts) {
    navigator.contacts.select(['name', 'tel'], {multiple: false}).then(contacts => {
      if (contacts && contacts.length > 0) {
        const contact = contacts[0];
        if (contact.name && document.getElementById('custName')) document.getElementById('custName').value = contact.name[0];
        if (contact.tel && document.getElementById('custPhone')) document.getElementById('custPhone').value = contact.tel[0];
      }
    }).catch(err => alert('Contact selection failed or cancelled.'));
  } else {
    alert('Contact Picker API is not supported on this browser/device.');
  }
}
