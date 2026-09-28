// =========================================================
// ELEMENT REFERENCES (all original IDs preserved)
// =========================================================
const codeInput = document.getElementById("codeInput");
const validateBtn = document.getElementById("validateBtn");

const tokenTableBody = document.getElementById("tokenTableBody");
const errorList = document.getElementById("errorList");
const identifierList = document.getElementById("identifierList");

// New UI elements
const bracketList = document.getElementById("bracketList");
const lineNumbers = document.getElementById("lineNumbers");
const editorCounter = document.getElementById("editorCounter");
const banner = document.getElementById("banner");
const backendStatus = document.getElementById("backendStatus");
const backendStatusText = document.getElementById("backendStatusText");

const statTokens = document.getElementById("statTokens");
const statIdentifiers = document.getElementById("statIdentifiers");
const statErrors = document.getElementById("statErrors");
const statBrackets = document.getElementById("statBrackets");
const statErrorsCard = document.getElementById("statErrorsCard");
const statBracketsCard = document.getElementById("statBracketsCard");

const tabs = Array.from(document.querySelectorAll(".tab"));
const panels = Array.from(document.querySelectorAll(".tab-panel"));


// =========================================================
// HELPERS
// =========================================================
function esc(value) {
    const div = document.createElement("div");
    div.textContent = value === undefined || value === null ? "" : String(value);
    return div.innerHTML;
}

function emptyState(icon, title, text, extraClass) {
    return `
        <div class="empty ${extraClass || ""}">
            <div class="icon">${icon}</div>
            <div class="title">${title}</div>
            <p>${text}</p>
        </div>
    `;
}

function issueCard(glyph, error, label) {
    return `
        <div class="card error">
            <span class="glyph" aria-hidden="true">⚠</span>
            <div class="body">
                <div class="title">${esc(label || error.type)}</div>
                <div class="msg">${esc(error.message)}</div>
            </div>
            <span class="meta">Line ${esc(error.line)}</span>
        </div>
    `;
}

function successCard(title, text) {
    return `
        <div class="card success">
            <span class="glyph" aria-hidden="true">✓</span>
            <div class="body">
                <div class="title">${title}</div>
                <div class="msg">${text}</div>
            </div>
        </div>
    `;
}

// Stable hue per token type so any type from the backend gets a colour
function hueFor(text) {
    let hash = 0;
    for (const ch of String(text)) hash = (hash * 31 + ch.charCodeAt(0)) % 360;
    return hash;
}

function setTabCount(name, count, bad) {
    const tab = document.getElementById("tab-" + name);
    const label = name.charAt(0).toUpperCase() + name.slice(1);
    tab.innerHTML = count === null
        ? label
        : `${label}<span class="count ${bad ? "bad" : ""}">${count}</span>`;
}

function setStat(card, value, tone) {
    value.textContent = tone.text;
    card.classList.remove("good", "bad");
    if (tone.state) card.classList.add(tone.state);
}

function showBanner(type, text) {
    banner.hidden = false;
    banner.className = "banner " + type;
    banner.innerHTML = `<span aria-hidden="true">${type === "ok" ? "✓" : "⚠"}</span> ${text}`;
}

function setStatus(state, text) {
    backendStatus.dataset.state = state;
    backendStatusText.textContent = text;
}

function setLoading(isLoading) {
    validateBtn.disabled = isLoading;
    validateBtn.classList.toggle("loading", isLoading);
    validateBtn.querySelector(".btn-icon").textContent = isLoading ? "⟳" : "✓";
    validateBtn.querySelector(".btn-label").textContent =
        isLoading ? "Analyzing..." : "Validate Code";
    validateBtn.setAttribute("aria-busy", String(isLoading));
}

function resetStats() {
    [statTokens, statIdentifiers, statErrors, statBrackets].forEach(el => el.textContent = "–");
    statErrorsCard.classList.remove("good", "bad");
    statBracketsCard.classList.remove("good", "bad");
    ["tokens", "errors", "identifiers", "brackets"].forEach(n => setTabCount(n, null));
    banner.hidden = true;
}


// =========================================================
// TABS (keyboard: arrow keys, Home, End)
// =========================================================
function selectTab(tab) {
    tabs.forEach(function (t) {
        const active = t === tab;
        t.setAttribute("aria-selected", String(active));
        t.tabIndex = active ? 0 : -1;
    });
    panels.forEach(function (p) {
        p.hidden = p.id !== tab.getAttribute("aria-controls");
    });
}

