// 🛒 총 가격 업데이트 함수
function updateTotalPrice() {
    let total = 0;
    const rows = document.querySelectorAll(".cart-row");
    
    rows.forEach(row => {
        const checkbox = row.querySelector(".cart-checkbox");
        const quantity = row.querySelector(".quantity-selector").value;
        const price = parseFloat(row.querySelector(".cart-price").dataset.price);
        
        if (checkbox.checked) {
            total += price * quantity;
        }
    });

    document.getElementById("totalPrice").textContent = total.toFixed(2);
}

// 🛒 장바구니에서 항목 제거
function removeFromCart(title, button) {
    const row = button.closest(".cart-row");
    row.remove();
    updateTotalPrice();
}

// 🛒 Checkout 페이지로 이동
function redirectToCheckout() {
    const selectedItems = [];
    document.querySelectorAll(".cart-row").forEach(row => {
        const checkbox = row.querySelector(".cart-checkbox");
        if (checkbox.checked) {
            const title = row.querySelector(".cart-item-info p").textContent;
            const quantity = row.querySelector(".quantity-selector").value;
            selectedItems.push({ title, quantity });
        }
    });

    if (selectedItems.length === 0) {
        alert("🛒 결제할 상품을 선택하세요!");
        return;
    }

    // 백엔드로 데이터 전송 (예: Flask에서 처리 가능)
    fetch("/checkout", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ items: selectedItems }),
    }).then(response => response.json())
    .then(data => {
        alert("🛒 주문이 완료되었습니다!");
        window.location.href = "/thankyou";
    }).catch(error => console.error("Error:", error));
}
function redirectToCheckout() {
    window.location.href = "/checkout";
}
function proceedToCheckout() {
    let selectedItems = [];
    let checkboxes = document.querySelectorAll(".cart-checkbox");

    checkboxes.forEach(checkbox => {
        if (checkbox.checked) {  // ✅ 체크된 항목만 추가
            let row = checkbox.closest(".cart-row");
            let title = row.querySelector(".cart-item-info p").textContent;
            let price = parseFloat(row.querySelector(".cart-price").dataset.price);
            let image = row.querySelector(".cart-book-image").src;
            let quantity = parseInt(row.querySelector(".quantity-selector").value);

            selectedItems.push({
                title: title,
                price: price,
                image: image,
                quantity: quantity
            });
        }
    });

    if (selectedItems.length === 0) {
        alert("🚨 Please select at least one item to checkout.");
        return;
    }

    console.log("🔹 Sending to /checkout:", selectedItems);

    fetch("/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cart_items: selectedItems })
    })
    .then(response => response.json())
    .then(data => {
        console.log("✅ Server Response:", data);
        if (data.success) {
            window.location.href = "/checkout"; // Checkout 페이지로 이동
        } else {
            alert("🚨 Error processing checkout.");
        }
    })
    .catch(error => console.error("🚨 Fetch Error:", error));
}

// 🛒 Checkout 버튼에 이벤트 리스너 추가
document.addEventListener("DOMContentLoaded", () => {
    let checkoutButton = document.querySelector(".checkout-button");
    if (checkoutButton) {
        checkoutButton.addEventListener("click", proceedToCheckout);
    }
});
function toggleSelectAll(source) {
    const checkboxes = document.querySelectorAll('.cart-checkbox');
    checkboxes.forEach(checkbox => {
        checkbox.checked = source.checked;
    });
    updateTotalPrice(); // 총 가격도 업데이트
}


// 🛒 장바구니 개수 업데이트 함수
function updateCartCount() {
    fetch("/cart/count")
        .then(response => response.json())
        .then(data => {
            const cartCountElements = document.querySelectorAll("#cart-count");
            cartCountElements.forEach(element => {
                element.textContent = data.count > 0 ? `(${data.count})` : "";
            });
        })
        .catch(error => console.error("🚨 Error updating cart count:", error));
}

// 🛒 장바구니 추가 (버튼 클릭 시 실행)
function addToCart(title, price, image) {
    fetch("/cart/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, price, image })
    })
    .then(response => response.json())
    .then(data => {
        console.log("✅ 서버 응답:", data);  // ✅ 디버깅용 콘솔 출력
        if (data.message) {
            updateCartCount();  // ✅ 장바구니 개수 업데이트 실행
            alert(data.message);
        } else {
            alert(data.error);
        }
    })
    .catch(error => console.error("🚨 Error:", error));
}


// 🛒 장바구니에서 상품 삭제 시 개수 업데이트
function removeFromCart(bookTitle, button) {
    fetch("/cart/remove", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: bookTitle })
    })
    .then(response => response.json())
    .then(data => {
        if (data.error) {
            alert(data.error);
        } else {
            const row = button.closest(".cart-row");
            row.remove();
            updateTotalPrice();
            updateCartCount();  // ✅ 삭제 후 개수 업데이트 실행
        }
    })
    .catch(error => console.error("🚨 Error:", error));
}

