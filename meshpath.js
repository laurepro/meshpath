window.addEventListener("load", (le) => {
  const project = new Project();
  const interface = {
    tools: document.querySelector("body>nav"),
    area: document.querySelector("body>aside"),
    layers: document.querySelector('body>aside select[name="layers"]'),
    groups: document.querySelector('body>aside select[name="groups"]'),
    activateLayer: (layer) => {
      project.activateLayer(layer);
      interface.layers.querySelector(`option[value="${layer}"]`).selected = true;
      interface.area.querySelector('input[name="layername"]').value = project.getLayerName(layer);
    },
    activateGroup: (group) => {
      project.activateGroup(group);
      interface.groups.querySelector(`option[value="${group}"]`).selected = true;
      interface.area.querySelector('input[name="groupname"]').value = project.getGroupName(group);
    },
    activatePath: (index) => {
      project.activatePath(index);
      project.showMeshPoint(project.getCurGroup(), project.getCurPath());
    },
    getMode: () => {
      return interface.tools.querySelector('input[name="mode"]:checked').getAttribute("value");
    },
  };
  document.addEventListener("keyup", (ke) => {
    if (ke.code == "Escape") {
      interface.tools.classList.toggle("hidden");
      interface.area.classList.toggle("hidden");
    }
  });
  interface.tools.querySelector('input[type="range"]').addEventListener("change", (ce) => {
    project.setDuration(ce.target.value);
  });
  interface.tools.querySelector('input[type="file"]').addEventListener("change", (ce) => {
    if (ce.target.files.length > 0) {
      var mimetype = ce.target.files[0].type.split("/");
      if (mimetype[0] == "image") {
        project.loadFromFile(ce.target.files[0], mimetype[1]);
      }
    }
  });
  interface.area.querySelector("button.add.layer").addEventListener("click", (ce) => {
    if (project.pointCount(0) > 0) {
      interface.area.addlayer(project.addLayer());
    }
  });
  interface.area.querySelector("button.remove.layer").addEventListener("click", (ce) => {
    if (project.layerCount() > 1) {
      Array.from(interface.layers.querySelectorAll("option")).pop().remove();
      interface.activateLayer(project.removeLayer());
      interface.layers.querySelectorAll("option").forEach((o, k) => (o.text = project.getLayerName(k)));
    }
  });
  interface.area.querySelector("button.add.group").addEventListener("click", (ce) => {
    if (project.pointCount(0) > 0) {
      interface.area.addgroup(project.addGroup());
    }
  });
  interface.area.querySelector("button.remove.group").addEventListener("click", (ce) => {
    if (project.groupCount() > 1) {
      Array.from(interface.groups.querySelectorAll("option")).pop().remove();
      interface.activateGroup(project.removeGroup());
      interface.groups.querySelectorAll("option").forEach((o, k) => (o.text = project.getGroupName(k)));
    }
  });
  interface.area.querySelector('input[name="layername"]').addEventListener("change", (ce) => {
    project.setLayerName(ce.target.value);
    interface.layers.children[project.getCurLayer()].text = ce.target.value;
  });
  interface.area.querySelector('input[name="groupname"]').addEventListener("change", (ce) => {
    project.setGroupName(ce.target.value);
    interface.groups.children[project.getCurGroup()].text = ce.target.value;
  });
  interface.area.addgroup = (id) => {
    let newid = interface.groups.querySelectorAll("option").length;
    let option = document.createElement("option");
    option.value = newid;
    option.selected = true;
    interface.groups.appendChild(option);
    interface.groups.querySelectorAll("option").forEach((o, k) => (o.text = project.getGroupName(k)));
    interface.activateGroup(id);
  };
  interface.area.addlayer = (id) => {
    let newid = interface.layers.querySelectorAll("option").length;
    let option = document.createElement("option");
    option.value = newid;
    option.selected = true;
    option.classList.toggle("locked", project.islocked(newid));
    interface.layers.appendChild(option);
    interface.layers.querySelectorAll("option").forEach((o, k) => (o.text = project.getLayerName(k)));
    interface.activateLayer(id);
  };
  interface.layers.addEventListener("change", (ce) => {
    interface.activateLayer(ce.target.value);
  });
  interface.groups.addEventListener("change", (ce) => {
    interface.activateGroup(ce.target.value);
  });
  interface.tools.addEventListener("click", (ce) => {
    if (ce.target.tagName == "INPUT") {
      if (ce.target.name == "mesh") {
        project.showMesh(ce.target.checked);
      } else if (ce.target.name == "close") {
        project.closePath(ce.target.checked);
      }
    }
  });
  interface.tools.querySelector("label.clear").addEventListener("click", (ce) => {
    if (confirm("sure ?")) {
      project.clear();
      location.reload();
    }
  });
  document.addEventListener("keydown", (kp) => {
    if (kp.key == "z" && kp.ctrlKey) {
      interface.tools.querySelector("label.undo").click();
    }
    if (kp.key == "y" && kp.ctrlKey) {
      interface.tools.querySelector("label.redo").click();
    }
  });
  interface.tools.querySelector("label.undo").addEventListener("click", (ce) => {
    project.undo();
    interface.tools.reInit();
  });
  interface.tools.querySelector("label.redo").addEventListener("click", (ce) => {
    project.redo();
    interface.tools.reInit();
  });
  interface.tools.reInit = () => {
    interface.layers.length = 0;
    for (let i = 0; i < project.layerCount(); i++) {
      interface.area.addlayer(i);
    }
    interface.activateLayer(project.getCurLayer());
    interface.groups.length = 0;
    for (let i = 0; i < project.groupCount(); i++) {
      interface.area.addgroup(i);
    }
    interface.activateGroup(project.getCurGroup());
  };
  interface.tools.querySelector("label.save").addEventListener("click", (ce) => {
    project.saveToFile();
  });
  interface.tools.querySelector("label.animate").addEventListener("click", (ce) => {
    project.animate(true);
  });
  interface.tools.querySelector("label.path").addEventListener("click", (ce) => {
    if (ce.target.classList.includes("add")) {
      project.addPoint();
    } else if (ce.target.classList.includes("remove")) {
      project.removePoint();
    }
  });
  interface.area.querySelector("button.reverse").addEventListener("click", (ce) => {
    project.reverseGroup();
  });
  interface.area.querySelector("button.lock").addEventListener("click", (ce) => {
    let lock = project.lockLayer();
    let layer = project.curlayer;
    interface.layers.querySelector(`option[value="${layer}"]`).classList.toggle("locked", lock);
  });
  interface.tools.querySelector('input[name="bkg"]').addEventListener("change", (ce) => {
    project.svg.image.style.opacity = ce.target.value;
  });
  document.addEventListener("mousedown", () => project.animate(false));

  const action = {
    trace: false,
    group: false,
    move: false,
  };
  project.svg.svg.addEventListener("mousedown", (md) => {
    let mode = interface.getMode();
    if (md.target.tagName == "circle") {
      let index = [...md.target.parentNode.children].indexOf(md.target),
        group = md.target.parentNode.getAttribute("group"),
        layer = md.target.parentNode.parentNode.getAttribute("layer");
      interface.activateLayer(layer);
      interface.activateGroup(group);
      interface.activatePath(index);
      if (mode == "trace") {
        if (index == 0 || index == project.pointCount(group) - 1) {
          action.trace = index == 0 ? -1 : 1;
          action.group = group;
        }
      } else {
        if (project.isMovable()) {
          action.move = md.target;
        }
      }
    } else if (project.curGroupEmpty()) {
      action.trace = true;
      action.group = false;
    }
  });
  project.svg.svg.addEventListener("mouseup", (mu) => {
    if (action.trace !== false && mu.target.tagName == "circle") {
      let group = mu.target.parentNode.getAttribute("group");
      let layer = mu.target.parentNode.parentNode.getAttribute("layer");
      project.applyPoint(layer, group, action.trace);
    }
    if (action.move) {
      project.historize();
    }
    action.trace = false;
    action.group = false;
    action.move = false;
  });
  project.svg.svg.addEventListener("mousemove", (me) => {
    if (me.buttons == 1) {
      let mode = interface.getMode();
      let x = me.offsetX / project.getScale(),
        y = me.offsetY / project.getScale();
      if (mode == "trace" && action.trace !== false) {
        var group = action.group || project.getCurGroup();
        project.tracePoint(group, action.trace, x, y);
      } else if (action.move !== false) {
        let group = action.move.parentNode;
        let g = parseInt(group.getAttribute("group"));
        let index = [...group.children].indexOf(action.move);
        if (x < 10) x = 0;
        if (y < 10) y = 0;
        if (x > project.width - 10) x = project.width;
        if (y > project.heignt - 10) x = project.height;
        action.move.setAttribute("cx", x);
        action.move.setAttribute("cy", y);
        project.movePoint(g, index, x, y, mode);
      }
    }
  });

  project.svg.container.addEventListener("wheel", (we) => {
    if (we.ctrlKey) {
      we.stopPropagation();
      we.preventDefault();
      let pointx = ((we.x + project.svg.container.scrollLeft) / project.svg.scale) * 100,
        pointy = ((we.y + project.svg.container.scrollTop - project.svg.container.offsetTop) / project.svg.scale) * 100,
        scale = project.getScale();
      if (Math.abs(we.deltaY) > 50) {
        scale -= we.deltaY / 1000;
      } else {
        scale += we.deltaY / 100;
      }
      scale = Math.max(scale, window.innerHeight / project.getHeight());

      project.setScale(scale);
      project.svg.container.scrollLeft = (pointx * project.svg.scale) / 100 - we.x;
      project.svg.container.scrollTop = (pointy * project.svg.scale) / 100 - we.y + project.svg.container.offsetTop;
    }
  });

  interface.tools.reInit();
  interface.tools.querySelector('label.close>input[type="checkbox"]').checked = project.close;
});
