// ==========================================
// 1. ریٹ لسٹ کو مستقل محفوظ (Permanent Save) کرنے کا نظام
// ==========================================

// عارضی طور پر ریٹ تبدیل کرنے کے لیے (بغیر سیو کیے)
function handleRateInputChange(itemId, newRate) {
    const item = allItems.find(i => i.id === itemId);
    if(item) {
        item.tempRate = Number(newRate);
    }
}

// جب آپ 'Save Rate' کا بٹن دبائیں گے تو یہ ریٹ ہمیشہ کے لیے سیو ہو جائے گا
function saveSingleItemRatePermanently(itemId) {
    const item = allItems.find(i => i.id === itemId);
    if(item && item.tempRate !== undefined) {
        item.rate = item.tempRate; // اصل ریٹ اپ ڈیٹ ہو گیا
        
        // لوکل اسٹوریج میں مستقل محفوظ کرنا تاکہ ورسل/گٹ ہب پر یاد رہے
        if (typeof saveItems === 'function') {
            saveItems(); 
        } else {
            localStorage.setItem('rehma_items', JSON.stringify(allItems));
        }

        // سکرین اور ٹیبل کو ریفریش کریں
        if (typeof renderRateListTable === 'function') renderRateListTable();
        if (typeof renderMultiItemBox === 'function') renderMultiItemBox();

        alert("ریٹ لسٹ میں تبدیلی کامیابی سے پرماننٹ سیو ہو گئی ہے!");
    } else {
        alert("پہلے ریٹ تبدیل کریں!");
    }
}


// ==========================================
// 2. گوگل ڈرائیو بیک اپ کا نظام (drmuhammedjaved@gmail.com)
// ==========================================

function handleGoogleDriveBackup() {
    const CLIENT_ID = 'آپ_کی_کلائنٹ_آئی_ڈی.apps.googleusercontent.com'; // یہاں اپنی اصلی گوگل کلائنٹ آئی ڈی درج کریں
    
    const client = google.accounts.oauth2.initTokenClient({
        client_id: CLIENT_ID,
        scope: 'https://www.googleapis.com/auth/drive.file',
        // براہِ راست آپ کی ای میل کو ہدف بنانے کے لیے خاص ہنٹ
        hint: 'drmuhammedjaved@gmail.com',
        callback: (response) => {
            if (response && response.access_token) {
                uploadAppDataToDrive(response.access_token);
            } else {
                alert("گوگل لاگ ان منسوخ ہو گیا یا ایرر آ گیا۔");
            }
        },
    });

    client.requestAccessToken();
}

// ایپ کا سارا ڈیٹا ڈرائیو پر اپ لوڈ کرنے کا فنکشن
function uploadAppDataToDrive(accessToken) {
    const appData = {
        items: allItems,
        bills: typeof bills !== 'undefined' ? bills : [],
        ledger: typeof ledger !== 'undefined' ? ledger : [],
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
            alert("بیک اپ محفوظ کرتے وقت گوگل کی طرف سے مسئلہ آیا ہے۔");
        }
    })
    .catch(err => {
        console.error(err);
        alert("انٹرنیٹ یا گوگل سرور کا کنکشن فیل ہو گیا!");
    });
}
