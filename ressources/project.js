class Project {
  constructor() {
    this.history = new History();
    let init = `{"project":null,"step":[[[]]],"background":"","names":{"step":["step0"],"group":["group0"]},"lock":[],"width":${window.innerWidth},"height":${window.innerHeight},"close":false}`;
    this.load(localStorage.getItem("project") || init);
    this.save(true);
    this.svg = {
      scale: 1,
      container: document.querySelector("body>section#svg"),
      svg: document.querySelector("body>section#svg>svg"),
      steps: document.querySelector("body>section#svg>svg>g#steps"),
      points: document.querySelector("body>section#svg>svg>g#points"),
      meshes: document.querySelector("body>section#svg>svg>g#meshes"),
      image: document.querySelector("body>section#svg>svg>image#background"),
      animate: document.querySelector("body>section#svg>svg>g#animate"),
    };
    this.curpoint = {
      step: 0,
      group: 0,
      path: 0,
    };
    this.duration = 5;
    this.decorate();
    this.drawSvg();
  }
  decorate() {
    this.svg.svg.setAttribute("height", this.height);
    this.svg.svg.setAttribute("width", this.width);
    this.svg.svg.setAttribute("viewBox", `0 0 ${this.width} ${this.height}`);
    this.svg.image.setAttribute("href", this.background);
    this.svg.image.setAttribute("width", this.width);
    this.svg.image.setAttribute("height", this.height);
  }
  load(store) {
    let load = JSON.parse(store);
    this.step = load.step;
    this.names = load.names;
    this.lock = load.lock;
    this.background = load.background;
    this.width = load.width;
    this.height = load.height;
    this.close = load.close;
    this.projectName = load.projectName;
  }
  saveToFile(projectName) {
    projectName = projectName || "meshpath";
    this.projectName = projectName;
    const blob = new Blob(
      [
        `<?xml version="1.0" encoding="UTF-8" standalone="no"?>
<!-- Created with MeshPath (http://meshpath.laurepro.fr/) -->
<svg xmlns="http://www.w3.org/2000/svg" width="${this.width}" height="${this.height}" viewBox="0 0 ${this.width} ${this.height}">
<meshpath project="${this.projectName}" steps="${btoa(JSON.stringify(this.step))}" names="${btoa(JSON.stringify(this.names))}"/>
${this.svg.image.outerHTML}
${this.animation()}
</svg>`,
      ],
      { type: "image/svg+xml" }
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = this.projectName + ".svg";
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
          that.viewBox = root.getAttribute("viewBox");
          let meshpath = svg.querySelector("meshpath");
          if (meshpath) {
            let step = JSON.parse(atob(meshpath.getAttribute("steps")));
            let names = JSON.parse(atob(meshpath.getAttribute("names")));
            that.step.length = 0;
            step.forEach((l) => that.step.push(l));
            that.names.step.length = 0;
            names.step.forEach((ln) => that.names.step.push(ln));
            that.names.group.length = 0;
            names.group.forEach((gn) => that.names.group.push(gn));
            that.projectName = meshpath.getAttribute("project");
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
      step: this.step,
      names: this.names,
      lock: this.lock,
      background: this.background,
      width: this.width,
      height: this.height,
      close: this.close,
      projectName: this.projectName
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
  getProjectName() {
    return this.projectName;
  }
  getHeight() {
    return this.height;
  }
  getWidth() {
    return this.width;
  }
  getScale() {
    return this.svg.scale;
  }
  setScale(value) {
    this.svg.scale = value;
    this.svg.svg.style.height = this.height * value + "px";
    this.svg.svg.style.width = this.width * value + "px";
    this.drawSvg();
  }
  getCurStep() {
    return this.curpoint.step;
  }
  getCurGroup() {
    return this.curpoint.group;
  }
  getCurPath() {
    return this.curpoint.path;
  }
  getStep(step) {
    return this.step[step];
  }
  getGroup(step, group) {
    return this.step[step][group];
  }
  getStepName(step) {
    return this.names.step[step];
  }
  getGroupName(group) {
    return this.names.group[group];
  }
  setStepName(name) {
    this.names.step[this.curpoint.step] = name;
    this.save(true);
  }
  setGroupName(name) {
    this.names.group[this.curpoint.group] = name;
    this.save(true);
  }
  curGroupEmpty() {
    return this.step[this.curpoint.step][this.curpoint.group].length == 0;
  }
  drawStepAll() {
    this.svg.steps.innerHTML = this.step.map((l, step) => this.drawStep(step)).join("");
  }
  drawStep(step) {
    return `<path step="${step}" class="${step == this.curpoint.step ? "active" : ""}" d="${this.step[step].map((group) => this.drawGroup(group)).join(" ")}" stroke-width="${0.75 / this.svg.scale}" fill="none"/>`;
  }
  drawGroup(group) {
    return bezierPath(group.map((point) => [point.x, point.y]));
  }
  drawPathAll() {
    this.svg.points.innerHTML = this.step.map((l, step) => this.drawPath(step)).join("");
  }
  drawPath(step) {
    return `<g step="${step}" class="${step == this.curpoint.step ? "active" : ""} ${this.lock.includes(step) ? "locked" : ""}">${this.step[step].map((group, g) => `<g group="${g}" class="${g == this.curpoint.group ? "active" : ""}" >${group.map((point) => `<circle cx="${point.x}" cy="${point.y}" r="${4 / this.svg.scale}" stroke-width="${0.75 / this.svg.scale}"/>`).join("")}</g>`).join("")}</g>`;
  }
  drawMeshAll() {
    let mesh = [];
    this.step[0].forEach((v, group) => {
      this.step[0][group].forEach((v, point) => {
        mesh.push(this.drawMesh(group, point));
      });
    });
    this.svg.meshes.innerHTML = mesh.join("");
  }
  drawMesh(group, point) {
    let path = [];
    this.step.forEach((l, step) => {
      path.push(this.step[step][group][point]);
    });
    return `<path group="${group}" point="${point}" class="${group == this.curpoint.group ? "active" : ""}" d="${path.map((point, p) => `${p == 0 ? "M" : "L"} ${point.x},${point.y}`).join(" ")}"  stroke-width="${0.75 / this.svg.scale}" marker-end="url(#arrowhead)" fill="none"/>`;
  }
  drawSvg() {
    this.drawStepAll();
    this.drawPathAll();
    this.drawMeshAll();
  }
  addStep() {
    const regex = new RegExp("[0-9]+");
    let numstep = this.names.step.length;
    let maxstep = 0;
    this.names.step.forEach((n) => (maxstep = Math.max(maxstep, parseInt((n.match(regex) || ["0"]).shift()))));
    if (numstep < maxstep) {
      numstep = maxstep + 1;
    }
    let prev = this.curpoint.step;
    let next = prev + 1;
    if (next == this.step.length) {
      this.step[next] = JSON.parse(JSON.stringify(this.step[this.step.length - 1]));
      this.names.step[next] = "step" + numstep;
    } else {
      let newStep = [[]];
      this.step[prev].forEach((g, group) => {
        newStep[group] = [];
        this.step[prev][group].forEach((p, point) => {
          newStep[group][point] = {
            x: this.step[prev][group][point].x + (this.step[next][group][point].x - this.step[prev][group][point].x) / 2,
            y: this.step[prev][group][point].y + (this.step[next][group][point].y - this.step[prev][group][point].y) / 2,
          };
        });
      });
      this.step.splice(next, 0, newStep);
      this.names.step.splice(next, 0, "step" + numstep);
    }
    this.save(true);
    this.drawSvg();
    return next;
  }
  removeStep() {
    this.step.splice(this.curpoint.step, 1);
    this.curpoint.step = Math.min(this.curpoint.step, this.step.length - 1);
    this.save(true);
    this.drawSvg();
    return this.curpoint.step;
  }
  lockStep() {
    if (this.lock.includes(this.curpoint.step)) {
      this.lock = this.lock.filter((item) => item != this.curpoint.step);
    } else {
      this.lock.push(this.curpoint.step);
    }
    this.save(true);
    return this.lock.includes(this.curpoint.step);
  }
  islocked(step) {
    return this.lock.includes(step);
  }
  isMovable() {
    return !this.lock.includes(this.curpoint.step);
  }
  addGroup() {
    const regex = new RegExp("[0-9]+");
    let numgroup = this.names.group.length;
    let maxgroup = 0;
    this.names.group.forEach((n) => (maxgroup = Math.max(maxgroup, parseInt((n.match(regex) || ["0"]).shift()))));
    if (numgroup < maxgroup) {
      numgroup = maxgroup + 1;
    }
    this.step.forEach((l, step) => {
      this.step[step].push([]);
    });
    this.names.group.push("group" + numgroup);
    this.save(true);
    return this.step[0].length - 1;
  }
  removeGroup() {
    this.step.forEach((l, step) => {
      this.step[step].splice(this.curpoint.group, 1);
    });
    this.curpoint.group = Math.min(this.curpoint.group, this.step[0].length - 1);
    this.save(true);
    this.drawSvg();
    return this.curpoint.group;
  }
  selectPath(step, group, path) {
    this.curpoint.step = parseInt(step);
    this.curpoint.group = parseInt(group);
    this.curpoint.path = parseInt(path);
  }
  activateGroup(g) {
    this.curpoint.group = parseInt(g);
    this.svg.points.querySelectorAll("g[group]").forEach((g) => g.classList.remove("active"));
    this.svg.points.querySelectorAll(`g[group="${g}"]`).forEach((g) => g.classList.add("active"));
    this.svg.meshes.querySelectorAll("path.active").forEach((g) => g.classList.remove("active"));
    this.svg.meshes.querySelectorAll(`path[group="${g}"]`).forEach((g) => g.classList.add("active"));
  }
  activateStep(l) {
    this.curpoint.step = parseInt(l);
    this.svg.steps.querySelectorAll("path.active").forEach((l) => l.classList.remove("active"));
    this.svg.steps.querySelector(`path[step="${l}"]`).classList.add("active");
    this.svg.points.querySelectorAll("g[step].active").forEach((g) => g.classList.remove("active"));
    let active = this.svg.points.querySelector(`g[step="${l}"]`);
    active.classList.add("active");
    this.svg.points.appendChild(active);
  }
  activatePath(p) {
    this.curpoint.path = parseInt(p);
  }
  reverseGroup() {
    this.step.forEach((l, step) => {
      this.step[step][this.curpoint.group].reverse();
    });
    this.save(true);
    this.drawSvg();
  }
  showMesh(active) {
    this.svg.meshes.classList.toggle("show", active);
  }
  showMeshPath(group, point) {
    this.svg.meshes.querySelectorAll("path.show").forEach((p) => p.classList.remove("show"));
    this.svg.points.querySelectorAll("circle.show").forEach((p) => p.classList.remove("show"));
    this.svg.meshes.querySelectorAll(`path[group="${group}"][point="${point}"]`).forEach((p) => p.classList.add("show"));
    this.svg.points.querySelectorAll(`g[group="${group}"] circle:nth-of-type(${point + 1})`).forEach((p) => p.classList.add("show"));
  }
  setDuration(dur) {
    this.duration = dur;
  }
  animation() {
    return `
    <path stroke="${this.close ? "none" : "blue"}" stroke-width="3" fill="${this.close ? "#00008080" : "none"}">
        <animate 
            dur="${this.duration}s" 
            repeatCount="indefinite" 
            attributeName="d" 
            values="${Array.from(steps.querySelectorAll("path"))
              .map((p) => p.getAttribute("d").trim() || "M 0,0")
              .join("; ")}" />
    </path>`;
  }
  animate(start) {
    this.svg.animate.innerHTML = start ? this.animation() : "";
    this.svg.steps.style.display = start ? "none" : "";
    this.svg.points.style.display = start ? "none" : "";
  }
  pointCount(group) {
    return this.step[0][group].length;
  }
  groupCount() {
    return this.step[0].length;
  }
  stepCount() {
    return this.step.length;
  }
  addPath() {
    let group = this.curpoint.group;
    let index = this.curpoint.path;
    this.step.forEach((l, step) => {
      let points = [this.step[step][group][index]];
      if (index > 0) {
        points.unshift({
          x: this.step[step][group][index].x - (this.step[step][group][index].x - this.step[step][group][index - 1].x) / 2,
          y: this.step[step][group][index].y - (this.step[step][group][index].y - this.step[step][group][index - 1].y) / 2,
        });
      }
      if (index < this.step[step][group].length - 1) {
        points.push({
          x: this.step[step][group][index].x + (this.step[step][group][index + 1].x - this.step[step][group][index].x) / 2,
          y: this.step[step][group][index].y + (this.step[step][group][index + 1].y - this.step[step][group][index].y) / 2,
        });
      }
      this.step[step][group] = this.step[step][group].slice(0, index).concat(points, this.step[step][group].slice(index + 1));
    });
    this.save(true);
    this.drawSvg();
  }
  removePath() {
    let group = this.curpoint.group;
    let index = this.curpoint.path;
    this.step.forEach((l, step) => {
      this.step[step][group] = this.step[step][group].slice(0, index).concat(this.step[step][group].slice(index + 1));
    });
    this.save(true);
    this.drawSvg();
  }
  applyPath(step, group, point) {
    let source = this.step[step][group];
    this.step.forEach((l, cible) => {
      if (cible != step) {
        if (point == 1) {
          this.step[cible][group] = this.step[cible][group].concat(source.slice(this.step[cible][group].length));
        } else {
          this.step[cible][group] = source.slice(0, source.length - this.step[cible][group].length).concat(this.step[cible][group]);
        }
      }
    });
    this.save(true);
    this.drawSvg();
  }
  tracePath(group, point, x, y) {
    let path = this.step[this.curpoint.step][group];
    let newpoint = { x: Math.max(0, x), y: Math.max(0, y) };
    if (point == 1) {
      path.push(newpoint);
    } else {
      path.unshift(newpoint);
    }
    path = simplify(path);
    this.step[this.curpoint.step][group] = path;
    this.svg.points.querySelector(`g[step="${this.curpoint.step}"]`).outerHTML = this.drawPath(this.curpoint.step);
    this.svg.steps.querySelector(`path[step="${this.curpoint.step}"]`).outerHTML = this.drawStep(this.curpoint.step);
    this.save(false);
  }
  movePath(group, index, x, y, mode) {
    let point = { x: Math.max(0, x), y: Math.max(0, y) },
      oldpoint = this.step[this.curpoint.step][group][index];
    this.step[this.curpoint.step][group][index] = point;
    if (mode == "equalize") {
      this.equalizeMove(group, index);
    } else if (mode == "elastic") {
      this.elasticMove(group, index, oldpoint);
    } else if (mode == "sameway") {
      let delta = { x: point.x - oldpoint.x, y: point.y - oldpoint.y };
      this.step[this.curpoint.step][group].forEach((p, point) => {
        if (index != point) {
          this.step[this.curpoint.step][group][point].x += delta.x;
          this.step[this.curpoint.step][group][point].y += delta.y;
        }
      });
    }
    this.save(false);
    this.drawSvg();
    this.showMeshPath(group, index);
  }
  equalizeMove(group, index) {
    let hook = 0;
    for (var i = this.curpoint.step; i > hook; i--) {
      if (this.lock.includes(i)) {
        hook = i;
        break;
      }
    }
    this.equalizePaths(group, index, hook);
    hook = this.step.length - 1;
    for (var i = this.curpoint.step; i < hook; i++) {
      if (this.lock.includes(i)) {
        hook = i;
        break;
      }
    }
    this.equalizePaths(group, index, hook);
  }
  equalizePaths(group, index, hook) {
    let moved = this.curpoint.step;
    if (arguments.length == 2) {
      hook = 0;
      moved = this.step.length - 1;
    }
    let nbr = Math.abs(moved - hook),
      way = Math.sign(moved - hook),
      stepX = (this.step[hook][group][index].x - this.step[moved][group][index].x) / nbr,
      stepY = (this.step[hook][group][index].y - this.step[moved][group][index].y) / nbr;
    for (var i = 1; i < nbr; i++) {
      this.step[hook + way * i][group][index].x = this.step[hook][group][index].x - stepX * i;
      this.step[hook + way * i][group][index].y = this.step[hook][group][index].y - stepY * i;
    }
  }
  elasticMove(group, index, oldpoint) {
    let hook = 0;
    for (var i = this.curpoint.step; i > hook; i--) {
      if (this.lock.includes(i)) {
        hook = i;
        break;
      }
    }
    this.elasticPaths(group, index, hook, oldpoint);
    hook = this.step.length - 1;
    for (var i = this.curpoint.step; i < hook; i++) {
      if (this.lock.includes(i)) {
        hook = i;
        break;
      }
    }
    this.elasticPaths(group, index, hook, oldpoint);
  }
  elasticPaths(group, index, hook, oldpoint) {
    let hookpoint = this.step[hook][group][index],
      movepoint = this.step[this.curpoint.step][group][index],
      movevector = this.vector(movepoint, hookpoint),
      oldvector = this.vector(oldpoint, hookpoint),
      moveratio = movevector.distance / oldvector.distance,
      angledifference = movevector.angle - oldvector.angle,
      length = Math.abs(hook - this.curpoint.step) - 1;
    if (oldvector.distance == 0) {
      this.equalizePaths(group, index, hook);
    } else if (length > 0) {
      Array(Math.abs(hook - this.curpoint.step) - 1)
        .fill(hook)
        .map((e, i) => e + i * Math.sign(this.curpoint.step - hook) + Math.sign(this.curpoint.step - hook))
        .forEach((i) => {
          let setpoint = this.step[i][group][index],
            vector = this.vector(hookpoint, setpoint);
          vector.distance = vector.distance * moveratio;
          vector.angle += angledifference;
          this.step[i][group][index] = this.coordinates(hookpoint, vector);
        });
    }
  }
  vector(origine, destination) {
    return {
      angle: Math.atan2(origine.y - destination.y, destination.x - origine.x), // radian
      distance: Math.sqrt(Math.pow(destination.y - origine.y, 2) + Math.pow(destination.x - origine.x, 2)),
    };
  }
  coordinates(origine, vector) {
    return {
      x: Math.cos(vector.angle) * vector.distance + origine.x,
      y: 0 - (Math.sin(vector.angle) * vector.distance - origine.y),
    };
  }
}