tabs.forEach(function (tab, i) {
    tab.addEventListener("click", () => selectTab(tab));
    tab.addEventListener("keydown", function (e) {
        let next = null;
        if (e.key === "ArrowRight") next = tabs[(i + 1) % tabs.length];
        if (e.key === "ArrowLeft") next = tabs[(i - 1 + tabs.length) % tabs.length];
        if (e.key === "Home") next = tabs[0];
        if (e.key === "End") next = tabs[tabs.length - 1];
        if (next) { e.preventDefault(); next.focus(); selectTab(next); }
    });
});


// =========================================================
// EDITOR: line numbers + counter
// =========================================================
function updateEditor() {
    const text = codeInput.value;
    const lines = text.split("\n").length;

    let numbers = "";
    for (let i = 1; i <= lines; i++) numbers += i + "\n";
    lineNumbers.textContent = numbers.trimEnd();

    editorCounter.textContent =
        `${lines} ${lines === 1 ? "line" : "lines"} · ${text.length} chars`;
    lineNumbers.scrollTop = codeInput.scrollTop;
}

codeInput.addEventListener("input", updateEditor);
codeInput.addEventListener("scroll", function () {
    lineNumbers.scrollTop = codeInput.scrollTop;
});

// Insert 4 spaces on Tab (Esc then Tab still leaves the field for keyboard users)
codeInput.addEventListener("keydown", function (e) {
    if (e.key === "Escape") codeInput.dataset.escaped = "1";
    if (e.key === "Tab" && !e.shiftKey && !codeInput.dataset.escaped) {
        e.preventDefault();
        const s = codeInput.selectionStart;
        codeInput.setRangeText("    ", s, codeInput.selectionEnd, "end");
        updateEditor();
    } else if (e.key !== "Escape") {
        delete codeInput.dataset.escaped;
    }
});

updateEditor();


