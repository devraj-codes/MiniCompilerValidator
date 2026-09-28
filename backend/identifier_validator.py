from identifier_dfa import validate_identifier
from lexer import reserved


def validate_identifier_token(identifier, line, column=None):
    """Return an error dict for an invalid identifier, or None if it is valid.

    Two checks:
      1. The DFA must accept the text (correct shape).
      2. The text must not be a reserved keyword.
    """

    if not validate_identifier(identifier):

        if identifier[:1].isdigit():
            message = (
                f"Invalid identifier or malformed number '{identifier}'. "
                "An identifier cannot start with a digit."
            )
        else:
            message = (
                f"Invalid identifier '{identifier}'. "
                "Identifier must start with a letter or underscore "
                "and contain only letters, digits, or underscores."
            )

        return {
            "type": "Identifier Error",
            "message": message,
            "value": identifier,
            "line": line,
            "column": column
        }

    if identifier in reserved:

        return {
            "type": "Identifier Error",
            "message": (
                f"'{identifier}' is a reserved keyword "
                "and cannot be used as an identifier."
            ),
            "value": identifier,
            "line": line,
            "column": column
        }

    return None