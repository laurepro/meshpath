window.addEventListener("load", (le) => {
  const project = new Project();
  const tools = document.querySelector("body>div");
  document.addEventListener("keyup", (ke) => {
    if (ke.code == "Escape") {
      tools.classList.toggle("hidden");
    }
  });
  tools.querySelector('input[type="range"]').addEventListener("change", (ce) => {
    project.setDuration(ce.target.value);
  });
  tools.querySelector('input[type="file"]').addEventListener("change", (ce) => {
    if (ce.target.files.length > 0) {
      var mimetype = ce.target.files[0].type.split("/");
      if (mimetype[0] == "image") {
        project.loadFromFile(ce.target.files[0], mimetype[1]);
      }
    }
  });
  tools.querySelector("label.add.layer").addEventListener("click", (ce) => {
    tools.addlayer(project.addLayer());
  });
  tools.querySelector("label.add.group").addEventListener("click", (ce) => {
    tools.addgroup(project.addGroup());
  });
  tools.addgroup = (id) => {
    let newgroup = document.createElement("label");
    newgroup.setAttribute("group", id);
    newgroup.innerHTML = `<input name="group" type="radio"><div>${id}</div>`;
    tools.insertBefore(newgroup, tools.querySelector("label.add.group"));
    newgroup.click();
  };
  tools.addlayer = (id) => {
    let newlayer = document.createElement("label");
    newlayer.setAttribute("layer", id);
    newlayer.innerHTML = `<input name="layer" type="radio"><div>${id}</div>`;
    tools.insertBefore(newlayer, tools.querySelector("label.add.layer"));
    newlayer.click();
  };
  tools.addEventListener("click", (ce) => {
    if (ce.target.tagName == "INPUT") {
      if (ce.target.name == "group") {
        var g = ce.target.parentElement.getAttribute("group");
        project.activateGroup(g);
      } else if (ce.target.name == "layer") {
        let l = ce.target.parentElement.getAttribute("layer");
        project.activateLayer(l);
      } else if (ce.target.name == "mesh") {
        project.activateMesh(ce.target.checked);
      } else if (ce.target.name == "close") {
        project.closePath(ce.target.checked);
      }
    }
  });
  tools.querySelector("label.clear").addEventListener("click", (ce) => {
    if (confirm("sure ?")) {
      project.clear();
      location.reload();
    }
  });
  document.addEventListener("keydown", (kp) => {
    if (kp.key == "z" && kp.ctrlKey) {
      tools.querySelector("label.undo").click();
    }
    if (kp.key == "y" && kp.ctrlKey) {
      tools.querySelector("label.redo").click();
    }
  });
  tools.querySelector("label.undo").addEventListener("click", (ce) => {
    project.undo();
  });
  tools.querySelector("label.redo").addEventListener("click", (ce) => {
    project.redo();
  });
  tools.querySelector("label.save").addEventListener("click", (ce) => {
    project.saveToFile();
  });
  tools.querySelector("label.animate").addEventListener("click", (ce) => {
    project.animate(true);
  });
  document.addEventListener("mousedown", () => project.animate(false));

  const action = {
    trace: false,
    group: false,
    move: false,
  };

  project.svg.svg.addEventListener("dblclick", (dc) => {
    if (dc.target.tagName == "circle") {
      tools.querySelector(`label[layer="${dc.target.parentNode.parentNode.getAttribute("layer")}"]>input`).click();
      tools.querySelector(`label[group="${dc.target.parentNode.getAttribute("group")}"]>input`).click();
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
    if (action.trace || action.move) {
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
        project.tracePoint(group, action.trace, me.x, me.y);
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

  for (var layer = 0; layer < project.layerCount(); layer++) {
    tools.addlayer(layer);
  }
  for (var group = 0; group < project.groupCount(); group++) {
    tools.addgroup(group);
  }
  tools.querySelector('label.close>input[type="checkbox"]').checked = project.close;
});
