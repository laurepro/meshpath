window.addEventListener("load", (le) => {
  const project = new Project();
  const interface = {
    tools: document.querySelector("body>div"),
    layers: document.querySelector('body>div select[name="layers"]'),
    groups: document.querySelector('body>div select[name="groups"]'),
    activateLayer: (layer) => {
      project.activateLayer(layer);
      interface.layers.querySelector(`option[value="${layer}"]`).selected = true;
      interface.tools.querySelector('input[name="layername"]').value = project.getLayerName(layer);
    },
    activateGroup: (group) => {
      project.activateGroup(group);
      interface.groups.querySelector(`option[value="${group}"]`).selected = true;
      interface.tools.querySelector('input[name="groupname"]').value = project.getGroupName(group);
    } 
  };
  document.addEventListener("keyup", (ke) => {
    if (ke.code == "Escape") {
      interface.tools.classList.toggle("hidden");
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
  interface.tools.querySelector("label.add.layer").addEventListener("click", (ce) => {
    if (project.pointCount(0) > 0) {
      interface.tools.addlayer(project.addLayer());
    }
  });
  interface.tools.querySelector("label.remove.layer").addEventListener("click", (ce) => {
    if (project.layerCount() > 1) {
      interface.tools.querySelector(`label[layer="${project.removeLayer()}"]`).click();
      Array.from(interface.tools.querySelectorAll("label[layer]")).pop().remove();
    }
  });
  interface.tools.querySelector("label.add.group").addEventListener("click", (ce) => {
    if (project.pointCount(0) > 0) {
      interface.tools.addgroup(project.addGroup());
    }
  });
  interface.tools.querySelector("label.remove.group").addEventListener("click", (ce) => {
    if (project.groupCount() > 1) {
      interface.tools.querySelector(`label[group="${project.removeGroup()}"]`).click();
      Array.from(interface.tools.querySelectorAll("label[group]")).pop().remove();
    }
  });
  interface.tools.querySelector('input[name="layername"]').addEventListener("change", (ce) => {
    project.setLayerName(ce.target.value);
    interface.layers.children[project.getCurLayer()].text = ce.target.value;
  });
  interface.tools.querySelector('input[name="groupname"]').addEventListener("change", (ce) => {
    project.setGroupName(ce.target.value);
    interface.groups.children[project.getCurGroup()].text = ce.target.value;
  });
  interface.tools.addgroup = (id) => {
    let newid = interface.groups.querySelectorAll("option").length;
    let option = document.createElement("option");
    option.value = newid;
    option.selected = true;
    interface.groups.appendChild(option);
    interface.groups.querySelectorAll("option").forEach((o, k) => (o.text = project.getGroupName(k)));
    interface.activateGroup(id);
  };
  interface.tools.addlayer = (id) => {
    let newid = interface.layers.querySelectorAll("option").length;
    let option = document.createElement("option");
    option.value = newid;
    option.selected = true;
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
        project.activateMesh(ce.target.checked);
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
    let layers = project.layerCount(),
      layer = Math.min(project.getCurLayer(), layers - 1),
      groups = project.groupCount(),
      group = Math.min(project.getCurGroup(), layers - 1),
      llabels = interface.tools.querySelectorAll("label[layer]"),
      glabels = interface.tools.querySelectorAll("label[group]");
    if (layers > llabels.length) {
      for (var l = llabels.length; l < layers; l++) {
        interface.tools.addlayer(l);
      }
    } else if (layers < llabels.length) {
      Array.from(llabels).pop().remove();
    }
    interface.activateLayer(layer);
    if (groups > glabels.length) {
      for (var g = glabels.length; g < groups; g++) {
        interface.tools.addgroup(g);
      }
    } else if (groups < glabels.length) {
      Array.from(glabels).pop().remove();
    }
  };
  interface.tools.querySelector("label.save").addEventListener("click", (ce) => {
    project.saveToFile();
  });
  interface.tools.querySelector("label.animate").addEventListener("click", (ce) => {
    project.animate(true);
  });
  interface.tools.querySelector("label.reverse").addEventListener("click", (ce) => {
    project.reverseGroup();
  });
  document.addEventListener("mousedown", () => project.animate(false));

  const action = {
    trace: false,
    group: false,
    move: false,
  };

  project.svg.svg.addEventListener("dblclick", (dc) => {
    if (dc.target.tagName == "circle") {
      let layer = dc.target.parentNode.parentNode.getAttribute("layer");
      interface.activateLayer(layer);
      // interface.tools.querySelector(`label[group="${dc.target.parentNode.getAttribute("group")}"]>input`).click();
    }
  });

  project.svg.svg.addEventListener("mousedown", (md) => {
    if (md.shiftKey) {
      if (md.target.tagName == "circle") {
        let index = [...md.target.parentNode.children].indexOf(md.target);
        var group = md.target.parentNode.getAttribute("group");
        if (index == 0 || index == project.pointCount(group) - 1) {
          action.trace = index == 0 ? -1 : 1;
          action.group = group;
        }
      } else if (project.curGroupEmpty()) {
        action.trace = true;
        action.group = false;
      }
    } else {
      if (md.target.tagName == "circle") {
        let group = md.target.parentNode;
        let index = [...group.children].indexOf(md.target);
        if (md.ctrlKey) {
          let g = group.getAttribute("group");
          project.addPoint(g, index);
        } else if (md.altKey) {
          let g = group.getAttribute("group");
          project.removePoint(g, index);
        } else if (group.parentNode.getAttribute("layer") == project.getCurLayer()) {
          action.move = md.target;
        }
      }
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
      if (me.shiftKey && action.trace !== false) {
        var group = action.group || project.getCurGroup();
        project.tracePoint(group, action.trace, me.layerX, me.layerY);
      } else if (action.move !== false) {
        let group = action.move.parentNode;
        let g = group.getAttribute("group");
        let index = [...group.children].indexOf(action.move);
        let x = me.layerX;
        let y = me.layerY;
        if (x < 10) x = 0;
        if (y < 10) y = 0;
        if (x > project.width - 10) x = project.width;
        if (y > project.heignt - 10) x = project.height;
        action.move.setAttribute("cx", x);
        action.move.setAttribute("cy", y);
        project.movePoint(g, index, x, y);
      }
    }
  });

  // for (var layer = 0; layer < project.layerCount(); layer++) {
  //   interface.tools.addlayer(layer);
  // }
  // for (var group = 0; group < project.groupCount(); group++) {
  //   interface.tools.addgroup(group);
  // }
  interface.tools.reInit();
  interface.tools.querySelector('label.close>input[type="checkbox"]').checked = project.close;
});