// =========================================================
// VALIDATE
// =========================================================
validateBtn.addEventListener("click", async function () {

    if (validateBtn.disabled) return;   // block simultaneous requests

    const code = codeInput.value;

    // -----------------------------------------
    // CHECK EMPTY INPUT
    // -----------------------------------------
    if (code.trim() === "") {

        tokenTableBody.innerHTML = "";
        resetStats();

        const empty = emptyState(
            "&lt;/&gt;",
            "No source code provided",
            "Enter C code above and run validation."
        );

        tokenTableBody.innerHTML = `<tr><td colspan="3">${empty}</td></tr>`;
        errorList.innerHTML = empty;
        identifierList.innerHTML = empty;
        bracketList.innerHTML = empty;
        codeInput.focus();
        return;
    }

    // -----------------------------------------
    // RESET PREVIOUS RESULTS
    // -----------------------------------------
    resetStats();
    tokenTableBody.innerHTML = "";
    errorList.innerHTML = "<p>Analyzing code...</p>";
    identifierList.innerHTML = "<p>Analyzing identifiers...</p>";
    bracketList.innerHTML = "<p>Analyzing brackets...</p>";

    setLoading(true);
    setStatus("busy", "Analyzing...");

    // -----------------------------------------
    // SEND CODE TO FLASK (unchanged endpoint & body)
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

        if (!response.ok) {
            throw new Error(`Server returned ${response.status}`);
        }

        const data = await response.json();
        setStatus("connected", "Backend connected");

        const tokens = data.tokens || [];

        // -----------------------------------------
        // DISPLAY TOKENS
        // -----------------------------------------
        if (tokens.length > 0) {

            tokens.forEach(function (token) {

                const row = document.createElement("tr");

                const lexemeCell = document.createElement("td");
                lexemeCell.textContent = token.value;

                const typeCell = document.createElement("td");
                const badge = document.createElement("span");
                badge.className = "badge";
                badge.style.setProperty("--h", hueFor(token.type));
                badge.textContent = token.type;
                typeCell.appendChild(badge);

                const lineCell = document.createElement("td");
                lineCell.textContent = token.line;

                row.appendChild(lexemeCell);
                row.appendChild(typeCell);
                row.appendChild(lineCell);

                tokenTableBody.appendChild(row);
            });

        } else {
            tokenTableBody.innerHTML = `
                <tr><td colspan="3">${emptyState("{ }", "No tokens found", "The analyzer returned no tokens for this input.")}</td></tr>
            `;
        }

        // -----------------------------------------
        // DISPLAY LEXICAL ERRORS
        // -----------------------------------------
        const lexicalErrors = data.lexical_errors || [];

        if (lexicalErrors.length === 0) {
            errorList.innerHTML = successCard("No lexical errors found", "Every character was recognised by the lexer.");
        } else {
            errorList.innerHTML = lexicalErrors.map(e => issueCard("⚠", e)).join("");
        }

        // -----------------------------------------
        // IDENTIFIERS
        // -----------------------------------------
        const identifiers = tokens.filter(t => t.type === "IDENTIFIER");
        const identifierErrors = data.identifier_errors || [];

        identifierList.innerHTML = "";

        if (identifiers.length === 0) {
            identifierList.innerHTML = emptyState("id", "No identifiers found", "This code contains no identifiers to validate.");
        } else {
            identifierList.innerHTML = identifiers.map(function (identifier) {
                return `
                    <div class="card identifier-item">
                        <span class="name">${esc(identifier.value)}</span>
                        <span class="pill">✓ ACCEPTED</span>
                        <span class="meta">Line ${esc(identifier.line)}</span>
                    </div>
                `;
            }).join("");
        }

        // -----------------------------------------
        // INVALID IDENTIFIER ERRORS
        // -----------------------------------------
        if (identifierErrors.length > 0) {
            identifierList.insertAdjacentHTML(
                "beforeend",
                identifierErrors.map(e => issueCard("⚠", e)).join("")
            );
        }

        // -----------------------------------------
        // PDA / BRACKET VALIDATION
        // -----------------------------------------
        const bracketErrors = data.bracket_errors || [];

        if (bracketErrors.length === 0) {
            bracketList.innerHTML = successCard("Brackets balanced", "All brackets are properly matched.");
        } else {
            bracketList.innerHTML = bracketErrors.map(e => issueCard("⚠", e, "Bracket error: " + e.type)).join("");
        }

        // -----------------------------------------
        // OVERVIEW STATS (all derived from the response)
        // -----------------------------------------
        const errorTotal =
            lexicalErrors.length + identifierErrors.length + bracketErrors.length;

        statTokens.textContent = tokens.length;
        statIdentifiers.textContent = identifiers.length;
        setStat(statErrorsCard, statErrors, {
            text: errorTotal,
            state: errorTotal === 0 ? "good" : "bad"
        });
        setStat(statBracketsCard, statBrackets, bracketErrors.length === 0
            ? { text: "✓ Balanced", state: "good" }
            : { text: bracketErrors.length + " error" + (bracketErrors.length === 1 ? "" : "s"), state: "bad" });

        setTabCount("tokens", tokens.length);
        setTabCount("errors", lexicalErrors.length, lexicalErrors.length > 0);
        setTabCount("identifiers", identifiers.length + identifierErrors.length, identifierErrors.length > 0);
        setTabCount("brackets", bracketErrors.length === 0 ? "✓" : bracketErrors.length, bracketErrors.length > 0);

        // -----------------------------------------
        // FINAL STATUS
        // -----------------------------------------
        if (data.success) {
            showBanner("ok", "Validation complete");
            console.log("Validation completed successfully.");
        } else {
            showBanner("warn", `Validation finished with ${errorTotal} issue${errorTotal === 1 ? "" : "s"}`);
            console.log("Validation completed with errors.");
        }

    }

    // -----------------------------------------
    // CONNECTION ERROR
    // -----------------------------------------
    catch (error) {

        console.error("Validation error:", error);

        setStatus("offline", "Backend offline");
        tokenTableBody.innerHTML = "";

        errorList.innerHTML = `
            <div class="error card">
                <span class="glyph" aria-hidden="true">⚠</span>
                <div class="body">
                    <div class="title">Backend Connection Failed</div>
                    <div class="msg">
                        Unable to connect to the Flask validation server.
                        Make sure the Flask server is running on port 5000.
                    </div>
                </div>
            </div>
        `;

        identifierList.innerHTML = "<p>Identifier analysis unavailable.</p>";
        bracketList.innerHTML = "<p>Bracket analysis unavailable.</p>";
        showBanner("warn", "Backend connection failed");
        selectTab(document.getElementById("tab-errors"));
    }

    finally {
        setLoading(false);
    }

});
