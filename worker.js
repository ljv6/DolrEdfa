import crypto from "node:crypto";

function buildHash(orderId, amount, currency, description, merchantPassword) {
  const base = `${orderId}${amount}${currency}${description}${merchantPassword}`.toUpperCase();
  const md5Hex = crypto.createHash("md5").update(base).digest("hex");
  return crypto.createHash("sha1").update(md5Hex).digest("hex");
}

function renderHTML() {
  return `
<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
<meta charset="UTF-8" />
<title>Dolr Pay – بوابة الدفع</title>
<meta name="viewport" content="width=device-width, initial-scale=1">
<style>
  body {
    margin: 0; padding: 0;
    background: #020617;
    color: #e5e7eb;
    display: flex; justify-content: center; align-items: center;
    min-height: 100vh;
    font-family: sans-serif;
  }
  .card {
    width: 90%; max-width: 400px;
    padding: 30px;
    background: #0f172a;
    border-radius: 20px;
    border: 1px solid #1e293b;
    text-align: center;
    box-shadow: 0 10px 30px rgba(0,0,0,0.5);
  }
  h1 { color: #22d3ee; margin-bottom: 5px; }
  input {
    width: 100%; padding: 12px; margin: 10px 0;
    border-radius: 10px; border: 1px solid #334155;
    background: #1e293b; color: white;
  }
  button {
    width: 100%; padding: 15px;
    background: linear-gradient(135deg, #22d3ee, #a855f7);
    border: none; border-radius: 10px;
    color: #0f172a; font-weight: bold; cursor: pointer;
  }
  #status { margin-top: 15px; font-size: 14px; color: #9ca3af; }
</style>
</head>
<body>
  <div class="card">
    <h1>Dolr Pay</h1>
    <p>بوابة دفع آمنة</p>
    <form id="payform">
      <input id="amount" type="number" placeholder="المبلغ (SAR)" required>
      <input id="desc" type="text" placeholder="وصف الطلب" required>
      <input id="phone" type="tel" placeholder="رقم الجوال 9665xxxxxxxx" required>
      <input id="email" type="email" placeholder="البريد الإلكتروني" required>
      <button type="submit">إتمام الدفع</button>
      <div id="status"></div>
    </form>
  </div>

  <script>
    document.getElementById("payform").addEventListener("submit", async (e) => {
      e.preventDefault();
      const status = document.getElementById("status");
      status.innerText = "جاري المعالجة...";
      
      try {
        const res = await fetch("/api/create-payment", {
          method: "POST",
          headers: {"Content-Type": "application/json"},
          body: JSON.stringify({
            amount: document.getElementById("amount").value,
            description: document.getElementById("desc").value,
            phone: document.getElementById("phone").value,
            email: document.getElementById("email").value
          })
        });
        const data = await res.json();
        if(data.redirect_url) window.location.href = data.redirect_url;
        else status.innerText = "خطأ في إنشاء الطلب";
      } catch(e) { status.innerText = "فشل الاتصال"; }
    });
  </script>
</body>
</html>`;
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // الصفحة الرئيسية
    if (url.pathname === "/") {
      return new Response(renderHTML(), { headers: { "Content-Type": "text/html; charset=utf-8" } });
    }

    // معالجة الدفع
    if (url.pathname === "/api/create-payment") {
      try {
        const body = await request.json();
        const orderId = "DL-" + Date.now();
        const merchantId = env.EDFA_MERCHANT_ID;
        const merchantPassword = env.EDFA_PASSWORD;

        if (!merchantId || !merchantPassword) {
          return new Response(JSON.stringify({ error: "إعدادات Merchant ناقصة" }), { status: 500 });
        }

        const hash = buildHash(orderId, body.amount, "SAR", body.description, merchantPassword);

        const form = new FormData();
        form.append("action", "SALE");
        form.append("edfa_merchant_id", merchantId);
        form.append("merchant_password", merchantPassword);
        form.append("order_id", orderId);
        form.append("order_amount", body.amount);
        form.append("order_currency", "SAR");
        form.append("order_description", body.description);
        form.append("payer_first_name", "Dolr");
        form.append("payer_last_name", "Pay");
        form.append("payer_email", body.email);
        form.append("payer_phone", body.phone);
        form.append("payer_ip", "127.0.0.1");
        form.append("payer_country", "SA");
        form.append("payer_city", "Riyadh");
        form.append("payer_address", "Online");
        form.append("payer_zip", "12221");
        form.append("hash", hash);

        const res = await fetch("https://api.edfapay.com/payment/initiate", { method: "POST", body: form });
        return new Response(await res.text(), { headers: { "Content-Type": "application/json" } });
      } catch (e) {
        return new Response(JSON.stringify({ error: e.message }), { status: 500 });
      }
    }

    return new Response("Not Found", { status: 404 });
  }
};
