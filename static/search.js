// 📌 검색 기능
function searchBooks() {
    const query = document.getElementById("searchBar").value.toLowerCase();  // 검색어 가져오기
    if (!query) return;  // 검색어가 비어있으면 실행 안 함

    fetch(`/search?q=${query}`)  // 백엔드 `/search` API 호출
        .then(response => response.json())
        .then(data => {
            console.log("🔍 검색 결과:", data); // ✅ 콘솔에서 결과 확인
            displayBooks(data);  // 검색 결과를 화면에 표시
        })
        .catch(error => console.error("🔴 검색 오류:", error));
}

// 📌 검색 결과를 화면에 출력하는 함수
function displayBooks(books) {
    const bookList = document.getElementById("bookList");
    if (!bookList) {
        console.error("🔴 bookList 요소를 찾을 수 없습니다.");
        return;
    }

    bookList.innerHTML = "";  // 기존 목록 삭제
    books.forEach(book => {
        if (!book.price) book.price = 0;  // ✅ price가 없으면 0으로 처리!

        const bookDiv = document.createElement("div");
        bookDiv.classList.add("book");

        bookDiv.innerHTML = `
            <a href="/book/${book.id}">
                <img src="${book.image}" alt="${book.title}">
                <h3>${book.title}</h3>
            </a>
            <p class="book-price">💰 IDR ${parseFloat(book.price).toFixed(2)}</p> <!-- ✅ 숫자로 변환 후 toFixed() 사용 -->
            <button class="cart-button" onclick="addToCart('${book.title}', ${book.price}, '${book.image}')">
                Add To Cart
            </button>
        `;

        bookList.appendChild(bookDiv);
    });
}

