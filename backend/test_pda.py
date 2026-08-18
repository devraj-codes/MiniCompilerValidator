from pda import validate_brackets


def test_parentheses():
    errors = validate_brackets("()")
    assert errors == []


def test_curly_brackets():
    errors = validate_brackets("{}")
    assert errors == []


def test_square_brackets():
    errors = validate_brackets("[]")
    assert errors == []


def test_nested_brackets():
    errors = validate_brackets("({[]})")
    assert errors == []


def test_mismatched_brackets():
    errors = validate_brackets("({)}")
    assert len(errors) > 0


def test_missing_closing_bracket():
    errors = validate_brackets("{")

    assert len(errors) > 0
    assert errors[0]["type"] == "missing_closing_bracket"


def test_unexpected_closing_bracket():
    errors = validate_brackets("}")

    assert len(errors) > 0
    assert errors[0]["type"] == "unexpected_closing_bracket"


def test_line_number():
    code = """int main() {
    if (x > 5) {
        printf("Hello");
    """

    errors = validate_brackets(code)

    assert len(errors) == 2
    assert errors[0]["line"] == 2
    assert errors[1]["line"] == 1


def test_realistic_c_code():
    code = """int main() {
    int a = 10;

    if (a > 5) {
        printf("Hello");
    }

    return 0;
}"""

    errors = validate_brackets(code)

    assert errors == []


def test_bracket_inside_string():
    code = """int main() {
    printf("Hello }");
}"""

    errors = validate_brackets(code)

    assert errors == []


def test_brackets_inside_single_line_comment():
    code = """int main() {
    // This } should be ignored
    printf("Hello");
}"""

    errors = validate_brackets(code)

    assert errors == []


def test_brackets_inside_character():
    code = """int main() {
    char x = '}';
}"""

    errors = validate_brackets(code)

    assert errors == []


def test_brackets_inside_multiline_comment():
    code = """int main() {
    /*
        {
        }
        [
        ]
    */
    printf("Hello");
}"""

    errors = validate_brackets(code)

    assert errors == []

def test_empty_code():
    errors = validate_brackets("")
    assert errors == []


def test_only_non_bracket_code():
    code = """int x = 10;
printf("Hello");
"""

    errors = validate_brackets(code)

    assert errors == []


def test_deeply_nested_brackets():
    code = "({[({[]})]})"

    errors = validate_brackets(code)

    assert errors == []


def test_multiple_unexpected_brackets():
    code = "}})"

    errors = validate_brackets(code)

    assert len(errors) == 3


def test_multiple_missing_brackets():
    code = """{
[
(
"""

    errors = validate_brackets(code)

    assert len(errors) == 3


def test_string_with_many_brackets():
    code = """int main() {
    printf("({[Hello]}])");
}"""

    errors = validate_brackets(code)

    assert errors == []


def test_comment_with_many_brackets():
    code = """int main() {
    // ({[ ]})
    /*
       ({[ ]})
    */
}"""

    errors = validate_brackets(code)

    assert errors == []