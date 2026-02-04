import crypto from "node:crypto";

// دالة بناء الهاش الخاصة بـ EdfaPay
function buildHash(orderId, amount, currency, description, merchantPassword) {
  const base = `${orderId}${amount}${currency}${description}${merchantPassword}`.toUpperCase();
  const md5Hex = crypto.createHash("md5").update(base).digest("hex");
  return crypto.createHash("sha1").update(md5Hex).digest("hex");
}

// واجهة المستخدم المستقرة (بدون ملفات خارجية)
function renderHTML() {
  return `
<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Dolr Pay – بوابة الدفع</title>
    <style>
        :root { --primary: #22d3ee; --accent: #a855f7; --bg: #020617; }
        body {
            margin: 0; font-family: system-ui, -apple-system, sans-serif;
            background: radial-gradient(circle at top, #1e293b, var(--bg));
            color: white; display: flex; justify-content: center; align-items: center; min-height: 100vh;
        }
        .card {
            background: rgba(15, 23, 42, 0.95);
            padding: 2rem; border-radius: 24px; border: 1px solid rgba(255,255,255,0.1);
            width: 100%; max-width: 400px; text-align: center; box-shadow: 0 20px 50px rgba(0,0,0,0.5);
        }
        h1 { color: var(--primary); font-size: 2rem; margin-bottom: 0.5rem; }
        p { color: #9ca3af; font-size: 0.9rem; margin-bottom: 2rem; }
        .input-group { margin-bottom: 1.2rem; text-align: right; }
        label { display: block; margin-bottom: 0.5rem; font-size: 0.8rem; color: #22d3ee; }
        input {
            width: 100%; padding: 12px; border-radius: 12px; border: 1px solid #334155;
            background: #1e293b; color: white; box-sizing: border-box; outline: none;
        }
        input:focus { border-color: var(--primary); }
        button {
            width: 100%; padding: 14px; border-radius: 12px; border: none;
            background: linear-gradient(135deg, var(--primary), var(--accent));
            color: #020617; font-weight: bold; font-size: 1rem; cursor: pointer;
            transition: transform 0.2s;
        }
        button:active { transform: scale(0.98); }
        #status { margin-top: 1rem; font-size: 0.85rem; color: #fb7185; }
    </style>
</head>
<body>
    <div class="card">
        <h1>Dolr Pay</h1>
        <p>بوابة دفع آمنة عبر EdfaPay</p>
        <form id="payForm">
            <div class="input-group">
                <label>المبلغ (SAR)</label>
                <input type="number" id="amount" placeholder="0.00" required step="0.01">
            </div>
            <div class="input-group">
                <label>وصف الطلب</label>
                <input type="text" id="desc" placeholder="مثلاً: اشتراك متجر" required>
            </div>
            <div class="input-group">
                <label>رقم الجوال</label>
                <input type="tel" id="phone" placeholder="9665xxxxxxxx" required>
            </div>
            <div class="input-group">
                <label>البريد الإلكتروني</label>
                <input type="email" id="email" placeholder="name@example.com" required>
            </div>
            <button type="submit">ادفع الآن</button>
            <div id="status"></div>
        </form>
    </div>

    <script>
        document.getElementById('payForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            const btn = e.target.querySelector('button');
            const status = document.getElementById('status');
            
            btn.disabled = true;
            btn.innerText = 'جاري التحويل...';
            status.innerText = '';

            try {
                const response = await fetch('/api/create-payment', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        amount: document.getElementById('amount').value,
                        description: document.getElementById('desc').value,
                        phone: document.getElementById('phone').value,
                        email: document.getElementById('email').value
                    })
                });

                const data = await response.json();
                if (data.redirect_url) {
                    window.location.href = data.redirect_url;
                } else {
                    throw new Error(data.error || 'فشل الاتصال بالبوابة');
                }
            } catch (err) {
                status.innerText = err.message;
                btn.disabled = false;
                btn.innerText = 'ادفع الآن';
            }
        });
    </script>
</body>
</html>
`;
}

export default {
    async fetch(request, env) {
        const url = new URL(request.url);

        // الصفحة الرئيسية
        if (url.pathname === "/" || url.pathname === "") {
            return new Response(renderHTML(), {
                headers: { "Content-Type": "text/html; charset=utf-8" }
            });
        }

        // إنشاء عملية الدفع
        if (url.pathname === "/api/create-payment" && request.method === "POST") {
            try {
                const body = await request.json();
                const orderId = "DL-" + Date.now();
                const merchantId = env.EDFA_MERCHANT_ID;
                const merchantPassword = env.EDFA_PASSWORD;

                if (!merchantId || !merchantPassword) {
                    return new Response(JSON.stringify({ error: "Environment variables missing" }), { status: 500 });
                }

                const hash = buildHash(orderId, body.amount, "SAR", body.description, merchantPassword);

                const formData = new FormData();
                formData.append("action", "SALE");
                formData.append("edfa_merchant_id", merchantId);
                formData.append("merchant_password", merchantPassword);
                formData.append("order_id", orderId);
                formData.append("order_amount", body.amount);
                formData.append("order_currency", "SAR");
                formData.append("order_description", body.description);
                formData.append("payer_first_name", "Dolr");
                formData.append("payer_last_name", "Customer");
                formData.append("payer_email", body.email);
                formData.append("payer_phone", body.phone);
                formData.append("payer_ip", "127.0.0.1");
                formData.append("payer_country", "SA");
                formData.append("payer_city", "Riyadh");
                formData.append("payer_address", "Online");
                formData.append("payer_zip", "12221");
                formData.append("hash", hash);

                const edfaRes = await fetch("https://api.edfapay.com/payment/initiate", {
                    method: "POST",
                    body: formData
                });

                const result = await edfaRes.text();
                return new Response(result, { headers: { "Content-Type": "application/json" } });

            } catch (err) {
                return new Response(JSON.stringify({ error: err.message }), { status: 500 });
            }
        }

        return new Response("Not Found", { status: 404 });
    }
};
