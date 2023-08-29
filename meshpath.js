
window.addEventListener("load", (le) => {
    const project = new Project;
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
        console.log(id)
        let newgroup = document.createElement("label");
        newgroup.setAttribute("group", id);
        newgroup.innerHTML = `<input name="group" type="radio" checked><div>${id}</div>`;
        tools.insertBefore(newgroup, tools.querySelector("label.add.group"));
    };
    tools.addlayer = (id) => {
        let newlayer = document.createElement("label");
        newlayer.setAttribute("layer", id);
        newlayer.innerHTML = `<input name="layer" type="radio" checked><div>${id}</div>`;
        tools.insertBefore(newlayer, tools.querySelector("label.add.layer"));
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
            }
        }
    });
    tools.querySelector("label.clear").addEventListener("click", (ce) => {
        if (confirm("sure ?")) {
            project.clear()
            location.reload();
        }
    });
    document.addEventListener('keydown', (kp) => {
        if (kp.key == 'z' && kp.ctrlKey) {
            tools.querySelector("label.undo").click();
        }
        if (kp.key == 'y' && kp.ctrlKey) {
            tools.querySelector("label.redo").click();
        }
    })
    tools.querySelector("label.undo").addEventListener("click", (ce) => {
        project.undo()
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

    var trace = false;
    var group = false;
    var move = false;

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
                if (index == 0 || index == layer[project.curlayer()][group].length - 1) {
                    svg.trace = index == 0 ? -1 : 1;
                    svg.group = md.target.parentNode.getAttribute("group");
                }
            } else if (layer[project.curlayer()][project.curgroup].length == 0) {
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
                } else if (group.parentNode.getAttribute("layer") == project.curlayer()) {
                    svg.move = md.target;
                }
            }
        }
    });

    project.svg.svg.addEventListener("mouseup", (mu) => {
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

    project.svg.svg.addEventListener("mousemove", (me) => {
        if (me.buttons == 1) {
            if (me.shiftKey && svg.trace !== false) {
                var group = svg.group || project.curgroup;
                let path = layer[project.curlayer()][group];
                let point = { x: Math.max(0, me.x), y: Math.max(0, me.y) };
                if (svg.trace == 1) {
                    path.push(point);
                } else {
                    path.unshift(point);
                }
                path = simplify(path);
                layer[project.curlayer()][group] = path;
                layers.querySelector(`path[layer="${project.curlayer()}"]`).outerHTML = drawpath(layer[project.curlayer()], project.curlayer());
                hooks.querySelector(`g[layer="${project.curlayer()}"]`).outerHTML = drawpoint(layer[project.curlayer()], project.curlayer());
                savelayer();
            } else if (svg.move !== false) {
                let group = svg.move.parentNode;
                let g = group.getAttribute("group");
                let i = [...group.children].indexOf(svg.move);
                let point = { x: Math.max(0, me.x), y: Math.max(0, me.y) };
                layer[project.curlayer()][g][i] = point;
                svg.move.setAttribute("cx", point.x);
                svg.move.setAttribute("cy", point.y);
                layers.querySelector(`path[layer="${project.curlayer()}"]`).outerHTML = drawpath(layer[project.curlayer()], project.curlayer());
                meshes.querySelector(`path[group="${g}"][point="${i}"]`).outerHTML = drawmesh(g, i);
                savelayer();
            }
        }
    });

    for (var layer = 0; layer < project.layerCount(); layer++) {
        tools.addlayer(layer);
    }
    for (var group = 0; group < project.groupCount(); group++) {
        tools.addgroup(group);
    }
    project.drawSvg();
});
