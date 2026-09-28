"""Deterministic finite automaton for C-style identifiers.

M = (Q, Sigma, delta, q0, F)

    Q     = {q0, q1, dead}
    Sigma = {letter, digit, other}
            letter = a-z, A-Z or '_'   (ASCII only)
            digit  = 0-9               (ASCII only)
            other  = every other character
    q0    = start state
    F     = {q1}

    delta      letter   digit   other
    q0         q1       dead    dead
    q1         q1       q1      dead
    dead       dead     dead    dead

The DFA only decides whether a string has the *shape* of an identifier.
Keywords such as 'int' have that shape too; rejecting them is a separate
lookup done in identifier_validator.py.
"""

import string

START_STATE = "q0"
ACCEPTING_STATES = {"q1"}
DEAD_STATE = "dead"

LETTERS = set(string.ascii_letters + "_")
DIGITS = set(string.digits)

TRANSITIONS = {
    ("q0", "letter"): "q1",
    ("q0", "digit"): DEAD_STATE,
    ("q0", "other"): DEAD_STATE,

    ("q1", "letter"): "q1",
    ("q1", "digit"): "q1",
    ("q1", "other"): DEAD_STATE,

    (DEAD_STATE, "letter"): DEAD_STATE,
    (DEAD_STATE, "digit"): DEAD_STATE,
    (DEAD_STATE, "other"): DEAD_STATE,
}


def classify(character):
    """Map a character to its input symbol in Sigma."""
    if character in LETTERS:
        return "letter"
    if character in DIGITS:
        return "digit"
    return "other"


def next_state(state, character):
    """The transition function delta(state, character)."""
    return TRANSITIONS[(state, classify(character))]


def trace_identifier(identifier):
    """Return the run of the DFA as a list of (character, state) pairs.

    The first entry is ("", "q0"). Useful for the report and for showing
    the state path in the UI.
    """
    state = START_STATE
    path = [("", state)]

    for character in identifier:
        state = next_state(state, character)
        path.append((character, state))

    return path


def validate_identifier(identifier):
    """True if the DFA ends in an accepting state after reading the input."""
    return trace_identifier(identifier)[-1][1] in ACCEPTING_STATES