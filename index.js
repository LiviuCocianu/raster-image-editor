var canvas;
var context;

var darkness;
var loadWindow;
var loadOption, saveOption;

var currentImage;
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

    currentImage = new Image(0, 0);

    darkness = document.getElementById("darkness");
    loadWindow = document.getElementById("load-window");
    loadOption = document.getElementById("load-button");
    saveOption = document.getElementById("save-button");

    loadOption.focus();

    ajustareDimensiuneAplicatie();
    initializareEvenimente();

    let textBox = document.getElementById("info-tooltip-textbox");
    INFO_TEXT_LIMIT = Math.ceil(textBox.getBoundingClientRect().width * 0.112);

    infoDefault();
};

function initializareEvenimente() {
    let loadClose = document.getElementById("lw-close-button");
    let loadInput = document.getElementById("lw-load-input");
    let loadSubmit = document.getElementById("lw-submit-button");
    let infoText = document.getElementById("info-tooltip-textbox");

    loadInput.value = "";

    loadOption.addEventListener("click", () => {
        openLoadWindow();
    });

    loadClose.addEventListener("click", () => {
        closeLoadWindow();
    });

    loadInput.addEventListener("change", e => {
        const reader = new FileReader();

        reader.addEventListener("load", () => {
            loadSubmit.disabled = false;
            loadSubmit.style.cursor = "pointer";
            loadSubmit.focus();
            currentImage.src = reader.result;
        });

        reader.readAsDataURL(e.target.files[0]);
    });

    loadSubmit.addEventListener("click", () => {
        if(currentImage.naturalWidth > 0) 
            displayOnCanvas();
    });

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

function openLoadWindow() {
    let loadSubmit = document.getElementById("lw-submit-button");
    let loadInput = document.getElementById("lw-load-input");

    loadWindow.style.visibility = "visible";
    loadOption.disabled = true;
    loadOption.style.cursor = "not-allowed";
    loadSubmit.style.cursor = "not-allowed";
    loadInput.focus();

    darkness.style.visibility = "visible";
}

function closeLoadWindow() {
    let loadInput = document.getElementById("lw-load-input");

    loadWindow.style.visibility = "hidden";
    loadOption.disabled = false;
    loadOption.style.cursor = "pointer";
    loadInput.value = "";

    darkness.style.visibility = "hidden";
}

function displayOnCanvas() {
    context.clearRect(0, 0, canvas.width, canvas.height);

    canvas.width = canvas.style.width = currentImage.naturalWidth;
    canvas.height = canvas.style.height = currentImage.naturalHeight;

    context.drawImage(currentImage, 0, 0, canvas.width, canvas.height);
    closeLoadWindow();
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

    canvas.width = 0;
    canvas.height = 0;

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