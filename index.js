// Obiecte de lucru
var infoTextbox;
var toolbar;
var workspace;
var selection;

// Toolbar
var loadOption, saveOption;

// Fereastra de load
var darkness;
var loadWindow;

window.onload = () => {
    // Toolbar
    loadOption = document.getElementById("load-button");
    saveOption = document.getElementById("save-button");
    loadOption.focus();

    // Obiecte de lucru
    toolbar = new Toolbar();
    infoTextbox = new InfoTextbox();
    workspace = new Workspace();
    selection = Selection.create(0, 0, 1, 1);

    // Fereastra de load
    darkness = document.getElementById("darkness");
    loadWindow = new LoadWindow();
    
    ajustareDimensiuneAplicatie();
    initializareEvenimente();
};

function initializareEvenimente() {
    saveOption.addEventListener("click", e => {
        if(workspace.loadedImageExists) {
            e.preventDefault();

            const a = document.createElement("a");

            a.style.display = "none";
            a.href = workspace.getCanvasElement.toDataURL(Image.prototype.format, 1.0);
            a.download = workspace.getLoadedImage.name;

            a.click();
            a.remove();
        }
    });
}

/*
    Ajustarea marimilor aplicației în mod programatic.
    Canvas-ul trebuie să aibă o marime fixă, prin urmare
    ajustăm, pe lânga canvas, și alte componente, precum
    toolpicker-ul și toolbar-ul, pentru a se potrivi
    mărimii inițiale a ferestrei.
*/
function ajustareDimensiuneAplicatie() {
    const workspaceDiv = document.getElementById("workspace-area");
    const barsDiv = document.getElementById("bars");
    const toolpickerDiv = document.getElementById("toolpicker");
    const canvCont = workspace.getContainingCanvasElement;

    canvCont.style.width = `${canvCont.getBoundingClientRect().width}px`;
    canvCont.style.height = `${canvCont.getBoundingClientRect().height}px`;

    const workspaceRect = workspaceDiv.getBoundingClientRect();
    barsDiv.style.width = workspaceRect.width + "px";

    const padding = parseInt(window.getComputedStyle(toolpickerDiv).paddingTop.replace(/[^\d+]/ig, ""));
    toolpickerDiv.style.height = (workspaceRect.height - padding) + "px";

    workspaceDiv.style.width = workspaceRect.width + "px";
    workspaceDiv.style.height = workspaceRect.height + "px";
}

class InfoTextbox {
    constructor() {
        this.infoTextbox = document.getElementById("info-tooltip-textbox");
        this.infoOwnText = document.getElementById("info-tooltip-text");
        this.infoTextHover = document.getElementById("info-tooltip-hover");

        this.fullInfoText;
        this.infoTextLimit = Math.ceil(this.infoTextbox.getBoundingClientRect().width * 0.112);

        this.infoDefault();

        this.events();
    }

    get getInfoTextboxElement() {
        return this.infoTextbox;
    }

    get getInfoTextLimit() {
        return this.infoTextLimit;
    }

    setInfoText(text) {
        this.fullInfoText = text.slice();
        this.infoOwnText.innerHTML = text.slice(0, this.infoTextLimit) + (text.length > this.infoTextLimit ? "<b>[...]</b>" : "");
    }

    infoDefault() {
        this.setInfoText(toolbar.getToolInfo(toolbar.ToolEnum.NONE));
        this.infoOwnText.style.color = "gray";
    }

    info(text) {
        this.setInfoText(text);
        this.infoOwnText.style.color = "var(--mild-black)";
    }

    events() {
        this.infoTextbox.addEventListener("mouseenter", e => {
            if (this.infoTextHover.style.display !== "block" && this.fullInfoText.length > this.infoTextLimit) {
                this.infoTextHover.style.display = "block";

                this.infoTextHover.style.left = e.clientX + "px";
                this.infoTextHover.style.top = e.clientY + "px";

                this.infoTextHover.classList.remove("hover-out");
                this.infoTextHover.classList.add("hover-in");
                this.infoTextHover.innerHTML = this.fullInfoText;
            }
        });

        this.infoTextbox.addEventListener("mouseleave", () => {
            if (this.infoTextHover.style.display !== "none") {
                this.infoTextHover.classList.remove("hover-in");
                this.infoTextHover.classList.add("hover-out");

                setTimeout(() => {
                    if (this.infoTextHover.style.display !== "none")
                        this.infoTextHover.style.display = "none";
                }, 1500);
            }
        });

        Array.from(document.getElementsByClassName("tool")).forEach(el => {
            el.addEventListener("mouseenter", () => {
                this.info(toolbar.getToolInfo(toolbar.ToolEnum[el.alt]))
            });
        });
    }
}

