from flask import Flask, request, jsonify
from flask_cors import CORS
from lexer import tokenize

app = Flask(__name__)
CORS(app)


@app.route("/")
def home():
    return "Mini Compiler Validator Backend is running!"


@app.route("/validate", methods=["POST"])
def validate():

    data = request.get_json()

    code = data.get("code", "")

    tokens, errors = tokenize(code)

    return jsonify({
        "success": len(errors) == 0,
        "tokens": tokens,
        "errors": errors
    })


if __name__ == "__main__":
    app.run(debug=True)