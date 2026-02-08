export default async function handler(req, res) {
    // التأكد من أن الطلب القادم هو POST (كما يفعل البنك)
    if (req.method === 'POST') {
        
        // محاولة جلب البيانات سواء كانت JSON أو Form
        const data = req.body;
        
        const botToken = "8254444681:AAHYJz1CtqVTT1ovCVUOPCckj3AySLAs8UI";
        const chatId = "591768998";

        // استخراج المعلومات الأساسية
        const orderId = data.order_id || "غير معروف";
        const status = data.status || "لا توجد حالة";
        const amount = data.order_amount || "0";
        const currency = data.order_currency || "SAR";

        // أيقونة الحالة
        const icon = status === 'success' ? '✅' : '❌';
        
        const message = `${icon} *تحديث كول باك جديد*\n\n` +
                        `🆔 رقم الطلب: ${orderId}\n` +
                        `💰 المبلغ: ${amount} ${currency}\n` +
                        `📊 الحالة: ${status}`;

        try {
            // إرسال الإشعار للبوت
            await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    chat_id: chatId,
                    text: message,
                    parse_mode: 'Markdown'
                })
            });

            // الرد على البنك بـ OK (ضروري جداً)
            return res.status(200).send('OK');
        } catch (error) {
            return res.status(500).send('Error');
        }
    }

    // إذا تم فتح الرابط بالمتصفح
    res.status(405).send('بانتظار بيانات البنك...');
}
