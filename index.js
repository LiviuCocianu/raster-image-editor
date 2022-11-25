var canvas;
var context;

var fullInfoText;
var INFO_TEXT_LIMIT;

var tools_info = {
    none: "Treceți cu cursorul peste un instrument pentru a-i vedea descrierea",
    SELECTION: "<b>Selectează:</b> Selectează o porțiune din imagine sau toată imaginea.",
    CROP: "<b>Decupează:</b> Decupează imaginea conform unei selecții făcute cu Select.",
    EFFECTS: "<b>Efecte:</b> Aplică un filtru pe porțiunea selectată.",
    RESIZE: "<b>Redimensionează:</b> Scalează imaginea după o lungime și lățime date.",
    TEXT: "<b>Text:</b> Adaugă un text pe imagine.",
    COLOR_HISTOGRAM: "<b>Histogramă:</b> Comută histograma de culori pentru o selecție.",
    CUT: "<b>Decupează:</b> Elimină porțiunea selectată din imagine."
}

window.onload = () => {
    canvas = document.getElementById("workspace-canvas");
    context = canvas.getContext("2d", {willReadFrequently: true});

    ajustareDimensiuneAplicatie();
    initializareEvenimente();

    let textBox = document.getElementById("info-tooltip-textbox");
    INFO_TEXT_LIMIT = Math.ceil(textBox.getBoundingClientRect().width * 0.112);

    infoDefault();
};

function initializareEvenimente() {
    let infoText = document.getElementById("info-tooltip-textbox");

    infoText.addEventListener("mouseenter", (e) => {
        let infoHover = document.getElementById("info-tooltip-hover");

        if (infoHover.style.display !== "block" && fullInfoText.length > INFO_TEXT_LIMIT) { 
            infoHover.style.display = "block";

            infoHover.style.left = e.clientX + "px";
            infoHover.style.top = e.clientY + "px";

            infoHover.classList.remove("hover-out");
            infoHover.classList.add("hover-in");
            infoHover.innerHTML = fullInfoText;
        }
    });

    infoText.addEventListener("mouseleave", () => {
        let infoHover = document.getElementById("info-tooltip-hover");

        if (infoHover.style.display !== "none") {
            infoHover.classList.remove("hover-in");
            infoHover.classList.add("hover-out");
    
            setTimeout(() => {
                if (infoHover.style.display !== "none")
                    infoHover.style.display = "none";
            }, 1500);
        }
    });

    Array.from(document.getElementsByClassName("tool")).forEach(el => {
        el.addEventListener("mouseenter", () => {
            info(tools_info[el.alt])
        });
    });
}

function infoDefault() {
    let infoText = document.getElementById("info-tooltip-text");
    setInfoText(tools_info.none);
    infoText.style.color = "gray";
}

function info(text) {
    let infoText = document.getElementById("info-tooltip-text");
    setInfoText(text);
    infoText.style.color = "var(--mild-black)";
}

/*
    Ajustarea marimilor aplicației în mod programatic.
    Canvas-ul trebuie să aibă o marime fixă, prin urmare
    ajustăm, pe lânga canvas, și alte componente, precum
    toolpicker-ul și toolbar-ul, pentru a se potrivi
    mărimii inițiale a ferestrei.
*/
function ajustareDimensiuneAplicatie() {
    let workspaceDiv = document.getElementById("workspace-area");
    let barsDiv = document.getElementById("bars");
    let toolpickerDiv = document.getElementById("toolpicker");

    let workspaceRect = workspaceDiv.getBoundingClientRect();

    barsDiv.style.width = workspaceRect.width + "px";

    canvas.width = workspaceRect.width;
    canvas.height = workspaceRect.height;
    canvas.style.width = workspaceRect.width + "px";
    canvas.style.height = workspaceRect.height + "px";

    var padding = parseInt(window.getComputedStyle(toolpickerDiv).paddingTop.replace(/[^\d+]/ig, ""));
    toolpickerDiv.style.height = (workspaceRect.height - padding) + "px";

    workspaceDiv.style.width = workspaceRect.width + "px";
    workspaceDiv.style.height = workspaceRect.height + "px";
}

function setInfoText(text) {
    let textArea = document.getElementById("info-tooltip-text");

    fullInfoText = text.slice();
    textArea.innerHTML = text.slice(0, INFO_TEXT_LIMIT) + (text.length > INFO_TEXT_LIMIT ? "<b>[...]</b>" : "");
}