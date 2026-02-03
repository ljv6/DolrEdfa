const express = require('express');
const axios = require('axios');
const FormData = require('form-data');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// ==================== 🔐 بيانات التاجر ====================
const MERCHANT_ID = "983c9669-9278-4dd1-950f-8b8fbb0a14d2";
const MERCHANT_PASSWORD = "7ceb6437-92bc-411b-98fa-be054b39eaba";
const EdfaPay_URL = "https://api.edfapay.com/payment/initiate";

// ==================== الإعدادات ====================
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(__dirname));

const ORDERS_FILE = path.join(__dirname, 'orders.json');
if (!fs.existsSync(ORDERS_FILE)) fs.writeFileSync(ORDERS_FILE, JSON.stringify({}, null, 2));

function getOrders() {
    try { return JSON.parse(fs.readFileSync(ORDERS_FILE, 'utf8')); } catch (e) { return {}; }
}
function saveOrders(orders) { fs.writeFileSync(ORDERS_FILE, JSON.stringify(orders, null, 2), 'utf8'); }

// ==================== الصفحة الرئيسية ====================
app.get('/', (req, res) => { res.sendFile(path.join(__dirname, 'index.html')); });

// ==================== API بدء الدفع ====================
app.post('/api/initiate', async (req, res) => {
    try {
        const { amount, description, email, phone } = req.body;
        if (!amount || parseFloat(amount) <= 0) return res.status(400).json({ error: "مبلغ غير صالح" });
        
        const cleanPhone = phone.replace(/\D/g, '');
        if (!/^[5][0-9]{8}$/.test(cleanPhone)) return res.status(400).json({ error: "رقم الجوال غير صحيح" });

        const orderId = "DOLR-" + Date.now();
        const currency = "SAR";
        
        const orders = getOrders();
        orders[orderId] = { order_id: orderId, amount: parseFloat(amount).toFixed(2), currency, description: description || "خدمة", email: email || "none@example.com", phone: cleanPhone, created_at: Date.now(), status: "PENDING" };
        saveOrders(orders);

        // حساب الـ Hash
        const hashBase = (orderId + parseFloat(amount).toFixed(2) + currency + (description || "") + MERCHANT_PASSWORD).toUpperCase();
        const md5Hash = crypto.createHash('md5').update(hashBase).digest('hex');
        const finalHash = crypto.createHash('sha1').update(md5Hash).digest('hex');

        const form = new FormData();
        form.append('action', 'SALE');
        form.append('edfa_merchant_id', MERCHANT_ID);
        form.append('order_id', orderId);
        form.append('order_amount', parseFloat(amount).toFixed(2));
        form.append('order_currency', currency);
        form.append('order_description', description || "خدمة");
        form.append('req_token', 'Y');
        form.append('payer_first_name', 'Dolr');
        form.append('payer_last_name', 'Customer');
        form.append('payer_email', email);
        form.append('payer_phone', cleanPhone);
        form.append('payer_country', 'SA');
        form.append('payer_city', 'Riyadh');
        form.append('payer_address', 'Online');
        form.append('payer_zip', '12221');
        form.append('payer_ip', req.ip || '127.0.0.1');

        const protocol = req.protocol;
        const host = req.get('host');
        const domain = `${protocol}://${host}`;
        const callbackUrl = `${domain}/api/callback`;

        form.append('term_url_3ds', callbackUrl);
        form.append('success_url', callbackUrl);
        form.append('failure_url', callbackUrl);
        form.append('callback_url', callbackUrl);
        form.append('auth', 'N');
        form.append('recurring_init', 'N');
        form.append('hash', finalHash);

        const response = await axios.post(EdfaPay_URL, form, { headers: { ...form.getHeaders(), "Accept": "application/json" } });
        const data = response.data;

        if (data.html) return res.json({ html: data.html });
        else if (data.redirect_url) return res.json({ redirect_url: data.redirect_url });
        else return res.status(500).json({ error: "رد غير متوقع", raw: data });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "فشل الاتصال", details: error.message });
    }
});

