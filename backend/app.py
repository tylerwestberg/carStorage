from flask import Flask, jsonify, request
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
import jwt
import datetime
import os

app = Flask(__name__)
CORS(app)

app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///carStorage.db"
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
app.config["SECRET_KEY"] = "devkey123"

db = SQLAlchemy(app)


# ----------------------- MODELS -----------------------
class User(db.Model):
    __tablename__ = "users"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password = db.Column(db.String(100), nullable=False)
    is_admin = db.Column(db.Boolean, default=False)
    phone_number = db.Column(db.String(20))
    cars = db.relationship("Car", backref="owner", lazy=True)


class Car(db.Model):
    __tablename__ = "cars"

    id = db.Column(db.Integer, primary_key=True)
    color = db.Column(db.String(50))
    make = db.Column(db.String(100), nullable=False)
    model = db.Column(db.String(100), nullable=False)
    year = db.Column(db.String(10))
    notes = db.Column(db.String(150))
    date_added = db.Column(db.String(20))
    proj_pickup_date = db.Column(db.String(20))
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)


with app.app_context():
    db.create_all()


# ----------------------- HELPERS -----------------------
def decode_token_from_header():
    token = request.headers.get("Authorization")
    if not token:
        return None
    try:
        payload = jwt.decode(token, app.config["SECRET_KEY"], algorithms=["HS256"])
        return payload.get("id"), payload.get("is_admin", False)
    except Exception:
        return None


def create_token(user):
    return jwt.encode(
        {
            "id": user.id,
            "is_admin": user.is_admin,
            "exp": datetime.datetime.utcnow() + datetime.timedelta(hours=12),
        },
        app.config["SECRET_KEY"],
        algorithm="HS256",
    )


# ----------------------- AUTH -----------------------
@app.route("/api/register", methods=["POST"])
def register():
    data = request.get_json() or {}
    name = data.get("name", "").strip()
    email = data.get("email", "").strip().lower()
    password = data.get("password", "")
    phone_number = data.get("phone_number", "")
    is_admin = bool(data.get("is_admin", False))

    if not name or not email or not password:
        return jsonify({"error": "Name, email, and password required"}), 400

    if User.query.filter_by(email=email).first():
        return jsonify({"error": "Email already exists"}), 400

    user = User(name=name, email=email, password=password, is_admin=is_admin, phone_number=phone_number)
    db.session.add(user)
    db.session.commit()
    return jsonify({"message": "User registered"}), 201


@app.route("/api/login", methods=["POST"])
def login():
    data = request.get_json() or {}
    email = data.get("email", "").strip().lower()
    password = data.get("password", "")
    user = User.query.filter_by(email=email).first()

    if not user or user.password != password:
        return jsonify({"error": "Invalid credentials"}), 401

    token = create_token(user)
    return jsonify({"token": token})


# ----------------------- USERS -----------------------
@app.route("/api/users", methods=["GET"])
def get_users():
    users = User.query.order_by(User.name.asc()).all()
    return jsonify(
        [
            {
                "id": u.id,
                "name": u.name,
                "email": u.email,
                "phone_number": u.phone_number,
                "is_admin": u.is_admin,
            }
            for u in users
        ]
    )


@app.route("/api/update_user/<int:user_id>", methods=["PUT"])
def update_user(user_id):
    auth = decode_token_from_header()
    if not auth:
        return jsonify({"error": "Invalid token"}), 401
    current_user_id, is_admin = auth

    # Only admins or the user themselves can update the user record
    if not is_admin and current_user_id != user_id:
        return jsonify({"error": "Forbidden"}), 403

    user = User.query.get(user_id)
    if not user:
        return jsonify({"error": "Not found"}), 404

    data = request.get_json() or {}

    # Update fields safely
    if "name" in data:
        user.name = data.get("name", user.name).strip()

    if "email" in data:
        new_email = data.get("email", user.email).strip().lower()
        if new_email != user.email and User.query.filter_by(email=new_email).first():
            return jsonify({"error": "Email already exists"}), 400
        user.email = new_email

    if "phone_number" in data:
        user.phone_number = data.get("phone_number", user.phone_number)

    # Allow password change
    if "password" in data and data.get("password"):
        user.password = data.get("password")

    # Only admins can toggle is_admin
    if "is_admin" in data and is_admin:
        user.is_admin = bool(data.get("is_admin"))

    db.session.commit()
    return jsonify({"message": "User updated"}), 200


