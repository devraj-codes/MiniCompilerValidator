from lexer import tokenize
from identifier_validator import validate_identifier_token


def check_identifiers(code):

    tokens, lexical_errors = tokenize(code)

    identifier_errors = []

    for token in tokens:

        if token["type"] == "IDENTIFIER":

            error = validate_identifier_token(
                token["value"],
                token["line"]
            )

            if error is not None:

                identifier_errors.append(error)

    return identifier_errors, lexical_errors