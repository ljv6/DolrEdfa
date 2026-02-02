let selectedAmount = null;

function selectAmount(amount) {
  selectedAmount = amount;
  document.getElementById("amount").value = amount;
}

function payNow() {
  const inputAmount = document.getElementById("amount").value;
  const amount = selectedAmount || Number(inputAmount);

  if (!amount || amount <= 0) {
    alert("الرجاء إدخال مبلغ صحيح");
    return;
  }

  // تحويل تجريبي – نربطه لاحقًا مع API ادفع باي الحقيقي
  const paymentUrl = `https://pay.adfpay.com?amount=${amount}&currency=SAR`;

  window.location.href = paymentUrl;
}