class Toolbar {
    constructor() {
        this.toolEnum = {
            NONE: -1,
            SELECTION: 0,
            CROP: 1,
            EFFECTS: 2,
            RESIZE: 3,
            TEXT: 4,
            COLOR_HISTOGRAM: 5,
            CUT: 6
        }

        this.toolsInfo = {
            NONE: "Treceți cu cursorul peste un instrument pentru a-i vedea descrierea",
            SELECTION: "<b>Selectează:</b> Selectează o porțiune din imagine sau toată imaginea.",
            CROP: "<b>Decupează:</b> Decupează imaginea conform unei selecții făcute cu Select.",
            EFFECTS: "<b>Efecte:</b> Aplică un filtru pe porțiunea selectată.",
            RESIZE: "<b>Redimensionează:</b> Scalează imaginea după o lungime și lățime date.",
            TEXT: "<b>Text:</b> Adaugă un text pe imagine.",
            COLOR_HISTOGRAM: "<b>Histogramă:</b> Comută histograma de culori pentru o selecție.",
            CUT: "<b>Decupează:</b> Elimină porțiunea selectată din imagine."
        }

        this.selectedTool = this.toolEnum.NONE;
    }

    get ToolEnum() {
        return this.toolEnum;
    }

    getToolInfo(tool) {
        return this.toolsInfo[Object.keys(this.toolEnum).find(key => this.toolEnum[key] == tool)];
    }

    selectTool(tool) {
        if(workspace.loadedImageExists) {
            this.selectedTool = tool;

            switch (tool) {
                case this.toolEnum.SELECTION:
                    selection.makeSelectionAt(0, 0, workspace.CW - 2, workspace.CH - 2);
                    document.getElementById("select-button").classList.add("selected-tool");
                    break;
            }
        }
    }

    deselectTool(tool) {
        switch (tool) {
            case this.toolEnum.SELECTION:
                selection.hideSelection();
                document.getElementById("select-button").classList.remove("selected-tool");

                break;
        }

        this.selectedTool = this.toolEnum.NONE;
    }
}

class Workspace {
    constructor() {
        this.workspace = document.getElementById("workspace-area");
        this.canvas = document.getElementById("workspace-canvas");
        this.canvCont = document.getElementById("ws-canvas-container");
        this.context = this.canvas.getContext("2d", { willReadFrequently: true });
        this.currentImage = new Image(0, 0);

        this.CW = this.canvas.width;
        this.CH = this.canvas.height;
    }

    get getWorkspaceElement() {
        return this.workspace;
    }

    get getCanvasElement() {
        return this.canvas;
    }

    get getContainingCanvasElement() {
        return this.canvCont;
    }

    get getCanvasContext() {
        return this.context;
    }

    get getLoadedImage() {
        return this.currentImage;
    }

    get loadedImageExists() {
        return Image.prototype.format ? true : false;
    }

    setCanvasSize(w, h) {
        this.canvas.width = w;
        this.canvas.height = h;
        this.canvas.style.width = `${w}px`;
        this.canvas.style.height = `${h}px`;
        this.canvCont.style.width = `${this.canvas.width}px`;
        this.canvCont.style.height = `${this.canvas.height}px`;
        this.CW = this.canvas.width;
        this.CH = this.canvas.height;
    }

    fitCanvas(imgW, imgH) {
        const wrkRect = this.workspace.getBoundingClientRect();
        const [wrkW, wrkH] = [wrkRect.width, wrkRect.height];
        const perc = 0.7;

        const percW = Math.round(wrkW * perc);
        const percH = Math.round(wrkH * perc);

        const fitW = imgW > imgH ? percW : Math.round(imgW * (percH / imgH));
        const fitH = imgW < imgH ? percH : Math.round(imgH * (percW / imgW));

        this.setCanvasSize(fitW, fitH);
    }

    displayOnCanvas() {
        if(this.loadedImageExists) {
            this.context.clearRect(0, 0, this.CW, this.CH);
            //this.fitCanvas(this.currentImage.naturalWidth, this.currentImage.naturalHeight);
            this.setCanvasSize(this.currentImage.naturalWidth, this.currentImage.naturalHeight);
            this.context.drawImage(this.getLoadedImage, 0, 0, this.CW, this.CH);

            loadWindow.closeLoadWindow();
        }
    }
}

class LoadWindow {
    constructor() {
        this.loadWindow = document.getElementById("load-window");
        this.loadClose = document.getElementById("lw-close-button");
        this.loadInput = document.getElementById("lw-load-input");
        this.loadSubmit = document.getElementById("lw-submit-button");

        this.events();
    }

    get getLoadWindowElement() {
        return this.loadWindow;
    }

    openLoadWindow() {
        this.loadWindow.style.visibility = "visible";
        loadOption.disabled = true;
        loadOption.style.cursor = "not-allowed";
        this.loadSubmit.style.cursor = "not-allowed";
        this.loadInput.focus();
        this.loadInput.value = "";

        darkness.style.visibility = "visible";
    }

    closeLoadWindow() {
        this.loadWindow.style.visibility = "hidden";
        loadOption.disabled = false;
        loadOption.style.cursor = "pointer";
        this.loadInput.value = "";

        darkness.style.visibility = "hidden";
    }

