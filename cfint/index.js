class Cell {
	constructor(value) {
    this.element = document.createElement("div");
    this.element.classList.add("cell");
  	this.setValue(value);
  }
  
  setValue(value) {
  	this.value = value;
    this.element.innerText = value;
  }
  
  getValue() {
  	return this.value;
  }
  
  activate() {
  	this.element.classList.add('active');
  }
  
  deactivate() {
  	this.element.classList.remove('active');
  }
}

class Tape {
	constructor(element, count) {
  	this.element = element;
    this.tape = [];
    this.active = undefined;
   	this.addCell(256);
    for (let i = 0; i < count - 1; i++) {
    	this.addCell();
    }
  }
  
  addCell(n) {
  	n = (n === undefined) ? 0 : n;
    let cell = new Cell(n);
    this.element.appendChild(cell.element);
    this.tape.push(cell);
  }
  
  pad(n) {
  	for (let i = this.tape.length - 1; i < n; i++) {
    	this.addCell(0);
    }
  }
  
  activate(c) {
  	this.pad(c);
  	if (this.active !== undefined) {
    	this.tape[this.active].deactivate()
    }
  	this.tape[c].activate();
    this.active = c;
  }
  
  setCell(c, n) {
  	this.pad(c);
  	this.tape[c].setValue(n);
  }
  
  getCell(c) {
  	this.pad(c);
  	return this.tape[c].getValue();
  }
  
  clear() {
  	this.setCell(0, 256);
  	for (let i = 1; i < this.tape.length; i++) {
    	this.setCell(i, 0);
    }
  }
}

class Emulator {
	constructor(program, tape) {
  	this.tape = tape;
    this.pointer = 0;
    this.held = 0;
    this.program = program;
    this.pc = 0;
    this.halted = false;
  }

	skip(inc, dec, dir) {
  	let nest = 1;
    this.pc = this.pc + 2 * dir;
  	while (nest !== 0 && this.pc < this.program.length) {
    	let op = this.program[this.pc];
      if (op === inc) {
      	nest++;
      } else if (op === dec) {
      	nest--;
      }
      this.pc += dir;
    }
    this.pc -= dir;
  }

  operate(command) {
  	switch(command) {
    case '*':
    	let current = this.tape.getCell(this.pointer);
    	if (this.held == 1) {
      	this.tape.setCell(this.pointer, current + 1);
        this.held = 0;
      } else if (current > 0) {
      	this.tape.setCell(this.pointer, current - 1);
        this.held = 1;
      }
      break;
    case '>':
    	this.pointer++;
      break;
    case '<':
    	this.pointer = Math.max(0, this.pointer - 1);
      break;
    case '[':
    	if (this.held === 0) {
      	this.skip('[', ']', 1);
      }
      break;
    case ']':
    	if (this.held === 1) {
      	this.skip(']', '[', -1);
      }
      break;
    }
    this.tape.activate(this.pointer);
  }
  
  step() {
  	if (this.pc >= this.program.length) {
    	this.halted = true;
    	return false;
    }

  	let op = this.program[this.pc];
    this.operate(op);
    this.pc++;
    this.halted = false;
    return true;
  }
}

class Baked {
	constructor(element, emu) {
  	this.emu = emu;
    this.element = element;
    this.prior = undefined;
    element.innerHTML = '';
    let program = emu.program + '∅';
    for (let i = 0; i < program.length; i++) {
    	let span = document.createElement('span');
      span.textContent = program[i];
      element.appendChild(span)
    }
    this.update();
  }
  
  update() {
  	if (this.prior !== undefined) {
    	this.prior.classList.remove('selected');
    }
  	let active = this.element.children[this.emu.pc];
    active.classList.add('selected');
    this.prior = active;
  }
}

let box = document.querySelector(".box");
let held = document.querySelector("#held");
let codebox = document.querySelector("#code");
let bakedelem = document.querySelector(".bakedcode");
let playbutton = document.querySelector("#playbutton");
let tape = new Tape(box, 300);
let emu = new Emulator(codebox.value, tape);
let baked = new Baked(bakedelem, emu);
let player = null;

let interval = 100;
let tinterval = interval;
let imax = 1000;
let irange = document.querySelector("#interval");
let itext = document.querySelector("#interval-text");

tape.activate(0);

function updateHeld() {
	held.textContent = emu.held;
}

function step() {
	emu.step();
  updateHeld();
  baked.update();
  if (emu.halted && player !== null) {
  	clearInterval(player);
    player = null;
  }
}

function play() {
	player = setInterval(step, interval);
}

function pause() {
	if (player !== null) {
  	clearInterval(player);
  	player = null;
  }
}

function reset() {
	pause();
  tape.clear();
  tape.activate(0);
	emu = new Emulator(codebox.value, tape);
  baked = new Baked(bakedelem, emu);
  updateHeld();
}

function updateinterval() {
	let x = irange.value / irange.max;
	tinterval = Math.max(1, Math.floor(imax * Math.pow(x, 3.32)));
	itext.textContent = `Interval ${tinterval}ms (${(1000/tinterval).toFixed(1)}/s)`;
}

function changeinterval() {
  interval = tinterval;
  if (player) {
  	pause();
    play();
  }
}

function playpause() {
	if (player) {
  	pause();
    playbutton.textContent = '⏵';
  } else {
    play();
    playbutton.textContent = '⏸';
  }
}

updateinterval();
