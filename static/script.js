document.addEventListener("DOMContentLoaded", () => {
    fetchBooks();
    document.getElementById("searchBar").addEventListener("input", searchBooks);
    initBannerSlider();
    updateCartCount(); // 페이지 로드 시 장바구니 개수 업데이트
});

// 📌 책 데이터를 가져오는 함수
function fetchBooks() {
    fetch("/books")
        .then(response => response.json())
        .then(data => displayBooks(data));
}

// 📌 검색 기능
function searchBooks() {
    const query = document.getElementById("searchBar").value.toLowerCase();  // 검색어 가져오기
    fetch(`/search?q=${query}`)  // 백엔드 `/search` 엔드포인트 호출
        .then(response => response.json())
        .then(data => {
            console.log("🔍 검색 결과:", data); // ✅ 콘솔에서 결과 확인
            displayBooks(data);  // 검색 결과를 화면에 표시
        })
        .catch(error => console.error("🔴 검색 오류:", error));
}

// 📌 검색 결과를 화면에 출력
function displayBooks(books) {
    const bookList = document.getElementById("bookList");
    if (!bookList) {
        console.error("🔴 bookList 요소를 찾을 수 없습니다.");
        return;
    }

    bookList.innerHTML = "";  // 기존 목록 삭제
    books.forEach(book => {
        const bookDiv = document.createElement("div");
        bookDiv.classList.add("book");

        bookDiv.innerHTML = `
            <a href="/book/${book.id}">
                <img src="${book.image}" alt="${book.title}">
                <h3>${book.title}</h3>
            </a>
            <p class="book-price">IDR ${book.price.toFixed(2)}</p>
            <button class="cart-button" onclick="addToCart('${book.title}', ${book.price}, '${book.image}')">
                Add To Cart
            </button>
        `;

        bookList.appendChild(bookDiv);
    });
}


function addToCart(bookTitle, bookPrice, bookImage) {
    // 📌 로그인 상태 확인 (템플릿에서 `user_logged_in` 값 가져오기)
    const userLoggedIn = JSON.parse('{{ user_logged_in|tojson }}');

    if (!userLoggedIn) {
        alert("Please log in to add items to the cart.");
        window.location.href = "/login"; // ✅ 로그인 페이지로 이동
        return;
    }

    if (!bookTitle || !bookPrice || !bookImage) {
        alert("Missing book data.");
        console.error("Error: bookTitle, bookPrice, or bookImage is undefined.");
        return;
    }

    fetch("/cart/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: bookTitle, price: bookPrice, image: bookImage })
    })
    .then(response => response.json())
    .then(data => {
        if (data.message) {
            updateCartCount();
            alert(data.message);
        } else {
            alert(data.error);
        }
    })
    .catch(error => console.error("Error:", error));
}

// 로그인 상태 확인 후 경고를 띄우는 함수
function alertLoginRequired() {
    alert("Please log in to add items to your cart.");
}

// 📌 장바구니에서 제거하는 함수
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
        }
    })
    .catch(error => console.error("Error:", error));
}

// 📌 장바구니 총 가격 업데이트
function updateTotalPrice() {
    let total = 0;
    document.querySelectorAll(".cart-row").forEach(row => {
        const checkbox = row.querySelector(".cart-checkbox");
        const quantitySelector = row.querySelector(".quantity-selector");
        const priceElement = row.querySelector(".cart-price");

        if (checkbox.checked) {
            let price = parseFloat(priceElement.dataset.price);
            let quantity = parseInt(quantitySelector.value);
            total += price * quantity;
        }
    });
    document.getElementById("totalPrice").textContent = total.toFixed(2);
}

// 📌 배너 슬라이드 초기화 함수
function initBannerSlider() {
    let slides = document.querySelectorAll(".banner-slide");
    let currentSlide = 0;
    const totalSlides = slides.length;

    // 첫 번째 슬라이드 즉시 보이도록 설정
    slides.forEach((slide, i) => {
        slide.style.opacity = i === 0 ? "1" : "0"; 
        slide.style.display = "block";
    });

    // 5초마다 슬라이드 전환
    setInterval(() => {
        slides[currentSlide].style.opacity = "0";
        currentSlide = (currentSlide + 1) % totalSlides;
        slides[currentSlide].style.opacity = "1";
    }, 5000);
}

// 📌 장바구니 개수 업데이트 함수
function updateCartCount() {
    fetch("/cart/count")
        .then(response => {
            if (!response.ok) {
                throw new Error("HTTP error! Status: " + response.status);
            }
            return response.json();
        })
        .then(data => {
            const cartCountElement = document.getElementById("cart-count"); // HTML 요소 찾기
            if (!cartCountElement) {
                console.error("🔴 Error: #cart-count element not found!");
                return;
            }
            cartCountElement.textContent = data.count > 0 ? `(${data.count})` : "";
        })
        .catch(error => console.error("🚨 Error updating cart count:", error));
}

// 📌 장바구니 추가 시 개수 업데이트
function addToCart(title, price, image) {
    fetch("/cart/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, price, image })
    })
    .then(response => response.json())
    .then(data => {
        if (data.message) {
            updateCartCount();  // ✅ 장바구니 개수 업데이트 실행
            alert(data.message);
        } else {
            alert(data.error);
        }
    })
    .catch(error => console.error("🚨 Error:", error));
}

// 📌 페이지 로드 시 장바구니 개수 업데이트
document.addEventListener("DOMContentLoaded", () => {
    updateCartCount();  // ✅ 페이지 로드될 때 실행
});

// 🛒 장바구니 개수 업데이트 함수
function updateCartCount() {
    fetch("/cart/count")
        .then(response => response.json())
        .then(data => {
            const cartCountElement = document.getElementById("cart-count");
            if (cartCountElement) {
                cartCountElement.textContent = data.count > 0 ? `(${data.count})` : "";
            }
        })
        .catch(error => console.error("🚨 Error updating cart count:", error));
}

// 📌 페이지 로드 시 장바구니 개수 업데이트
document.addEventListener("DOMContentLoaded", () => {
    updateCartCount();
});
