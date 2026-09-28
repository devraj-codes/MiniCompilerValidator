from lexer import tokenize, reserved
from identifier_validator import validate_identifier_token

# Token types produced for keywords (INT, FLOAT, ...)
KEYWORD_TOKEN_TYPES = set(reserved.values())

# Keywords after which a name (identifier) is expected
DECLARATION_TYPES = {"INT", "FLOAT", "CHAR"}


def _touching(first, second):
    """True if two tokens sit next to each other with no gap."""
    return (
        first["line"] == second["line"]
        and first["column"] + len(str(first["value"])) == second["column"]
    )


def check_identifier_tokens(tokens):
    """Validate identifiers using an already-produced token list.

    Cases handled:
      * every IDENTIFIER token is run through the DFA
      * a NUMBER directly followed by a word (e.g. 1student, 3.5abc):
        the lexer splits these into two tokens, so they are rejoined and
        run through the DFA, which rejects them
      * a keyword used where a variable name is expected (int while = 5;)
    """

    identifier_errors = []

    for index, token in enumerate(tokens):

        following = tokens[index + 1] if index + 1 < len(tokens) else None
        error = None

        if token["type"] == "IDENTIFIER":

            error = validate_identifier_token(
                token["value"],
                token["line"],
                token["column"]
            )

        elif (
            token["type"] == "NUMBER"
            and following is not None
            and following["type"] in KEYWORD_TOKEN_TYPES | {"IDENTIFIER"}
            and _touching(token, following)
        ):

            error = validate_identifier_token(
                str(token["value"]) + following["value"],
                token["line"],
                token["column"]
            )

        elif (
            token["type"] in DECLARATION_TYPES
            and following is not None
            and following["type"] in KEYWORD_TOKEN_TYPES
        ):

            error = validate_identifier_token(
                following["value"],
                following["line"],
                following["column"]
            )

        if error is not None:
            identifier_errors.append(error)

    return identifier_errors


def check_identifiers(code):
    """Tokenize the code and validate its identifiers.

    Returns (identifier_errors, lexical_errors).
    """

    tokens, lexical_errors = tokenize(code)

    return check_identifier_tokens(tokens), lexical_errors