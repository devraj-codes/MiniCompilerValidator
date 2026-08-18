const codeInput = document.getElementById("codeInput");
const validateBtn = document.getElementById("validateBtn");

const tokenTableBody = document.getElementById("tokenTableBody");
const errorList = document.getElementById("errorList");
const identifierList = document.getElementById("identifierList");


validateBtn.addEventListener("click", async function () {

    const code = codeInput.value;

    // -----------------------------------------
    // CHECK EMPTY INPUT
    // -----------------------------------------

    if (code.trim() === "") {

        tokenTableBody.innerHTML = "";

        errorList.innerHTML =
            "<p>Please enter some code.</p>";

        identifierList.innerHTML =
            "<p>No identifier analysis yet.</p>";

        return;
    }


    // -----------------------------------------
    // RESET PREVIOUS RESULTS
    // -----------------------------------------

    tokenTableBody.innerHTML = "";

    errorList.innerHTML =
        "<p>Analyzing code...</p>";

    identifierList.innerHTML =
        "<p>Analyzing identifiers...</p>";


    // -----------------------------------------
    // SEND CODE TO FLASK
    // -----------------------------------------

    try {

        const response = await fetch(
            "http://127.0.0.1:5000/validate",
            {
                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({
                    code: code
                })
            }
        );


        // -----------------------------------------
        // CHECK SERVER RESPONSE
        // -----------------------------------------

        if (!response.ok) {

            throw new Error(
                `Server returned ${response.status}`
            );
        }


        const data = await response.json();


        // -----------------------------------------
        // DISPLAY TOKENS
        // -----------------------------------------

        if (data.tokens && data.tokens.length > 0) {

            data.tokens.forEach(function (token) {

                const row =
                    document.createElement("tr");


                const lexemeCell =
                    document.createElement("td");

                lexemeCell.textContent =
                    token.value;


                const typeCell =
                    document.createElement("td");

                typeCell.textContent =
                    token.type;


                const lineCell =
                    document.createElement("td");

                lineCell.textContent =
                    token.line;


                row.appendChild(lexemeCell);
                row.appendChild(typeCell);
                row.appendChild(lineCell);

                tokenTableBody.appendChild(row);

            });

        } else {

            tokenTableBody.innerHTML = `
                <tr>
                    <td colspan="3">
                        No tokens found.
                    </td>
                </tr>
            `;
        }


        // -----------------------------------------
        // DISPLAY LEXICAL ERRORS
        // -----------------------------------------

        const lexicalErrors =
            data.lexical_errors || [];


        if (lexicalErrors.length === 0) {

            errorList.innerHTML =
                "<p>No lexical errors found.</p>";

        } else {

            errorList.innerHTML = "";


            lexicalErrors.forEach(function (error) {

                const errorElement =
                    document.createElement("div");


                errorElement.className =
                    "error";


                errorElement.innerHTML = `
                    <strong>${error.type}</strong><br>
                    ${error.message}<br>
                    Line: ${error.line}
                `;


                errorList.appendChild(
                    errorElement
                );

            });

        }


        // -----------------------------------------
        // GET IDENTIFIER TOKENS
        // -----------------------------------------

        const identifiers =
            data.tokens.filter(
                token => token.type === "IDENTIFIER"
            );


        // -----------------------------------------
        // DISPLAY IDENTIFIER VALIDATION
        // -----------------------------------------

        if (identifiers.length === 0) {

            identifierList.innerHTML =
                "<p>No identifiers found.</p>";

        } else {

            identifierList.innerHTML = "";


            identifiers.forEach(function (identifier) {

                const element =
                    document.createElement("div");


                element.className =
                    "identifier-item";


                element.innerHTML = `
                    <strong>
                        ${identifier.value}
                    </strong>

                    <span>
                        ✓ ACCEPT
                    </span>

                    <span>
                        Line ${identifier.line}
                    </span>
                `;


                identifierList.appendChild(
                    element
                );

            });

        }


        // -----------------------------------------
        // DISPLAY INVALID IDENTIFIER ERRORS
        // -----------------------------------------

        const identifierErrors =
            data.identifier_errors || [];


        if (identifierErrors.length > 0) {

            identifierErrors.forEach(
                function (error) {

                    const errorElement =
                        document.createElement("div");


                    errorElement.className =
                        "error";


                    errorElement.innerHTML = `
                        <strong>
                            ${error.type}
                        </strong><br>

                        ${error.message}<br>

                        Line: ${error.line}
                    `;


                    identifierList.appendChild(
                        errorElement
                    );

                }
            );

        }

        // -----------------------------------------
        // DISPLAY PDA / BRACKET VALIDATION
        // -----------------------------------------

        const bracketErrors =
            data.bracket_errors || [];


        if (bracketErrors.length === 0) {

            const pdaElement =
                document.createElement("div");

            pdaElement.className =
                "pda-success";

            pdaElement.innerHTML = `
                <strong>PDA / Bracket Analysis</strong><br>
                ✓ All brackets are balanced.
            `;

            errorList.appendChild(pdaElement);

        } else {

            const pdaHeading =
                document.createElement("div");

            pdaHeading.innerHTML = `
                <strong>PDA / Bracket Errors</strong>
            `;

            errorList.appendChild(pdaHeading);


            bracketErrors.forEach(function (error) {

                const errorElement =
                    document.createElement("div");

                errorElement.className =
                    "error";

                errorElement.innerHTML = `
                    <strong>${error.type}</strong><br>
                    ${error.message}<br>
                    Line: ${error.line}
                `;

                errorList.appendChild(errorElement);

            });

        }


        // -----------------------------------------
        // FINAL STATUS
        // -----------------------------------------

        if (data.success) {

            console.log(
                "Validation completed successfully."
            );

        } else {

            console.log(
                "Validation completed with errors."
            );

        }

    }


    // -----------------------------------------
    // CONNECTION ERROR
    // -----------------------------------------

    catch (error) {

        console.error(
            "Validation error:",
            error
        );


        tokenTableBody.innerHTML = "";


        errorList.innerHTML = `
            <div class="error">
                <strong>Connection Error</strong><br>
                Could not connect to Flask.
                Make sure the Flask server is running.
            </div>
        `;


        identifierList.innerHTML =
            "<p>Identifier analysis unavailable.</p>";
    }

});