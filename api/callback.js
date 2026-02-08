export default async function handler(req, res) {
    // البنك يرسل البيانات بطريقة POST
    if (req.method === 'POST') {
        const data = req.body;

        // بيانات البوت الخاصة بك
        const botToken = "8254444681:AAHYJz1CtqVTT1ovCVUOPCckj3AySLAs8UI";
        const chatId = "591768998";

        // تنسيق الرسالة التي ستصلك
        const statusIcon = data.status === 'success' ? '✅' : '❌';
        const message = `${statusIcon} *تحديث دفع من السيرفر*\n\n` +
                        `🆔 رقم الطلب: ${data.order_id}\n` +
                        `💰 المبلغ: ${data.order_amount} ${data.order_currency}\n` +
                        `📧 البريد: ${data.payer_email}\n` +
                        `📊 الحالة: ${data.status}\n` +
                        `📝 الوصف: ${data.order_description}`;

        // إرسال البيانات لتليجرام عبر Fetch
        await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: chatId,
                text: message,
                parse_mode: 'Markdown'
            })
        });

        // الرد على "إدفع باي" بأن الرسالة وصلت بنجاح
        return res.status(200).json({ status: "ok" });
    }

    // إذا حاول شخص فتح الرابط بالمتصفح يظهر له هذا الخطأ
    res.status(405).send('فقط لاستقبال بيانات البنك');
}