// ==================== API الاستدعاء والنتائج ====================
app.get('/api/callback', (req, res) => {
    const payload = { ...req.query, ...req.body };
    const orders = getOrders();
    const orderId = payload.order_id || payload.merchant_order_id || payload.ref || 'N/A';
    
    const normalizeStatus = (data) => {
        const result = (data.result || '').toUpperCase();
        const status = (data.status || data.payment_status || '').toUpperCase();
        const code = (data.response_code || '').toUpperCase();
        if (result === 'SUCCESS') return 'SUCCESS';
        if (['SETTLED','CAPTURED','APPROVED','PAID','COMPLETED','AUTH'].includes(status)) return 'SUCCESS';
        if (['1','00','000'].includes(code)) return 'SUCCESS';
        if (result === 'FAILED') return 'FAILED';
        if (['DECLINED','FAILED','VOIDED','EXPIRED','REJECTED'].includes(status)) return 'FAILED';
        if (['2','3','4','9'].includes(code)) return 'FAILED';
        return 'PENDING';
    };

    const status = normalizeStatus(payload);
    const trx = payload.transaction_id || payload.trans_id || 'N/A';
    const orderDetails = orders[orderId];

    if (orderDetails && orderDetails.status !== 'SUCCESS') {
        orderDetails.status = status;
        orderDetails.trx_id = trx;
        orderDetails.updated_at = Date.now();
        saveOrders(orders);
        if (status === 'SUCCESS') console.log(`Payment Success: ${orderId}`);
    }

    const isSuccess = (status === 'SUCCESS');
    const isFailed = (status === 'FAILED');
    const isPending = (status === 'PENDING');
    const title = isSuccess ? 'تم الدفع بنجاح' : (isFailed ? 'فشلت عملية الدفع' : 'جاري التحقق');
    const color = isSuccess ? '#10b981' : (isFailed ? '#ef4444' : '#3b82f6');
    const msg = isSuccess ? 'تم استلام المبلغ عبر Dolr.' : (isFailed ? 'فشلت العملية.' : 'جاري التحقق من البنك.');

    res.send(`
    <!DOCTYPE html>
    <html lang="ar" dir="rtl">
    <head>
        <meta charset="UTF-8">
        <title>${title} | Dolr</title>
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <style>
            body { font-family: sans-serif; background: #0f172a; color: white; display: flex; justify-content: center; align-items: center; min-height: 100vh; margin: 0; }
            .card { background: #1e293b; padding: 40px; border-radius: 24px; text-align: center; max-width: 450px; width: 90%; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.5); border: 1px solid rgba(255,255,255,0.1); }
            h1 { margin-bottom: 15px; color: ${color}; font-size: 28px; }
            p { color: #94a3b8; line-height: 1.6; margin-bottom: 25px; }
            .details { background: rgba(0,0,0,0.3); padding: 20px; border-radius: 16px; margin-bottom: 25px; text-align: right; font-size: 14px; }
            .row { display: flex; justify-content: space-between; margin-bottom: 10px; border-bottom: 1px solid rgba(255,255,255,0.05); padding-bottom: 8px; }
            .btn { display: block; background: #334155; color: white; padding: 15px; text-decoration: none; border-radius: 12px; margin-top: 10px; font-weight: bold; }
            .spinner { border: 4px solid rgba(255,255,255,0.1); border-left-color: ${color}; border-radius: 50%; width: 40px; height: 40px; margin: 0 auto 20px; animation: spin 1s linear infinite; }
            @keyframes spin { 100% { transform: rotate(360deg); } }
        </style>
    </head>
    <body>
        <div class="card">
            ${isPending ? '<div class="spinner"></div>' : ''}
            <h1>${title}</h1>
            <p>${msg}</p>
            ${orderDetails ? `<div class="details"><div class="row"><span>رقم الطلب:</span> <b>${orderId}</b></div><div class="row"><span>المبلغ:</span> <b>${orderDetails.amount} SAR</b></div></div>` : ''}
            <a href="/" class="btn">العودة للرئيسية</a>
        </div>
        ${isPending ? '<script>setTimeout(()=>window.location.reload(), 5000)</script>' : ''}
    </body>
    </html>
    `);
});

if (require.main === module) {
    app.listen(PORT, () => console.log(`Dolr Payment Gateway Ready on port ${PORT}`));
}
module.exports = app;
