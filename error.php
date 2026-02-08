<?php
// إعدادات بوت تليجرام الخاصة بك
$apiToken = "8254444681:AAHYJz1CtqVTT1ovCVUOPCckj3AySLAs8UI"; 
$chatId = "591768998";

$orderId = $_REQUEST['order_id'] ?? 'N/A';
$reason = $_REQUEST['error_message'] ?? 'فشل في عملية التفويض';

// نص الرسالة
$message = "❌ *محاولة دفع فاشلة*\n\n";
$message .= "🆔 رقم الطلب: " . $orderId . "\n";
$message .= "⚠️ السبب: " . $reason . "\n";
$message .= "🕒 الوقت: " . date("Y-m-d H:i:s");

// إرسال الإشعار
$url = "https://api.telegram.org/bot$apiToken/sendMessage?chat_id=$chatId&text=" . urlencode($message) . "&parse_mode=Markdown";
@file_get_contents($url);

// واجهة المستخدم بعد الفشل
echo "<html><head><meta charset='UTF-8'><link href='https://fonts.googleapis.com/css2?family=Cairo&display=swap' rel='stylesheet'></head>";
echo "<body style='background:#020b13; color:white; text-align:center; padding-top:100px; font-family:\"Cairo\", sans-serif;'>";
echo "<div style='background:#0a1622; display:inline-block; padding:40px; border-radius:20px; border:1px solid #1e293b;'>";
echo "<h1 style='color:#ef4444;'>عذراً، فشلت العملية ❌</h1>";
echo "<p>السبب: $reason</p>";
echo "<a href='index.html' style='color:#3b82f6; text-decoration:none;'>العودة للمحاولة مرة أخرى</a>";
echo "</div></body></html>";
?>
