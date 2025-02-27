from flask import Flask, render_template, request, jsonify, redirect, url_for, session
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
from flask_migrate import Migrate
import smtplib
from email.mime.text import MIMEText
import requests

app = Flask(__name__)
CORS(app)

# 📌 SQLite 데이터베이스 설정
app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///database.db"
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
app.secret_key = "supersecretkey"

db = SQLAlchemy(app)
migrate = Migrate(app, db)

# 📌 도서 모델 정의
class Book(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(100), nullable=False)
    image = db.Column(db.String(200), nullable=False)
    price = db.Column(db.Float, nullable=False, default=0.0)

# 📌 데이터베이스 초기화
with app.app_context():
    db.create_all()

# 📌 장바구니 데이터 저장 (세션 사용 가능)
cart_items = []

# ✅ **홈 페이지**
@app.route("/")
def home():
    books = Book.query.all()
    user_logged_in = "username" in session  # 로그인 상태 확인
    cart_count = len(cart_items)  # 장바구니 개수

    return render_template(
        "index.html",  # 템플릿 렌더링
        books=books,
        user_logged_in=user_logged_in,  # 로그인 상태 전달
        cart_count=cart_count  # 장바구니 개수 전달
    )

# ✅ **도서 목록 API**
@app.route("/books", methods=["GET"])
def get_books():
    books = Book.query.all()
    book_list = [{"id": book.id, "title": book.title, "image": book.image, "price": book.price} for book in books]
    return jsonify(book_list)

# ✅ **도서 검색 API**
@app.route("/search", methods=["GET"])
def search_books():
    query = request.args.get("q", "").lower()  # 검색어 가져오기
    books = Book.query.filter(Book.title.ilike(f"%{query}%")).all()  # 검색 실행
    book_list = [
        {
            "id": book.id,
            "title": book.title,
            "image": book.image,
            "price": book.price  # ✅ price 추가!
        } 
        for book in books
    ]
    return jsonify(book_list)  # JSON 반환

# ✅ **도서 상세 페이지**
@app.route("/book/<int:book_id>")
def book_detail(book_id):
    book = Book.query.get(book_id)
    if book is None:
        return render_template("book_not_found.html", book_id=book_id)

    user_logged_in = "username" in session  # ✅ 로그인 상태 추가
    cart_count = len(cart_items)  # ✅ 장바구니 개수 추가

    return render_template(
        "book_detail.html",
        book=book,
        user_logged_in=user_logged_in,  # ✅ 로그인 변수 전달
        cart_count=cart_count  # ✅ 장바구니 개수 전달
    )


# ✅ **장바구니 페이지**
@app.route('/cart')
def cart_page():
    user_logged_in = "username" in session
    if not user_logged_in:
        return redirect(url_for('login'))

    cart_items = session.get('cart', [])  # ✅ 세션에서 장바구니 데이터 가져오기
    print("🛒 현재 장바구니 데이터:", cart_items)  # ✅ 디버깅용 콘솔 출력 추가

    total_price = sum(float(item['price']) * int(item['quantity']) for item in cart_items)

    return render_template('cart.html', cart_items=cart_items, total_price=total_price, user_logged_in=user_logged_in)


# ✅ **장바구니 추가 API**
@app.route("/cart/add", methods=["POST"])
def add_to_cart():
    if "username" not in session:
        return jsonify({"error": "You need to log in to add items to the cart."}), 401

    data = request.get_json()
    if not data:
        return jsonify({"error": "Invalid request data."}), 400

    book_title = data.get("title")
    book_price = float(data.get("price"))  # ✅ float 변환 추가
    book_image = data.get("image")

    if not (book_title and book_price and book_image):
        return jsonify({"error": "Missing book information."}), 400

    # 🛒 세션에서 장바구니 가져오기 (기본값: 빈 리스트)
    cart = session.get("cart", [])

    # ✅ 같은 상품이 있으면 수량 증가
    for item in cart:
        if item["title"] == book_title:
            item["quantity"] = int(item["quantity"]) + 1  # ✅ int 변환 추가
            session["cart"] = cart
            session.modified = True
            return jsonify({"message": f"'{book_title}' 수량이 증가했습니다!", "cart": cart})

    # 🆕 새로운 상품 추가
    new_item = {
        "title": book_title,
        "price": book_price,
        "image": book_image,
        "quantity": 1  # ✅ 항상 정수 값으로 저장
    }
    cart.append(new_item)

    session["cart"] = cart
    session.modified = True

    return jsonify({"message": f"'{book_title}'이(가) 장바구니에 추가되었습니다!", "cart": cart})



