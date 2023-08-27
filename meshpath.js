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
              }
              var img = inputfile.querySelector("image#background");
              if (img) {
                background = {
                  height: img.getAttribute("height"),
                  width: img.getAttribute("width"),
                  image: img.getAttribute("href"),
                };
                savebackground();
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
  tools.querySelector("button.add").addEventListener("click", (ce) => {
    let newid = layer.length;
    layer[newid] = [...layer[layer.length - 1]] || [];
    savelayer();
    tools.addlayer(newid);
    drawsvg();
  });
  tools.addlayer = (id) => {
    let newlayer = document.createElement("label");
    newlayer.setAttribute("layer", id);
    newlayer.innerHTML = `<input name="layer" type="radio" checked><div>${id}</div>`;
    tools.insertBefore(newlayer, tools.querySelector("button.add"));
  };
  tools.addEventListener("click", (ce) => {
    if (ce.target.tagName == "INPUT") {
      if (ce.target.name == "layer") {
        hooks.querySelector("g.active").classList.remove("active");
        let active = hooks.querySelector(`g[layer="${ce.target.parentElement.getAttribute("layer")}"]`);
        active.classList.add("active");
        hooks.appendChild(active);
      }
      else if (ce.target.name == "mesh") {
        meshes.style.display = ce.target.checked ? 'initial' : '';
      }
    }
  });
  tools.querySelector("button.clear").addEventListener("click", (ce) => {
    if (confirm("sure ?")) {
      layer = [[[]]];
      background = {};
      layers.querySelector('path[layer="0"]').setAttribute("d", "");
      hooks.querySelector('g[layer="0"]').innerHTML = "";
      layers.querySelectorAll('path:not([layer="0"])').forEach((p) => p.remove());
      hooks.querySelectorAll('g:not([layer="0"])').forEach((p) => p.remove());
      tools.querySelectorAll('label[layer]:not([layer="0"])').forEach((p) => p.remove());
      tools.querySelector('label[layer="0"]>input').checked = true;
      savebackground();
      savelayer();
      svg.initialize();
    }
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
  const drawpathall = () => layer.map((l, k) => drawpath(l, k)).join("");
  const drawpath = (l, k) => `<path layer="${k}" d="${bezierPath(l.map((p) => [p.x, p.y]))}" stroke="black" fill="none"/>`;
  const drawpointall = () => layer.map((l, k) => drawpoint(l, k)).join("");
  const drawpoint = (l, k) => `<g layer="${k}" class="${k == curlayer() ? "active" : ""}">${l.map((p) => `<circle cx="${p.x}" cy="${p.y}" r="3"/>`).join("")}$</g>`;
  const drawmeshall = () => {
    let mesh = [];
    for (var i = 0; i < layer[0].length; i++) {
      mesh.push(drawmesh(i));
    }
    return mesh.join("");
  };
  const drawmesh = (i) => {
    let path = [];
    for (var m = 0; m < layer.length; m++) {
      path.push(layer[m][i]);
    }
    return `<path mesh="${i}" d="${path.map((p, k) => `${k==0 ? 'M' : 'L'} ${p.x},${p.y}`)}" stroke="red" fill="none"/>`;
  };
  const savelayer = () => localStorage.setItem("layer", JSON.stringify(layer));
  const savebackground = () => localStorage.setItem("background", JSON.stringify(background));
  const loadlayer = () => JSON.parse(localStorage.getItem("layer") || "[[]]");
  const loadbackground = () => JSON.parse(localStorage.getItem("background") || "{}");
  const drawsvg = () => {
    layers.innerHTML = drawpathall();
    hooks.innerHTML = drawpointall();
    meshes.innerHTML = drawmeshall();
  };

  var layer = loadlayer();
  var background = loadbackground();
  const svg = document.querySelector("body>svg");
  const layers = document.querySelector("body>svg>g#layers");
  const hooks = document.querySelector("body>svg>g#hooks");
  const meshes = document.querySelector("body>svg>g#meshes");
  const image = document.querySelector("body>svg>image#background");
  const animate = document.querySelector("body>svg>g#animate");

  animate.start = () => animate.innerHTML = `<path stroke="blue" stroke-width="3" fill="none"><animate dur="${tools.querySelector('input[name="speed"]').value}s" repeatCount="indefinite" attributeName="d" values="${Array.from(layers.querySelectorAll('path')).map((p)=>p.getAttribute('d')).join('; ')}" /></path>`;
  animate.stop = () => animate.innerHTML = "";

  svg.trace = false;
  svg.move = false;
  svg.join = false;

  document.addEventListener("mousedown", () => animate.stop());
  svg.addEventListener("mousedown", (md) => {
    if (md.ctrlKey) {
      if (md.target.tagName == "circle") {
        let index = [...md.target.parentNode.children].indexOf(md.target);
        if (index == 0 || index == layer[curlayer()].length - 1) {
          svg.trace = index == 0 ? -1 : 1;
          svg.join = md.target;
        }
      }
      else {
        svg.trace = true;
      }
    } else {
      if (md.target.tagName == "circle") {
        if (md.shiftKey) {
          tools.querySelector(`label[layer="${md.target.parentElement.getAttribute("layer")}"]>input`).click();
        } else if (md.altKey) {
          let index = [...md.target.parentNode.children].indexOf(md.target);
          for (let i = 0; i < layer.length; i++) {
            let points = [layer[i][index]];
            if (index > 0) {
              points.unshift({
                x: layer[i][index].x - (layer[i][index].x - layer[i][index - 1].x) / 2,
                y: layer[i][index].y - (layer[i][index].y - layer[i][index - 1].y) / 2,
              });
            }
            if (index < layer[i].length - 1) {
              points.push({
                x: layer[i][index].x + (layer[i][index + 1].x - layer[i][index].x) / 2,
                y: layer[i][index].y + (layer[i][index + 1].y - layer[i][index].y) / 2,
              });
            }
            layer[i] = layer[i].slice(0, index).concat(points, layer[i].slice(index + 1));
          }
          savelayer();
          drawsvg();
        } else if (md.target.parentNode.getAttribute("layer") == curlayer()) {
          svg.move = md.target;
        }
      }
    }
  });

  svg.addEventListener("mouseup", (mu) => {
    if (svg.trace !== false) {
      let source = layer[curlayer()];
      layer.forEach((v, k) => {
        if (k != curlayer()) {
          if (svg.trace == 1) {
            layer[k] = layer[k].concat(source.slice(layer[k].length));
          } else {
            layer[k] = source.slice(0, source.length - layer[k].length).concat(layer[k]);
          }
        }
      });
      savelayer();
      drawsvg();
    }
    svg.trace = false;
    svg.move = false;
  });

  svg.addEventListener("mousemove", (me) => {
    if (me.buttons == 1) {
      if (me.ctrlKey && svg.trace !== false) {
        path = layer[curlayer()];
        if (svg.trace == 1) {
          path.push({ x: me.x, y: me.y });
        } else {
          path.unshift({ x: me.x, y: me.y });
        }
        path = simplify(path);
        layer[curlayer()] = path;
        layers.querySelector(`path[layer="${curlayer()}"]`).outerHTML = drawpath(layer[curlayer()], curlayer());
        hooks.querySelector(`g[layer="${curlayer()}"]`).outerHTML = drawpoint(layer[curlayer()], curlayer());
        savelayer();
      } else if (svg.move !== false) {
        let index = [...svg.move.parentNode.children].indexOf(svg.move);
        layer[curlayer()][index] = { x: me.x, y: me.y };
        svg.move.setAttribute("cx", me.x);
        svg.move.setAttribute("cy", me.y);
        layers.querySelector(`path[layer="${curlayer()}"]`).outerHTML = drawpath(layer[curlayer()], curlayer());
        meshes.querySelector(`path[mesh="${index}"]`).outerHTML = drawmesh(index);
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
    image.initialize();
    drawsvg();
  };

  svg.initialize();
});
