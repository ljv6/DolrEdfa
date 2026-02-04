import crypto from "node:crypto";

function buildHash(orderId, amount, currency, description, merchantPassword) {
  const base = `${orderId}${amount}${currency}${description}${merchantPassword}`.toUpperCase();
  const md5Hex = crypto.createHash("md5").update(base).digest("hex");
  return crypto.createHash("sha1").update(md5Hex).digest("hex");
}

function renderHTML(origin) {
  return `
<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
<meta charset="UTF-8" />
<title>RYPAY – بوابة الدفع</title>
<meta name="viewport" content="width=device-width, initial-scale=1">

<style>
@font-face {
  font-family: "Thmanyah sans 1.2";
  src: url("/Thmanyahsans12-Bold.ttf") format("truetype");
  font-weight: 700;
}

* {
  box-sizing: border-box;
}

body {
  margin: 0;
  padding: 0;
  background: radial-gradient(circle at 0% 0%, #22d3ee22, transparent 60%),
              radial-gradient(circle at 100% 100%, #a855f722, transparent 60%),
              #020617;
  min-height: 100vh;
  font-family: "Thmanyah sans 1.2", sans-serif;
  color: #e5e7eb;
  display: flex;
  justify-content: center;
  align-items: center;
}

.card {
  width: 90%;
  max-width: 480px;
  padding: 24px 22px 20px;
  border-radius: 22px;
  background: rgba(15,23,42,0.96);
  border: 1px solid rgba(148,163,184,0.35);
  box-shadow: 0 0 25px rgba(34,211,238,0.55), 0 0 55px rgba(168,85,247,0.45);
  backdrop-filter: blur(20px);
}

h1 {
  margin-top: 0;
  margin-bottom: 4px;
  text-align: center;
  font-size: 26px;
}

.logo-box {
  display: flex;
  justify-content: center;
  margin-bottom: 10px;
}

.logo-box img {
  width: 64px;
  height: 64px;
}

.subtitle {
  text-align: center;
  font-size: 12px;
  color: #9ca3af;
  margin-bottom: 18px;
}

.field {
  margin-bottom: 12px;
}

.field-label {
  font-size: 12px;
  color: #9ca3af;
  margin-bottom: 4px;
  display: flex;
  align-items: center;
  gap: 6px;
}

.field-label svg {
  width: 16px;
  height: 16px;
}

.field-wrapper {
  position: relative;
  display: flex;
  align-items: center;
  border-radius: 14px;
  background: rgba(15,23,42,0.92);
  border: 1px solid rgba(148,163,184,0.45);
  padding-inline: 10px 12px;
}

.field-wrapper:focus-within {
  border-color: #22d3ee;
  box-shadow: 0 0 0 1px rgba(34,211,238,0.35);
}

.field-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  margin-inline-start: 2px;
}

.field-icon svg {
  width: 18px;
  height: 18px;
}

input {
  border: none;
  outline: none;
  flex: 1;
  padding: 9px 6px;
  font-size: 14px;
  background: transparent;
  color: #fff;
}

input::placeholder {
  color: #6b7280;
}

button {
  width: 100%;
  background: linear-gradient(135deg, #22d3ee, #0ea5e9, #a855f7);
  padding: 12px;
  border: none;
  border-radius: 999px;
  color: #0f172a;
  font-weight: 700;
  font-size: 15px;
  cursor: pointer;
  margin-top: 6px;
  box-shadow: 0 0 18px rgba(34,211,238,0.8);
}

button:active {
  transform: translateY(1px);
}

#status {
  margin-top: 10px;
  font-size: 13px;
  text-align: center;
  color: #9ca3af;
}

/* سوشيال ميديا */
.social-row {
  margin-top: 16px;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  justify-content: center;
}

.social-btn {
  width: 44px;
  height: 44px;
  border-radius: 999px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  text-decoration: none;
  box-shadow: 0 0 14px rgba(15,23,42,0.6);
}

.social-btn svg {
  width: 22px;
  height: 22px;
}

/* ألوان رسمية تقريبية */
.social-x {
  background: #000000;
}
.social-x svg {
  fill: #ffffff;
}

.social-telegram {
  background: #229ED9;
}
.social-telegram svg {
  fill: #ffffff;
}

.social-snap {
  background: #FFFC00;
}
.social-snap svg {
  fill: #000000;
}

.social-whatsapp {
  background: #25D366;
}
.social-whatsapp svg {
  fill: #ffffff;
}

@media (max-width: 400px) {
  .card {
    padding: 20px 16px 18px;
  }
}
</style>
</head>

<body>
  <div class="card">

    <div class="logo-box">
      <img src="/payed.png" alt="Pay Logo">
    </div>

    <h1>RYPAY</h1>
    <div class="subtitle">بوابة دفع آمنة لاشتراكات Razah Store عبر EdfaPay</div>

    <form id="payform">

      <!-- المبلغ -->
      <div class="field">
        <div class="field-label">
          <span>المبلغ (SAR)</span>
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M7 5h10v2H9.8C12 8 13 9.2 13 11.5V19h-2v-3.5C11 13 10 11.5 7.5 11.5H7V9.5h.5c1.7 0 2.6.6 3.1 1.4C10.4 9 9 7 7 7V5zM15 11h4v2h-4v-2z"/>
          </svg>
        </div>
        <div class="field-wrapper">
          <span class="field-icon">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M7 4h10a2 2 0 0 1 2 2v2h-2V6H7v12h10v-2h2v2a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z"/>
              <path d="M15 8h-2.2c-1.4 0-2.3.8-2.3 2 0 1 .7 1.6 1.7 1.8l1.4.3c.5.1.8.3.8.7 0 .5-.5.8-1.1.8H11v1.7h1.9c1.6 0 2.7-.9 2.7-2.3 0-1-.6-1.7-1.8-2l-1.3-.3c-.5-.1-.8-.3-.8-.7 0-.4.4-.7 1-.7H15V8z"/>
            </svg>
          </span>
          <input id="amount" type="number" min="1" step="0.01" placeholder="أدخل المبلغ المطلوب (ريال سعودي)">
        </div>
      </div>

      <!-- وصف الطلب -->
      <div class="field">
        <div class="field-label">
          <span>وصف الطلب</span>
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M7 3h10a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2zm0 2v14h10V5H7zm2 3h6v2H9V8zm0 4h6v2H9v-2z"/>
          </svg>
        </div>
        <div class="field-wrapper">
          <span class="field-icon">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M5 4h14v2H5V4zm2 4h10v2H7V8zm0 4h8v2H7v-2zm0 4h6v2H7v-2z"/>
            </svg>
          </span>
          <input id="desc" type="text" placeholder="مثال: اشتراك Razah Store لمدة شهر">
        </div>
      </div>

      <!-- رقم الجوال -->
      <div class="field">
        <div class="field-label">
          <span>رقم الجوال</span>
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M7 2h10a2 2 0 0 1 2 2v16a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2zm0 2v16h10V4H7zm3.2 2.5h3.6v1.5h-3.6V6.5zM12 18.5a1.3 1.3 0 1 1 0-2.6 1.3 1.3 0 0 1 0 2.6z"/>
          </svg>
        </div>
        <div class="field-wrapper">
          <span class="field-icon">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M6.6 3.4 8.8 3A2 2 0 0 1 11 4.3l.7 3a1.8 1.8 0 0 1-.5 1.7l-1.1 1a10.5 10.5 0 0 0 4.6 4.6l1-1.1c.4-.4 1-.6 1.7-.5l3 .7A2 2 0 0 1 21 16.9l-.4 2.2A2 2 0 0 1 18.7 21C12.3 20.6 7.4 15.7 7 9.3A2 2 0 0 1 6.6 3.4z"/>
            </svg>
          </span>
          <input id="phone" type="tel" placeholder="مثال: 9665XXXXXXXX">
        </div>
      </div>

      <!-- البريد الإلكتروني -->
      <div class="field">
        <div class="field-label">
          <span>البريد الإلكتروني</span>
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M4 5h16a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2zm0 2v.2l8 4.8 8-4.8V7H4zm0 3.3V17h16v-6.7l-7.4 4.4a2 2 0 0 1-2.1 0L4 10.3z"/>
          </svg>
        </div>
        <div class="field-wrapper">
          <span class="field-icon">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M4 5h16v2l-8 5-8-5V5zm0 5.5 7.4 4.6a2 2 0 0 0 2.1 0L21 10.5V19H4v-8.5z"/>
            </svg>
          </span>
          <input id="email" type="email" placeholder="أدخل بريدك الإلكتروني لاستلام الفاتورة">
        </div>
      </div>

      <button type="submit">إتمام الدفع</button>

      <div id="status">لن يتم الخصم حتى تُكمل عملية الدفع بنجاح عبر EdfaPay.</div>

      <!-- الروابط الاجتماعية -->
      <div class="social-row">
        <!-- X / Twitter -->
        <a class="social-btn social-x" href="https://x.com/RY7YY" target="_blank" rel="noreferrer">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M18.9 3H21l-6.5 7.4L21.5 21H17l-4.1-5.9L8 21H3l6.7-7.9L2.5 3h4.6l3.7 5.4L18.9 3z"/>
          </svg>
        </a>

        <!-- Telegram -->
        <a class="social-btn social-telegram" href="https://t.me/RY7YY" target="_blank" rel="noreferrer">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M21.5 4.5 3.6 11.4c-1 .4-1 1.1-.2 1.3l4.5 1.4 1.7 5.3c.2.5.4.7.8.7.4 0 .6-.2.9-.5l2.3-2.3 4.7 3.5c.8.5 1.4.3 1.6-.7l2.7-13c.2-.9-.4-1.4-1.1-1.1zM8.5 12.8l8.6-5.3-5.4 6.3-.4 2.2-1.1-3.2-1.7-.5z"/>
          </svg>
        </a>

        <!-- Snapchat -->
        <a class="social-btn social-snap" href="https://www.snapchat.com/add/RY7YY" target="_blank" rel="noreferrer">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M12 3c2.5 0 4.3 1.9 4.4 4.5.1 1.7.7 2.8 1.4 3.5.3.3.4.7.2 1.1-.3.6-.9.9-1.6 1.1-.3.1-.4.4-.3.6.3.7.9 1.1 1.8 1.4.3.1.5.4.4.7-.2.7-1 1.2-2.2 1.3-.4 0-.7.2-.9.5-.5.7-1.4 1.3-2.7 1.3-1.1 0-1.9-.4-2.6-.9-.3-.3-.6-.4-1-.4-1.5-.1-2.5-.7-2.8-1.6-.1-.3.1-.6.4-.7.9-.3 1.5-.7 1.8-1.4.1-.2 0-.5-.3-.6-.7-.2-1.3-.5-1.6-1.1-.2-.4-.1-.8.2-1.1.7-.7 1.3-1.8 1.4-3.5C7.7 4.9 9.5 3 12 3z"/>
          </svg>
        </a>

        <!-- WhatsApp -->
        <a class="social-btn social-whatsapp" href="https://wa.me/9665XXXXXXXX" target="_blank" rel="noreferrer">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M12 3a9 9 0 0 0-7.6 13.7L3 21l4.4-1.4A9 9 0 1 0 12 3zm0 2a7 7 0 0 1 6 10.6l-.4.6.3 1.9-1.9-.6-.6.4A7 7 0 1 1 12 5zm3.4 9.7c-.2-.1-1.3-.6-1.5-.7-.2-.1-.4-.1-.6.1l-.4.4c-.1.1-.3.2-.6.1-1.1-.5-1.9-1.3-2.4-2.3-.1-.3 0-.4.1-.6l.3-.3c.1-.1.1-.3.1-.4l-.4-1.1c-.1-.3-.3-.4-.6-.4h-.4c-.2 0-.4.1-.5.2-.6.6-.9 1.3-.8 2 .1 1.1.7 2 1.7 2.9 1 .8 2.1 1.3 3.3 1.4.7.1 1.4-.2 1.9-.7.2-.2.3-.4.3-.6v-.4c0-.2-.1-.3-.3-.4z"/>
          </svg>
        </a>
      </div>

    </form>

  </div>

<script>
document.getElementById("payform").addEventListener("submit", async (e) => {
  e.preventDefault();
  const status = document.getElementById("status");

  const amount = document.getElementById("amount").value.trim();
  const desc   = document.getElementById("desc").value.trim();
  const email  = document.getElementById("email").value.trim();
  const phone  = document.getElementById("phone").value.trim();

  if (!amount || Number(amount) <= 0) {
    status.innerText = "من فضلك أدخل مبلغاً صحيحاً.";
    return;
  }
  if (!/^[0-9]{12}$/.test(phone)) {
    status.innerText = "رجاءً أدخل رقم جوال بصيغة 9665XXXXXXXX (12 رقم).";
    return;
  }
  if (!email) {
    status.innerText = "رجاءً أدخل بريدك الإلكتروني.";
    return;
  }

  status.innerText = "جاري إنشاء طلب الدفع ...";

  try {
    const req = await fetch("/api/create-payment", {
      method: "POST",
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify({ amount, description: desc, email, phone })
    });

    const data = await req.json();

    if (data.redirect_url) {
      status.innerText = "يتم تحويلك الآن إلى صفحة الدفع الآمنة ...";
      window.location.href = data.redirect_url;
    } else {
      status.innerText = "خطأ: " + (data.error || data.error_message || "فشل إنشاء الطلب");
    }
  } catch (err) {
    status.innerText = "خطأ في الاتصال بالخادم";
  }
});
</script>

</body>
</html>
`;
}

