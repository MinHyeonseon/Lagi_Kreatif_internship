from app import db, Book, app  # Flask 앱을 가져옴
import os

# 업로드된 파일 리스트
files = [
    "Fawwaz Atharayhan Almumtadz3.jpg",
    "Fawwaz Atharayhan Almumtadz2.jpg",
    "Azka Agilla Girani Wajdi.jpg",
    "Fawwaz Atharayhan Almumtadz1.jpg",
    "Tania Putri Azalea.jpg",
    "Ar-euPan dan tepemchava.jpg",
    "Arumi Naima Ghassani1.jpg",
    "Adiva Inez Aprilladea.jpg",
    "Arumi Naima Ghassani2.jpg",
    "Muhammad Kiandra Alfarizy.jpg"
]

# Flask 애플리케이션 컨텍스트 설정
with app.app_context():
    for file in files:
        title = os.path.splitext(file)[0]  # 확장자 제거하여 책 제목 생성
        image_path = f"/static/uploads/{file}"  # 이미지 저장 경로
        db.session.add(Book(title=title, image=image_path))

    # 변경사항 저장
    db.session.commit()

print("Database updated successfully.")
