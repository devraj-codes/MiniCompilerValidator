from identifier_validator import validate_identifier_token


test_cases = [
    ("student", 1),
    ("student1", 2),
    ("_marks", 3),
    ("marks2026", 4),
    ("1student", 5),
    ("student-name", 6),
    ("hello@", 7)
]


for identifier, line in test_cases:

    error = validate_identifier_token(identifier, line)

    if error is None:

        print(
            f"{identifier:<20} "
            f"VALID"
        )

    else:

        print(
            f"{identifier:<20} "
            f"INVALID"
        )

        print(
            f"  → {error['message']}"
        )