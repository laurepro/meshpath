window.addEventListener('load', (le) => {
    const tools = document.querySelector('body>div');
    document.addEventListener('keyup', (ke) => {
        if (ke.code == "Escape") {
            tools.classList.toggle('hidden');
        }
    });
    tools.querySelector('input[type="file"]').addEventListener('change', (ce) => {
        if (ce.target.files.length > 0) {
            let reader = new FileReader();
            reader.onload = (re) => {
                // parse 
                let inputfile = (new DOMParser()).parseFromString(re.target.result, 'image/svg+xml');
                datalayer = JSON.parse(atob(inputfile.firstChild.getAttribute('data-layer')));
                layer.length = 0;
                datalayer.forEach((l) => layer.push(l));
                svg.initialize();
                savelayer();
            }
            reader.readAsText(ce.target.files[0]);
        }
    });
    tools.querySelector('button.add').addEventListener('click', (ce) => {
        let newid = layer.length;
        layer[newid] = layer[layer.length - 1] || [];
        tools.addlayer(newid);
        svg.innerHTML = drawpathall() + drawpointall();
        savelayer();
    });
    tools.addlayer = (id) => {
        let newlayer = document.createElement('label');
        newlayer.setAttribute('layer', id);
        newlayer.innerHTML = `<input name="layer" type="radio" checked><div>${id}</div>`;
        tools.insertBefore(newlayer, tools.querySelector('button.add'));
    }
    tools.addEventListener('click', (ce) => {
        if (ce.target.tagName == 'INPUT' && ce.target.name == 'layer') {
            svg.querySelector('g.active').classList.remove('active');
            let active = svg.querySelector(`g[layer="${ce.target.parentElement.getAttribute('layer')}"]`);
            active.classList.add('active');
            svg.appendChild(active);
        }
    });
    tools.querySelector('button.clear').addEventListener('click', (ce) => {
        if (confirm('sure ?')) {
            layer.length = 1;
            layer[0].length = 0;
            svg.querySelector('path[layer="0"]').setAttribute('d', '');
            svg.querySelector('g[layer="0"]').innerHTML = '';
            svg.querySelectorAll('path:not([layer="0"])').forEach((p) => p.remove());
            svg.querySelectorAll('g:not([layer="0"])').forEach((p) => p.remove());
            tools.querySelectorAll('label[layer]:not([layer="0"])').forEach((p) => p.remove());
            tools.querySelector('label[layer="0"]>input').checked = true
            savelayer()
        }
    })
    tools.querySelector('button.save').addEventListener('click', (ce) => {
        const rect = svg.getBoundingClientRect();
        const blob = new Blob([`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${rect.width} ${rect.height}" data-layer="${btoa(JSON.stringify(layer))}">${drawpathall()}</svg>`], { type: 'image/svg+xml' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'meshpath.svg';
        const clickHandler = () => {
            setTimeout(() => {
                URL.revokeObjectURL(url);
                removeEventListener('click', clickHandler);
            }, 150);
        };
        a.addEventListener('click', clickHandler, false);
        a.click();
    });

    const curlayer = () => tools.querySelector('input[name="layer"]:checked').parentElement.getAttribute('layer');
    const drawpathall = () => layer.map((l, k) => drawpath(l, k)).join('');
    const drawpath = (l, k) => `<path layer="${k}" d="${bezierPath(l.map((p) => [p.x, p.y]))}" stroke="black" fill="none"/>`
    const drawpointall = () => layer.map((l, k) => drawpoint(l, k)).join('');
    const drawpoint = (l, k) => `<g layer="${k}" class="${k == curlayer() ? 'active' : ''}">${l.map((p) => `<circle cx="${p.x}" cy="${p.y}" r="3"/>`).join('')}$</g>`;
    const savelayer = () => localStorage.setItem('layer', JSON.stringify(layer));
    const loadlayer = () => JSON.parse(localStorage.getItem('layer') || '[[]]');

    const layer = loadlayer();
    const svg = document.querySelector('body>svg');
    svg.trace = false;
    svg.move = false;
    svg.addEventListener('mousedown', (md) => {
        if (md.ctrlKey) {
            if (layer[curlayer()].length == 0) {
                svg.trace = true;
            } else if (md.target.tagName == 'circle') {
                position = [...md.target.parentNode.children].indexOf(md.target);
                if (position == 0 || position == layer[curlayer()].length - 1) {
                    svg.trace = position == 0 ? -1 : 1;
                }
            }
        }
        else {
            if (md.target.tagName == 'circle') {
                if (md.target.parentNode.getAttribute('layer') == curlayer()) {
                    svg.move = md.target;
                }
                if (md.shiftKey) {
                    tools.querySelector(`label[layer="${md.target.parentElement.getAttribute('layer')}"]>input`).click()
                }
            }
        }
    })
    svg.addEventListener('mouseup', (mu) => {
        if (svg.trace !== false) {
            let source = layer[curlayer()];
            layer.forEach((v, k) => {
                if (k != curlayer()) {
                    if (svg.trace == 1) {
                        layer[k] = layer[k].concat(source.slice(layer[k].length))
                    }
                    else {
                        layer[k] = source.slice(0, source.length - layer[k].length).concat(layer[k]);
                    }
                }
            });
            savelayer();
            svg.innerHTML = drawpathall() + drawpointall();
        }
        svg.trace = false;
        svg.move = false;
    })
    svg.addEventListener('mousemove', (me) => {
        if (me.buttons == 1) {
            if (me.ctrlKey && svg.trace !== false) {
                path = layer[curlayer()];
                if (svg.trace == 1) {
                    path.push({ x: me.x, y: me.y });
                }
                else {
                    path.unshift({ x: me.x, y: me.y });
                }
                path = simplify(path);
                layer[curlayer()] = path;
                svg.querySelector(`path[layer="${curlayer()}"]`).outerHTML = drawpath(layer[curlayer()], curlayer());
                svg.querySelector(`g[layer="${curlayer()}"]`).outerHTML = drawpoint(layer[curlayer()], curlayer());
                savelayer();
            } else {
                if (svg.move !== false) {
                    let index = [...svg.move.parentNode.children].indexOf(svg.move)
                    layer[curlayer()][index] = { x: me.x, y: me.y };
                    svg.move.setAttribute('cx', me.x);
                    svg.move.setAttribute('cy', me.y);
                    svg.querySelector(`path[layer="${curlayer()}"]`).outerHTML = drawpath(layer[curlayer()], curlayer());
                    savelayer();
                }
            }
        }
    });
    svg.initialize = () => {
        svg.innerHTML = '';
        tools.querySelectorAll('label[layer]').forEach((p) => p.remove());
        for (let i = 0; i < layer.length; i++) {
            tools.addlayer(i);
        }
        svg.innerHTML = drawpathall() + drawpointall();
    }

    svg.initialize();
});
