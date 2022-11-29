var canvas;
var context;

var darkness;
var selection;
var loadWindow;
var loadOption, saveOption;
var workspace;

var currentImage;
var fullInfoText;
var workspaceScale = 1;
var selMouseDown = {
    point: {
        x: 10,
        y: 10
    },
    topLeft: false,
    topRight: false,
    bottomLeft: false,
    bottomRight: false
};

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
    selection = Selection.create(0, 0, 50, 50);
    loadWindow = document.getElementById("load-window");
    loadOption = document.getElementById("load-button");
    saveOption = document.getElementById("save-button");
    workspace = document.getElementById("workspace-area");

    loadOption.focus();
    selection.sel.style.display = "none";

    ajustareDimensiuneAplicatie();
    initializareEvenimente();
    initEvenimenteSel();

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

    saveOption.addEventListener("click", e => {
        if(Image.prototype.format) {
            e.preventDefault();

            const a = document.createElement("a");

            a.style.display = "none";
            a.href = canvas.toDataURL(Image.prototype.format, 1.0);
            a.download = currentImage.name;

            a.click();
            a.remove();
        }
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

            // Păstrăm numele original al imaginii
            currentImage.name = e.target.files[0].name.split(".")[0];

            // Stocăm tipul imaginii direct în obiectul Image la nivel global, creând o nouă proprietate "format"
            Image.prototype.format = reader.result.split(";")[0].slice(5);
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

    window.addEventListener("keyup", e => {
        if(e.ctrlKey) {
            const incr = 0.1;

            // Keybinds pentru zoom pe workspace
            if(e.key == ".") {
                workspaceScale = Math.max(0, Math.min(workspaceScale + incr, 3));
                canvas.style.transform = `scale(${workspaceScale})`;
            } else if(e.key == ",") {
                workspaceScale = Math.max(0, Math.min(workspaceScale - incr, 3));
                canvas.style.transform = `scale(${workspaceScale})`;
            }
        }
    });

    Array.from(document.getElementsByClassName("tool")).forEach(el => {
        el.addEventListener("mouseenter", () => {
            info(tools_info[el.alt])
        });
    });
}

function initEvenimenteSel() {
    const tl = document.getElementById("sel-tl");
    const tr = document.getElementById("sel-tr");
    const bl = document.getElementById("sel-bl");
    const br = document.getElementById("sel-br");
    const canvCont = document.getElementById("ws-canvas-container");

    tl.addEventListener("mousedown", () => selMouseDown.topLeft = true);
    tr.addEventListener("mousedown", () => selMouseDown.topRight = true);
    bl.addEventListener("mousedown", () => selMouseDown.bottomLeft = true);
    br.addEventListener("mousedown", () => selMouseDown.bottomRight = true);

    // Array.from(document.getElementsByClassName("sel-handle")).forEach(el => {
    //     el.addEventListener("mousedown", e => {
    //         selMouseDown.point = {
    //             x: Math.round(Math.max(0, e.target.clientX)),
    //             y: Math.round(Math.max(0, e.target.clientY))
    //         };
    //     });
    // });

    canvCont.addEventListener("mousedown", e => {
        if(e.target.classList.contains("sel-handle")) return;

        const rect = canvas.getBoundingClientRect();
        const x = Math.round(Math.max(0, e.clientX - rect.left));
        const y = Math.round(Math.max(0, e.clientY - rect.top));

        selMouseDown.point = {x, y};
        selMouseDown.bottomRight = true;
    });

    canvCont.addEventListener("mouseup", e => {
        selMouseDown.topLeft = false;
        selMouseDown.topRight = false;
        selMouseDown.bottomLeft = false;
        selMouseDown.bottomRight = false;
    });

    canvCont.addEventListener("mousemove", e => {
        const rect = canvas.getBoundingClientRect();
        const x = selMouseDown.point.x;
        const y = selMouseDown.point.y;
        const w = Math.round(Math.max(0, (e.clientX - rect.left) - x));
        const h = Math.round(Math.max(0, (e.clientY - rect.top) - y));

        if(selMouseDown.topLeft) 
            selection.makeSelectionAt(x, y, w, h, 1);

        if(selMouseDown.topRight) 
            selection.makeSelectionAt(x, y, w, h, 2);

        if(selMouseDown.bottomLeft) 
            selection.makeSelectionAt(x, y, w, h, 3);

        if(selMouseDown.bottomRight)
            selection.makeSelectionAt(x, y, w, h, 4);
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

class Selection {
    constructor() {
        this.x = 0;
        this.y = 0;
        this.w = 8;
        this.h = 8;

        this.sel = document.getElementById("selection");

        this.setElemX(this.x);
        this.setElemY(this.y);
        this.setElemWidth(this.w);
        this.setElemHeight(this.h);
    }

    static create(x, y, w, h) {
        const sel = new Selection();

        sel.x = x;
        sel.y = y;
        sel.w = Math.max(8, w);
        sel.h = Math.max(8, h);

        sel.sel = document.getElementById("selection");

        sel.setElemX(sel.getX);
        sel.setElemY(sel.getY);
        sel.setElemWidth(sel.getWidth);
        sel.setElemHeight(sel.getHeight);

        return sel;
    }

    get getX() {
        return this.x;
    }

    get getY() {
        return this.y;
    }

    get getWidth() {
        return this.w;
    }

    get getHeight() {
        return this.h;
    }

    setElemX(x) {
        this.sel.style.left = `${x}px`;
    }

    setElemY(y) {
        this.sel.style.top = `${y}px`;
    }

    setElemWidth(w) {
        this.sel.style.width = `${w}px`;
    }

    setElemHeight(h) {
        this.sel.style.height = `${h}px`;
    }

    getPixelPositions() {
        let pixels = [];

        for(let i = this.x; i < this.w; i++) {
            for(let j = this.y; i < this.h; i++) {
                pixels.push({x: i, y: j});
            }
        }

        return pixels;
    }

    getCornerPosition(corner) {
        const point = {x: 0, y: 0};
        const cnvRect = canvas.getBoundingClientRect();
        let crn;

        switch(corner) {
            case 1:
                crn = document.getElementById("sel-tl");
                break;
            case 2:
                crn = document.getElementById("sel-tr");
                break;
            case 3:
                crn = document.getElementById("sel-bl");
                break;
            case 4:
                crn = document.getElementById("sel-br");
                break;
        }

        const cornerRect = crn.getBoundingClientRect();

        point.x = Math.round(cornerRect.left - cnvRect.left + 1);
        point.y = Math.round(cornerRect.top - cnvRect.top + 1);

        return point;
    }

    // Colturi: 1-4
    makeSelectionAt(x, y, w, h, corner) {
        if(this.sel.style.display == "none") {
            this.sel.style.display = "grid";
        }

        switch(corner) {
            case 1:
                this.sel.style.transformOrigin = "100% 100%";
                break;
            case 2:
                this.sel.style.transformOrigin = "100% 0";
                break;
            case 3:
                this.sel.style.transformOrigin = "0 100%";
                break;
            case 4:
                this.sel.style.transformOrigin = "0 0";
                break;
        }

        this.setElemX(x);
        this.setElemY(y);
        this.setElemWidth(w);
        this.setElemHeight(h);

        this.x = x;
        this.y = y;
        this.w = w;
        this.h = h;
    }
}