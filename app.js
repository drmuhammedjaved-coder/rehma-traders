function renderLedger(data) {
  const tbody = document.querySelector('#ledgerTable tbody');
  if (!tbody) return;
  tbody.innerHTML = '';

  data.forEach((b, idx) => {
    // dbBills में असली इंडेक्स (index) ढूँढें ताकि फ़िल्टर के दौरान भी सही बिल डिलीट हो
    let realIdx = dbBills.findIndex(item => item.id === b.id);
    if (realIdx === -1) realIdx = idx;

    tbody.innerHTML += `<tr>
      <td style="text-align: center; width: 40px;">
        <input type="checkbox" class="bill-select-checkbox" value="${realIdx}" style="width: 20px; height: 20px; cursor: pointer;">
      </td>
      <td>${b.id}</td>
      <td><strong onclick="filterByCustomer('${b.customer}')" style="cursor:pointer; color:var(--accent-main);">${b.customer}</strong></td>
      <td>${b.date}</td>
      <td style="color:var(--accent-main); font-weight:bold;">Rs. ${b.netAmount}</td>
      <td>
        <button type="button" class="btn-silver" onclick="previewHistoryBill(${realIdx})" style="padding:4px 8px; font-size:11px; margin-right:4px;">👁️ Preview</button>
        <button type="button" class="btn-gold" onclick="cloneAndRepeatBill(${realIdx})" style="padding:4px 8px; font-size:11px;">🔄 Repeat</button>
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
    alert("कृपया डिलीट करने के लिए कम से कम एक बिल का चेकबॉक्स (निशान) चुनें।");
    return;
  }

  if (confirm(`क्या आप सचमुच चुने गए ${checkboxes.length} बिल डिलीट करना चाहते हैं?`)) {
    registerGlobalChange();

    let indicesToDelete = Array.from(checkboxes).map(cb => parseInt(cb.value));
    
    // बड़ी इंडेक्स से छोटी इंडेक्स की तरफ सॉर्ट करें
    indicesToDelete.sort((a, b) => b - a);

    indicesToDelete.forEach(idx => {
      dbBills.splice(idx, 1);
    });

    localStorage.setItem('rehma_bills', JSON.stringify(dbBills));
    updateDashboard();
    
    // सर्च इनपुट के हिसाब से दोबारा लेजर रेंडर करें
    const query = document.getElementById('searchCust')?.value.toLowerCase() || '';
    if (query) {
      filterLedger();
    } else {
      renderLedger(dbBills);
    }

    updateNextBillNo();
    alert("चुने गए बिल सफलतापूर्वक डिलीट कर दिए गए हैं!");
  }
}