# ✅ **로그인 페이지**
@app.route("/login", methods=["GET", "POST"])
def login():
    if request.method == "POST":
        username = request.form["username"]
        password = request.form["password"]
        if username == "admin" and password == "password":
            session["logged_in"] = True
            session["username"] = username
            return redirect(url_for("home"))
        else:
            message = "The ID or password is wrong"
            return render_template("login.html", message=message)

    return render_template("login.html")

# ✅ **로그아웃 API**
@app.route("/logout")
def logout():
    session.pop("logged_in", None)
    session.pop("username", None)
    return redirect(url_for("home"))

@app.route('/checkout', methods=['GET', 'POST'])
def checkout():
    if request.method == 'POST':
        data = request.get_json()
        print("🔹 Received Checkout Data:", data)  # 디버깅 로그

        selected_items = data.get("cart_items", [])
        if not selected_items:
            print("🚨 No items received in checkout request!")  # 디버깅 로그
            return jsonify({"error": "🚨 Please select at least one item to checkout."}), 400

        # 🛒 세션에 장바구니 데이터 저장
        session['checkout_items'] = selected_items
        session["payment_method"] = data.get("payment_method", "Unknown")
        session.modified = True  

        print("✅ Checkout items saved in session:", session['checkout_items'])  # 디버깅 로그

        return jsonify({"success": True, "message": "Checkout completed. Sending email..."})

    # ✅ GET 요청 시: checkout_items가 없으면 cart에서 불러오기
    checkout_items = session.get("checkout_items", [])

    if not checkout_items:
        print("🚨 Checkout page loaded, but no checkout items found in session!")  # 디버깅 로그
        return render_template('checkout.html', cart_items=[], total_price=0)

    total_price = sum(item['price'] * item['quantity'] for item in checkout_items)

    print("✅ Checkout page loaded with items:", checkout_items)  # 디버깅 로그
    return render_template('checkout.html', cart_items=checkout_items, total_price=total_price)

@app.route('/')
def index():
    return render_template('checkout.html')

import smtplib
from email.mime.text import MIMEText

@app.route('/send-email', methods=['POST'])
def send_email():
    try:
        # ✅ 세션에서 checkout_items 가져오기 (오류 확인)
        if "checkout_items" not in session or not session["checkout_items"]:
            print("🚨 Error: No items found in session for email sending!")
            return jsonify({"error": "🚨 No items found for email confirmation."}), 400

        data = request.get_json()
        print("✅ Received Data for Email:", data)

        cart_items = session["checkout_items"]
        payment_method = session.get("payment_method", "Unknown Payment Method")

        # ✅ 이메일 내용 생성
        order_details = f"""
        Orderer Info:
        - Name: {data.get('name', 'Unknown')}
        - Phone: {data.get('phone', 'Unknown')}
        - Address: {data.get('address1', 'Unknown')}, {data.get('address2', '')}, {data.get('city', 'Unknown')}, {data.get('postcode', 'Unknown')}
        - Payment Method: {payment_method}
        
        List of items ordered:
        """
        for item in cart_items:
            order_details += f"- {item.get('title', 'Unknown')} (Quantity: {item.get('quantity', 1)}, Price: IDR {item.get('price', 0)})\n        "

        total_price = sum(int(item.get('price', 0)) * int(item.get('quantity', 1)) for item in cart_items)
        order_details += f"\nTotal Price: IDR {total_price}"

        print("📩 Final Email Content:\n", order_details)

        # ✅ SMTP 서버 설정
        smtp_server = "smtp.gmail.com"
        smtp_port = 587
        sender_email = "20221095@edu.hanbat.ac.kr"
        receiver_email = "luonj@naver.com"
        app_password = "qcfc rjkd ymlj gsce"

        # ✅ 이메일 전송
        try:
            smtp = smtplib.SMTP(smtp_server, smtp_port)
            smtp.ehlo()
            smtp.starttls()
            smtp.login(sender_email, app_password)

            msg = MIMEText(order_details)
            msg['Subject'] = '📦 New Order Received'
            msg['From'] = sender_email
            msg['To'] = receiver_email

            smtp.sendmail(sender_email, receiver_email, msg.as_string())
            smtp.quit()

            print("✅ Email sent successfully.")
            return jsonify({"message": "✅ Order confirmed and email sent!"})

        except smtplib.SMTPException as e:
            print("🚨 Email Error:", str(e))
            return jsonify({"error": str(e)}), 500

    except Exception as e:
        print("🚨 General Error:", str(e))
        return jsonify({"error": str(e)}), 500

     
