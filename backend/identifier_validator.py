from identifier_dfa import validate_identifier


def validate_identifier_token(identifier, line):

    if validate_identifier(identifier):

        return None

    return {
        "type": "Identifier Error",
        "message": (
            f"Invalid identifier '{identifier}'. "
            "Identifier must start with a letter or underscore "
            "and contain only letters, digits, or underscores."
        ),
        "value": identifier,
        "line": line
    }