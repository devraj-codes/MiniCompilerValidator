// =========================================================
// MINI COMPILER VALIDATOR - TOC DEVELOPER DASHBOARD SCRIPT
// =========================================================

// --- PRESERVED ORIGINAL ELEMENT REFERENCES ---
const codeInput = document.getElementById("codeInput");
const validateBtn = document.getElementById("validateBtn");
const tokenTableBody = document.getElementById("tokenTableBody");
const errorList = document.getElementById("errorList");
const identifierList = document.getElementById("identifierList");
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

// --- NEW DASHBOARD REFERENCES ---
const overallStatusCard = document.getElementById("overallStatusCard");
const heroIcon = document.getElementById("heroIcon");
const heroTitle = document.getElementById("heroTitle");
const heroSubtitle = document.getElementById("heroSubtitle");

const pipeLexer = document.getElementById("pipeLexer");
const pipeDfa = document.getElementById("pipeDfa");
const pipePda = document.getElementById("pipePda");
const pipeCfg = document.getElementById("pipeCfg");
const pipeTree = document.getElementById("pipeTree");

const sampleSelect = document.getElementById("sampleSelect");
const copyCodeBtn = document.getElementById("copyCodeBtn");
const clearCodeBtn = document.getElementById("clearCodeBtn");
const tokenSearchInput = document.getElementById("tokenSearchInput");
const tokenCountBadge = document.getElementById("tokenCountBadge");
const dfaStatusBadge = document.getElementById("dfaStatusBadge");
const pdaStatusBadge = document.getElementById("pdaStatusBadge");
const lexicalStatusBadge = document.getElementById("lexicalStatusBadge");
const syntaxAnalysisContainer = document.getElementById("syntaxAnalysisContainer");
const parseTreeContainer = document.getElementById("parseTreeContainer");

const navBadgeTokens = document.getElementById("navBadgeTokens");
const navBadgeDfa = document.getElementById("navBadgeDfa");
const navBadgePda = document.getElementById("navBadgePda");
const navBadgeLex = document.getElementById("navBadgeLex");

const navPills = Array.from(document.querySelectorAll(".nav-pill"));
const resultCards = Array.from(document.querySelectorAll(".result-card"));

// Cached list of current tokens for search/filter
let currentTokensList = [];

// =========================================================
// SAMPLE PRESET CODES
// =========================================================
const SAMPLE_PRESETS = {
    "valid": `int main() {
    int x = 10;

    if (x > 5) {
        printf("Hello");
    }

    return 0;
}`,
    "dfa-error": `int main() {
    int 5student = 20;
    int while = 10;

    return 0;
}`,
    "pda-error": `int main() {
    int x = 10;

    if (x > 0) {
        printf("Missing closing brace");

    return 0;
}`,
    "lexical-error": `int main() {
    int @invalid = 100;
    char #flag = 'A';

    return 0;
}`,
    "complex-valid": `int main() {
    int count = 0;
    int total = 100;

    while (count < 5) {
        count = count + 1;
        printf("Current count: %d", count);
    }

    if (total >= 100) {
        return 1;
    } else {
        return 0;
    }
}`
};