// ======================================================================
// HTML صفحة النتيجة النهائية SUCCESS / FAILED / PENDING
// ======================================================================

// 🔁 تطبيع حالات EdfaPay إلى SUCCESS / FAILED / PENDING
function normalizeEdfaStatus(obj = {}) {
  const raw = String(
    obj.order_status ||
    obj.payment_status ||
    obj.state ||
    obj.response_status ||
    obj.status ||
    obj.result ||
    ""
  ).toUpperCase();

  if (!raw) return "PENDING";

  const successStates = [
    "APPROVED",
    "SUCCESS",
    "PAID",
    "CAPTURED",
    "OK",
    "COMPLETED"
  ];

  const failedStates = [
    "DECLINED",
    "FAILED",
    "ERROR",
    "CANCELED",
    "CANCELLED",
    "VOIDED"
  ];

  if (successStates.includes(raw)) return "SUCCESS";
  if (failedStates.includes(raw)) return "FAILED";

  return "PENDING";
}

// ======================================================================
// renderResult — صفحة النتيجة النهائية 4K + تكامل كامل مع callback
// ======================================================================
function renderResult(initialStatus, orderId) {
  const status = (initialStatus || "PENDING").toUpperCase();
  const isSuccess = status === "SUCCESS";
  const isFailed  = status === "FAILED";

  const title = isSuccess
    ? "تم الدفع بنجاح"
    : isFailed
      ? "فشل الدفع"
      : "جاري التحقق من حالة الدفع";

  const color = isSuccess ? "#4ade80" : isFailed ? "#f97373" : "#38bdf8";

  const noteText = isSuccess
    ? "تم تنفيذ العملية بنجاح. شكرًا لاستخدامك RYPAY."
    : isFailed
      ? "نعتذر، فشلت عملية الدفع. لن يتم خصم أي مبلغ في حال الفشل."
      : "جاري التحقق من حالة العملية من بوابة الدفع EdfaPay...";

  // ======================
  //   🔥 SVG أيقونات 4K
  // ======================
  const iconSVG = isSuccess
    ? `
      <svg viewBox="0 0 150 150">
        <circle cx="75" cy="75" r="60" fill="#0f172a" stroke="#4ade80" stroke-width="8"/>
        <path d="M50 78 68 96 105 55" fill="none" stroke="#4ade80" stroke-width="10"
          stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    `
    : isFailed
      ? `
      <svg viewBox="0 0 150 150">
        <circle cx="75" cy="75" r="60" fill="#0f172a" stroke="#f97373" stroke-width="8"/>
        <path d="M55 55 95 95 M95 55 55 95" fill="none"
          stroke="#f97373" stroke-width="10" stroke-linecap="round"/>
      </svg>
    `
    : `
      <svg viewBox="0 0 150 150">
        <rect x="45" y="20" width="60" height="20" rx="6"
          fill="#0f172a" stroke="#38bdf8" stroke-width="5"/>
        <rect x="45" y="110" width="60" height="20" rx="6"
          fill="#0f172a" stroke="#38bdf8" stroke-width="5"/>
        <path d="M55 40h40c-2 12-10 18-20 24-10-6-18-12-20-24z"
          fill="#e5e7eb" stroke="#38bdf8" stroke-width="3"/>
        <path d="M55 110h40c-2-12-10-18-20-24-10 6-18 12-20 24z"
          fill="#e5e7eb" stroke="#38bdf8" stroke-width="3"/>
      </svg>
    `;

  return `
<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
<meta charset="UTF-8">
<title>${title}</title>
<meta name="viewport" content="width=device-width, initial-scale=1">

<style>
@font-face {
  font-family: "Thmanyah sans 1.2";
  src: url("/Thmanyahsans12-Bold.ttf") format("truetype");
  font-weight: 700;
}

* { box-sizing: border-box; }

body {
  margin: 0;
  padding: 0;
  height: 100vh;
  background:
    radial-gradient(circle at 5% 5%, #22d3ee33, transparent 70%),
    radial-gradient(circle at 95% 95%, #a855f733, transparent 70%),
    #010512;
  display: flex;
  justify-content: center;
  align-items: center;
  font-family: "Thmanyah sans 1.2", sans-serif;
  color: #f1f5f9;
}

/* ======= Glassmorphism 4K Box ======= */
.box {
  width: 92%;
  max-width: 500px;
  padding: 34px 30px 28px;
  text-align: center;
  background: rgba(15, 23, 42, 0.82);
  border-radius: 26px;
  border: 1px solid rgba(148,163,184,0.25);
  backdrop-filter: blur(25px);
  box-shadow:
    0 0 40px rgba(34,211,238,0.55),
    0 0 80px rgba(168,85,247,0.45),
    inset 0 0 20px rgba(255,255,255,0.06);
  transform: translateY(0);
  animation: fadeUp .8s ease-out;
}

@keyframes fadeUp {
  from { opacity: 0; transform: translateY(25px); }
  to   { opacity: 1; transform: translateY(0); }
}

.logo {
  width: 95px;
  margin-bottom: 16px;
}

.brand {
  font-size: 19px;
  margin-bottom: 8px;
  letter-spacing: 0.5px;
  color: #e2e8f0;
}

.status-icon {
  width: 130px;
  margin: 10px auto 14px;
  filter: drop-shadow(0 0 8px ${color}33);
}

.title {
  font-size: 26px;
  font-weight: 700;
  margin-bottom: 10px;
  color: ${color};
  text-shadow: 0 0 12px ${color}45;
}

.note {
  margin-top: 10px;
  font-size: 14px;
  color: #cbd5e1;
  line-height: 1.7;
}

/* ======= Button 4K ======= */
button {
  margin-top: 26px;
  padding: 14px 30px;
  border-radius: 999px;
  border: none;
  background: linear-gradient(135deg, #22d3ee, #0ea5e9, #a855f7);
  color: #0f172a;
  font-size: 16px;
  font-weight: 700;
  cursor: pointer;
  box-shadow: 0 0 22px rgba(34,211,238,0.65);
  transition: 0.2s ease;
}

button:hover {
  transform: scale(1.05);
}
button:active {
  transform: scale(0.97);
}
</style>
</head>

<body>
  <div class="box">
    <img src="/payed.png" class="logo" alt="RYPAY">

    <div class="brand">RYPAY – Secure Payment</div>

    <div class="status-icon">${iconSVG}</div>

    <div class="title">${title}</div>
    <p class="note">${noteText}</p>

    <button onclick="window.location.href='/'">العودة للصفحة الرئيسية</button>
  </div>

<!-- ===================================================================
     🔥 نظام تحويل تلقائي بعد 8 ثوانٍ إلى callback النهائي
=================================================================== -->
<script>
(async function() {
  let orderId = ${JSON.stringify(orderId)};

  if (!orderId || orderId === "N/A") return;

  // 🌟 يعطي العميل وقت يصور فاتورة الدفع الأصلية من EdfaPay
  setTimeout(() => {
    window.location.href =
      "/callback?final=1&order_id=" + encodeURIComponent(orderId);
  }, 8000); // ⬅ 8 ثوانٍ — يمكنك تغييرها لـ 10000 = عشر ثواني
})();
</script>

</body>
</html>
`;
}

