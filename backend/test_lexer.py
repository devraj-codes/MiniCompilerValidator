from lexer import tokenize


code = '''
int main() {

    int age = @18;

}
'''


tokens, errors = tokenize(code)


print("\nTOKENS")
print("=" * 50)

for token in tokens:

    print(
        f"{token['type']:<15} "
        f"{str(token['value']):<15} "
        f"Line: {token['line']}"
    )


print("\nERRORS")
print("=" * 50)

for error in errors:

    print(error)