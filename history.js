class History {
  constructor() {
    this.load();
  }
  load() {
    let storage = JSON.parse(localStorage.getItem("history") || '{"list":[],"index":null}');
    this.list = storage.list;
    this.index = storage.index;
  }
  add() {
    if(this.index != null) {
      this.index++;
    }
    else {
      this.index = 0;
    }
    this.list.length = this.index;
    let ajout = [];
    Array.from(arguments).forEach((a) => ajout.push(JSON.parse(JSON.stringify(a))));
    this.list.push(ajout);
    this.store();
  }
  go(sens) {
    let extract = [];
    this.index += sens;
    this.index = Math.min(Math.max(this.index, 0), this.list.length - 1);
    this.list[this.index].forEach((i) => extract.push(JSON.parse(JSON.stringify(i))));
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
  isEmpty() {
    return this.list.length == 0;
  }
}
