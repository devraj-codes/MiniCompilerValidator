"""Bracket validator implemented as a pushdown automaton.

Stack alphabet : the opening brackets ( { [
Transitions    : on an opening bracket -> push it
                 on a closing bracket  -> pop and compare with the match
Accept         : input finished with an empty stack and no errors

Strings, character literals and comments are skipped so brackets inside
them are ignored. Unterminated literals and comments are reported by the
lexer; here they only stop the scan from swallowing the rest of the file.
"""

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
    stack = []          # entries: (bracket, line, column)
    errors = []

    line_number = 1
    line_start = 0      # index where the current line begins
    i = 0
    n = len(code)

    while i < n:

        character = code[i]
        next_character = code[i + 1] if i + 1 < n else ""

        # =========================================
        # NEWLINE
        # =========================================
        if character == "\n":
            line_number += 1
            line_start = i + 1
            i += 1
            continue

        # =========================================
        # SINGLE-LINE COMMENT: skip to end of line
        # =========================================
        if character == "/" and next_character == "/":
            while i < n and code[i] != "\n":
                i += 1
            continue

        # =========================================
        # MULTI-LINE COMMENT: skip to */ (or end of file)
        # =========================================
        if character == "/" and next_character == "*":
            i += 2

            while i < n:

                if code[i] == "*" and i + 1 < n and code[i + 1] == "/":
                    i += 2
                    break

                if code[i] == "\n":
                    line_number += 1
                    line_start = i + 1

                i += 1

            continue

        # =========================================
        # STRING OR CHARACTER LITERAL
        # =========================================
        # A literal cannot span lines, so it also ends at a newline.
        # That keeps one missing quote from hiding every later bracket.
        if character == '"' or character == "'":
            quote = character
            i += 1

            while i < n:

                current = code[i]

                if current == "\\":
                    # Backslash before a newline: treat the literal as
                    # unterminated instead of splicing the lines.
                    if i + 1 < n and code[i + 1] == "\n":
                        i += 1
                        break

                    i += 2      # skip the escaped character
                    continue

                if current == quote:
                    i += 1
                    break

                if current == "\n":
                    break       # newline handled by the main loop

                i += 1

            continue

        # =========================================
        # OPENING BRACKET: push
        # =========================================
        if character in OPENING_BRACKETS:

            stack.append((
                character,
                line_number,
                i - line_start + 1
            ))

        # =========================================
        # CLOSING BRACKET: pop and compare
        # =========================================
        elif character in CLOSING_BRACKETS:

            column = i - line_start + 1

            if not stack:

                errors.append({
                    "type": "unexpected_closing_bracket",
                    "message": f"Unexpected '{character}'",
                    "line": line_number,
                    "column": column
                })

            else:

                opening_bracket, opening_line, _ = stack.pop()

                if opening_bracket != CLOSING_BRACKETS[character]:

                    errors.append({
                        "type": "mismatched_bracket",
                        "message": (
                            f"Unexpected '{character}': expected "
                            f"'{OPENING_BRACKETS[opening_bracket]}' to close "
                            f"'{opening_bracket}' opened on line "
                            f"{opening_line}"
                        ),
                        "line": line_number,
                        "column": column
                    })

        i += 1

    # =============================================
    # MISSING CLOSING BRACKETS
    # =============================================
    for opening_bracket, opening_line, opening_column in stack:

        errors.append({
            "type": "missing_closing_bracket",
            "message": (
                f"Missing closing bracket for "
                f"'{opening_bracket}'"
            ),
            "line": opening_line,
            "column": opening_column
        })

    # Report errors in source order
    errors.sort(key=lambda e: (e["line"], e["column"]))

    return errors