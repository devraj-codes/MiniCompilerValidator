const codeInput = document.getElementById("codeInput");
const validateBtn = document.getElementById("validateBtn");

const tokenTableBody = document.getElementById("tokenTableBody");
const errorList = document.getElementById("errorList");


validateBtn.addEventListener("click", async function () {

    const code = codeInput.value;

    if (code.trim() === "") {

        errorList.innerHTML = "Please enter some code.";

        tokenTableBody.innerHTML = "";

        return;
    }


    errorList.innerHTML = "Analyzing code...";

    tokenTableBody.innerHTML = "";


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


        const data = await response.json();


        // -----------------------------------------
        // DISPLAY TOKENS
        // -----------------------------------------

        data.tokens.forEach(function (token) {

            const row = document.createElement("tr");

            row.innerHTML = `
                <td>${token.value}</td>
                <td>${token.type}</td>
                <td>${token.line}</td>
            `;

            tokenTableBody.appendChild(row);

        });


        // -----------------------------------------
        // DISPLAY ERRORS
        // -----------------------------------------

        if (data.errors.length === 0) {

            errorList.innerHTML =
                "<p>No lexical errors found.</p>";

        } else {

            errorList.innerHTML = "";

            data.errors.forEach(function (error) {

                const errorElement =
                    document.createElement("div");

                errorElement.className = "error";

                errorElement.innerHTML = `
                    <strong>${error.type}</strong><br>
                    ${error.message}<br>
                    Line: ${error.line}
                `;

                errorList.appendChild(errorElement);

            });

        }

    } catch (error) {

        errorList.innerHTML =
            "Could not connect to Flask.";

        console.error(error);

    }

});