def send_whatsapp(phone_number, message):
    account_sid = "ACXXXXXXXXXXXXXXXXXXXXXXXXXXXX"  # Twilio Account SID
    auth_token = "your_auth_token"                    # Twilio Authentication Token
    from_whatsapp_number = 'whatsapp:+14155238886'      # WhatsApp Outgoing Number Provided by Twilio
    to_whatsapp_number = f'whatsapp:{phone_number}'     # Recipient number (add 'whatsapp:' before phone number)
    
    url = f'https://api.twilio.com/2010-04-01/Accounts/{account_sid}/Messages.json'
    data = {
        'From': from_whatsapp_number,
        'To': to_whatsapp_number,
        'Body': message
    }
    
    response = requests.post(url, data=data, auth=(account_sid, auth_token))
    return response


@app.route('/send-whatsapp', methods=['POST'])
def send_whatsapp_message():
    try:
        data = request.get_json()
        print("✅ Received Data for WhatsApp:", data)

        phone_number = data.get("phone")
        if not phone_number:
            return jsonify({"error": "전화번호가 필요합니다."}), 400

        cart_items = session.get("checkout_items", [])
        payment_method = session.get("payment_method", "Unknown Payment Method")

        if not cart_items:
            return jsonify({"error": "Your cart is empty. Please select at least one item."}), 400

        # ✅ 주문 내역 생성 (결제 수단 포함)
        order_details = f"""
        주문자 정보:
        - Name: {data.get('name', 'Unknown')}
        - Phone: {phone_number}
        - Address: {data.get('address1', 'Unknown')}, {data.get('address2', '')}, {data.get('city', 'Unknown')}, {data.get('postcode', 'Unknown')}
        - Payment Method: {payment_method}  # ✅ 결제 수단 포함
        
        주문한 상품 목록:
        """
        for item in cart_items:
            order_details += f"- {item.get('title', 'Unknown')} (Quantity: {item.get('quantity', 1)}, Price: IDR {item.get('price', 0)})\n"

        total_price = sum(int(item.get('price', 0)) * int(item.get('quantity', 1)) for item in cart_items)
        order_details += f"\nTotal Price: IDR {total_price}"

        # ✅ WhatsApp 메시지 전송
        response = send_whatsapp(phone_number, order_details)
        if response.status_code in [200, 201]:
            return jsonify({"message": "WhatsApp 메시지가 성공적으로 전송되었습니다."})
        else:
            return jsonify({"error": "WhatsApp 메시지 전송에 실패했습니다.", "details": response.text}), 500

    except Exception as e:
        print("🚨 WhatsApp General Error:", str(e))
        return jsonify({"error": str(e)}), 500

@app.route("/newitem", endpoint="new_books")
def new_books():
    books = Book.query.order_by(Book.id.desc()).limit(10).all()  
    if not books:
        return render_template("book_not_found.html", message="새로운 책 목록이 없습니다.")
    return render_template("new_books.html", books=books, user_logged_in=("username" in session))


@app.route("/best")
def best_books():
    books = Book.query.order_by(Book.price.desc()).limit(10).all()  # 가장 비싼 책 10권
    if not books:
        return render_template("book_not_found.html", message="베스트셀러 목록이 없습니다.")  # ✅ 예외 처리 추가
    return render_template("best_books.html", books=books, user_logged_in=("username" in session))  # ✅ 파일명 수정


@app.route("/mypage")
def mypage():
    return render_template("mypage.html", user_logged_in=("username" in session))


@app.route("/order")
def order():
    return render_template("order.html", user_logged_in=("username" in session))

@app.route("/faq", endpoint="faq")  # ✅ 엔드포인트 명확히 설정
def faq():
    return render_template("faq.html")

@app.route("/company", endpoint="company")
def company():
    return render_template("company.html")

@app.route("/book_intro", endpoint="book_intro")
def book_intro():
    return render_template("book_intro.html")

@app.context_processor
def inject_cart_count():
    return {"cart_count": len(cart_items)}  # ✅ 장바구니 개수를 모든 템플릿에서 사용 가능하도록 설정

@app.route("/manual", endpoint="manual")  # ✅ 엔드포인트 명확히 설정
def manual():
    return render_template("manual.html")

# Flask 애플리케이션 실행
if __name__ == "__main__":
    app.run(debug=True)

# 🛒 장바구니 개수 반환 API
@app.route('/cart/count')
def get_cart_count():
    cart_count = sum(item["quantity"] for item in session.get("cart", []))
    return jsonify({"count": cart_count})

@app.route('/cart/remove', methods=['POST'])
def remove_from_cart():
    title = request.json.get('title')
    if not title:
        return jsonify({"error": "No title provided."}), 400

    # Remove the item from the cart
    cart_items = session.get('cart', [])
    cart_items = [item for item in cart_items if item['title'] != title]
    session['cart'] = cart_items  # Update the cart in the session

    return jsonify({"success": True, "cart_count": len(cart_items)})

