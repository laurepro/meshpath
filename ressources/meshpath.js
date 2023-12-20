window.addEventListener("load", () => {
  const project = new Project();
  const interface = {
    tools: document.querySelector("body>nav"),
    area: document.querySelector("body>aside"),
    steps: document.querySelector('body>aside select[name="steps"]'),
    groups: document.querySelector('body>aside select[name="groups"]'),
    activateStep: (step) => {
      project.activateStep(step);
      interface.steps.querySelector(`option[value="${step}"]`).selected = true;
      interface.area.querySelector('input[name="stepname"]').value = project.getStepName(step);
    },
    activateGroup: (group) => {
      project.activateGroup(group);
      interface.groups.querySelector(`option[value="${group}"]`).selected = true;
      interface.area.querySelector('input[name="groupname"]').value = project.getGroupName(group);
    },
    activatePath: (index) => {
      project.activatePath(index);
      project.showMeshPath(project.getCurGroup(), project.getCurPath());
    },
    getMode: () => {
      return interface.tools.querySelector('input[name="mode"]:checked').getAttribute("value");
    },
    debug() {
      let html = "";
      for (var i = 0; i < arguments.length; i++) {
        let text = arguments[i];
        if (["object", "array"].includes(typeof text)) {
          text = JSON.stringify(text, null, 2);
        }
        html += `<p>${text}</p>`;
      }
      document.querySelector("#debug").innerHTML = html;
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
  interface.area.querySelector("button.add.step").addEventListener("click", (ce) => {
    if (project.pointCount(0) > 0) {
      interface.area.addstep(project.addStep());
    }
  });
  interface.area.querySelector("button.remove.step").addEventListener("click", (ce) => {
    if (project.stepCount() > 1) {
      Array.from(interface.steps.querySelectorAll("option")).pop().remove();
      interface.activateStep(project.removeStep());
      interface.steps.querySelectorAll("option").forEach((o, k) => (o.text = project.getStepName(k)));
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
  interface.area.querySelector('input[name="stepname"]').addEventListener("change", (ce) => {
    project.setStepName(ce.target.value);
    interface.steps.children[project.getCurStep()].text = ce.target.value;
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
  interface.area.addstep = (id) => {
    let newid = interface.steps.querySelectorAll("option").length;
    let option = document.createElement("option");
    option.value = newid;
    option.selected = true;
    option.classList.toggle("locked", project.islocked(newid));
    interface.steps.appendChild(option);
    interface.steps.querySelectorAll("option").forEach((o, k) => (o.text = project.getStepName(k)));
    interface.activateStep(id);
  };
  interface.steps.addEventListener("change", (ce) => {
    interface.activateStep(ce.target.value);
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
  document.addEventListener("keydown", (ke) => {
    if (ke.key == "z" && ke.ctrlKey) {
      interface.tools.querySelector("label.undo").click();
    }
    if (ke.key == "y" && ke.ctrlKey) {
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
    interface.steps.length = 0;
    for (let i = 0; i < project.stepCount(); i++) {
      interface.area.addstep(i);
    }
    interface.activateStep(project.getCurStep());
    interface.groups.length = 0;
    for (let i = 0; i < project.groupCount(); i++) {
      interface.area.addgroup(i);
    }
    interface.activateGroup(project.getCurGroup());
    interface.activatePath(project.getCurPath());
    interface.tools.querySelector('label.close>input[type="checkbox"]').checked = project.close;
  };
  interface.tools.querySelector("label.save").addEventListener("click", (ce) => {
    let name = window.prompt("project name ?", project.getProjectName());
    if (name !== null) {
      project.saveToFile(name);
    }
  });
  interface.tools.querySelector("label.animate").addEventListener("click", (ce) => {
    project.animate(true);
  });
  interface.tools.querySelector("label.path.add").addEventListener("click", (ce) => {
    project.addPath();
    interface.activatePath(project.getCurPath() > 0 ? project.getCurPath() + 1 : 0);
  });
  interface.tools.querySelector("label.path.remove").addEventListener("click", (ce) => {
    project.removePath();
    interface.activatePath(project.getCurPath() > 0 ? project.getCurPath() - 1 : 0);
  });
  interface.area.querySelector("button.reverse").addEventListener("click", (ce) => {
    project.reverseGroup();
  });
  interface.area.querySelector("button.lock").addEventListener("click", (ce) => {
    let lock = project.lockStep();
    let step = project.getCurStep();
    interface.steps.querySelector(`option[value="${step}"]`).classList.toggle("locked", lock);
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
  project.svg.svg.addEventListener("mousedown", (me) => {
    let mode = interface.getMode();
    if (me.target.tagName == "circle") {
      let index = [...me.target.parentNode.children].indexOf(me.target),
        group = me.target.parentNode.getAttribute("group"),
        step = me.target.parentNode.parentNode.getAttribute("step");
      interface.activateStep(step);
      interface.activateGroup(group);
      interface.activatePath(index);
      if (mode == "trace") {
        if (index == 0 || index == project.pointCount(group) - 1) {
          action.trace = index == 0 ? -1 : 1;
          action.group = group;
        }
      } else {
        if (project.isMovable()) {
          action.move = me.target;
        }
      }
    } else if (project.curGroupEmpty()) {
      action.trace = true;
      action.group = false;
    }
  });
  project.svg.svg.addEventListener("mouseup", (me) => {
    if (action.trace !== false && me.target.tagName == "circle") {
      let group = me.target.parentNode.getAttribute("group");
      let step = me.target.parentNode.parentNode.getAttribute("step");
      project.applyPath(step, group, action.trace);
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
        project.tracePath(group, action.trace, x, y);
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
        project.movePath(g, index, x, y, mode);
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
      scale = Math.min(5, Math.max(scale, window.innerHeight / project.getHeight()));
      project.setScale(scale);
      project.svg.container.scrollLeft = (pointx * project.svg.scale) / 100 - we.x;
      project.svg.container.scrollTop = (pointy * project.svg.scale) / 100 - we.y + project.svg.container.offsetTop;
    }
  });
  const touch = {
    scale: false,
    stylus: false,
    rect: false,
    distance: false,
    move: false,
    trace: false,
    group: false,
    coord: false
  };
  const distance = (ge) => {
    return Math.hypot(ge.touches[0].pageX - ge.touches[1].pageX, ge.touches[0].pageY - ge.touches[1].pageY) * touch.scale;
  };
  project.svg.container.addEventListener("pointerdown", (evt) => {
    touch.stylus = evt.width < 1 && evt.height < 1;
    interface.debug(evt.pointerType);
  });
  project.svg.container.addEventListener("pointerup", (evt) => {
    interface.debug('up');
  });
  // project.svg.container.addEventListener("pointermove", (evt) => {
  //   interface.debug('move');
  // });
  project.svg.container.addEventListener("touchstart", (ge) => {
    if (touch.stylus) {
      let mode = interface.getMode();
      if (ge.target.tagName == "circle") {
        let index = [...ge.target.parentNode.children].indexOf(ge.target),
          group = ge.target.parentNode.getAttribute("group"),
          step = ge.target.parentNode.parentNode.getAttribute("step");
        interface.activateStep(step);
        interface.activateGroup(group);
        interface.activatePath(index);
        if (mode == "trace") {
          if (index == 0 || index == project.pointCount(group) - 1) {
            touch.trace = index == 0 ? -1 : 1;
            touch.group = group;
          }
        } else {
          if (project.isMovable()) {
            touch.move = ge.target;
          }
        }
      } else if (project.curGroupEmpty()) {
        touch.trace = true;
        touch.group = false;
      }
    } else if (ge.touches.length === 2 && ge.target.id == "background") {
      touch.scale = project.getScale();
      touch.distance = distance(ge);
      touch.rect = ge.target.getBoundingClientRect();
      touch.coord = {
        x: ((ge.targetTouches[0].pageX + ge.targetTouches[1].pageX) / 2 - touch.rect.left) / project.getScale(),
        y: (ge.targetTouches[0].pageY + ge.targetTouches[1].pageY) / 2 / project.getScale(),
      };
    }
  });
  project.svg.container.addEventListener("touchmove", (ge) => {
    if (touch.stylus || ge.touches.length > 1) {
      ge.stopPropagation();
      ge.preventDefault();
    }
    if (touch.stylus) {
      let mode = interface.getMode();
      let x = ge.touches[0].clientX / project.getScale(),
        y = ge.touches[0].clientY / project.getScale();
      if (mode == "trace" && touch.trace !== false) {
        var group = touch.group || project.getCurGroup();
        project.tracePath(group, touch.trace, x, y);
      } else if (touch.move !== false) {
        let group = touch.move.parentNode;
        let g = parseInt(group.getAttribute("group"));
        let index = [...group.children].indexOf(touch.move);
        if (x < 10) x = 0;
        if (y < 10) y = 0;
        if (x > project.width - 10) x = project.width;
        if (y > project.heignt - 10) x = project.height;
        touch.move.setAttribute("cx", x);
        touch.move.setAttribute("cy", y);
        project.movePath(g, index, x, y, mode);
      }
    } else if (touch.scale !== false) {
      project.setScale(Math.min(5, Math.max((touch.scale * distance(ge)) / touch.distance, window.innerHeight / project.getHeight())));
      let rect = ge.target.getBoundingClientRect();
      project.svg.container.scrollLeft = touch.coord.x * project.getScale() - touch.coord.x * touch.scale - touch.rect.left;
      document.scrollingElement.scrollTop = touch.coord.y * project.getScale() - touch.coord.y * touch.scale - touch.rect.top;
    }
  });

  project.svg.container.addEventListener("touchend", (ge) => {
    if (touch.trace !== false && ge.target.tagName == "circle") {
      let group = ge.target.parentNode.getAttribute("group");
      let step = ge.target.parentNode.parentNode.getAttribute("step");
      project.applyPath(step, group, touch.trace);
    }
    if (touch.move) {
      project.historize();
    }
    for(i in touch) {
      touch[i]= false
    }
  });

  interface.tools.reInit();
});
