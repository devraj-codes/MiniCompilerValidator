# Mini-C Grammar

This document defines the grammar supported by the Mini Compiler Validator.

The project supports a limited subset of the C programming language.

---

## 1. Program

program
    → function_definition

---

## 2. Function Definition

function_definition
    → datatype IDENTIFIER LPAREN RPAREN block

---

## 3. Block

block
    → LBRACE statement_list RBRACE

---

## 4. Statement List

statement_list
    → statement statement_list
    | ε

---

## 5. Statement

statement
    → declaration
    | assignment
    | if_statement
    | while_statement
    | printf_statement
    | return_statement

---

## 6. Data Type

datatype
    → INT
    | FLOAT
    | CHAR

---

## 7. Declaration

declaration
    → datatype IDENTIFIER SEMICOLON
    | datatype IDENTIFIER ASSIGN expression SEMICOLON

---

## 8. Assignment

assignment
    → IDENTIFIER ASSIGN expression SEMICOLON

---

## 9. If Statement

if_statement
    → IF LPAREN condition RPAREN block
    | IF LPAREN condition RPAREN block ELSE block

---

## 10. While Statement

while_statement
    → WHILE LPAREN condition RPAREN block

---

## 11. Print Statement

printf_statement
    → PRINTF LPAREN printf_arguments RPAREN SEMICOLON

---

## 11.1 Print Arguments

printf_arguments
    → STRING
    | STRING COMMA argument_list

---

## 11.2 Argument List

argument_list
    → expression
    | expression COMMA argument_list

---

## 12. Return Statement

return_statement
    → RETURN expression SEMICOLON

---

## 13. Condition

condition
    → expression relational_operator expression

---

## 14. Relational Operator

relational_operator
    → GREATER
    | LESS
    | GREATER_EQUAL
    | LESS_EQUAL
    | EQUAL
    | NOT_EQUAL

---

## 15. Expression

expression
    → expression PLUS term
    | expression MINUS term
    | term

---

## 16. Term

term
    → term MULTIPLY factor
    | term DIVIDE factor
    | term MODULO factor
    | factor

---

## 17. Factor

factor
    → NUMBER
    | CHARACTER
    | IDENTIFIER
    | LPAREN expression RPAREN