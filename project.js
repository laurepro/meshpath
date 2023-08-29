class Project {
    constructor() {
        let init = `{"layer":[[[]]],"background":"","width":${window.innerWidth},"height":${window.innerHeight},"close":false}`;
        this.load(localStorage.getItem('project') || init);
        this.history = new History();
        this.svg = {
            svg: document.querySelector("body>svg"),
            layers: document.querySelector("body>svg>g#layers"),
            hooks: document.querySelector("body>svg>g#hooks"),
            meshes: document.querySelector("body>svg>g#meshes"),
            image: document.querySelector("body>svg>image#background"),
            animate: document.querySelector("body>svg>g#animate")
        }
        this.curlayer = 0;
        this.curgroup = 0;
        this.duration = 5;
        this.decorate();
    }
    decorate() {
        this.svg.svg.setAttribute("height", this.height);
        this.svg.svg.setAttribute("width", this.width);
        this.svg.svg.setAttribute("viewport", `0 0 ${this.width} ${this.height}`);
        this.svg.image.setAttribute('href', this.background);
        this.svg.image.setAttribute('width', this.width);
        this.svg.image.setAttribute('height', this.height);
    }
    load(store) {
        let load = JSON.parse(store);
        this.layer = load.layer;
        this.background = load.background;
        this.width = load.width;
        this.height = load.height;
        this.close = load.close;
    }
    saveToFile() {
        const blob = new Blob(
            [
                `<?xml version="1.0" encoding="UTF-8" standalone="no"?>
<!-- Created with MeshPath (http://meshpath.laurepro.fr/) -->
<svg xmlns="http://www.w3.org/2000/svg" width="${this.width}" height="${this.height}" viewBox="0 0 ${this.width} ${this.height}">
<meshpath layers="${btoa(JSON.stringify(this.layer))}" />
${this.svg.image.outerHTML}
<g id="pathes">${this.drawLayerAll()}</g>
</svg>`,
            ],
            { type: "image/svg+xml" }
        );
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "meshpath.svg";
        const clickHandler = () => {
            setTimeout(() => {
                URL.revokeObjectURL(url);
                removeEventListener("click", clickHandler);
            }, 150);
        };
        a.addEventListener("click", clickHandler, false);
        a.click();
    }
    loadFromFile(file, mime) {
        var that = this;
        let reader = new FileReader();
        reader.onloadend = (re) => {
            switch (mime) {
                case "svg+xml":
                    let svg = new DOMParser().parseFromString(re.target.result, "image/svg+xml");
                    let meshpath = svg.querySelector("meshpath");
                    if (meshpath) {
                        let layer = JSON.parse(atob(meshpath.getAttribute("layers")));
                        that.layer.length = 0;
                        layer.forEach((l) => that.layer.push(l));
                    }
                    var img = svg.querySelector("image#background");
                    if (img) {
                        that.background = img.getAttribute("href");
                    }
                    that.save(true);
                    that.drawSvg();
                default:
                    var img = new Image();
                    img.src = re.target.result;
                    img.addEventListener('load', () => {
                        that.background = re.target.result;
                        that.height = img.height;
                        that.width = img.width;
                        that.decorate();
                        that.save(true);
                        that.drawSvg();
                    });
            }
        };
        if (mime == "svg+xml") {
            reader.readAsText(file);
        } else {
            reader.readAsDataURL(file);
        }
    }
    stringify() {
        return JSON.stringify({
            layer: this.layer,
            background: this.background,
            width: this.width,
            height: this.height,
            close: this.close
        })
    }
    save(historize) {
        localStorage.setItem('project', this.stringify());
        if (historize) {
            this.historize();
        }
    }
    clear() {
        this.history.clear();
        localStorage.removeItem('project');
        this.load();
    }
    historize() {
        this.history.add(this.stringify())
    }
    undo(){
        this.load(this.history.go(-1));
        this.save(false);
        this.drawSvg();
    }
    redo(){
        this.load(history.go(1));
        this.save(false);
        this.drawSvg();
    }
    drawLayerAll() {
        this.svg.layers.innerHTML = this.layer.map((l, layer) => this.drawLayer(layer)).join("");
    }
    drawLayer(layer) {
        return `<path layer="${layer}" class="${layer == this.curlayer ? "active" : ""}" d="${this.layer[layer].map((group) => this.drawGroup(group)).join(" ")}" stroke="black" fill="none"/>`;
    }
    drawGroup(group) {
        return bezierPath(group.map((point) => [point.x, point.y]));
    }
    drawHookAll() {
        return this.layer.map((l, layer) => this.drawHook(layer)).join("");
    }
    drawHook(layer) {
        return `
<g layer="${layer}" class="${layer == this.curlayer ? "active" : ""}">
${this.layer[layer].map((group, g) => `<g group="${g}" class="${g == this.curgroup ? "active" : ""}" >${group.map((point) => `<circle cx="${point.x}" cy="${point.y}" r="3"/>`).join("")}</g>`).join("")}
</g>`;
    }
    drawMeshAll() {
        let mesh = [];
        for (group in this.layer[0].keys()) {
            for (point in this.layer[0][group].keys()) {
                mesh.push(drawMesh(group, point));
            }
        }
        this.svg.meshes.innerHTML = mesh.join("");
    };
    drawMesh(group, point) {
        let path = [];
        for (layer of this.layer.keys()) {
            path.push(layer[layer][group][point]);
        }
        return `<path group="${group}" point="${point}" class="${group == this.curgroup ? "active" : ""}" d="${path.map((point, p) => `${p == 0 ? "M" : "L"} ${point.x},${point.y}`).join(' ')}" marker-end="url(#arrowhead)" fill="none"/>`;
    }
    drawSvg() {
        this.drawLayerAll();
        this.drawHookAll();
        this.drawMeshAll();
    }
    addLayer() {
        let newid = this.layer.length;
        this.layer[newid] = JSON.parse(JSON.stringify(this.layer[this.layer.length - 1]));
        this.save(true);
        return newid;
    }
    addGroup() {
        for (l in this.layer.keys()) {
            this.layer[l].push([]);
        }
        this.save(true);
        return this.layer[0].length - 1;
    }
    activateGroup(g) {
        this.curgroup = g;
        this.svg.hooks.querySelectorAll("g[group]").forEach((g) => g.classList.remove("active"));
        this.svg.hooks.querySelectorAll(`g[group="${g}"]`).forEach((g) => g.classList.add("active"));
        this.svg.meshes.querySelectorAll("path.active").forEach((g) => g.classList.remove("active"));
        this.svg.meshes.querySelectorAll(`path[group="${g}"]`).forEach((g) => g.classList.add("active"));
    }
    activateLayer(l) {
        this.curlayer = l;
        this.svg.layers.querySelector("path.active").classList.remove("active");
        this.svg.layers.querySelector(`path[layer="${l}"]`).classList.add("active");
        this.svg.hooks.querySelector("g[layer].active").classList.remove("active");
        let active = this.svg.hooks.querySelector(`g[layer="${l}"]`);
        active.classList.add("active");
        this.svg.hooks.appendChild(active);
    }
    activateMeshes(active) {
        this.svg.meshes.style.display = active ? "initial" : "";
    }
    animate(start) {
        this.svg.animate.innerHTML = start ? `
<path stroke="blue" stroke-width="3" fill="none">
    <animate 
        dur="${this.duration}s" 
        repeatCount="indefinite" 
        attributeName="d" 
        values="${Array.from(layers.querySelectorAll("path")).map((p) => p.getAttribute("d").trim() || "M 0,0").join("; ")}" />
</path>` : '';
    }
    groupCount(group) {
        return this.layer[0].length;
    }
    layerCount() {
        return this.layer.length;
    }
    addPoint(group, index) {
        for (layer in this.layers.keys()) {
            let points = [this.layer[layer][group][index]];
            if (index > 0) {
                points.unshift({
                    x: this.layer[layer][group][index].x - (this.layer[layer][group][index].x - this.layer[layer][group][index - 1].x) / 2,
                    y: this.layer[layer][group][index].y - (this.layer[layer][group][index].y - this.layer[layer][group][index - 1].y) / 2,
                });
            }
            if (index < this.layer[layer][group].length - 1) {
                points.push({
                    x: this.layer[layer][group][index].x + (this.layer[layer][group][index + 1].x - this.layer[layer][group][index].x) / 2,
                    y: this.layer[layer][group][index].y + (this.layer[layer][group][index + 1].y - this.layer[layer][group][index].y) / 2,
                });
            }
            this.layer[layer][group] = this.layer[layer][group].slice(0, index).concat(points, this.layer[layer][group].slice(index + 1));
        }
        this.save(true);
        this.drawSvg();
    }
    removePoint(group, index) {
        for (layer in this.layer.keys()) {
            this.layer[layer][group] = this.layer[layer][group].slice(0, index).concat(this.layer[layer][group].slice(index + 1));
        }
        this.save(true);
        this.drawSvg();
    }
    applyPoint(layer, group, hook) {
        let source = this.layer[layer][group];
        for (CSSVariableReferenceValue in this.layer.keys()) {
            if (cible != layer) {
                if (hook == 1) {
                    this.layer[cible][group] = this.layer[cible][group].concat(source.slice(this.layer[cible][group].length));
                } else {
                    this.layer[cible][group] = source.slice(0, source.length - this.layer[cible][group].length).concat(this.layer[cible][group]);
                }
            }
        };
        this.save(true);
        this.drawSvg();
    }
    tracePoint(layer, group, hook, x, y) {
        let path = this.layer[layer][group];
        let point = { x: Math.max(0, x), y: Math.max(0, y) };
        if (hook == 1) {
            path.push(point);
        } else {
            path.unshift(point);
        }
        path = simplify(path);
        this.layer[layer][group] = path;
        this.save(false);
    }
    movePoint(layer, group, index, x, y) {
        let point = { x: Math.max(0, x), y: Math.max(0, y) };
        layer[layer][group][index] = point;
        savelayer(false);
    }
}