@app.route("/api/users/<int:user_id>", methods=["DELETE"])
def delete_user(user_id):
    auth = decode_token_from_header()
    if not auth:
        return jsonify({"error": "Invalid token"}), 401
    _, is_admin = auth

    # Only admins may delete users
    if not is_admin:
        return jsonify({"error": "Forbidden"}), 403

    user = User.query.get(user_id)
    if not user:
        return jsonify({"error": "Not found"}), 404

    # Remove related cars first
    Car.query.filter_by(user_id=user_id).delete()
    db.session.delete(user)
    db.session.commit()
    return jsonify({"message": "User deleted"}), 200


# ----------------------- CARS -----------------------
@app.route("/api/cars", methods=["GET"])
def get_cars():
    auth = decode_token_from_header()
    if not auth:
        return jsonify({"error": "Invalid token"}), 401
    user_id, is_admin = auth

    query = Car.query
    requested_id = request.args.get("user_id")

    if is_admin:
        if requested_id and requested_id != "all":
            query = query.filter_by(user_id=requested_id)
    else:
        query = query.filter_by(user_id=user_id)

    cars = query.order_by(Car.id.desc()).all()

    result = []
    for car in cars:
        owner = User.query.get(car.user_id)
        result.append({
            "id": car.id,
            "color": car.color,
            "make": car.make,
            "model": car.model,
            "year": car.year,
            "notes": car.notes,
            "date_added": car.date_added,
            "proj_pickup_date": car.proj_pickup_date,
            "user_id": car.user_id,
            "user_name": owner.name if owner else "",
            "user_email": owner.email if owner else "",
        })
    return jsonify(result)


@app.route("/api/cars", methods=["POST"])
def add_car():
    auth = decode_token_from_header()
    if not auth:
        return jsonify({"error": "Invalid token"}), 401
    current_user_id, is_admin = auth

    data = request.get_json() or {}
    make = data.get("make", "").strip()
    model = data.get("model", "").strip()
    if not make or not model:
        return jsonify({"error": "Make and model are required"}), 400

    target_user_id = (
        int(data.get("user_id"))
        if is_admin and data.get("user_id")
        else current_user_id
    )

    car = Car(
        color=data.get("color", "").strip(),
        make=make,
        model=model,
        year=data.get("year", "").strip(),
        notes=data.get("notes", "").strip(),
        date_added=data.get("date_added", datetime.date.today().isoformat()),
        proj_pickup_date=data.get("proj_pickup_date", ""),
        user_id=target_user_id,
    )
    db.session.add(car)
    db.session.commit()
    return jsonify({"message": "Car added", "id": car.id}), 201


@app.route("/api/cars/<int:car_id>", methods=["DELETE"])
def delete_car(car_id):
    auth = decode_token_from_header()
    if not auth:
        return jsonify({"error": "Invalid token"}), 401
    current_user_id, is_admin = auth

    car = Car.query.get(car_id)
    if not car:
        return jsonify({"error": "Not found"}), 404
    if not is_admin and car.user_id != current_user_id:
        return jsonify({"error": "Forbidden"}), 403

    db.session.delete(car)
    db.session.commit()
    return jsonify({"message": "Car deleted"}), 200


@app.route("/api/cars/<int:car_id>", methods=["PUT"])
def update_car(car_id):
    auth = decode_token_from_header()
    if not auth:
        return jsonify({"error": "Invalid token"}), 401
    current_user_id, is_admin = auth

    car = Car.query.get(car_id)
    if not car:
        return jsonify({"error": "Not found"}), 404
    if not is_admin and car.user_id != current_user_id:
        return jsonify({"error": "Forbidden"}), 403

    data = request.get_json() or {}
    for field in ["color", "make", "model", "year", "notes", "proj_pickup_date"]:
        if field in data:
            setattr(car, field, data[field])

    db.session.commit()
    return jsonify({"message": "Car updated"}), 200


if __name__ == "__main__":
    app.run(debug=True)