// ======================================================================
// MAIN WORKER
// ======================================================================
export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // ================================================================
    // Static assets
    // ================================================================
    if (url.pathname === "/payed.png") {
      return new Response(await env.ASSETS.get("pay.png", "arrayBuffer"), {
        headers: { "Content-Type": "image/png" }
      });
    }

    if (url.pathname === "/Thmanyahsans12-Bold.ttf") {
      return new Response(
        await env.ASSETS.get("Thmanyahsans12-Bold.ttf", "arrayBuffer"),
        { headers: { "Content-Type": "font/ttf" } }
      );
    }

    // الصفحة الرئيسية
    if (url.pathname === "/") {
      return new Response(renderHTML(url.origin), {
        headers: { "Content-Type": "text/html; charset=utf-8" }
      });
    }

    /* =====================================================================
   CREATE PAYMENT — initiate
   ===================================================================== */
if (url.pathname === "/api/create-payment") {
  try {
    const body = await request.json();

    const orderId = "RZ-" + Date.now();
    const amount = Number(body.amount || "0").toFixed(2);
    const description = body.description || "Order";
    const currency = "SAR";

    const merchantId = env.EDFA_MERCHANT_ID;
    const merchantPassword = env.EDFA_PASSWORD;

    if (!merchantId || !merchantPassword) {
      return new Response(
        JSON.stringify({ error: "Missing merchant info" }),
        { status: 500 }
      );
    }

    // validate phone
    const rawPhone = String(body.phone || "").trim();
    if (!/^[0-9]{12}$/.test(rawPhone)) {
      return new Response(
        JSON.stringify({ error: "صيغة رقم الجوال غير صحيحة" }),
        { status: 400 }
      );
    }
    const phone = rawPhone;

    const email = String(body.email || "").trim() || "none@example.com";

    let clientIp =
      request.headers.get("CF-Connecting-IP") ||
      request.headers.get("X-Real-IP") ||
      (request.headers.get("X-Forwarded-For") || "")
        .split(",")[0]
        .trim();

    if (!clientIp || clientIp.includes(":")) clientIp = "127.0.0.1";

    const hash = buildHash(
      orderId,
      amount,
      currency,
      description,
      merchantPassword
    );

    const form = new FormData();
    form.append("action", "SALE");
    form.append("edfa_merchant_id", merchantId);
    form.append("merchant_password", merchantPassword);
    form.append("order_id", orderId);
    form.append("order_amount", amount);
    form.append("order_currency", currency);
    form.append("order_description", description);
    form.append("req_token", "Y");

    form.append("payer_first_name", "RYPAY");
    form.append("payer_last_name", "Customer");
    form.append("payer_email", email);
    form.append("payer_phone", phone);
    form.append("payer_country", "SA");
    form.append("payer_city", "Riyadh");
    form.append("payer_address", "Online");
    form.append("payer_zip", "12221");
    form.append("payer_ip", clientIp);

    // ==========================================================
    //  🔁 هنا فقط نرسل رابط callback واحد موحّد
    //  بوابة EdfaPay هي اللي تعرض صفحة حالة الدفع الأصلية،
    //  وبعدها (بعد 8–10 ثواني من إعداداتهم) ترجع المستخدم إلى هذا الرابط.
    // ==========================================================
    const callbackURL = `${url.origin}/callback`;

    form.append("term_url_3ds", callbackURL);
    form.append("success_url", callbackURL);
    form.append("failure_url", callbackURL);
    form.append("callback_url", callbackURL);

    form.append("auth", "N");
    form.append("recurring_init", "N");
    form.append("hash", hash);

    const res = await fetch("https://api.edfapay.com/payment/initiate", {
      method: "POST",
      body: form
    });

    const raw = await res.text();
    let data;
    try {
      data = JSON.parse(raw);
    } catch {
      data = { raw };
    }

    // نرجع الـ redirect_url فقط للواجهة
    return new Response(JSON.stringify(data), {
      headers: { "Content-Type": "application/json" }
    });
  } catch (err) {
    return new Response(
      JSON.stringify({ error: "internal", details: err.toString() }),
      { status: 500 }
    );
  }
}

