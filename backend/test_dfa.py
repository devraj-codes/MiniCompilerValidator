from identifier_dfa import validate_identifier


test_cases = [
    "student",
    "student1",
    "student_name",
    "_marks",
    "marks2026",
    "1student",
    "5abc",
    "student-name",
    "hello@",
    ""
]


for identifier in test_cases:

    result = validate_identifier(identifier)

    if result:
        print(f"{identifier!r:<20} ACCEPT")
    else:
        print(f"{identifier!r:<20} REJECT")