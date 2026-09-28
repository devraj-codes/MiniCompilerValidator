import ply.lex as lex


# --------------------------------------------------
# 1. TOKEN NAMES
# --------------------------------------------------

tokens = (
    'CHARACTER',
    'IDENTIFIER',
    'NUMBER',
    'STRING',

    'PLUS',
    'MINUS',
    'MULTIPLY',
    'DIVIDE',
    'MODULO',

    'ASSIGN',
    'EQUAL',
    'NOT_EQUAL',
    'GREATER',
    'LESS',
    'GREATER_EQUAL',
    'LESS_EQUAL',

    'SEMICOLON',
    'COMMA',

    'LPAREN',
    'RPAREN',
    'LBRACE',
    'RBRACE',
    'LBRACKET',
    'RBRACKET'
)


# --------------------------------------------------
# 2. KEYWORDS
# --------------------------------------------------

reserved = {
    'int': 'INT',
    'float': 'FLOAT',
    'char': 'CHAR',
    'if': 'IF',
    'else': 'ELSE',
    'while': 'WHILE',
    'return': 'RETURN',
    'printf': 'PRINTF'
}


# Add keyword token names to the token list
tokens = tokens + tuple(reserved.values())


# --------------------------------------------------
# 3. HELPERS FOR ERROR REPORTING
# --------------------------------------------------

def find_column(data, position):
    """Return the 1-based column of an absolute offset in the source."""
    return position - data.rfind('\n', 0, position)


def report_error(t, message):
    """Record a lexical error at the start of the current match."""
    t.lexer.errors.append({
        "type": "Lexical Error",
        "message": message,
        "line": t.lineno,
        "column": find_column(t.lexer.lexdata, t.lexpos)
    })


# --------------------------------------------------
# 4. SIMPLE OPERATORS
# --------------------------------------------------

t_PLUS = r'\+'
t_MINUS = r'-'
t_MULTIPLY = r'\*'
t_DIVIDE = r'/'
t_MODULO = r'%'

t_ASSIGN = r'='


# --------------------------------------------------
# 5. COMPARISON OPERATORS
# --------------------------------------------------

# PLY sorts string rules by decreasing regex length, so '==' is tried
# before '=' and '>=' before '>'.

t_EQUAL = r'=='
t_NOT_EQUAL = r'!='
t_GREATER_EQUAL = r'>='
t_LESS_EQUAL = r'<='
t_GREATER = r'>'
t_LESS = r'<'


# --------------------------------------------------
# 6. DELIMITERS
# --------------------------------------------------

t_SEMICOLON = r';'
t_COMMA = r','

t_LPAREN = r'\('
t_RPAREN = r'\)'

t_LBRACE = r'\{'
t_RBRACE = r'\}'

t_LBRACKET = r'\['
t_RBRACKET = r'\]'


# --------------------------------------------------
# 7. STRINGS AND CHARACTER LITERALS
# --------------------------------------------------
# Function rules are tried in the order they are defined, so each
# "valid" rule must come before the matching "error" rule.
# All of these must be defined BEFORE lex.lex() is called.

def t_STRING(t):
    r'"([^"\\\n]|\\.)*"'
    return t


def t_UNTERMINATED_STRING(t):
    r'"([^"\\\n]|\\.)*\\?'
    report_error(t, "Unterminated string literal")


def t_CHARACTER(t):
    r"'([^'\\\n]|\\.)'"
    return t


def t_BAD_CHARACTER(t):
    r"'([^'\\\n]|\\.)*'?"
    text = t.value
    if len(text) == 2 and text[1] == "'":
        report_error(t, "Empty character literal")
    elif text.endswith("'") and len(text) > 1:
        report_error(t, "Character literal must contain exactly one character")
    else:
        report_error(t, "Unterminated character literal")


# --------------------------------------------------
# 8. NUMBERS
# --------------------------------------------------

def t_NUMBER(t):
    r'\d+(\.\d+)?'
    return t


# --------------------------------------------------
# 9. IDENTIFIERS AND KEYWORDS
# --------------------------------------------------

def t_IDENTIFIER(t):
    r'[A-Za-z_][A-Za-z0-9_]*'

    if t.value in reserved:
        t.type = reserved[t.value]

    return t


# --------------------------------------------------
# 10. IGNORE SPACES, TABS AND CARRIAGE RETURNS
# --------------------------------------------------

t_ignore = ' \t\r'


# --------------------------------------------------
# 11. LINE NUMBERS AND COMMENTS
# --------------------------------------------------

def t_newline(t):
    r'\n+'
    t.lexer.lineno += len(t.value)


def t_COMMENT_SINGLE(t):
    r'//.*'
    pass


def t_COMMENT_MULTI(t):
    r'/\*[\s\S]*?\*/'
    t.lexer.lineno += t.value.count('\n')
    pass


def t_COMMENT_UNTERMINATED(t):
    r'/\*[\s\S]*'
    report_error(t, "Unterminated comment")
    t.lexer.lineno += t.value.count('\n')


# --------------------------------------------------
# 12. INVALID CHARACTERS
# --------------------------------------------------

def t_error(t):
    report_error(t, f"Illegal character '{t.value[0]}'")
    t.lexer.skip(1)


# --------------------------------------------------
# 13. BUILD THE LEXER
# --------------------------------------------------

lexer = lex.lex()
lexer.errors = []


def tokenize(code):
    """Tokenize source code.

    Returns (token_list, errors). A fresh clone of the lexer is used
    for every call, so concurrent Flask requests do not share state.
    """

    lx = lexer.clone()
    lx.errors = []
    lx.lineno = 1
    lx.input(code)

    token_list = []

    while True:

        token = lx.token()

        if not token:
            break

        token_list.append({
            "type": token.type,
            "value": token.value,
            "line": token.lineno,
            "column": find_column(code, token.lexpos)
        })

    return token_list, lx.errors