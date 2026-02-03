<?php
// =======================================================
// DOLR PAY – EdfaPay Payment Initiator
// =======================================================

// 🔐 === البيانات التي تحتاج تغييرها ===
// احصل على هذه البيانات من لوحة تحكم أدف باي (EdfaPay)
 $MERCHANT_ID = "ضع_هنا_الmerchant_ID"; 
 $MERCHANT_PASSWORD = "ضع_هنا_الmerchant_Password";

// رابط الـ API الخاص بـ Adfapay
 $EDFA_URL = "https://api.edfapay.com/payment/initiate";

header("Content-Type: application/json; charset=utf-8");

// قراءة البيانات القادمة من الواجهة (GitHub Pages)
 $raw = file_get_contents("php://input");
 $body = json_decode($raw, true);

 $amount = isset($body["amount"]) ? number_format((float)$body["amount"], 2, ".", "") : "0.00";
 $description = trim($body["description"] ?? "Order");
 $email = trim($body["email"] ?? "none@example.com");
 $phone = preg_replace('/\D+/', '', $body["phone"] ?? ""); // تنظيف الرقم من أي رموز

// =======================================================
// التحقق من صحة البيانات
// =======================================================
if ($amount <= 0) {
  echo json_encode(["error" => "مبلغ غير صالح"]);
  exit;
}

// التأكد أن رقم الجوال سعودي ويبدأ بـ 5 (مثال)
if (!preg_match('/^[5][0-9]{8}$/', $phone)) {
  echo json_encode(["error" => "صيغة رقم الجوال يجب أن تكون 9 أرقام وتبدأ بـ 5 (مثال: 512345678)"]);
  exit;
}

// =======================================================
// تجهيز بيانات الطلب
// =======================================================
 $orderId  = "DOLR-" . time(); // بادئة Dolr للطلبات
 $currency = "SAR";

// حفظ الطلب محلياً (محاكاة قاعدة البيانات)
 $storeFile = __DIR__ . "/orders.json";
 $orders = [];
if (file_exists($storeFile)) {
    $orders = json_decode(file_get_contents($storeFile), true);
    if (!is_array($orders)) $orders = [];
}

 $orders[$orderId] = [
    "order_id"    => $orderId,
    "amount"      => $amount,
    "currency"    => $currency,
    "description" => $description,
    "email"       => $email,
    "phone"       => $phone,
    "status"      => "PENDING",
    "created_at"  => time()
];
file_put_contents($storeFile, json_encode($orders, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));

// =======================================================
// حساب التوقيع (HASH)
// الصيغة: sha1(md5(UPPER(orderId + amount + currency + description + password)))
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
// === روابط العودة (Callback URLs) ===
// ⚠️ قم بتغيير الدومين هنا إلى الدومين الخاص باستضافة الـ PHP
// =======================================================
 $myDomain = "https://your-php-domain.com/buytvapp"; 

// =======================================================
// إعداد الحقول المرسلة للبنك
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
  "payer_ip" => $_SERVER["REMOTE_ADDR"] ?? "127.0.0.1",

  // روابط العودة والاستقبال
  "term_url_3ds" => "$myDomain/callback.php",
  "success_url"  => "$myDomain/callback.php", // يمكن جعلها success.php إذا فضلت
  "failure_url"  => "$myDomain/callback.php", // يمكن جعلها error.php
  "callback_url" => "$myDomain/callback.php",

  "auth" => "N",
  "recurring_init" => "N",
  "hash" => $hash // التوقيع
];

// =======================================================
// إرسال الطلب للبنك
// =======================================================
 $ch = curl_init($EDFA_URL);
curl_setopt_array($ch, [
  CURLOPT_POST => true,
  CURLOPT_POSTFIELDS => $form,
  CURLOPT_RETURNTRANSFER => true,
  CURLOPT_TIMEOUT => 40,
  CURLOPT_SSL_VERIFYPEER => true,
  CURLOPT_HTTPHEADER => ["Accept: application/json"]
]);

 $response = curl_exec($ch);
 $error = curl_error($ch);
curl_close($ch);

// =======================================================
// معالجة الرد
// =======================================================
if (!$response) {
  echo json_encode(["error" => "فشل الاتصال ببوابة الدفع", "details" => $error]);
  exit;
}

 $data = json_decode($response, true);

// إذا كان الرد يحتوي على HTML للفورم المباشر (3DS)
if (isset($data['html'])) {
    echo json_encode(["html" => $data['html']]);
    exit;
}

// إذا كان الرد يحتوي على رابط توجيه
if (isset($data['redirect_url'])) {
    echo json_encode(["redirect_url" => $data['redirect_url']]);
    exit;
}

// في حال حدث خطأ من البنك
echo json_encode([
    "error" => "رد غير متوقع من البوابة",
    "raw" => $response
]);
?>
