OPENING_BRACKETS = {
    "(": ")",
    "{": "}",
    "[": "]"
}

CLOSING_BRACKETS = {
    ")": "(",
    "}": "{",
    "]": "["
}


def validate_brackets(code):
    stack = []
    errors = []

    line_number = 1
    i = 0

    # States
    in_string = False
    in_character = False
    in_single_comment = False
    in_multi_comment = False

    while i < len(code):

        character = code[i]

        # =========================================
        # INSIDE SINGLE-LINE COMMENT
        # =========================================
        if in_single_comment:

            if character == "\n":
                in_single_comment = False
                line_number += 1

            i += 1
            continue

        # =========================================
        # INSIDE MULTI-LINE COMMENT
        # =========================================
        if in_multi_comment:

            # Check for */
            if (
                character == "*"
                and i + 1 < len(code)
                and code[i + 1] == "/"
            ):
                in_multi_comment = False
                i += 2
                continue

            if character == "\n":
                line_number += 1

            i += 1
            continue

        # =========================================
        # INSIDE STRING
        # =========================================
        if in_string:

            # Handle escaped characters
            # Example: \" or \\
            if character == "\\":
                i += 2
                continue

            # End of string
            if character == '"':
                in_string = False

            if character == "\n":
                line_number += 1

            i += 1
            continue

        # =========================================
        # INSIDE CHARACTER LITERAL
        # =========================================
        if in_character:

            # Handle escaped characters
            # Example: \' or \\
            if character == "\\":
                i += 2
                continue

            # End of character literal
            if character == "'":
                in_character = False

            if character == "\n":
                line_number += 1

            i += 1
            continue

        # =========================================
        # START SINGLE-LINE COMMENT
        # =========================================
        if (
            character == "/"
            and i + 1 < len(code)
            and code[i + 1] == "/"
        ):
            in_single_comment = True
            i += 2
            continue

        # =========================================
        # START MULTI-LINE COMMENT
        # =========================================
        if (
            character == "/"
            and i + 1 < len(code)
            and code[i + 1] == "*"
        ):
            in_multi_comment = True
            i += 2
            continue

        # =========================================
        # START STRING
        # =========================================
        if character == '"':
            in_string = True
            i += 1
            continue

        # =========================================
        # START CHARACTER LITERAL
        # =========================================
        if character == "'":
            in_character = True
            i += 1
            continue

        # =========================================
        # OPENING BRACKET
        # =========================================
        if character in OPENING_BRACKETS:

            stack.append(
                (character, line_number)
            )

        # =========================================
        # CLOSING BRACKET
        # =========================================
        elif character in CLOSING_BRACKETS:

            # No opening bracket exists
            if not stack:

                errors.append({
                    "type": "unexpected_closing_bracket",
                    "message": f"Unexpected '{character}'",
                    "line": line_number
                })

            else:

                opening_bracket, opening_line = stack.pop()

                expected_opening = CLOSING_BRACKETS[character]

                # Wrong type of closing bracket
                if opening_bracket != expected_opening:

                    errors.append({
                        "type": "mismatched_bracket",
                        "message": (
                            f"Unexpected '{character}'. "
                            f"Expected closing bracket for "
                            f"'{opening_bracket}'"
                        ),
                        "line": line_number
                    })

        # =========================================
        # LINE NUMBER
        # =========================================
        if character == "\n":
            line_number += 1

        i += 1

    # =============================================
    # MISSING CLOSING BRACKETS
    # =============================================
    while stack:

        opening_bracket, opening_line = stack.pop()

        errors.append({
            "type": "missing_closing_bracket",
            "message": (
                f"Missing closing bracket for "
                f"'{opening_bracket}'"
            ),
            "line": opening_line
        })

    return errors