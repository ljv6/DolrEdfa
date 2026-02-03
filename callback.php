<?php
// =======================================================
// DOLR PAY – Payment Callback Handler
// =======================================================
header("Content-Type: text/html; charset=utf-8");

 $settingsFile = __DIR__ . "/settings.json";
 $storeFile = __DIR__ . "/orders.json";

// === إعدادات تيليجرام ===
// أنشئ ملف settings.json وضع فيه التوكن والشات أيدي بهذا الشكل:
// {"telegram_bot_token": "12345:ABC...", "telegram_chat_id": "123456", "admin_whatsapp_number": "9665000000"}
 $TELEGRAM_BOT_TOKEN = ""; 
 $TELEGRAM_CHAT_ID  = "";
 $ADMIN_WHATSAPP = "";

if (file_exists($settingsFile)) {
    $settings = json_decode(file_get_contents($settingsFile), true);
    if (is_array($settings)) {
        $TELEGRAM_BOT_TOKEN = $settings['telegram_bot_token'] ?? '';
        $TELEGRAM_CHAT_ID  = $settings['telegram_chat_id'] ?? '';
        $ADMIN_WHATSAPP    = $settings['admin_whatsapp_number'] ?? '';
    }
}

// ==========================================
// 1. التحقق من الحالة الداخلية (للمعاينة)
// ==========================================
if (isset($_GET['mode']) && $_GET['mode'] === 'check_status') {
    if (file_exists($storeFile)) {
        $orders = json_decode(file_get_contents($storeFile), true);
        $id = $_GET['order_id'] ?? '';
        echo json_encode(['status' => (isset($orders[$id]) ? ($orders[$id]['status'] ?? 'PENDING') : 'NOT_FOUND')]);
    } else { echo json_encode(['status' => 'NOT_FOUND']); }
    exit;
}

// ==========================================
// 2. جمع البيانات القادمة (POST/GET/JSON)
// ==========================================
 $rawInput = file_get_contents("php://input");
 $jsonInput = json_decode($rawInput, true);
 $payload = [];
if (!empty($_GET)) $payload = array_merge($payload, $_GET);
if (is_array($jsonInput)) $payload = array_merge($payload, $jsonInput);
if (!empty($_POST)) $payload = array_merge($payload, $_POST);

// تحميل الطلبات
 $orders = [];
if (file_exists($storeFile)) {
    $orders = json_decode(file_get_contents($storeFile), true);
    if (!is_array($orders)) $orders = [];
}

 $orderId = $payload['order_id'] ?? $payload['merchant_order_id'] ?? $payload['ref'] ?? 'N/A';
 $amount = $payload['amount'] ?? $payload['total'] ?? 0;
 $trx = $payload['transaction_id'] ?? $payload['trans_id'] ?? 'N/A';

// ==========================================
// 3. توحيد حالة الطلب
// ==========================================
function normalizeStatus($data) {
    $result = strtoupper($data['result'] ?? ''); 
    $status = strtoupper($data['status'] ?? $data['payment_status'] ?? ''); 
    $code = strtoupper($data['response_code'] ?? '');
    
    if ($result === 'SUCCESS') return 'SUCCESS';
    if (in_array($status, ['SETTLED','CAPTURED','APPROVED','PAID','COMPLETED','AUTH'])) return 'SUCCESS';
    if (in_array($code, ['1','00','000'])) return 'SUCCESS';
    if ($result === 'FAILED') return 'FAILED';
    if (in_array($status, ['DECLINED','FAILED','VOIDED','EXPIRED','REJECTED'])) return 'FAILED';
    if (in_array($code, ['2','3','4','9'])) return 'FAILED';
    return 'PENDING';
}

 $status = normalizeStatus($payload);

