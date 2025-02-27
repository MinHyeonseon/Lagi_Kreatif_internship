document.getElementById("checkoutForm").addEventListener("submit", function(event) {
    event.preventDefault();

    console.log("🔹 Checkout form submitted.");

    let cartRows = document.querySelectorAll(".cart-row");
    let cartItems = [];
    let selectedPayment = document.querySelector("input[name='payment_method']:checked");

    if (!selectedPayment) {
        alert("🚨 Please select a payment method.");
        return;
    }

    // 🔹 결제 수단에서 확장자(.png, .jpg 등) 제거
    let paymentMethod = selectedPayment.value.replace(/\.[^/.]+$/, "");

    cartRows.forEach(row => {
        let title = row.querySelector("td:first-child").textContent;
        let price = parseFloat(row.querySelector(".cart-price").dataset.price);
        let quantityElement = row.querySelector(".quantity-selector");

        let quantity = quantityElement ? parseInt(quantityElement.value) : 1;  // 수량 선택이 있으면 가져오고 없으면 1로 설정

        cartItems.push({ title, price, quantity });
    });

    if (cartItems.length === 0) {
        console.log("🚨 No items selected for checkout!");
        alert("🚨 Please select at least one item to checkout.");
        return;
    }

    console.log("✅ Sending checkout data:", cartItems);

    let formData = {
        name: document.getElementById("name").value,
        phone: document.getElementById("phone").value,
        address1: document.getElementById("address1").value,
        address2: document.getElementById("address2").value,
        city: document.getElementById("city").value,
        postcode: document.getElementById("postcode").value,
        note: document.getElementById("note").value,
        payment_method: paymentMethod,  // 🔹 수정된 부분 (확장자 제거된 결제 수단 전달)
        cart_items: cartItems
    };

    fetch("/checkout", {  
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
    })
    .then(response => response.json())
    .then(data => {
        console.log("✅ Server Response (checkout):", data);
        if (data.error) {
            alert("🚨 " + data.error);
        } else {
            alert(data.message || "✅ Checkout completed. Sending email...");
            
            return fetch("/send-email", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData)
            });
        }
    })
    .then(response => response.json())
    .then(emailResponse => {
        console.log("✅ Server Response (send-email):", emailResponse);
        if (emailResponse.error) {
            alert("🚨 Email error: " + emailResponse.error);
        } else {
            alert("✅ Order confirmed and email sent!");
            window.location.href = "/";
        }
    })
    .catch(error => console.error("🚨 Fetch Error:", error));
});
