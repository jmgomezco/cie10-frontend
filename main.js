document.addEventListener("DOMContentLoaded", function () {
    // Elementos de la pantalla inicial
    const containerInicial = document.getElementById("container-inicial");
    const input = document.getElementById("textoInput");
    const error = document.getElementById("errorMessage");
    const spinner = document.getElementById("spinner");

    // Elementos de la pantalla de resultados
    const containerResultados = document.getElementById("container-resultados");
    const resultSectionCodesList = document.getElementById("codes-list");
    const textoPlaceholder = document.getElementById("texto-placeholder");
    const newSearchBtn = document.getElementById("new-search-btn");
    const noCodesMsg = document.getElementById("no-codes-message");

    // NUEVO: almacenar sesionId para usarlo en /select
    let currentSesionId = null;

    // Quita la barra final para evitar doble barra en las rutas
    const API_BASE = "https://ffljaqyibd.execute-api.us-east-1.amazonaws.com";

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
    noCodesMsg.style.display = "none";
    }

    function showSpinner() {
        spinner.style.display = "block";
    }

    function hideSpinner() {
        spinner.style.display = "none";
    }

    function renderCodes(codes) {
        resultSectionCodesList.innerHTML = "";
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
            resultSectionCodesList.appendChild(codeItem);
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

    // Usamos keydown, pero solo actúa si hay texto no vacío
input.addEventListener("keydown", async (e) => {
    if (e.key !== "Enter") return;
    e.preventDefault();
    const texto = input.value.trim().substring(0, 200);

    if (!texto) {
        input.focus();
        return;
    }
    hideMessages();   // <-- Primero oculta mensajes previos
    showSpinner();    // <-- Luego muestra el spinner

    try {
        const res = await fetch(API_BASE + "/texto", {
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
        containerInicial.style.display = "none";
        containerResultados.style.display = "flex";
        textoPlaceholder.textContent = texto;
        renderCodes(data.codigos || data.codes || []);
        currentSesionId = data.sesionId || null;
    } catch (err) {
        hideSpinner();
        showError("Error: " + (err.message || "Error desconocido"));
    }
});


    newSearchBtn.addEventListener("click", () => {
        containerInicial.style.display = "flex";
        containerResultados.style.display = "none";
        input.value = "";
        hideMessages();
        currentSesionId = null;
        setTimeout(() => {
            input.focus();
        }, 100); // Asegura que el input reciba el focus tras el cambio de pantalla
    });

    // Inicializar
    hideMessages();
    containerInicial.style.display = "flex";
    containerResultados.style.display = "none";
    input.focus();
});
