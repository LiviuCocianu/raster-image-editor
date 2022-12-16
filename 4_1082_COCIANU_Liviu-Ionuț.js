// Obiecte de lucru
var infoTextbox;
var toolbar;
var workspace;
var selection;
var crop;
var effects;
var resize;

// Toolbar
var loadOption, saveOption;

// Fereastra de load
var darkness;
var loadWindow;

// Constante
const maxImagePxSize = 3000;

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
    crop = new Cropping();
    effects = new Effects();
    resize = new Resize();

    // Fereastra de load
    darkness = document.getElementById("darkness");
    loadWindow = new LoadWindow();
    
    ajustareDimensiuneAplicatie();
    initializareEvenimente();
};

function initializareEvenimente() {
    saveOption.addEventListener("click", e => {
        if(workspace.loadedImageExists) {
            const a = document.createElement("a");

            a.style.display = "none";
            a.href = workspace.getCanvasElement.toDataURL(Image.prototype.format, 1.0);
            a.download = workspace.getLoadedImage.name;

            a.click();
            a.remove();
        } else {
            infoTextbox.warn(infoTextbox.warnings.saveNoImage);
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
    const barsDiv = document.getElementById("bars");
    const toolpickerDiv = document.getElementById("toolpicker");
    const canvCont = workspace.getContainingCanvasElement;
    const workspaceRect = workspace.getWorkspaceElement.getBoundingClientRect();
    const padding = parseInt(window.getComputedStyle(toolpickerDiv).paddingTop.replace(/[^\d+]/ig, ""));

    canvCont.style.width = `${canvCont.getBoundingClientRect().width}px`;
    canvCont.style.height = `${canvCont.getBoundingClientRect().height}px`;

    workspace.getWorkspaceElement.style.width = workspaceRect.width + "px";
    workspace.getWorkspaceElement.style.height = workspaceRect.height + "px";

    barsDiv.style.width = workspaceRect.width + "px";
    toolpickerDiv.style.height = (workspaceRect.height - padding) + "px";
}

function onImageLoad(element, func) {
    element.addEventListener("load", func);
    setTimeout(() => {
        element.removeEventListener("load", func);
    }, 5000);
}

class InfoTextbox {
    constructor() {
        this.infoTextbox = document.getElementById("info-tooltip-textbox");
        this.infoOwnText = document.getElementById("info-tooltip-text");
        this.infoTextHover = document.getElementById("info-tooltip-hover");

        this.fullInfoText;
        this.infoTextLimit = Math.ceil(this.infoTextbox.getBoundingClientRect().width * 0.112);
        this.warnTimeoutID = -1;

        this.warnings = {
            imageTooBig: `Dimensiunea imaginii depășește limita de ${maxImagePxSize}px!`,
            toolNoImage: "Încarcă o imagine pentru a folosi instrumentele!",
            saveNoImage: "Încarcă o imagine pentru a putea salva!",
            cropNoSelection: "Selectează o regiune pe imagine înainte de a decupa!",
            effectNoSelection: "Selectează o regiune pe imagine înainte de a aplica un efect!",
            selectionEqualWorkspace: "Decupare redundantă!",
            resizeInvalidInputs: "Cămpuri invalide pentru redimensionare!",
            redundantResize: "Redimensionare redundantă!",
            resizeTooBig: `Noua dimensiune depășește limita de ${maxImagePxSize}px!`
        }

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
        if(this.warnTimeoutID != -1) {
            clearTimeout(this.warnTimeoutID);
            this.warnTimeoutID = -1;
        }

        this.infoOwnText.classList.remove("warn-text");

        this.setInfoText(text);
        this.infoOwnText.style.color = "var(--mild-black)";
    }

    warn(text) {
        if(this.warnTimeoutID != -1) {
            clearTimeout(this.warnTimeoutID);
            this.warnTimeoutID = -1;
        }

        this.setInfoText("<b>Warning!</b> " + text);
        this.infoOwnText.style.textShadow = "var(--gray3) 1px 1px 2px";
        this.infoOwnText.classList.add("warn-text");

        this.warnTimeoutID = setTimeout(() => {
            this.infoDefault();
            this.infoOwnText.style.textShadow = "none";
            this.infoOwnText.classList.remove("warn-text");
        }, 5000);
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
            RESIZE: "<b>Redimensionează:</b> Scalează imaginea după o lungime sau lățime date.",
            TEXT: "<b>Text:</b> Adaugă un text pe imagine.",
            COLOR_HISTOGRAM: "<b>Histogramă:</b> Comută histograma de culori pentru o selecție.",
            CUT: "<b>Șterge:</b> Elimină porțiunea selectată din imagine."
        }

        this.selectedTool = this.toolEnum.NONE;

        this.events();
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
                    selection.makeSelectionAt(0, 0, workspace.CW, workspace.CH);
                    document.getElementById("select-button").classList.add("selected-tool");
                    break;
            }
        }
    }

    deselectTool(tool) {
        switch (tool) {
            case this.toolEnum.SELECTION:
                document.getElementById("select-button").classList.remove("selected-tool");
                break;
        }

        this.selectedTool = this.toolEnum.NONE;
    }

    events() {
        Array.from(document.getElementsByClassName("tool")).forEach(el => {
            el.addEventListener("click", e => {
                const toolFromID = e.target.id.split("-")[0];

                if(!workspace.loadedImageExists) {
                    e.stopImmediatePropagation();
                    infoTextbox.warn(infoTextbox.warnings.toolNoImage);
                }

                if(toolFromID != "effects") effects.setOriginalImageURL(undefined);
            });
        });
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

    get getDataURL() {
        return this.canvas.toDataURL(Image.prototype.format, 1.0);
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
            this.setCanvasSize(this.currentImage.naturalWidth, this.currentImage.naturalHeight);
            this.context.drawImage(this.getLoadedImage, 0, 0, this.CW, this.CH);

            loadWindow.closeLoadWindow();
        }
    }

    saveCanvasToImage() {
        this.currentImage.src = this.getDataURL;
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
                workspace.getLoadedImage.src = reader.result;

                const checkBefore = () => {
                    if(workspace.getLoadedImage.naturalWidth > maxImagePxSize 
                        || workspace.getLoadedImage.naturalHeight > maxImagePxSize) {
                            this.closeLoadWindow();
                            infoTextbox.warn(infoTextbox.warnings.imageTooBig);
                            return;
                    }

                    this.loadSubmit.disabled = false;
                    this.loadSubmit.style.cursor = "pointer";
                    this.loadSubmit.focus();

                    // Păstrăm numele original al imaginii
                    workspace.getLoadedImage.name = e.target.files[0].name.split(".")[0];

                    // Stocăm tipul imaginii direct în obiectul Image la nivel global, creând o nouă proprietate "format"
                    Image.prototype.format = reader.result.split(";")[0].slice(5);
                };

                onImageLoad(workspace.getLoadedImage, checkBefore);
            });

            if(e.target.files.length > 0) reader.readAsDataURL(e.target.files[0]);
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

    get getDimensions() {
        return [this.x, this.y, this.w, this.h]
    }

    get getImageData() {
        return workspace.getCanvasContext.getImageData(this.x, this.y, this.w, this.h);
    }

    get isMade() {
        return this.sel.style.display != "none";
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

    getPixelAt(x, y) {
        const xValid = x >= 0 && x <= workspace.CW;
        const yValid = y >= 0 && y <= workspace.CH;
        return xValid && yValid ? {x, y} : 0;
    }

    getImagePixelAt(x, y) {
        const pos = (y - this.y) * (this.w * 4) + (x - this.x) * 4;
        const maxX = this.x + this.w;
        const maxY = this.y + this.h;
        const max = maxY * (this.w * 4) + maxX * 4;
        return pos >= 0 && pos <= max ? pos : 0;
    }

    getPixelPositions() {
        let pixels = [];

        for(let j = this.y; j <= this.y + this.h; j++) {
            for(let i = this.x; i <= this.x + this.w; i++) {
                pixels.push({x: i, y: j});
            }
        }

        return pixels;
    }

    getImageDataPixelPositions() {
        let pixels = [];

        for(let j = this.y; j <= this.y + this.h; j++) {
            for(let i = this.x; i <= this.x + this.w; i++) {
                const pos = j * (workspace.CW * 4) + i * 4;
                pixels.push(pos);
            }
        }

        return pixels;
    }

    makeSelectionAt(x, y, w, h) {
        if (this.sel.style.display == "none") {
            this.sel.style.display = "grid";
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
        toolbar.deselectTool(toolbar.ToolEnum.SELECTION);
    }

    events() {
        const canvCont = workspace.getContainingCanvasElement;

        canvCont.addEventListener("mouseup", () => this.finishSelecting());
        canvCont.addEventListener("mouseleave", () => this.finishSelecting());

        workspace.getWorkspaceElement.addEventListener("dblclick", () => {
            if (this.sel.style.display != "none") {
                this.hideSelection();
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

class Cropping {
    constructor() {
        this.events();
    }

    crop() {
        let currImgData = selection.getImageData;

        workspace.setCanvasSize(selection.getWidth, selection.getHeight);
        workspace.getCanvasContext.putImageData(currImgData, 0, 0);

        selection.hideSelection();
    }

    events() {
        document.getElementById("crop-button").addEventListener("click", () => {
            if(selection.isMade) {
                const [x, y, w, h] = selection.getDimensions;

                if(x == 0 && y == 0 && w == workspace.CW && h == workspace.CH) {
                    infoTextbox.warn(infoTextbox.warnings.selectionEqualWorkspace);
                } else this.crop();
            } else infoTextbox.warn(infoTextbox.warnings.cropNoSelection);
        })
    }
}

class Effects {
    constructor() {
        this.effectsDropdown = document.getElementById("effects-dropdown");
        this.effectsDropdown.style.display = "none";

        this.brightnessSettings = document.getElementById("brightness-settings");
        this.brightnessSliderVisible = false;

        this.originalImageURL = undefined;

        this.kernels =  {
            emboss: [-2, -1, 0, -1, 1, 1, 0, 1, 2],
            gaussian: [ 1/16, 2/16, 1/16, 2/16, 4/16, 2/16, 1/16, 2/16, 1/16 ],
            shadow: [1, 2, 1, 0, 1, 0, -1, -2, -1],
            sharpen: [0, -1, 0, -1, 5, -1, 0, -1, 0],
            sharpenless: [0, -1, 0, -1, 10, -1, 0, -1, 0]
        };

        this.events();
    }

    get getOriginalImageURL() {
        return this.originalImageURL;
    }

    setOriginalImageURL(url) {
        this.originalImageURL = url;
    }

    _normalize(kernel) {
        const out = [];
        let sum = kernel.reduce((acc, val) => acc + val, 0);
        sum = sum <= 0 ? 1 : sum;

        for(let i = 0; i < kernel.length; i++)
            out.push(kernel[i] / sum);

        return out;
    }

    _convolute(kernel) {
        if(!selection.isMade) {
            infoTextbox.warn(infoTextbox.warnings.effectNoSelection);
            return;
        }

        if(this.originalImageURL == undefined) {
            this.setOriginalImageURL(workspace.getDataURL);
        }

        kernel = this._normalize(kernel);

        const imgData = workspace.getCanvasContext.getImageData(...selection.getDimensions)
        const newImgData = workspace.getCanvasContext.createImageData(selection.getWidth, selection.getHeight);
        const newData = newImgData.data;

        const pixelPosList = selection.getPixelPositions();

        for(let i = 0; i < pixelPosList.length; i++) {
            const pixelPos = pixelPosList[i];
            const imgPixelPos = selection.getImagePixelAt(pixelPos.x, pixelPos.y);

            let [red, green, blue, alpha] = this._kernelSum(kernel, pixelPos, imgData);

            newData[imgPixelPos] = red;
            newData[imgPixelPos + 1] = green;
            newData[imgPixelPos + 2] = blue;
            newData[imgPixelPos + 3] = alpha;
        }

        workspace.getCanvasContext.putImageData(newImgData, selection.getX, selection.getY);
    }

    _kernelSum(kernel, pixelPos, imgData) {
        const data = imgData.data;
        let [red, green, blue, alpha] = [0, 0, 0, 0];
        const pixelGrid = [];

        for(let y = pixelPos.y - 1; y < pixelPos.y + 2; y++) {
            for(let x = pixelPos.x - 1; x < pixelPos.x + 2; x++) {
                pixelGrid.push(selection.getPixelAt(x, y));
            }
        }

        for (let j = 0; j < kernel.length; j++) {
            if (pixelGrid[j] != 0) {
                let pixelValue = selection.getImagePixelAt(pixelGrid[j].x, pixelGrid[j].y);

                red += data[pixelValue] * kernel[j];
                green += data[pixelValue + 1] * kernel[j];
                blue += data[pixelValue + 2] * kernel[j];
                alpha += data[pixelValue + 3] * kernel[j];
            }
        }

        return [red, green, blue, alpha];
    }

    _kernelessEffect(effect, brightness=25) {
        if(!selection.isMade) {
            infoTextbox.warn(infoTextbox.warnings.effectNoSelection);
            return;
        }

        if(this.originalImageURL == undefined) {
            this.setOriginalImageURL(workspace.getDataURL);
        }

        switch(effect) {
            case "brightness":
                this._forColorsInSelection((data, pos, r, g, b, a) => {
                    data[pos] = r + 255 * (brightness / 100);
                    data[pos + 1] = g + 255 * (brightness / 100);
                    data[pos + 2] = b + 255 * (brightness / 100);
                    data[pos + 3] = a;
                });
                break;
            case "grayscale":
                this._forColorsInSelection((data, pos, r, g, b, a) => {
                    data[pos] = data[pos + 1] = data[pos + 2] = 0.2126*r + 0.7152*g + 0.0722*b;
                    data[pos + 3] = a;
                });
                break;
            case "inverted":
                this._forColorsInSelection((data, pos, r, g, b, a) => {
                    data[pos] = 255 - r;
                    data[pos + 1] = 255 - g;
                    data[pos + 2] = 255 - b;
                    data[pos + 3] = a;
                });
                break;
            case "sepia":
                this._forColorsInSelection((data, pos, r, g, b, a) => {
                    data[pos] = 0.393*r + 0.769*g + 0.189*b;
                    data[pos + 1] = 0.349*r + 0.686*g + 0.168*b;
                    data[pos + 2] = 0.272*r + 0.534*g + 0.131*b;
                    data[pos + 3] = a;
                });
                break;
            case "none":
                if(this.originalImageURL != undefined) {
                    workspace.getLoadedImage.src = this.originalImageURL;
                    this.setOriginalImageURL(undefined);

                    const redrawImage = () => {
                        workspace.getCanvasContext.clearRect(...selection.getDimensions);
                        workspace.getCanvasContext.drawImage(workspace.getLoadedImage, ...selection.getDimensions);
                    };

                    onImageLoad(workspace.getLoadedImage, redrawImage);
                }
                break;
        }
    }

    _forColorsInSelection(rgbaFunc) {
        const imgData = selection.getImageData;
        const data = imgData.data;
        const newImgData = workspace.getCanvasContext.createImageData(selection.getWidth, selection.getHeight);
        const newData = newImgData.data;

        const pixelPosList = selection.getPixelPositions();

        for(let i = 0; i < pixelPosList.length; i++) {
            const pixelPos = pixelPosList[i];
            const imgPixelPos = selection.getImagePixelAt(pixelPos.x, pixelPos.y);

            rgbaFunc(newData, imgPixelPos, data[imgPixelPos], data[imgPixelPos + 1], data[imgPixelPos + 2], data[imgPixelPos + 3]);
        }

        workspace.getCanvasContext.putImageData(newImgData, selection.getX, selection.getY);
    }

    events() {
        document.getElementById("effects-button").addEventListener("click", e => {
            this.effectsDropdown.style.left = e.clientX + "px";
            this.effectsDropdown.style.top = e.clientY + "px";
            this.effectsDropdown.style.display = "flex";
        });

        this.effectsDropdown.addEventListener("mouseleave", () => {
            this.effectsDropdown.style.display = "none";
            
            this.toggleEffectInput("brightness", false);
        });

        document.getElementById("apply-brightness").addEventListener("click", () => {
            const value = parseInt(document.getElementById("brightness-slider").value);
            this._kernelessEffect("brightness", value);
        });

        Array.from(document.getElementsByClassName("fx-button")).forEach(btn => {
            const fxFromID = btn.id.split("-")[1];

            if(this.kernels.hasOwnProperty(fxFromID)) {
                btn.addEventListener("click", () => this._convolute(this.kernels[fxFromID]));
            } else if(fxFromID == "brightness") {
                btn.addEventListener("click", () => this.toggleEffectInput("brightness", !this.brightnessSliderVisible));
            } else {
                btn.addEventListener("click", () => this._kernelessEffect(fxFromID));
            }
        });
    }

    toggleEffectInput(effect, visible) {
        const display = !visible ? "none" : "grid";

        switch(effect) {
            case "brightness":
                this.brightnessSettings.style.display = display;
                this.brightnessSliderVisible = visible;
                document.getElementById("brightness-slider").value = 0;
                break;
        }
    }
}

class Resize {
    constructor() {
        this.resizeWindow = document.getElementById("resize-window");
        this.widthInput = document.getElementById("resize-width");
        this.heightInput = document.getElementById("resize-height");

        this.events();
    }

    calculateWidth(height) {
        const diffProcH = (workspace.CH - height)/workspace.CH;
        const newWidth = workspace.CW - (workspace.CW * diffProcH);
        return Math.round(newWidth);
    }

    calculateHeight(width) {
        const diffProcW = (workspace.CW - width)/workspace.CW;
        const newHeight = workspace.CH - (workspace.CH * diffProcW);
        return Math.round(newHeight);
    }

    resize(width, height) {
        workspace.saveCanvasToImage();

        const resizeImg = () => {
            workspace.getCanvasContext.clearRect(0, 0, workspace.CW, workspace.CH);
            workspace.setCanvasSize(width, height);
            workspace.getCanvasContext.drawImage(workspace.getLoadedImage, 0, 0, width, height);
        };

        onImageLoad(workspace.getLoadedImage, resizeImg);
    }

    events() {
        document.getElementById("resize-button").addEventListener("click", e => {
            this.widthInput.value = workspace.CW;
            this.heightInput.value = workspace.CH;

            this.resizeWindow.style.left = e.clientX + "px";
            this.resizeWindow.style.top = e.clientY + "px";
            this.resizeWindow.style.display = "flex";
        });

        this.resizeWindow.addEventListener("mouseleave", () => {
            this.resizeWindow.style.display = "none";
        });

        this.widthInput.addEventListener("input", e => {
            let value = e.target.value == "" ? 0 : parseInt(e.target.value);

            if(value <= 0) {
                if(value < 0) e.target.value = "";
                else this.heightInput.value = 0;
                return;
            }

            this.heightInput.value = this.calculateHeight(value);
        });

        this.heightInput.addEventListener("input", e => {
            let value = e.target.value == "" ? 0 : parseInt(e.target.value);

            if(value <= 0) {
                if(value < 0) e.target.value = "";
                else this.widthInput.value = 0;
                return;
            }

            this.widthInput.value = this.calculateWidth(value);
        });

        document.getElementById("apply-resize").addEventListener("click", () => {
            if(this.widthInput.value == "" || this.heightInput.value == "") {
                infoTextbox.warn(infoTextbox.warnings.resizeInvalidInputs);
                return;
            }

            const width = parseInt(this.widthInput.value);
            const height = parseInt(this.heightInput.value);

            if(width == 0 || height == 0) {
                infoTextbox.warn(infoTextbox.warnings.redundantResize);
                return;
            }

            if(width > maxImagePxSize || height > maxImagePxSize) {
                infoTextbox.warn(infoTextbox.warnings.resizeTooBig);
                return;
            }

            this.resize(width, height);
        });
    }
}