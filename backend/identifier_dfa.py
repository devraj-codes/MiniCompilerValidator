def is_letter(character):
    return character.isalpha()


def is_digit(character):
    return character.isdigit()


def is_identifier_start(character):
    return is_letter(character) or character == "_"


def is_identifier_part(character):
    return (
        is_letter(character)
        or is_digit(character)
        or character == "_"
    )


def validate_identifier(identifier):

    # Empty identifier
    if identifier == "":
        return False

    # DFA starts at q0
    state = "q0"

    # -----------------------------------------
    # STATE q0
    # -----------------------------------------

    first_character = identifier[0]

    if is_identifier_start(first_character):

        state = "q1"

    else:

        return False


    # -----------------------------------------
    # STATE q1
    # -----------------------------------------

    for character in identifier[1:]:

        if is_identifier_part(character):

            state = "q1"

        else:

            return False


    # -----------------------------------------
    # ACCEPTING STATE
    # -----------------------------------------

    return state == "q1"