// ==========================================
// 4. تحديث ملف الطلبات
// ==========================================
if (isset($orders[$orderId])) {
    // تحديث الحالة فقط إذا لم تكن نجحت مسبقاً
    if (($orders[$orderId]['status'] ?? '') !== 'SUCCESS') {
        $orders[$orderId]['status'] = $status;
        $orders[$orderId]['updated_at'] = time();
        $orders[$orderId]['trx_id'] = $trx;
        if (!isset($orders[$orderId]['amount'])) $orders[$orderId]['amount'] = $amount;
        
        file_put_contents($storeFile, json_encode($orders, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE), LOCK_EX);
        
        if ($status === 'SUCCESS') {
            sendTelegramNotification($orderId, $amount, $trx, $orders[$orderId], $payload);
            // استدعاء الواتساب الآلي (إذا وجد السكربت)
            $autoSendUrl = "https://" . $_SERVER['HTTP_HOST'] . dirname($_SERVER['PHP_SELF']) . "/auto_send.php?order_id=$orderId";
            @file_get_contents($autoSendUrl);
        }
    }
}

// دالة إرسال التيليجرام
function sendTelegramNotification($orderId, $amount, $trx, $orderDetails, $fullPayload) {
    global $TELEGRAM_BOT_TOKEN, $TELEGRAM_CHAT_ID;
    if (empty($TELEGRAM_BOT_TOKEN) || empty($TELEGRAM_CHAT_ID)) return;
    
    $phone = $orderDetails['phone'] ?? 'غير متوفر'; 
    $date = date('Y-m-d H:i');
    
    // تغيير اسم المتجر إلى Dolr
    $message = "<b>💰 Dolr - New Payment!</b>\n———————————————\n🆔 <b>Order ID:</b> <code>$orderId</code>\n💵 <b>Amount:</b> $amount SAR\n📱 <b>Phone:</b> $phone\n———————————————\n🆔 <b>Trx ID:</b>\n<code>$trx</code>\n📅 <b>Date:</b> $date";
    
    $url = "https://api.telegram.org/bot" . $TELEGRAM_BOT_TOKEN . "/sendMessage";
    $data = ['chat_id' => $TELEGRAM_CHAT_ID, 'text' => $message, 'parse_mode' => 'HTML', 'disable_web_page_preview' => true];
    @file_get_contents($url . "?" . http_build_query($data));
}

// ==========================================
// 5. عرض الصفحة (UI)
// ==========================================
 $isSuccess = ($status === 'SUCCESS'); 
 $isFailed = ($status === 'FAILED'); 
 $isPending = ($status === 'PENDING');

// جلب تفاصيل العرض
 $title  = $isSuccess ? 'تم الدفع بنجاح' : ($isFailed ? 'فشلت عملية الدفع' : 'جاري التحقق');
 $msg   = $isSuccess ? 'تم استلام المبلغ بنجاح عبر Dolr. سيتم تفعيل الخدمة خلال لحظات.' : ($isFailed ? 'لم تتم عملية الدفع بنجاح.' : 'تم استلام الطلب، جاري التحقق من حالة الدفع مع البنك.');
 $details = $orders[$orderId] ?? null;

