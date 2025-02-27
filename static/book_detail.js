// 📌 장바구니 추가 함수 (책 정보 포함)
function addToCart(bookTitle, bookPrice, bookImage, quantity) {

    if (!bookTitle || !bookPrice || !bookImage || !quantity) {
        alert("Error: Missing book data.");
        console.error("Error: bookTitle, bookPrice, or bookImage is undefined.");
        return;
    }

    fetch("/cart/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: bookTitle, price: bookPrice, image: bookImage, quantity: quantity })
    })
    .then(response => response.json())
    .then(data => {
        if (data.error) {
            alert("Error: " + data.error);
        } else {
            alert(data.message);

             // ✅ 장바구니로 이동할지 물어보기
             const userConfirmed = window.confirm("Moving to the shopping cart?");
             if (userConfirmed) {
                 window.location.href = "/cart";  // "예"를 클릭하면 장바구니 페이지로 이동
             }
        }
    })
    .catch(error => console.error("Error:", error));
}

// 로그인 상태 확인 후 경고를 띄우는 함수
function alertLoginRequired() {
    alert("Please log in to add items to your cart.");
}


/* ====================================================== */

/* ====================================================== */

/* ====================================================== */


// 접고/펴기

function toggleContent() {
    var content = document.getElementById('bookContent');
    content.classList.toggle('collapsed');  // collapsed 클래스를 토글하여 접고 펼치기
}


/* ====================================================== */

/* ====================================================== */

/* ====================================================== */


let comments = loadComments(); // 페이지 로드 시 로컬 스토리지에서 댓글 로드

// 댓글을 작성하는 함수
function postComment() {
    var commentInput = document.getElementById('commentInput');
    var commentText = commentInput.value.trim(); // 댓글 내용 가져오기

    if (commentText !== '') {
        var comment = {
            text: commentText,
            replies: [] // 대댓글 배열 초기화
        };

        comments.unshift(comment); // 댓글 배열에 추가
        saveComments(); // 로컬 스토리지에 저장
        renderComments(); // 댓글 다시 렌더링
        commentInput.value = ''; // 입력란 초기화
    } else {
        alert('Please leave comments!');
    }
}

// 댓글을 렌더링하는 함수
function renderComments() {
    var commentsContainer = document.getElementById('commentsContainer');
    commentsContainer.innerHTML = ''; // 댓글 목록 초기화

    comments.forEach((comment, index) => {
        var commentDiv = document.createElement('div');
        commentDiv.classList.add('comment');

        var commentParagraph = document.createElement('p');
        commentParagraph.textContent = comment.text;
        commentDiv.appendChild(commentParagraph);

        // 댓글 수정 및 삭제 버튼
        var commentActions = document.createElement('div');
        commentActions.classList.add('comment-actions');

        // 수정 버튼
        var editButton = document.createElement('button');
        editButton.textContent = 'Modify';
        editButton.classList.add('edit');
        editButton.onclick = () => editComment(index);
        commentActions.appendChild(editButton);

        // 삭제 버튼
        var deleteButton = document.createElement('button');
        deleteButton.textContent = 'Delete';
        deleteButton.onclick = () => deleteComment(index);
        commentActions.appendChild(deleteButton);

        commentDiv.appendChild(commentActions);

        // 대댓클 입력란과 버튼을 추가할 부분
        var replyInputContainer = document.createElement('div');
        replyInputContainer.classList.add('reply-input-container');

        // 대댓글 입력란
        var replyInput = document.createElement('input');
        replyInput.classList.add('reply-input');
        replyInput.placeholder = 'reply';
        replyInput.id = 'replyInput-' + index;
        replyInputContainer.appendChild(replyInput);

        // 대댓글 버튼
        var replyButton = document.createElement('button');
        replyButton.classList.add('reply-button');
        replyButton.innerHTML = '&nbsp;reply&nbsp;';
        replyButton.onclick = () => postReply(index);
        replyInputContainer.appendChild(replyButton);

        commentDiv.appendChild(replyInputContainer);  // 댓글 아래에 대댓글 입력란 추가

        // 대댓글 리스트
        var repliesContainer = document.createElement('div');
        comment.replies.forEach((reply, replyIndex) => {
            var replyDiv = document.createElement('div');
            replyDiv.classList.add('c-comment');
            replyDiv.innerHTML = `<p>${reply.text}</p>`;

            // 대댓글 수정 및 삭제 버튼
            var replyActions = document.createElement('div');
            replyActions.classList.add('comment-actions');

            // 대댓글 삭제 버튼
            var replyDeleteButton = document.createElement('button');
            replyDeleteButton.textContent = 'Delete';
            replyDeleteButton.onclick = () => deleteReply(index, replyIndex);
            replyActions.appendChild(replyDeleteButton);

            replyDiv.appendChild(replyActions);

            repliesContainer.appendChild(replyDiv);
        });

        commentDiv.appendChild(repliesContainer);

        // 댓글 컨테이너에 추가
        commentsContainer.appendChild(commentDiv);
    });
}

// 댓글 수정 함수
function editComment(index) {
    var newText = prompt('Modify the comments:', comments[index].text);
    if (newText !== null && newText.trim() !== '') {
        comments[index].text = newText.trim();
        saveComments(); // 로컬 스토리지에 저장
        renderComments();
    }
}

// 댓글 삭제 함수
function deleteComment(index) {
    comments.splice(index, 1); // 해당 댓글 삭제
    saveComments(); // 로컬 스토리지에 저장
    renderComments(); // 댓글 목록 다시 렌더링
}

// 대댓글 작성 함수
function postReply(commentIndex) {
    var replyInput = document.getElementById('replyInput-' + commentIndex);
    var replyText = replyInput.value.trim();

    if (replyText !== '') {
        var reply = {
            text: replyText
        };
        comments[commentIndex].replies.unshift(reply); // 대댓글 배열 뒤에 추가
        saveComments(); // 로컬 스토리지에 저장
        renderComments(); // 댓글 목록 다시 렌더링
    } else {
        alert('Please write a reply.');
    }
}

// 대댓글 삭제 함수
function deleteReply(commentIndex, replyIndex) {
    comments[commentIndex].replies.splice(replyIndex, 1); // 해당 대댓글 삭제
    saveComments(); // 로컬 스토리지에 저장
    renderComments(); // 댓글 목록 다시 렌더링
}

// 로컬 스토리지에 댓글 저장
function saveComments() {
    var pageId = getPageId(); // 페이지 고유 식별자
    localStorage.setItem(pageId, JSON.stringify(comments)); // pageId를 기준으로 댓글 저장
}

// 로컬 스토리지에서 댓글 불러오기
function loadComments() {
    var pageId = getPageId(); // 페이지 고유 식별자
    return JSON.parse(localStorage.getItem(pageId)) || []; // pageId를 기준으로 댓글 로드
}

// 페이지 고유 식별자 가져오기
function getPageId() {
    var url = window.location.pathname;
    var pageId = url.split('/').pop(); // URL 마지막 부분을 pageId로 사용
    return pageId;
}

// 페이지가 로드될 때 댓글 렌더링
window.onload = function() {
    renderComments();
};
