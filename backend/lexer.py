import ply.lex as lex

errors = []


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
# 3. SIMPLE OPERATORS
# --------------------------------------------------

t_PLUS = r'\+'
t_MINUS = r'-'
t_MULTIPLY = r'\*'
t_DIVIDE = r'/'
t_MODULO = r'%'

t_ASSIGN = r'='


# --------------------------------------------------
# 4. COMPARISON OPERATORS
# --------------------------------------------------

t_EQUAL = r'=='
t_NOT_EQUAL = r'!='
t_GREATER_EQUAL = r'>='
t_LESS_EQUAL = r'<='
t_GREATER = r'>'
t_LESS = r'<'


# --------------------------------------------------
# 5. DELIMITERS
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
# 6. STRING
# --------------------------------------------------

def t_STRING(t):
    r'"([^"\\]|\\.)*"'
    return t


# --------------------------------------------------
# 7. NUMBERS
# --------------------------------------------------

def t_NUMBER(t):
    r'\d+(\.\d+)?'
    return t


# --------------------------------------------------
# 8. IDENTIFIERS AND KEYWORDS
# --------------------------------------------------

def t_IDENTIFIER(t):
    r'[A-Za-z_][A-Za-z0-9_]*'

    if t.value in reserved:
        t.type = reserved[t.value]

    return t


# --------------------------------------------------
# 9. IGNORE SPACES AND TABS
# --------------------------------------------------

t_ignore = ' \t'


# --------------------------------------------------
# 10. LINE NUMBERS
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


# --------------------------------------------------
# 11. INVALID CHARACTERS
# --------------------------------------------------

def t_error(t):

    errors.append({
        "type": "Lexical Error",
        "message": f"Illegal character '{t.value[0]}'",
        "line": t.lineno,
        "column": t.lexpos
    })

    t.lexer.skip(1)


# --------------------------------------------------
# 12. BUILD THE LEXER
# --------------------------------------------------

lexer = lex.lex()


def tokenize(code):

    global errors

    errors = []

    lexer.lineno = 1
    lexer.input(code)

    tokens = []

    while True:

        token = lexer.token()

        if not token:
            break

        tokens.append({
            "type": token.type,
            "value": token.value,
            "line": token.lineno
        })

    return tokens, errors

def t_CHARACTER(t):
    r"'([^'\\]|\\.)'"
    return t