?>
<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title><?= $title ?> | Dolr</title>
<style>
@import url('https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700;800&display=swap');
:root { --bg-deep: #050507; --bg-card: rgba(25, 25, 30, 0.7); --border: rgba(255, 255, 255, 0.08); --success: #10b981; --error: #ef4444; --whatsapp: #25D366; --text-main: #ffffff; --text-muted: #94a3b8; --radius: 24px; }
* { box-sizing: border-box; margin: 0; padding: 0; outline: none; }
body { font-family: 'Tajawal', sans-serif; background-color: var(--bg-deep); background-image: radial-gradient(circle at 50% 0%, rgba(16, 185, 129, 0.15), transparent 50%); min-height: 100vh; display: flex; justify-content: center; align-items: center; color: var(--text-main); padding: 24px; }
.container { width: 100%; max-width: 480px; background: var(--bg-card); backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px); border: 1px solid var(--border); border-radius: var(--radius); padding: 40px; text-align: center; box-shadow: 0 30px 60px -15px rgba(0, 0, 0, 0.6); animation: slideUp 0.6s ease; }
@keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
.icon-wrapper { width: 80px; height: 80px; margin: 0 auto 25px; border-radius: 50%; display: flex; align-items: center; justify-content: center; background: rgba(255,255,255,0.03); }
.container.success .icon-wrapper { background: rgba(16, 185, 129, 0.1); box-shadow: 0 0 40px rgba(16, 185, 129, 0.2); color: var(--success); }
.container.fail .icon-wrapper { color: var(--error); background: rgba(239, 68, 68, 0.1); }
h1 { font-size: 26px; font-weight: 800; margin-bottom: 10px; color: #fff; }
p.message { font-size: 15px; color: var(--text-muted); line-height: 1.6; margin-bottom: 25px; }
.details-box { background: rgba(0, 0, 0, 0.3); border-radius: 16px; padding: 20px; margin-bottom: 25px; text-align: right; }
.row { display: flex; justify-content: space-between; font-size: 13px; margin-bottom: 8px; border-bottom: 1px solid rgba(255,255,255,0.05); padding-bottom: 8px; }
.row:last-child { border: none; margin: 0; padding: 0; }
.lbl { color: var(--text-muted); font-weight: 500; }
.val { color: #fff; font-weight: 700; font-family: monospace; direction: ltr; }
.btn { display: flex; justify-content: center; align-items: center; gap: 8px; width: 100%; padding: 16px; border-radius: 12px; background: rgba(255,255,255,0.05); color: white; text-decoration: none; font-weight: 700; transition: 0.3s; border: 1px solid var(--border); margin-bottom: 10px; }
.btn:hover { background: rgba(255,255,255,0.1); }
.btn.wa { background: #25D366; border-color: #128C7E; color: white; }
.btn.wa:hover { background: #1ebc57; }
.spinner { width: 30px; height: 30px; border: 3px solid rgba(255,255,255,0.1); border-top-color: #fff; border-radius: 50%; animation: spin 1s infinite linear; margin: 0 auto; }
@keyframes spin { to { transform: rotate(360deg); } }
</style>
</head>
<body>
<div class="container <?= $isSuccess ? 'success' : ($isFailed ? 'fail' : '') ?>">
  <div class="icon-wrapper">
    <?php if ($isSuccess): ?><svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
    <?php elseif ($isFailed): ?><svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
    <?php else: ?><div class="spinner"></div><?php endif; ?>
  </div>
  
  <h1><?= $title ?></h1>
  <p class="message"><?= $msg ?></p>
  
  <?php if ($details): ?>
  <div class="details-box">
    <div class="row"><span class="lbl">رقم الطلب</span><span class="val"><?= htmlspecialchars($orderId) ?></span></div>
    <div class="row"><span class="lbl">المبلغ</span><span class="val" style="color:var(--success)"><?= number_format($details['amount']) ?> SAR</span></div>
    <div class="row"><span class="lbl">التاريخ</span><span class="val"><?= date('Y-m-d H:i', $details['created_at']) ?></span></div>
  </div>
  <?php endif; ?>

  <?php if ($isSuccess && !empty($ADMIN_WHATSAPP)): ?>
  <a href="https://wa.me/<?= $ADMIN_WHATSAPP ?>?text=<?= urlencode("مرحباً، قمت بالدفع عبر Dolr والطلب رقم: " . $orderId) ?>" class="btn wa">
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.008-.57-.008-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
    تواصل مع الدعم
  </a>
  <?php endif; ?>
  
  <a href="/index.html" class="btn">العودة للرئيسية</a>
</div>
<script>
// تحديث الصفحة تلقائياً إذا كانت الحالة معلقة
<?php if ($isPending): ?>
setTimeout(function(){ window.location.reload(); }, 5000);
<?php endif; ?>
</script>
</body>
</html>