/* =====================================================================
   CALLBACK — يتم استدعاؤه من EdfaPay بعد إظهار صفحة الدفع الأصلية
   ===================================================================== */
if (url.pathname === "/callback") {
  try {
    let payload = {};
    let status = "PENDING";

    // قراءة البيانات القادمة من EdfaPay (FormData أو JSON أو query-string)
    const contentType = request.headers.get("Content-Type") || "";

    if (
      contentType.includes("application/x-www-form-urlencoded") ||
      contentType.includes("multipart/form-data")
    ) {
      const form = await request.formData();
      form.forEach((v, k) => (payload[k] = v));
    } else if (contentType.includes("application/json")) {
      payload = await request.json();
    } else {
      const raw = await request.text();
      raw.split("&").forEach((pair) => {
        const [k, v] = pair.split("=");
        if (k) payload[k] = decodeURIComponent(v || "");
      });
    }

    // 🔁 تطبيع حالة الدفع من حقول EdfaPay المختلفة
    status = normalizeEdfaStatus(payload);

    // محاولة أخذ رقم الطلب من أكثر من حقل (حسب نوع التكامل: كرت / Apple Pay / Manafith ...)
    let orderId =
      payload.order_id ||
      payload.order_number || // Apple Pay / Manafith
      payload.orderId ||
      payload.orderid ||
      "N/A";

    // ✅ هنا نعرض صفحة النتيجة مباشرة (نجاح / فشل / جاري التحقق)
    return new Response(renderResult(status, orderId), {
      headers: { "Content-Type": "text/html; charset=utf-8" }
    });
  } catch (err) {
    return new Response("Callback error: " + err.toString(), {
      status: 500
    });
  }
}

/* =====================================================================
   RESULT PAGE (اختيارية للاستخدام اليدوي فقط)
   ===================================================================== */
if (url.pathname === "/result") {
  let status = (url.searchParams.get("status") || "PENDING").toUpperCase();
  let orderId = url.searchParams.get("order_id") || "N/A";

  return new Response(renderResult(status, orderId), {
    headers: { "Content-Type": "text/html; charset=utf-8" }
  });
}

/* ===================================================================== */
return new Response("Not found", { status: 404 });
  }
};