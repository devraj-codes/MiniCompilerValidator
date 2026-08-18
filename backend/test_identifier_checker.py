from identifier_checker import check_identifiers


code = '''
int main() {

    int age = 18;
    int student_name = 20;

}
'''


identifier_errors, lexical_errors = check_identifiers(code)


print("IDENTIFIER ERRORS")
print("=" * 50)

if len(identifier_errors) == 0:

    print("No identifier errors found.")

else:

    for error in identifier_errors:
        print(error)


print("\nLEXICAL ERRORS")
print("=" * 50)

if len(lexical_errors) == 0:

    print("No lexical errors found.")

else:

    for error in lexical_errors:
        print(error)