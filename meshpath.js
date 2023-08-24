window.addEventListener('load', (le) => {
    const tools = document.querySelector('body>div');
    document.addEventListener('keyup', (ke) => {
        if (ke.code == "Escape") {
            tools.classList.toggle('active');
        }
    })
    tools.querySelector('button.load').addEventListener('click', (ce) => {
        const rect = svg.getBoundingClientRect();
        const blob = new Blob([`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${rect.width} ${rect.height}">${loadpath(path)}</svg>`], { type: 'image/svg+xml' });
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
    var path = [];
    const svg = document.querySelector('body>svg');
    svg.addEventListener('mousemove', (me) => {
        if (me.buttons == 1) {
            path.push({ x: me.x, y: me.y });
            path = simplify(path);
            svg.innerHTML =
                loadpath(path) +
                path.map(
                    (pt) => `<circle cx="${pt.x}" cy="${pt.y}" r="3" />`
                ).join('');
        }
    });
    const loadpath = (po) => bezierPath(po.map((p) => [p.x, p.y]));
});

function downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename || 'download';
    const clickHandler = () => {
        setTimeout(() => {
            URL.revokeObjectURL(url);
            removeEventListener('click', clickHandler);
        }, 150);
    };
    a.addEventListener('click', clickHandler, false);
    a.click();
    return a;
}