export default async function handler(req, res) {
    if (req.method === 'POST') {
        const data = req.body;
        
        const botToken = "8254444681:AAHYJz1CtqVTT1ovCVUOPCckj3AySLAs8UI";
        const chatId = "591768998";

        // محاولة قراءة البيانات بأكثر من اسم (لضمان الدقة)
        const orderId = data.order_id || data.orderid || "غير معروف";
        const status = data.status || data.result || "لا توجد حالة";
        const amount = data.order_amount || data.amount || "0";
        const currency = data.order_currency || data.currency || "SAR";

        // أيقونة الحالة بناءً على النص القادم من البنك
        let icon = '⚠️';
        if (status.toLowerCase() === 'success' || status.toLowerCase() === 'approved') {
            icon = '✅';
        } else if (status.toLowerCase() === 'error' || status.toLowerCase() === 'declined') {
            icon = '❌';
        }
        
        const message = `${icon} *تحديث دفع حقيقي*\n\n` +
                        `🆔 رقم الطلب: ${orderId}\n` +
                        `💰 المبلغ المستلم: ${amount} ${currency}\n` +
                        `📊 الحالة البرمجية: ${status}\n\n` +
                        `ℹ️ _ملاحظة: إذا ظهر المبلغ 0، راجع لوحة تحكم إدفع باي للتأكد من مسمى الحقول._`;

        try {
            await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    chat_id: chatId,
                    text: message,
                    parse_mode: 'Markdown'
                })
            });
            return res.status(200).send('OK');
        } catch (error) {
            return res.status(500).send('Error');
        }
    }
    res.status(405).send('Method Not Allowed');
}
