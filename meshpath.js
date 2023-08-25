window.addEventListener('load', (le) => {
    const tools = document.querySelector('body>div');
    document.addEventListener('keyup', (ke) => {
        if (ke.code == "Escape") {
            tools.classList.toggle('hidden');
        }
    });
    tools.querySelector('button.add').addEventListener('click', (ce) => {
        let newid = layer.length;
        layer[newid] = layer[layer.length - 1];
        let newlayer = document.createElement('label');
        newlayer.innerHTML = `<input name="layer" type="radio" value="${newid}" checked><span>${newid}</span>`;
        tools.insertBefore(newlayer, tools.querySelector('button.add'));
        svg.innerHTML = drawpath() + drawpoint();
    });
    tools.addEventListener('click', (ce) => {
        if (ce.target.tagName == 'INPUT' && ce.target.classList.contains('layer')) {
            svg.querySelector('g.active').classList.remove('active');
            svg.querySelector('g#layer' + ce.target.value).classList.add('active');
        }
    })
    tools.querySelector('button.save').addEventListener('click', (ce) => {
        const rect = svg.getBoundingClientRect();
        const blob = new Blob([`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${rect.width} ${rect.height}">${drawpath()}</svg>`], { type: 'image/svg+xml' });
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
    const layer = [[]];
    const svg = document.querySelector('body>svg');
    svg.trace = false;
    svg.move = false;
    svg.addEventListener('mousedown', (md) => {
        if (tools.querySelector('input[name="trace"]').checked) {
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
            if (md.target.tagName == 'circle' && md.target.parentNode.getAttribute('id') == 'layer'+curlayer()) {
                svg.move = md.target;
            }
        }
    })
    svg.addEventListener('mouseup', (mu) => {
        svg.trace = false;
        svg.move = false;
    })
    svg.addEventListener('mousemove', (me) => {
        if (me.buttons == 1) {
            if (svg.trace !== false) {
                path = layer[curlayer()];
                if (svg.trace == 1) {
                    path.push({ x: me.x, y: me.y });
                }
                else {
                    path.unshift({ x: me.x, y: me.y });
                }
                path = simplify(path);
                layer[curlayer()] = path;
                svg.innerHTML = drawpath() + drawpoint();
            }
            if (svg.move !== false ) {
                let index = [...svg.move.parentNode.children].indexOf(svg.move)
                layer[curlayer()][index] = {x: me.x, y:me.y};
                svg.move.setAttribute('cx', me.x);
                svg.move.setAttribute('cy', me.y);
                svg.querySelectorAll('path')[curlayer()].outerHTML = bezierPath(layer[curlayer()].map((p) => [p.x, p.y]));
                // svg.innerHTML = drawpath() + drawpoint();
                // console.log(me.target);
            }
        }
    });
    const curlayer = () => tools.querySelector('input[name="layer"]').value;
    const drawpath = () => layer.map((l) => bezierPath(l.map((p) => [p.x, p.y]))).join('');
    const drawpoint = () => layer.map((l, k) => `<g id="layer${k}" class="${k == curlayer() ? 'active' : ''}">${l.map((p) => `<circle cx="${p.x}" cy="${p.y}" r="3"/>`).join('')}$</g>`).join('');
});
