let currentLang = localStorage.getItem('rehma_lang') || 'en';

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
  { nameEn: 'Port Holder', nameUr: 'پورٹ ہولڈر', code: '2017447641001', rate: 70, stock: 100 },
  { nameEn: 'Tea Cozy Small', nameUr: 'ٹی کوزی چھوٹا', code: '2017447641002', rate: 220, stock: 18 },
  { nameEn: 'Tea Cozy Big', nameUr: 'ٹی کوزی بڑا', code: '2017447641003', rate: 250, stock: 14 },
  { nameEn: 'Iron Cover Cut', nameUr: 'آئرن کور کٹ', code: '1036001001584', rate: 430, stock: 22 },
  { nameEn: 'Iron Cover W/ Cut', nameUr: 'آئرن کور ود کٹ', code: '1036001001585', rate: 450, stock: 25 }
];

let itemsList = JSON.parse(localStorage.getItem('rehma_items')) || defaultItems;
let dbBills = JSON.parse(localStorage.getItem('rehma_bills')) || [];
let currentBillItems = [];

// ==========================================
// زبان بدلنے کا فنکشن
// ==========================================
function switchLanguage(lang) {
    currentLang = lang;
    localStorage.setItem('rehma_lang', lang);
    
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        if (dict[lang] && dict[lang][key]) {
            el.innerText = dict[lang][key];
        }
    });

    renderRateListTable();
    if (typeof renderMultiItemBox === 'function') renderMultiItemBox();
}

// ==========================================
// ریٹ لسٹ ایڈیٹنگ اور پرماننٹ سیو کا نظام
// ==========================================
let tempRateChanges = {};

function handleRateInputChange(itemCode, newRate) {
    tempRateChanges[itemCode] = Number(newRate);
}

function saveSingleItemRatePermanently(itemCode) {
    const newRate = tempRateChanges[itemCode];
    if (newRate !== undefined) {
        itemsList.forEach(item => {
            if (item.code === itemCode || item.nameEn === itemCode) {
                item.rate = newRate;
            }
        });
        localStorage.setItem('rehma_items', JSON.stringify(itemsList));
        
        renderRateListTable();
        if (typeof renderMultiItemBox === 'function') renderMultiItemBox();

        alert(currentLang === 'ur' ? "ریٹ لسٹ کامیابی سے پرماننٹ سیو ہو گئی ہے!" : "Rate saved permanently!");
    } else {
        alert(currentLang === 'ur' ? "پہلے ریٹ تبدیل کریں!" : "Please change the rate first!");
    }
}

// ریٹ لسٹ ٹیبل کو رینڈر کرنے اور ایڈیٹنگ/سیو بٹن دکھانے کا اصل فنکشن
function renderRateListTable() {
    const tbody = document.getElementById('rateListTableBody');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    itemsList.forEach((item, index) => {
        const displayName = currentLang === 'ur' ? item.nameUr : item.nameEn;
        const identifier = item.code || item.nameEn;
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${index + 1}</td>
            <td>${item.code || '-'}</td>
            <td>${displayName}</td>
            <td>${item.stock || 0}</td>
            <td>
               <input type="number" value="${item.rate}" onchange="handleRateInputChange('${identifier}', this.value)" style="width: 70px; padding: 4px; text-align: center; border: 1px solid #ccc; border-radius: 4px;" />
            </td>
            <td>
               <button onclick="saveSingleItemRatePermanently('${identifier}')" style="background: gold; color: black; border: none; padding: 5px 10px; border-radius: 4px; cursor: pointer; font-weight: bold;">
                 💾 Save
               </button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

// ایپ لوڈ ہونے پر خود بخود لسٹ شو کرنا
document.addEventListener('DOMContentLoaded', () => {
    renderRateListTable();
});

// ==========================================
// واٹس ایپ پر ایچ ڈی جے پی جی (HD JPG) شیئرنگ
// ==========================================
function shareRateListAsImage() {
    if (typeof html2canvas === 'function') {
        const element = document.getElementById('rateListPrintArea') || document.body;
        html2canvas(element, { scale: 2 }).then(canvas => {
            canvas.toBlob(blob => {
                const file = new File([blob], "RehmaTraders_RateList.jpg", { type: "image/jpeg" });
                if (navigator.canShare && navigator.canShare({ files: [file] })) {
                    navigator.share({
                        files: [file],
                        title: 'Rehma Traders Rate List',
                        text: 'رہما ٹریڈر کی تازہ ترین ریٹ لسٹ'
                    }).catch(() => {});
                } else {
                    const link = document.createElement('a');
                    link.download = 'RehmaTraders_RateList.jpg';
                    link.href = canvas.toDataURL('image/jpeg', 0.9);
                    link.click();
                }
            }, 'image/jpeg', 0.9);
        });
    } else {
        alert(currentLang === 'ur' ? "شیئرنگ لائبریری لوڈ ہو رہی ہے..." : "Sharing tool is loading...");
    }
}

// ==========================================
// گوگل ڈرائیو بیک اپ (drmuhammedjaved@gmail.com)
// ==========================================
function handleGoogleDriveBackup() {
    const CLIENT_ID = 'YOUR_CLIENT_ID.apps.googleusercontent.com'; // یہاں اپنی اصل کلائنٹ آئی ڈی درج کریں
    
    const client = google.accounts.oauth2.initTokenClient({
        client_id: CLIENT_ID,
        scope: 'https://www.googleapis.com/auth/drive.file',
        hint: 'drmuhammedjaved@gmail.com',
        callback: (response) => {
            if (response && response.access_token) {
                uploadAppDataToDrive(response.access_token);
            } else {
                alert("گوگل لاگ ان منسوخ ہو گیا ہے۔");
            }
        },
    });

    client.requestAccessToken();
}

function uploadAppDataToDrive(accessToken) {
    const appData = {
        itemsList: itemsList,
        dbBills: dbBills,
        backupDate: new Date().toISOString()
    };

    const fileContent = JSON.stringify(appData, null, 2);
    const file = new Blob([fileContent], { type: 'application/json' });
    const metadata = {
        name: 'RehmaTraders_Backup.json',
        mimeType: 'application/json'
    };

    const form = new FormData();
    form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
    form.append('file', file);

    fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
        method: 'POST',
        headers: new Headers({ 'Authorization': 'Bearer ' + accessToken }),
        body: form
    })
    .then(res => res.json())
    .then(data => {
        if(data.id) {
            alert("مبارک ہو! گوگل ڈرائیو پر بیک اپ کامیابی سے بن گیا ہے (drmuhammedjaved@gmail.com)۔");
        } else {
            alert("بیک اپ محفوظ کرنے میں مسئلہ آیا ہے۔");
        }
    })
    .catch(err => {
        console.error(err);
        alert("انٹرنیٹ یا سرور کا کنکشن فیل ہو گیا!");
    });
}
