class Project {
  constructor() {
    this.history = new History();
    let init = `{"layer":[[[]]],"background":"","names":{"layer":["layer0"],"group":["group0"]},"width":${window.innerWidth},"height":${window.innerHeight},"close":false}`;
    this.load(localStorage.getItem("project") || init);
    this.save(true);
    this.svg = {
      svg: document.querySelector("body>svg"),
      layers: document.querySelector("body>svg>g#layers"),
      hooks: document.querySelector("body>svg>g#hooks"),
      meshes: document.querySelector("body>svg>g#meshes"),
      image: document.querySelector("body>svg>image#background"),
      animate: document.querySelector("body>svg>g#animate"),
    };
    this.curlayer = 0;
    this.curgroup = 0;
    this.duration = 5;
    this.decorate();
    this.drawSvg();
  }
  decorate() {
    this.svg.svg.setAttribute("height", this.height);
    this.svg.svg.setAttribute("width", this.width);
    this.svg.svg.setAttribute("viewport", `0 0 ${this.width} ${this.height}`);
    this.svg.image.setAttribute("href", this.background);
    this.svg.image.setAttribute("width", this.width);
    this.svg.image.setAttribute("height", this.height);
  }
  load(store) {
    let load = JSON.parse(store);
    this.layer = load.layer;
    this.names = load.names;
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
<meshpath layers="${btoa(JSON.stringify(this.layer))}" names="${btoa(JSON.stringify(this.names))}" />
${this.svg.image.outerHTML}
${this.animation()}
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
          let root = svg.querySelector("svg");
          that.width = root.getAttribute("width");
          that.height = root.getAttribute("height");
          that.viewport = root.getAttribute("viewport");
          let meshpath = svg.querySelector("meshpath");
          if (meshpath) {
            let layer = JSON.parse(atob(meshpath.getAttribute("layers")));
            let names = JSON.parse(atob(meshpath.getAttribute("names")));
            that.layer.length = 0;
            layer.forEach((l) => that.layer.push(l));
            that.names.layer.length = 0;
            names.layer.forEach((ln) => that.names.layer.push(ln));
            that.names.group.length = 0;
            names.group.forEach((gn) => that.names.group.push(gn));
          }
          var img = svg.querySelector("image#background");
          if (img) {
            that.background = img.getAttribute("href");
          }
          that.history.clear();
          that.save(true);
          location.reload();
        default:
          var img = new Image();
          img.src = re.target.result;
          img.addEventListener("load", () => {
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
      names: this.names,
      background: this.background,
      width: this.width,
      height: this.height,
      close: this.close,
    });
  }
  save(historize) {
    localStorage.setItem("project", this.stringify());
    if (historize) {
      this.historize();
    }
  }
  clear() {
    this.history.clear();
    localStorage.removeItem("project");
    location.reload();
  }
  historize() {
    this.history.add(this.stringify());
  }
  undo() {
    this.load(this.history.go(-1));
    this.save(false);
    this.drawSvg();
  }
  redo() {
    this.load(this.history.go(1));
    this.save(false);
    this.drawSvg();
  }
  closePath(closed) {
    this.close = closed;
    this.save(true);
    this.drawSvg();
  }
  getCurLayer() {
    return this.curlayer;
  }
  getCurGroup() {
    return this.curgroup;
  }
  getLayer(layer) {
    return this.layer[layer];
  }
  getGroup(layer, group) {
    return this.layer[layer][group];
  }
  getLayerName(layer) {
    return this.names.layer[layer];
  }
  getGroupName(group) {
    return this.names.group[group];
  }
  setLayerName(name) {
    this.names.layer[this.curlayer] = name;
    this.save(true);
  }
  setGroupName(name) {
    this.names.group[this.curgroup] = name;
    this.save(true);
  }
  curGroupEmpty() {
    return this.layer[this.curlayer][this.curgroup].length == 0;
  }
  drawLayerAll() {
    this.svg.layers.innerHTML = this.layer.map((l, layer) => this.drawLayer(layer)).join("");
  }
  drawLayer(layer) {
    return `<path layer="${layer}" class="${layer == this.curlayer ? "active" : ""}" d="${this.layer[layer].map((group) => this.drawGroup(group)).join(" ")}" stroke="black" fill="none"/>`;
  }
  drawGroup(group) {
    return bezierPath(group.map((point) => [point.x, point.y])); // + (this.close ? ' Z' : '');
  }
  drawHookAll() {
    this.svg.hooks.innerHTML = this.layer.map((l, layer) => this.drawHook(layer)).join("");
  }
  drawHook(layer) {
    return `<g layer="${layer}" class="${layer == this.curlayer ? "active" : ""}">${this.layer[layer].map((group, g) => `<g group="${g}" class="${g == this.curgroup ? "active" : ""}" >${group.map((point) => `<circle cx="${point.x}" cy="${point.y}" r="3"/>`).join("")}</g>`).join("")}</g>`;
  }
  drawMeshAll() {
    let mesh = [];
    this.layer[0].forEach((v, group) => {
      this.layer[0][group].forEach((v, point) => {
        mesh.push(this.drawMesh(group, point));
      });
    });
    this.svg.meshes.innerHTML = mesh.join("");
  }
  drawMesh(group, point) {
    let path = [];
    this.layer.forEach((l, layer) => {
      path.push(this.layer[layer][group][point]);
    });
    return `<path group="${group}" point="${point}" class="${group == this.curgroup ? "active" : ""}" d="${path.map((point, p) => `${p == 0 ? "M" : "L"} ${point.x},${point.y}`).join(" ")}" marker-end="url(#arrowhead)" fill="none"/>`;
  }
  drawSvg() {
    this.drawLayerAll();
    this.drawHookAll();
    this.drawMeshAll();
  }
  addLayer() {
    const regex = new RegExp("[0-9]+");
    let numlayer = this.names.layer.length;
    let maxlayer = 0;
    this.names.layer.forEach((n) => (maxlayer = Math.max(maxlayer, parseInt((n.match(regex) || ["0"]).shift()))));
    if (numlayer < maxlayer) {
      numlayer = maxlayer + 1;
    }
    let prev = this.curlayer;
    let next = prev + 1;
    if (next == this.layer.length) {
      this.layer[next] = JSON.parse(JSON.stringify(this.layer[this.layer.length - 1]));
      this.names.layer[next] = "layer" + numlayer;
    } else {
      let newLayer = [[]];
      this.layer[prev].forEach((g, group) => {
        newLayer[group] = [];
        this.layer[prev][group].forEach((p, point) => {
          newLayer[group][point] = {
            x: this.layer[prev][group][point].x + (this.layer[next][group][point].x - this.layer[prev][group][point].x) / 2,
            y: this.layer[prev][group][point].y + (this.layer[next][group][point].y - this.layer[prev][group][point].y) / 2,
          };
        });
      });
      this.layer.splice(next, 0, newLayer);
      this.names.layer.splice(next, 0, "layer" + numlayer);
    }
    this.save(true);
    this.drawSvg();
    return next;
  }
  removeLayer() {
    this.layer.splice(this.curlayer, 1);
    this.curlayer = Math.min(this.curlayer, this.layer.length - 1);
    this.save(true);
    this.drawSvg();
    return this.curlayer;
  }
  addGroup() {
    const regex = new RegExp("[0-9]+");
    let numgroup = this.names.group.length;
    let maxgroup = 0;
    this.names.group.forEach((n) => (maxgroup = Math.max(maxgroup, parseInt((n.match(regex) || ["0"]).shift()))));
    if (numgroup < maxgroup) {
      numgroup = maxgroup + 1;
    }
    this.layer.forEach((l, layer) => {
      this.layer[layer].push([]);
    });
    this.names.group.push("group" + numgroup);
    this.save(true);
    return this.layer[0].length - 1;
  }
  removeGroup() {
    this.layer.forEach((l, layer) => {
      this.layer[layer].splice(this.curgroup, 1);
    });
    this.curgroup = Math.min(this.curgroup, this.layer[0].length - 1);
    this.save(true);
    this.drawSvg();
    return this.curgroup;
  }
  activateGroup(g) {
    this.curgroup = parseInt(g);
    this.svg.hooks.querySelectorAll("g[group]").forEach((g) => g.classList.remove("active"));
    this.svg.hooks.querySelectorAll(`g[group="${g}"]`).forEach((g) => g.classList.add("active"));
    this.svg.meshes.querySelectorAll("path.active").forEach((g) => g.classList.remove("active"));
    this.svg.meshes.querySelectorAll(`path[group="${g}"]`).forEach((g) => g.classList.add("active"));
  }
  activateLayer(l) {
    this.curlayer = parseInt(l);
    this.svg.layers.querySelectorAll("path.active").forEach((l) => l.classList.remove("active"));
    this.svg.layers.querySelector(`path[layer="${l}"]`).classList.add("active");
    this.svg.hooks.querySelectorAll("g[layer].active").forEach((g) => g.classList.remove("active"));
    let active = this.svg.hooks.querySelector(`g[layer="${l}"]`);
    active.classList.add("active");
    this.svg.hooks.appendChild(active);
  }
  reverseGroup() {
    this.layer.forEach((l, layer) => {
      this.layer[layer][this.curgroup].reverse();
    });
    this.save(true);
    this.drawSvg();
  }
  activateMesh(active) {
    this.svg.meshes.style.display = active ? "initial" : "";
  }
  setDuration(dur) {
    this.duration = dur;
  }
  animation() {
    return `
    <path stroke="blue" stroke-width="3" fill="${this.close ? "#00008080" : "none"}">
        <animate 
            dur="${this.duration}s" 
            repeatCount="indefinite" 
            attributeName="d" 
            values="${Array.from(layers.querySelectorAll("path"))
              .map((p) => p.getAttribute("d").trim() || "M 0,0")
              .join("; ")}" />
    </path>`;
  }
  animate(start) {
    this.svg.animate.innerHTML = start ? this.animation() : "";
  }
  pointCount(group) {
    return this.layer[0][group].length;
  }
  groupCount() {
    return this.layer[0].length;
  }
  layerCount() {
    return this.layer.length;
  }
  addPoint(group, index) {
    this.layer.forEach((l, layer) => {
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
    });
    this.save(true);
    this.drawSvg();
  }
  removePoint(group, index) {
    this.layer.forEach((l, layer) => {
      this.layer[layer][group] = this.layer[layer][group].slice(0, index).concat(this.layer[layer][group].slice(index + 1));
    });
    this.save(true);
    this.drawSvg();
  }
  applyPoint(layer, group, hook) {
    let source = this.layer[layer][group];
    this.layer.forEach((l, cible) => {
      if (cible != layer) {
        if (hook == 1) {
          this.layer[cible][group] = this.layer[cible][group].concat(source.slice(this.layer[cible][group].length));
        } else {
          this.layer[cible][group] = source.slice(0, source.length - this.layer[cible][group].length).concat(this.layer[cible][group]);
        }
      }
    });
    this.save(true);
    this.drawSvg();
  }
  tracePoint(group, hook, x, y) {
    let path = this.layer[this.curlayer][group];
    let point = { x: Math.max(0, x), y: Math.max(0, y) };
    if (hook == 1) {
      path.push(point);
    } else {
      path.unshift(point);
    }
    path = simplify(path);
    this.layer[this.curlayer][group] = path;
    this.save(false);
    this.svg.hooks.querySelector(`g[layer="${this.curlayer}"]`).outerHTML = this.drawHook(this.curlayer);
    this.svg.layers.querySelector(`path[layer="${this.curlayer}"]`).outerHTML = this.drawLayer(this.curlayer);
  }
  movePoint(group, index, x, y) {
    let point = { x: Math.max(0, x), y: Math.max(0, y) };
    this.layer[this.curlayer][group][index] = point;
    this.save(false);
    this.redrawPoint(group, index);
  }
  redrawPoint(group, index) {
    this.svg.layers.querySelector(`path[layer="${this.curlayer}"]`).outerHTML = this.drawLayer(this.curlayer);
    this.svg.meshes.querySelector(`path[group="${group}"][point="${index}"]`).outerHTML = this.drawMesh(group, index);
  }
}
