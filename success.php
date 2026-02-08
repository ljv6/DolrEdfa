<?php
// إعدادات بوت تليجرام الخاصة بك
$apiToken = "8254444681:AAHYJz1CtqVTT1ovCVUOPCckj3AySLAs8UI"; 
$chatId = "591768998";

// استلام البيانات من بوابة الدفع
$orderId = $_REQUEST['order_id'] ?? 'N/A';
$amount = $_REQUEST['order_amount'] ?? '0.00';
$email = $_REQUEST['payer_email'] ?? 'غير معروف';

// نص الرسالة
$message = "✅ *عملية دفع ناجحة جديدة*\n\n";
$message .= "💰 المبلغ: " . $amount . " SAR\n";
$message .= "🆔 رقم الطلب: " . $orderId . "\n";
$message .= "📧 البريد: " . $email . "\n";
$message .= "🕒 الوقت: " . date("Y-m-d H:i:s");

// إرسال الإشعار
$url = "https://api.telegram.org/bot$apiToken/sendMessage?chat_id=$chatId&text=" . urlencode($message) . "&parse_mode=Markdown";
@file_get_contents($url);

// واجهة المستخدم بعد النجاح
echo "<html><head><meta charset='UTF-8'><link href='https://fonts.googleapis.com/css2?family=Cairo&display=swap' rel='stylesheet'></head>";
echo "<body style='background:#020b13; color:white; text-align:center; padding-top:100px; font-family:\"Cairo\", sans-serif;'>";
echo "<div style='background:#0a1622; display:inline-block; padding:40px; border-radius:20px; border:1px solid #1e293b;'>";
echo "<h1 style='color:#22c55e;'>تم الدفع بنجاح! ✅</h1>";
echo "<p>رقم العملية: $orderId</p>";
echo "<p>تم إرسال تفاصيل الدفع إلى بريدك الإلكتروني.</p>";
echo "</div></body></html>";
?>