// =========================================================
// UTILITY HELPERS
// =========================================================
function esc(value) {
    if (value === undefined || value === null) return "";
    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function classifyTokenType(type) {
    const t = String(type).toUpperCase();
    if (["INT", "FLOAT", "CHAR", "IF", "ELSE", "WHILE", "RETURN", "PRINTF"].includes(t)) {
        return { category: "Keyword", className: "badge-keyword" };
    }
    if (t === "IDENTIFIER") {
        return { category: "Identifier", className: "badge-identifier" };
    }
    if (t === "NUMBER") {
        return { category: "Literal Number", className: "badge-number" };
    }
    if (["STRING", "CHARACTER"].includes(t)) {
        return { category: "Literal", className: "badge-string" };
    }
    if (["PLUS", "MINUS", "MULTIPLY", "DIVIDE", "MODULO", "ASSIGN", "EQUAL", "NOT_EQUAL", "GREATER", "LESS", "GREATER_EQUAL", "LESS_EQUAL"].includes(t)) {
        return { category: "Operator", className: "badge-operator" };
    }
    return { category: "Delimiter", className: "badge-delimiter" };
}

function setPipelineStage(el, status, text) {
    if (!el) return;
    el.classList.remove("passed", "failed", "ready-stage", "planned-stage");
    if (status) el.classList.add(status);
    const stateEl = el.querySelector(".stage-state");
    if (stateEl) stateEl.textContent = text;
}

function setStatus(state, text) {
    if (backendStatus) backendStatus.dataset.state = state;
    if (backendStatusText) backendStatusText.textContent = text;
}

function showBanner(type, text) {
    if (!banner) return;
    banner.hidden = false;
    banner.className = "banner " + type;
    banner.innerHTML = `<span aria-hidden="true">${type === "ok" ? "✓" : "⚠"}</span> ${esc(text)}`;
}

function setLoading(isLoading) {
    validateBtn.disabled = isLoading;
    validateBtn.classList.toggle("loading", isLoading);
    const label = validateBtn.querySelector(".btn-label");
    if (label) label.textContent = isLoading ? "Analyzing..." : "Validate Code";
    validateBtn.setAttribute("aria-busy", String(isLoading));
}

// =========================================================
// EDITOR: LINE NUMBERS & SYNCHRONIZATION
// =========================================================
function updateEditor() {
    const text = codeInput.value;
    const lines = text.split("\n").length;

    let numbers = "";
    for (let i = 1; i <= lines; i++) {
        numbers += i + "\n";
    }
    lineNumbers.textContent = numbers.trimEnd();

    if (editorCounter) {
        editorCounter.textContent = `${lines} ${lines === 1 ? "line" : "lines"} · ${text.length} chars`;
    }
    lineNumbers.scrollTop = codeInput.scrollTop;
}

codeInput.addEventListener("input", updateEditor);
codeInput.addEventListener("scroll", function () {
    lineNumbers.scrollTop = codeInput.scrollTop;
});

// Handle Tab key (indent 4 spaces)
codeInput.addEventListener("keydown", function (e) {
    if (e.key === "Tab" && !e.shiftKey) {
        e.preventDefault();
        const start = codeInput.selectionStart;
        codeInput.setRangeText("    ", start, codeInput.selectionEnd, "end");
        updateEditor();
    } else if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
        e.preventDefault();
        validateBtn.click();
    }
});

// Preset selector handler
if (sampleSelect) {
    sampleSelect.addEventListener("change", function () {
        const key = sampleSelect.value;
        if (SAMPLE_PRESETS[key]) {
            codeInput.value = SAMPLE_PRESETS[key];
            updateEditor();
            sampleSelect.value = "";
            codeInput.focus();
        }
    });
}

// Copy button
if (copyCodeBtn) {
    copyCodeBtn.addEventListener("click", async function () {
        try {
            await navigator.clipboard.writeText(codeInput.value);
            const originalText = copyCodeBtn.querySelector("span").textContent;
            copyCodeBtn.querySelector("span").textContent = "Copied!";
            setTimeout(() => {
                copyCodeBtn.querySelector("span").textContent = originalText;
            }, 1800);
        } catch (err) {
            console.error("Clipboard copy failed:", err);
        }
    });
}

// Clear button
if (clearCodeBtn) {
    clearCodeBtn.addEventListener("click", function () {
        codeInput.value = "";
        updateEditor();
        resetToInitialState();
        codeInput.focus();
    });
}

