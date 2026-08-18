from flask import Flask, request, jsonify
from flask_cors import CORS
from lexer import tokenize
from identifier_checker import check_identifiers

app = Flask(__name__)
CORS(app)


@app.route("/")
def home():
    return "Mini Compiler Validator Backend is running!"


@app.route("/validate", methods=["POST"])
def validate():

    data = request.get_json()

    code = data.get("code", "")

    tokens, lexical_errors = tokenize(code)

    identifier_errors, _ = check_identifiers(code)

    return jsonify({
        "success": (
            len(lexical_errors) == 0
            and len(identifier_errors) == 0
        ),

        "tokens": tokens,

        "lexical_errors": lexical_errors,

        "identifier_errors": identifier_errors
    })


if __name__ == "__main__":
    app.run(debug=True)