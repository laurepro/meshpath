class History {
  constructor() {
    this.list = [];
    this.index = 0;
  }
  add() {
    this.index++;
    let portion = this.list.slice(0, this.index + 1);
    let ajout = [];
    Array.from(arguments).forEach((a) => ajout.push(JSON.stringify(a)));
    portion.push(ajout);
    this.list = portion;
  }
  go(sens) {
    this.index += sens;
    this.index = Math.min(Math.max(this.index, 1), this.list.length);
    let extract = [];
    this.list[this.index - 1].forEach((i) => extract.push(JSON.parse(i)));
    return extract;
  }
}

window.addEventListener("load", (le) => {
  const tools = document.querySelector("body>div");
  document.addEventListener("keyup", (ke) => {
    if (ke.code == "Escape") {
      tools.classList.toggle("hidden");
    }
  });
  tools.querySelector('input[type="file"]').addEventListener("change", (ce) => {
    if (ce.target.files.length > 0) {
      var mimetype = ce.target.files[0].type.split("/");
      if (mimetype[0] == "image") {
        let reader = new FileReader();
        reader.onloadend = (re) => {
          switch (mimetype[1]) {
            case "svg+xml":
              let inputfile = new DOMParser().parseFromString(re.target.result, "image/svg+xml");
              let meshpath = inputfile.querySelector("meshpath");
              if (meshpath) {
                let ls = JSON.parse(atob(meshpath.getAttribute("layers")));
                layer.length = 0;
                ls.forEach((l) => layer.push(l));
                svg.initialize();
                savelayer();
                historize();
              }
              var img = inputfile.querySelector("image#background");
              if (img) {
                background = {
                  height: img.getAttribute("height"),
                  width: img.getAttribute("width"),
                  image: img.getAttribute("href"),
                };
                savebackground();
                historize();
                image.initialize();
              }
            default:
              var img = new Image();
              img.src = re.target.result;
              img.onload = function () {
                background = {
                  height: img.height,
                  width: img.width,
                  image: re.target.result,
                };
                savebackground();
                historize();
                image.initialize();
              };
          }
        };
        if (mimetype[1] == "svg+xml") {
          reader.readAsText(ce.target.files[0]);
        } else {
          reader.readAsDataURL(ce.target.files[0]);
        }
      }
    }
  });
  tools.querySelector("button.add.layer").addEventListener("click", (ce) => {
    let newid = layer.length;
    layer[newid] = JSON.parse(JSON.stringify(layer[layer.length - 1]));
    savelayer();
    historize();
    tools.addlayer(newid);
    drawsvg();
  });
  tools.querySelector("button.add.group").addEventListener("click", (ce) => {
    tools.addgroup(layer[curlayer()].length);
    for (let i = 0; i < layer.length; i++) {
      layer[i].push([]);
    }
    savelayer();
    historize();
  });
  tools.addgroup = (id) => {
    let newgroup = document.createElement("label");
    newgroup.setAttribute("group", id);
    newgroup.innerHTML = `<input name="group" type="radio" checked><div>${id}</div>`;
    tools.insertBefore(newgroup, tools.querySelector("button.add.group"));
  };
  tools.addlayer = (id) => {
    let newlayer = document.createElement("label");
    newlayer.setAttribute("layer", id);
    newlayer.innerHTML = `<input name="layer" type="radio" checked><div>${id}</div>`;
    tools.insertBefore(newlayer, tools.querySelector("button.add.layer"));
  };
  tools.addEventListener("click", (ce) => {
    if (ce.target.tagName == "INPUT") {
      if (ce.target.name == "group") {
        var g = ce.target.parentElement.getAttribute('group');
        hooks.querySelectorAll('g[group]').forEach((g) => g.classList.remove('active'));
        hooks.querySelectorAll(`g[group="${g}"]`).forEach((g) => g.classList.add('active'));
        meshes.querySelectorAll('path.active').forEach((g) => g.classList.remove('active'));
        meshes.querySelectorAll(`path[group="${g}"]`).forEach((g) => g.classList.add('active'));
      } else if (ce.target.name == "layer") {
        let l = ce.target.parentElement.getAttribute("layer");
        layers.querySelector("path.active").classList.remove("active");
        layers.querySelector(`path[layer="${l}"]`).classList.add("active");
        hooks.querySelector("g[layer].active").classList.remove("active");
        let active = hooks.querySelector(`g[layer="${l}"]`);
        active.classList.add("active");
        hooks.appendChild(active);
      } else if (ce.target.name == "mesh") {
        meshes.style.display = ce.target.checked ? "initial" : "";
      }
    }
  });
  tools.querySelector("button.clear").addEventListener("click", (ce) => {
    if (confirm("sure ?")) {
      localStorage.removeItem("layer");
      localStorage.removeItem("background");
      location.reload();
    }
  });
  tools.querySelector("button.undo").addEventListener("click", (ce) => {
    ret = history.go(-1);
    layer = ret[0];
    background = ret[1];
    savelayer();
    savebackground();
    drawsvg();
  });
  tools.querySelector("button.redo").addEventListener("click", (ce) => {
    ret = history.go(1);
    layer = ret[0];
    background = ret[1];
    savelayer();
    savebackground();
    drawsvg();
  });
  tools.querySelector("button.save").addEventListener("click", (ce) => {
    const rect = svg.getBoundingClientRect();
    const blob = new Blob(
      [
        `<?xml version="1.0" encoding="UTF-8" standalone="no"?>
<!-- Created with MeshPath (http://meshpath.laurepro.fr/) -->
<svg xmlns="http://www.w3.org/2000/svg" width="${rect.width}" height="${rect.height}" viewBox="0 0 ${rect.width} ${rect.height}">
<meshpath layers="${btoa(JSON.stringify(layer))}" />
${image.outerHTML}
<g id="pathes">${drawpathall()}</g>
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
  });

  tools.querySelector("button.animate").addEventListener("click", (ce) => {
    animate.start();
  });

  const curlayer = () => tools.querySelector('input[name="layer"]:checked').parentElement.getAttribute("layer");
  const curgroup = () => tools.querySelector('input[name="group"]:checked').parentElement.getAttribute("group");
  const drawpathall = () => layer.map((l, k) => drawpath(l, k)).join("");
  const drawpath = (l, k) => `<path layer="${k}" class="${k == curlayer() ? "active" : ""}" d="${l.map((g) => drawgroup(g)).join(" ")}" stroke="black" fill="none"/>`;
  const drawgroup = (g) => bezierPath(g.map((p) => [p.x, p.y]));
  const drawpointall = () => layer.map((l, k) => drawpoint(l, k)).join("");
  const drawpoint = (l, k) => `
  <g layer="${k}" class="${k == curlayer() ? "active" : ""}">
  ${l.map((g, k) => `<g group="${k}" class="${k == curgroup() ? "active" : ""}" >${g.map((p) => `<circle cx="${p.x}" cy="${p.y}" r="3"/>`).join("")}</g>`).join("")}
  </g>`;
  const drawmeshall = () => {
    let mesh = [];
    for (var g = 0; g < layer[0].length; g++) {
      for (var i = 0; i < layer[0][g].length; i++) {
        mesh.push(drawmesh(g, i));
      }
    }
    return mesh.join("");
  };
  const drawmesh = (g, i) => {
    let path = [];
    for (var l = 0; l < layer.length; l++) {
      path.push(layer[l][g][i]);
    }
    return `<path group="${g}" point="${i}" class="${g == curgroup() ? "active" : ""}" d="${path.map((p, k) => `${k == 0 ? "M" : "L"} ${p.x},${p.y}`)}" marker-end="url(#arrowhead)" fill="none"/>`;
  };
  const savelayer = () => localStorage.setItem("layer", JSON.stringify(layer));
  const savebackground = () => localStorage.setItem("background", JSON.stringify(background));
  const loadlayer = () => JSON.parse(localStorage.getItem("layer") || "[[[]]]");
  const loadbackground = () => JSON.parse(localStorage.getItem("background") || "{}");
  const drawsvg = () => {
    layers.innerHTML = drawpathall();
    hooks.innerHTML = drawpointall();
    meshes.innerHTML = drawmeshall();
  };
  const historize = () => history.add(layer, background);

  var layer = loadlayer();
  var background = loadbackground();
  const history = new History();
  const svg = document.querySelector("body>svg");
  const layers = document.querySelector("body>svg>g#layers");
  const hooks = document.querySelector("body>svg>g#hooks");
  const meshes = document.querySelector("body>svg>g#meshes");
  const image = document.querySelector("body>svg>image#background");
  const animate = document.querySelector("body>svg>g#animate");

  animate.start = () =>
    (animate.innerHTML = `<path stroke="blue" stroke-width="3" fill="none"><animate dur="${tools.querySelector('input[name="speed"]').value}s" repeatCount="indefinite" attributeName="d" values="${Array.from(layers.querySelectorAll("path"))
      .map((p) => p.getAttribute("d").trim() || "M 0,0")
      .join("; ")}" /></path>`);
  animate.stop = () => (animate.innerHTML = "");

  svg.trace = false;
  svg.group = false;
  svg.move = false;

  document.addEventListener("mousedown", () => animate.stop());
  svg.addEventListener("dblclick", (dc) => {
    if (dc.target.tagName == "circle") {
      tools.querySelector(`label[layer="${dc.target.parentNode.parentNode.getAttribute("layer")}"]>input`).click();
      tools.querySelector(`label[group="${dc.target.parentNode.getAttribute("group")}"]>input`).click();
    }
  });

  svg.addEventListener("mousedown", (md) => {
    if (md.shiftKey) {
      if (md.target.tagName == "circle") {
        let index = [...md.target.parentNode.children].indexOf(md.target);
        var group = md.target.parentNode.getAttribute("group");
        if (index == 0 || index == layer[curlayer()][group].length - 1) {
          svg.trace = index == 0 ? -1 : 1;
          svg.group = md.target.parentNode.getAttribute("group");
        }
      } else if (layer[curlayer()][curgroup()].length == 0) {
        svg.trace = true;
        svg.group = false;
      }
    } else {
      if (md.target.tagName == "circle") {
        let group = md.target.parentNode;
        if (md.ctrlKey) {
          let index = [...group.children].indexOf(md.target);
          let j = group.getAttribute("group");
          for (let i = 0; i < layer.length; i++) {
            let points = [layer[i][j][index]];
            if (index > 0) {
              points.unshift({
                x: layer[i][j][index].x - (layer[i][j][index].x - layer[i][j][index - 1].x) / 2,
                y: layer[i][j][index].y - (layer[i][j][index].y - layer[i][j][index - 1].y) / 2,
              });
            }
            if (index < layer[i][j].length - 1) {
              points.push({
                x: layer[i][j][index].x + (layer[i][j][index + 1].x - layer[i][j][index].x) / 2,
                y: layer[i][j][index].y + (layer[i][j][index + 1].y - layer[i][j][index].y) / 2,
              });
            }
            layer[i][j] = layer[i][j].slice(0, index).concat(points, layer[i][j].slice(index + 1));
          }
          savelayer();
          historize();
          drawsvg();
        } else if (md.altKey) {
          let index = [...group.children].indexOf(md.target);
          let j = group.getAttribute("group");
          for (let i = 0; i < layer.length; i++) {
            layer[i][j] = layer[i][j].slice(0, index).concat(layer[i][j].slice(index + 1));
          }
          savelayer();
          historize();
          drawsvg();
        } else if (group.parentNode.getAttribute("layer") == curlayer()) {
          svg.move = md.target;
        }
      }
    }
  });

  svg.addEventListener("mouseup", (mu) => {
    if (svg.trace !== false && mu.target.tagName == "circle") {
      let g = mu.target.parentNode.getAttribute("group");
      let l = mu.target.parentNode.parentNode.getAttribute("layer");

      let source = layer[l][g];
      layer.forEach((v, k) => {
        if (k != l) {
          if (svg.trace == 1) {
            layer[k][g] = layer[k][g].concat(source.slice(layer[k][g].length));
          } else {
            layer[k][g] = source.slice(0, source.length - layer[k][g].length).concat(layer[k][g]);
          }
        }
      });
      savelayer();
      drawsvg();
    }
    if (svg.trace || svg.move) {
      historize();
    }
    svg.trace = false;
    svg.group = false;
    svg.move = false;
  });

  svg.addEventListener("mousemove", (me) => {
    if (me.buttons == 1) {
      if (me.shiftKey && svg.trace !== false) {
        var group = svg.group || curgroup();
        path = layer[curlayer()][group];
        if (svg.trace == 1) {
          path.push({ x: me.x, y: me.y });
        } else {
          path.unshift({ x: me.x, y: me.y });
        }
        path = simplify(path);
        layer[curlayer()][group] = path;
        layers.querySelector(`path[layer="${curlayer()}"]`).outerHTML = drawpath(layer[curlayer()], curlayer());
        hooks.querySelector(`g[layer="${curlayer()}"]`).outerHTML = drawpoint(layer[curlayer()], curlayer());
        savelayer();
      } else if (svg.move !== false) {
        let group = svg.move.parentNode;
        let g = group.getAttribute("group");
        let i = [...group.children].indexOf(svg.move);
        layer[curlayer()][g][i] = { x: me.x, y: me.y };
        svg.move.setAttribute("cx", me.x);
        svg.move.setAttribute("cy", me.y);
        layers.querySelector(`path[layer="${curlayer()}"]`).outerHTML = drawpath(layer[curlayer()], curlayer());
        meshes.querySelector(`path[group="${g}"][point="${i}"]`).outerHTML = drawmesh(g, i);
        savelayer();
      }
    }
  });

  image.initialize = () => {
    svg.setAttribute("height", background.height || "100%");
    svg.setAttribute("width", background.width || "100%");
    svg.setAttribute("viewport", `0 0 ${background.width || "100%"} ${background.height || "100%"}`);
    image.setAttribute("href", background.image || "");
    image.setAttribute("width", background.width || 0);
    image.setAttribute("height", background.height || 0);
  };

  svg.initialize = () => {
    layers.innerHTML = "";
    hooks.innerHTML = "";
    tools.querySelectorAll("label[layer]").forEach((p) => p.remove());
    for (let i = 0; i < layer.length; i++) {
      tools.addlayer(i);
    }
    for (let i = 0; i < layer[0].length; i++) {
      tools.addgroup(i);
    }
    image.initialize();
    drawsvg();
  };
  historize();
  svg.initialize();
});