// =========================================================
// STAGE VIEW FILTERING (Tabs / Pills)
// =========================================================
navPills.forEach(pill => {
    pill.addEventListener("click", function () {
        navPills.forEach(p => p.classList.remove("active"));
        pill.classList.add("active");

        const target = pill.dataset.target;
        if (target === "all") {
            resultCards.forEach(card => card.classList.remove("hidden"));
        } else {
            resultCards.forEach(card => {
                if (card.id === target) {
                    card.classList.remove("hidden");
                    card.scrollIntoView({ behavior: "smooth", block: "nearest" });
                } else {
                    card.classList.add("hidden");
                }
            });
        }
    });
});

// =========================================================
// TOKEN SEARCH / FILTER
// =========================================================
if (tokenSearchInput) {
    tokenSearchInput.addEventListener("input", function () {
        const query = tokenSearchInput.value.trim().toLowerCase();
        renderTokenRows(query);
    });
}

function renderTokenRows(query = "") {
    if (!currentTokensList || currentTokensList.length === 0) {
        tokenTableBody.innerHTML = `
            <tr>
                <td colspan="3">
                    <div class="empty-state">
                        <div class="empty-icon">&lt;/&gt;</div>
                        <div class="empty-title">No tokens generated yet</div>
                        <p>Run validation to tokenize Mini-C source code.</p>
                    </div>
                </td>
            </tr>
        `;
        return;
    }

    const filtered = query
        ? currentTokensList.filter(t =>
            String(t.value).toLowerCase().includes(query) ||
            String(t.type).toLowerCase().includes(query) ||
            String(t.line).includes(query)
        )
        : currentTokensList;

    if (filtered.length === 0) {
        tokenTableBody.innerHTML = `
            <tr>
                <td colspan="3">
                    <div class="empty-state">
                        <div class="empty-icon">∅</div>
                        <div class="empty-title">No matching tokens</div>
                        <p>No tokens matched the search filter "${esc(query)}".</p>
                    </div>
                </td>
            </tr>
        `;
        return;
    }

    tokenTableBody.innerHTML = filtered.map(token => {
        const info = classifyTokenType(token.type);
        return `
            <tr>
                <td><code>${esc(token.value)}</code></td>
                <td><span class="badge-token ${info.className}">${esc(token.type)}</span></td>
                <td>Line ${esc(token.line)} : Col ${esc(token.column || 1)}</td>
            </tr>
        `;
    }).join("");
}

// =========================================================
// RESET / INITIAL STATE
// =========================================================
function resetToInitialState() {
    statTokens.textContent = "–";
    statIdentifiers.textContent = "–";
    statErrors.textContent = "–";
    statBrackets.textContent = "–";

    statErrorsCard.classList.remove("good", "bad");
    statBracketsCard.classList.remove("good", "bad");

    navBadgeTokens.textContent = "0";
    navBadgeDfa.textContent = "0";
    navBadgePda.textContent = "0";
    navBadgeLex.textContent = "0";

    tokenCountBadge.textContent = "0 tokens";
    dfaStatusBadge.textContent = "Pending";
    dfaStatusBadge.className = "badge-status";
    pdaStatusBadge.textContent = "Pending";
    pdaStatusBadge.className = "badge-status";
    lexicalStatusBadge.textContent = "Pending";
    lexicalStatusBadge.className = "badge-status";

    overallStatusCard.className = "overall-status-card ready";
    heroIcon.innerHTML = `
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="8" x2="12" y2="12"></line>
            <line x1="12" y1="16" x2="12.01" y2="16"></line>
        </svg>
    `;
    heroTitle.textContent = "READY FOR VALIDATION";
    heroSubtitle.textContent = "Enter Mini-C source code and click 'Validate Code' to run TOC analysis.";

    setPipelineStage(pipeLexer, "", "Pending");
    setPipelineStage(pipeDfa, "", "Pending");
    setPipelineStage(pipePda, "", "Pending");
    setPipelineStage(pipeCfg, "ready-stage", "Ready");
    setPipelineStage(pipeTree, "planned-stage", "Planned");

    currentTokensList = [];
    renderTokenRows();

    identifierList.innerHTML = `
        <div class="empty-state">
            <div class="empty-icon">DFA</div>
            <div class="empty-title">No identifier analysis yet</div>
            <p>Identified tokens will be processed through the DFA state transitions.</p>
        </div>
    `;

    bracketList.innerHTML = `
        <div class="empty-state">
            <div class="empty-icon">{ }</div>
            <div class="empty-title">No bracket analysis yet</div>
            <p>Brackets will be pushed and popped on the PDA stack to check balance.</p>
        </div>
    `;

    errorList.innerHTML = `
        <div class="empty-state">
            <div class="empty-icon">✓</div>
            <div class="empty-title">No lexical scan performed yet</div>
            <p>Errors like illegal symbols or unclosed comments will appear here.</p>
        </div>
    `;

    if (banner) banner.hidden = true;
}