    events() {
        loadOption.addEventListener("click", () => this.openLoadWindow());
        this.loadClose.addEventListener("click", () => this.closeLoadWindow());

        this.loadInput.addEventListener("change", e => {
            const reader = new FileReader();

            reader.addEventListener("load", () => {
                this.loadSubmit.disabled = false;
                this.loadSubmit.style.cursor = "pointer";
                this.loadSubmit.focus();
                workspace.getLoadedImage.src = reader.result;

                // Păstrăm numele original al imaginii
                workspace.getLoadedImage.name = e.target.files[0].name.split(".")[0];

                // Stocăm tipul imaginii direct în obiectul Image la nivel global, creând o nouă proprietate "format"
                Image.prototype.format = reader.result.split(";")[0].slice(5);
            });

            reader.readAsDataURL(e.target.files[0]);
        });

        this.loadSubmit.addEventListener("click", () => workspace.displayOnCanvas());
    }
}

class Selection {
    selMouseDown = {
        selecting: false,
        point: { x: 0, y: 0 }
    };
    
    constructor() {
        [this.x, this.y, this.w, this.h] = [0, 0, 8, 8];
        this.sel = document.getElementById("selection");

        this.setElemX(this.x);
        this.setElemY(this.y);
        this.setElemWidth(this.w);
        this.setElemHeight(this.h);

        this.events();
    }

    static create(x, y, w, h) {
        const sel = new Selection();

        [sel.x, sel.y, sel.w, sel.h] = [x, y, Math.max(8, w), Math.max(8, h)];
        sel.sel = document.getElementById("selection");

        sel.setElemX(sel.getX);
        sel.setElemY(sel.getY);
        sel.setElemWidth(sel.getWidth);
        sel.setElemHeight(sel.getHeight);

        sel.hideSelection();

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
        w = Math.max(w, 8);
        this.sel.style.width = `${w}px`;
    }

    setElemHeight(h) {
        h = Math.max(h, 8);
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
        const cnvRect = workspace.getCanvasElement().getBoundingClientRect();
        let crn;

        switch(corner) {
            case 1: crn = document.getElementById("sel-tl"); break;
            case 2: crn = document.getElementById("sel-tr"); break;
            case 3: crn = document.getElementById("sel-bl"); break;
            case 4: crn = document.getElementById("sel-br"); break;
        }

        const cornerRect = crn.getBoundingClientRect();

        point.x = Math.round(cornerRect.left - cnvRect.left + 1);
        point.y = Math.round(cornerRect.top - cnvRect.top + 1);

        return point;
    }

    // Colturi: 1-4
    makeSelectionAt(x, y, w, h, corner = 4) {
        if (this.sel.style.display == "none") {
            this.sel.style.display = "grid";
        }

        switch(corner) {
            case 1:
                const diffX = x - this.x;
                const diffY = y - this.y;
                x = w;
                y = h;
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

        this.selMouseDown.point = {x, y};

        this.setElemX(x);
        this.setElemY(y);
        this.setElemWidth(w);
        this.setElemHeight(h);

        [this.x, this.y, this.w, this.h] = [x, y, w, h]
    }

    finishSelecting() {
        this.selMouseDown.selecting = false;
    }

    hideSelection() {
        this.sel.style.display = "none";
    }

    events() {
        const canvCont = workspace.getContainingCanvasElement;

        canvCont.addEventListener("mouseup", () => this.finishSelecting());
        canvCont.addEventListener("mouseleave", () => this.finishSelecting());

        workspace.getWorkspaceElement.addEventListener("dblclick", () => {
            if (this.sel.style.display != "none") {
                toolbar.deselectTool(toolbar.ToolEnum.SELECTION);
            }
        });

        document.getElementById("sel-br").addEventListener("mousedown", () => {
            this.selMouseDown.selecting = true;
        });

        canvCont.addEventListener("mousedown", e => {
            if (e.target.classList.contains("sel-node")) return;
            if (!workspace.loadedImageExists) return;

            toolbar.deselectTool(toolbar.ToolEnum.SELECTION);

            const rect = canvCont.getBoundingClientRect();
            const x = Math.round(Math.max(0, e.clientX - rect.left));
            const y = Math.round(Math.max(0, e.clientY - rect.top));

            this.selMouseDown.point = { x, y };
            this.selMouseDown.selecting = true;
        });

        canvCont.addEventListener("mousemove", e => {
            const rect = canvCont.getBoundingClientRect();
            const x = this.selMouseDown.point.x;
            const y = this.selMouseDown.point.y;
            const w = Math.round(Math.max(0, (e.clientX - rect.left) - x));
            const h = Math.round(Math.max(0, (e.clientY - rect.top) - y));

            if ((x + w) >= rect.width || (y + h) >= rect.height) {
                this.finishSelecting();
                return;
            }

            if(this.selMouseDown.selecting)
                this.makeSelectionAt(x, y, w, h, 4);
        });
    }
}