document.addEventListener("DOMContentLoaded", function () {
    const input = document.getElementById("textoInput");
    const error = document.getElementById("errorMessage");
    const spinner = document.getElementById("spinner");
    const mainSection = document.getElementById("main-section");
    const resultSection = document.getElementById("result-section");
    const codesList = document.getElementById("codes-list");
    const textoPlaceholder = document.getElementById("texto-placeholder");
    const newSearchBtn = document.getElementById("new-search-btn");
    const noCodesMsg = document.getElementById("no-codes-message");

    // NUEVO: almacenar sesionId para usarlo en /select
    let currentSesionId = null;

    const API_BASE = "https://zt7bqbie09.execute-api.us-east-1.amazonaws.com";

    if ("visualViewport" in window) {
        window.visualViewport.addEventListener("resize", () => {
            input.scrollIntoView({ behavior: "smooth", block: "center" });
        });
    }

    function showError(message) {
        error.textContent = message;
        error.style.display = "block";
    }

    function hideMessages() {
        error.style.display = "none";
        spinner.style.display = "none";
        noCodesMsg.style.display = "none";
    }

    function showSpinner() {
        spinner.style.display = "block";
    }

    function hideSpinner() {
        spinner.style.display = "none";
    }

    function renderCodes(codes) {
        codesList.innerHTML = "";
        if (!codes || codes.length === 0) {
            noCodesMsg.style.display = "block";
            return;
        }
        noCodesMsg.style.display = "none";
        codes.forEach(code => {
            const codeItem = document.createElement("div");
            codeItem.className = "code-item";
            const info = document.createElement("div");
            info.className = "code-info";
            const number = document.createElement("div");
            number.className = "code-number";
            number.textContent = code.codigo || code.code || "";
            const desc = document.createElement("div");
            desc.className = "code-description";
            desc.textContent = code.desc_es || code.descripcion || code.description || "";
            info.appendChild(number);
            info.appendChild(desc);

            const btn = document.createElement("button");
            btn.className = "select-button";
            btn.textContent = "Elegir";
            btn.onclick = function () {
                seleccionarCodigo(code);
            };

            codeItem.appendChild(info);
            codeItem.appendChild(btn);
            codesList.appendChild(codeItem);
        });
    }

    async function seleccionarCodigo(code) {
        showSpinner();
        try {
            const res = await fetch(API_BASE + "/select", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ 
                    sesionId: currentSesionId, 
                    codigo: code.codigo || code.code 
                })
            });
            hideSpinner();
            const data = await res.json();
            if (data && data.ok) {
                alert("Código elegido: " + (code.codigo || code.code));
            } else {
                showError("No se pudo registrar la selección.");
            }
        } catch {
            hideSpinner();
            showError("Error al conectar con el servidor.");
        }
    }

    input.addEventListener("input", () => {
        if (input.value.trim()) hideMessages();
    });

    input.addEventListener("keydown", async (e) => {
        if (e.key !== "Enter") return;
        e.preventDefault();
        const texto = input.value.trim().substring(0, 200);
        if (!texto) return;
        showSpinner();
        hideMessages();

        try {
            const res = await fetch(API_BASE + "/analyze", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ texto })
            });
            hideSpinner();
            if (!res.ok) {
                const errorText = await res.text();
                throw new Error(`Error del servidor: ${res.status} ${errorText}`);
            }
            const data = await res.json();
            mainSection.style.display = "none";
            resultSection.style.display = "block";
            textoPlaceholder.textContent = texto;
            renderCodes(data.codigos || data.codes || []);
            // NUEVO: guardar sesionId para /select
            currentSesionId = data.sesionId || null;
        } catch (err) {
            hideSpinner();
            showError("Error: " + (err.message || "Error desconocido"));
        }
    });

    newSearchBtn.addEventListener("click", () => {
        mainSection.style.display = "block";
        resultSection.style.display = "none";
        input.value = "";
        hideMessages();
        input.focus();
        currentSesionId = null;
    });

    // Inicializar
    hideMessages();
    mainSection.style.display = "block";
    resultSection.style.display = "none";

    // SIEMPRE enfoca el input al cargar la página
    input.focus();
});
