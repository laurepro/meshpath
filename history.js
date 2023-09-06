class History {
  constructor() {
    this.load();
  }
  load() {
    let storage = JSON.parse(localStorage.getItem("history") || '{"list":[],"index":0}');
    this.list = storage.list;
    this.index = storage.index;
  }
  add() {
    this.index++;
    let portion = this.list.slice(0, this.index + 1);
    let ajout = [];
    Array.from(arguments).forEach((a) => ajout.push(JSON.parse(JSON.stringify(a))));
    portion.push(ajout);
    this.list = portion;
    this.store();
  }
  go(sens) {
    this.index += sens;
    this.index = Math.min(Math.max(this.index, 1), this.list.length);
    let extract = [];
    this.list[this.index - 1].forEach((i) => extract.push(JSON.parse(JSON.stringify(i))));
    this.store();
    return extract;
  }
  store() {
    try {
      localStorage.setItem("history", JSON.stringify({ list: this.list, index: this.index }));
    } catch (error) {
      this.list.shift();
      this.index--;
      this.store();
    }
  }
  clear() {
    localStorage.removeItem("history");
    this.load();
  }
}
