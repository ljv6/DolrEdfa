<?php
// =======================================================
// DOLR PAY – EdfaPay Payment Initiator
// =======================================================

// 🔐 === بيانات التاجر (محدثة) ===
 $MERCHANT_ID = "983c9669-9278-4dd1-950f-8b8fbb0a14d2";
 $MERCHANT_PASSWORD = "7ceb6437-92bc-411b-98fa-be054b39eaba";

// Endpoint
 $EDFA_URL = "https://api.edfapay.com/payment/initiate";

header("Content-Type: application/json; charset=utf-8");

// =======================================================
// Read JSON body
// =======================================================
 $raw = file_get_contents("php://input");
 $body = json_decode($raw, true);

 $amount = isset($body["amount"]) ? number_format((float)$body["amount"], 2, ".", "") : "0.00";
 $description = trim($body["description"] ?? "Order");
 $email = trim($body["email"] ?? "none@example.com");
 $phone = preg_replace('/\D+/', '', $body["phone"] ?? "");

// =======================================================
// Validate
// =======================================================
if ($amount <= 0) {
  echo json_encode(["error" => "مبلغ غير صالح"]);
  exit;
}

if (!preg_match('/^[5][0-9]{8}$/', $phone)) {
  echo json_encode(["error" => "صيغة رقم الجوال غير صحيحة (يجب أن يبدأ بـ 5 ويتكون من 9 أرقام)"]);
  exit;
}

// =======================================================
// Order data (MATCH worker.js logic)
// =======================================================
 $orderId  = "DOLR-" . time();
 $currency = "SAR";

// =======================
// حفظ الطلب محليًا
// =======================
 $storeFile = __DIR__ . "/orders.json";

 $orders = [];
if (file_exists($storeFile)) {
    $orders = json_decode(file_get_contents($storeFile), true);
    if (!is_array($orders)) {
        $orders = [];
    }
}

 $orders[$orderId] = [
    "order_id"    => $orderId,
    "amount"      => $amount,
    "currency"    => $currency,
    "description" => $description,
    "email"       => $email,
    "phone"       => $phone,
    "created_at"  => time(),
    "status"      => "PENDING"
];

file_put_contents(
    $storeFile,
    json_encode($orders, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE)
);

// =======================================================
// Client IP
// =======================================================
 $clientIp =
  $_SERVER["HTTP_CF_CONNECTING_IP"] ??
  $_SERVER["HTTP_X_FORWARDED_FOR"] ??
  $_SERVER["REMOTE_ADDR"] ??
  "127.0.0.1";

if (strpos($clientIp, ":") !== false) {
  $clientIp = "127.0.0.1";
}

// =======================================================
// HASH (IDENTICAL TO worker.js)
// sha1(md5(UPPER(orderId + amount + currency + description + password)))
// =======================================================
 $hashBase = strtoupper(
  $orderId .
  $amount .
  $currency .
  $description .
  $MERCHANT_PASSWORD
);
 $hash = sha1(md5($hashBase));

// =======================================================
// === تحديث روابط العودة (مهم جداً) ===
// يجب عليك تغيير الرابط أدناه إلى رابط موقعك الحقيقي (الذي يوجد عليه ملفات PHP)
// =======================================================
 $myDomain = "https://your-domain.com/buytvapp"; 

// =======================================================
// Build multipart/form-data
// =======================================================
 $form = [
  "action" => "SALE",
  "edfa_merchant_id" => $MERCHANT_ID,

  "order_id" => $orderId,
  "order_amount" => $amount,
  "order_currency" => $currency,
  "order_description" => $description,
  "req_token" => "Y",

  "payer_first_name" => "Dolr",
  "payer_last_name" => "Customer",
  "payer_email" => $email,
  "payer_phone" => $phone,
  "payer_country" => "SA",
  "payer_city" => "Riyadh",
  "payer_address" => "Online",
  "payer_zip" => "12221",
  "payer_ip" => $clientIp,

  // روابط الإشعارات
  "term_url_3ds" => "$myDomain/callback.php",
  "success_url"  => "$myDomain/callback.php",
  "failure_url"  => "$myDomain/callback.php",
  "callback_url" => "$myDomain/callback.php",

  "auth" => "N",
  "recurring_init" => "N",

  // HASH فقط
  "hash" => $hash
];

// =======================================================
// Send request (multipart)
// =======================================================
 $ch = curl_init($EDFA_URL);
curl_setopt_array($ch, [
  CURLOPT_POST => true,
  CURLOPT_POSTFIELDS => $form, // multipart
  CURLOPT_RETURNTRANSFER => true,
  CURLOPT_TIMEOUT => 40,
  CURLOPT_SSL_VERIFYPEER => true,
  CURLOPT_SSL_VERIFYHOST => 2,
  CURLOPT_HTTPHEADER => [
    "Accept: application/json"
  ]
]);

 $response = curl_exec($ch);
 $error = curl_error($ch);
curl_close($ch);

// =======================================================
// Handle response
// =======================================================
if (!$response) {
  echo json_encode([
    "error" => "فشل الاتصال ببوابة الدفع",
    "details" => $error
  ]);
  exit;
}

// حاول JSON
 $data = json_decode($response, true);
if (is_array($data)) {
    // إذا كان الرد يحتوي على HTML للفورم (3DS)
    if (isset($data['html'])) {
        echo json_encode(["html" => $data['html']]);
        exit;
    }
    // إذا كان رابط تحويل
    echo json_encode($data);
    exit;
}

// fallback
echo json_encode([
  "error" => "رد غير متوقع من البوابة",
  "raw" => $response
]);
?>