// Initialize on page load
if (codeInput.value.trim() === "") {
    codeInput.value = SAMPLE_PRESETS["valid"];
}
updateEditor();
resetToInitialState();

// =========================================================
// VALIDATION LOGIC
// =========================================================
validateBtn.addEventListener("click", async function () {
    if (validateBtn.disabled) return;

    const code = codeInput.value;

    // 1. EMPTY INPUT CHECK
    if (code.trim() === "") {
        resetToInitialState();
        overallStatusCard.className = "overall-status-card invalid";
        heroIcon.innerHTML = `
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="8" x2="12" y2="12"></line>
                <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
        `;
        heroTitle.textContent = "EMPTY SOURCE CODE";
        heroSubtitle.textContent = "Please enter Mini-C code or select a preset sample from the toolbar.";
        showBanner("warn", "No source code provided for validation.");
        codeInput.focus();
        return;
    }

    // 2. SET LOADING STATE
    setLoading(true);
    setStatus("busy", "Analyzing...");

    overallStatusCard.className = "overall-status-card busy";
    heroIcon.innerHTML = `
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="animation: spin 1s linear infinite;">
            <path d="M21 12a9 9 0 1 1-6.219-8.56"></path>
        </svg>
    `;
    heroTitle.textContent = "ANALYZING MINI-C PROGRAM...";
    heroSubtitle.textContent = "Running Lexical Scanner, DFA Identifiers, and PDA Bracket Verification...";

    // 3. SEND REQUEST TO FLASK BACKEND
    try {
        const response = await fetch("http://127.0.0.1:5000/validate", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                code: code
            })
        });

        if (!response.ok) {
            throw new Error(`Server returned HTTP ${response.status} (${response.statusText})`);
        }

        const data = await response.json();
        setStatus("connected", "Backend Connected");

        // Extract backend arrays
        const tokens = data.tokens || [];
        const lexicalErrors = data.lexical_errors || [];
        const identifierErrors = data.identifier_errors || [];
        const bracketErrors = data.bracket_errors || [];
        const totalErrors = lexicalErrors.length + identifierErrors.length + bracketErrors.length;
        const isValid = (data.success !== undefined) ? data.success : (totalErrors === 0);

        // -----------------------------------------------------
        // CARD 1: RENDER TOKENS
        // -----------------------------------------------------
        currentTokensList = tokens;
        renderTokenRows(tokenSearchInput ? tokenSearchInput.value.trim().toLowerCase() : "");
        tokenCountBadge.textContent = `${tokens.length} token${tokens.length === 1 ? "" : "s"}`;
        navBadgeTokens.textContent = tokens.length;
        statTokens.textContent = tokens.length;

        // -----------------------------------------------------
        // CARD 2: DFA / IDENTIFIER ANALYSIS
        // -----------------------------------------------------
        // Identify valid identifier tokens vs those flagged in identifier_errors
        const rejectedValues = new Set(identifierErrors.map(e => String(e.value || "")));
        const validIdentifiers = tokens.filter(t => t.type === "IDENTIFIER" && !rejectedValues.has(String(t.value)));

        const totalIdentifiersExamined = validIdentifiers.length + identifierErrors.length;
        statIdentifiers.textContent = totalIdentifiersExamined;
        navBadgeDfa.textContent = identifierErrors.length > 0 ? `${identifierErrors.length} err` : totalIdentifiersExamined;

        let dfaHtml = "";

        // First render REJECTED identifiers prominently
        if (identifierErrors.length > 0) {
            dfaStatusBadge.textContent = `${identifierErrors.length} Rejected`;
            dfaStatusBadge.className = "badge-status reject";

            dfaHtml += identifierErrors.map(err => `
                <div class="card-issue">
                    <span class="card-issue-glyph">✕</span>
                    <div class="card-issue-body">
                        <div style="display:flex; justify-content:space-between; align-items:center;">
                            <span class="item-name" style="color: var(--error-light);">${esc(err.value || "Invalid Identifier")}</span>
                            <span class="pill-reject">✕ REJECT</span>
                        </div>
                        <div class="card-issue-msg" style="margin-top: 4px;">${esc(err.message)}</div>
                        <div class="card-issue-pos">Line ${esc(err.line)}${err.column ? `, Column ${esc(err.column)}` : ""} · DFA Trap/Dead State</div>
                    </div>
                </div>
            `).join("");
        } else {
            dfaStatusBadge.textContent = "Accepted";
            dfaStatusBadge.className = "badge-status accept";
        }

        // Then render ACCEPTED identifiers
        if (validIdentifiers.length > 0) {
            dfaHtml += `<div class="analysis-item-list" style="margin-top: 6px;">` + validIdentifiers.map(id => `
                <div class="analysis-item">
                    <div class="item-left">
                        <span class="item-icon" style="color: var(--success);">✓</span>
                        <span class="item-name">${esc(id.value)}</span>
                    </div>
                    <div class="item-right">
                        <span class="item-meta">Line ${esc(id.line)}${id.column ? `, Col ${esc(id.column)}` : ""}</span>
                        <span class="pill-accept">✓ ACCEPT</span>
                    </div>
                </div>
            `).join("") + `</div>`;
        } else if (identifierErrors.length === 0) {
            dfaHtml = `
                <div class="empty-state">
                    <div class="empty-icon">id</div>
                    <div class="empty-title">No identifiers detected</div>
                    <p>This code contains no identifier variables or function names to validate.</p>
                </div>
            `;
        }

        identifierList.innerHTML = dfaHtml;

        // -----------------------------------------------------
        // CARD 3: PDA / BRACKET ANALYSIS
        // -----------------------------------------------------
        navBadgePda.textContent = bracketErrors.length === 0 ? "✓" : `${bracketErrors.length} err`;

        if (bracketErrors.length === 0) {
            pdaStatusBadge.textContent = "Balanced";
            pdaStatusBadge.className = "badge-status accept";
            statBrackets.textContent = "✓ Balanced";
            statBracketsCard.classList.remove("bad");
            statBracketsCard.classList.add("good");

            bracketList.innerHTML = `
                <div class="card-success">
                    <span class="card-success-glyph">✓</span>
                    <div class="card-success-body">
                        <div class="card-success-title">PDA Bracket Validation Passed</div>
                        <div class="card-success-msg">All parentheses (), curly braces {}, and brackets [] are properly balanced and nested.</div>
                        <div class="stack-status-pill">PDA Stack: [ Empty λ / Z₀ ] · Accepted by Empty Stack</div>
                    </div>
                </div>
            `;
        } else {
            pdaStatusBadge.textContent = `${bracketErrors.length} Error${bracketErrors.length === 1 ? "" : "s"}`;
            pdaStatusBadge.className = "badge-status reject";
            statBrackets.textContent = `${bracketErrors.length} Error${bracketErrors.length === 1 ? "" : "s"}`;
            statBracketsCard.classList.remove("good");
            statBracketsCard.classList.add("bad");

            bracketList.innerHTML = bracketErrors.map(err => `
                <div class="card-issue">
                    <span class="card-issue-glyph">✕</span>
                    <div class="card-issue-body">
                        <div class="card-issue-title">PDA Bracket Imbalance</div>
                        <div class="card-issue-msg">${esc(err.message)}</div>
                        <div class="card-issue-pos">Line ${esc(err.line)}${err.column ? `, Column ${esc(err.column)}` : ""} · LIFO Stack Mismatch</div>
                    </div>
                </div>
            `).join("");
        }

        // -----------------------------------------------------
        // CARD 4: LEXICAL ERRORS
        // -----------------------------------------------------
        navBadgeLex.textContent = lexicalErrors.length === 0 ? "0" : lexicalErrors.length;

        if (lexicalErrors.length === 0) {
            lexicalStatusBadge.textContent = "Valid";
            lexicalStatusBadge.className = "badge-status accept";

            errorList.innerHTML = `
                <div class="card-success">
                    <span class="card-success-glyph">✓</span>
                    <div class="card-success-body">
                        <div class="card-success-title">No Lexical Errors Detected</div>
                        <div class="card-success-msg">Every character and escape sequence belongs to the recognized Mini-C alphabet Σ.</div>
                    </div>
                </div>
            `;
        } else {
            lexicalStatusBadge.textContent = `${lexicalErrors.length} Error${lexicalErrors.length === 1 ? "" : "s"}`;
            lexicalStatusBadge.className = "badge-status reject";

            errorList.innerHTML = lexicalErrors.map(err => `
                <div class="card-issue">
                    <span class="card-issue-glyph">✕</span>
                    <div class="card-issue-body">
                        <div class="card-issue-title">Lexical Error</div>
                        <div class="card-issue-msg">${esc(err.message)}</div>
                        <div class="card-issue-pos">Line ${esc(err.line)}${err.column ? `, Column ${esc(err.column)}` : ""} · Character Rejected by Scanner</div>
                    </div>
                </div>
            `).join("");
        }

        // -----------------------------------------------------
        // CARD 5: CFG / SYNTAX ANALYSIS (Ready for parser response)
        // -----------------------------------------------------
        if (data.syntax_errors && data.syntax_errors.length > 0) {
            syntaxAnalysisContainer.innerHTML = data.syntax_errors.map(err => `
                <div class="card-issue">
                    <span class="card-issue-glyph">✕</span>
                    <div class="card-issue-body">
                        <div class="card-issue-title">Syntax Error</div>
                        <div class="card-issue-msg">${esc(err.message || "Grammar derivation failed")}</div>
                        <div class="card-issue-pos">Line ${esc(err.line || 1)} · Expected token mismatch</div>
                    </div>
                </div>
            `).join("");
            setPipelineStage(pipeCfg, "failed", "Syntax Err");
        } else if (data.syntax_valid === true) {
            syntaxAnalysisContainer.innerHTML = `
                <div class="card-success">
                    <span class="card-success-glyph">✓</span>
                    <div class="card-success-body">
                        <div class="card-success-title">Syntax Valid</div>
                        <div class="card-success-msg">Mini-C program adheres to context-free grammar production rules.</div>
                    </div>
                </div>
            `;
            setPipelineStage(pipeCfg, "passed", "Passed");
        } else {
            // Default stage when parser module is under development
            setPipelineStage(pipeCfg, "ready-stage", "Ready");
        }

        // -----------------------------------------------------
        // CARD 6: PARSE TREE (Ready for Graphviz / SVG response)
        // -----------------------------------------------------
        if (data.parse_tree_svg) {
            parseTreeContainer.innerHTML = data.parse_tree_svg;
            setPipelineStage(pipeTree, "passed", "Generated");
        } else if (data.parse_tree_image) {
            parseTreeContainer.innerHTML = `<img src="${esc(data.parse_tree_image)}" alt="Parse Tree" style="max-width: 100%; height: auto;">`;
            setPipelineStage(pipeTree, "passed", "Generated");
        } else {
            setPipelineStage(pipeTree, "planned-stage", "Planned");
        }

        // -----------------------------------------------------
        // OVERALL STATS & SUMMARY
        // -----------------------------------------------------
        statErrors.textContent = totalErrors;
        if (totalErrors === 0) {
            statErrorsCard.classList.remove("bad");
            statErrorsCard.classList.add("good");
        } else {
            statErrorsCard.classList.remove("good");
            statErrorsCard.classList.add("bad");
        }

        // Update pipeline tracker
        setPipelineStage(pipeLexer, lexicalErrors.length === 0 ? "passed" : "failed", lexicalErrors.length === 0 ? "Passed" : "Errors");
        setPipelineStage(pipeDfa, identifierErrors.length === 0 ? "passed" : "failed", identifierErrors.length === 0 ? "Passed" : "Rejected");
        setPipelineStage(pipePda, bracketErrors.length === 0 ? "passed" : "failed", bracketErrors.length === 0 ? "Balanced" : "Mismatch");

        // Final Hero Banner
        if (isValid) {
            overallStatusCard.className = "overall-status-card valid";
            heroIcon.innerHTML = `
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                    <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
            `;
            heroTitle.textContent = "VALID PROGRAM";
            heroSubtitle.textContent = "All validation stages passed successfully. Tokens, DFA identifiers, and PDA brackets are verified.";
            showBanner("ok", "Validation complete: 0 errors detected.");
        } else {
            overallStatusCard.className = "overall-status-card invalid";
            heroIcon.innerHTML = `
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
            `;
            heroTitle.textContent = "VALIDATION FAILED";
            heroSubtitle.textContent = `${totalErrors} issue${totalErrors === 1 ? "" : "s"} found during analysis (Lexical: ${lexicalErrors.length}, DFA: ${identifierErrors.length}, PDA: ${bracketErrors.length}).`;
            showBanner("warn", `Validation failed with ${totalErrors} issue${totalErrors === 1 ? "" : "s"}.`);
        }

    } catch (err) {
        console.error("Backend validation error:", err);
        setStatus("offline", "Backend Offline");

        overallStatusCard.className = "overall-status-card invalid";
        heroIcon.innerHTML = `
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <polygon points="7.86 2 16.14 2 22 7.86 22 16.14 16.14 22 7.86 22 2 16.14 2 7.86 7.86 2"></polygon>
                <line x1="12" y1="8" x2="12" y2="12"></line>
                <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
        `;
        heroTitle.textContent = "BACKEND CONNECTION FAILED";
        heroSubtitle.textContent = "Unable to connect to Flask server at http://127.0.0.1:5000/validate. Ensure the Python backend is active.";

        errorList.innerHTML = `
            <div class="card-issue">
                <span class="card-issue-glyph">⚠</span>
                <div class="card-issue-body">
                    <div class="card-issue-title">Flask Server Unreachable</div>
                    <div class="card-issue-msg">
                        The application could not establish a connection to <code>http://127.0.0.1:5000/validate</code>.<br>
                        Please run <code>python backend/app.py</code> in your terminal to start the Flask server.
                    </div>
                </div>
            </div>
        `;

        identifierList.innerHTML = `<p style="color: var(--text-muted); font-size: 0.85rem; padding: 12px;">DFA identifier analysis unavailable while backend is offline.</p>`;
        bracketList.innerHTML = `<p style="color: var(--text-muted); font-size: 0.85rem; padding: 12px;">PDA bracket analysis unavailable while backend is offline.</p>`;
        showBanner("warn", "Cannot reach Flask validation server on port 5000.");

    } finally {
        setLoading(false);
    }
});
