var six_dot = [
    'd',
    'w',
    'q',
    'k',
    'o',
    'p'
]

var eight_dot = [
    'f',
    'e',
    'w',
    'j',
    'i',
    'o',
    'a',
    ';'
]

var pips = six_dot

var six_dot_mode = true

var punched = [false, false, false, false, false, false, false, false]
var held = [false, false, false, false, false, false, false, false]

var label = document.getElementById("label")
var box = document.getElementById("box")

var message_six = document.getElementById("sixdot")
var message_eight = document.getElementById("eightdot")

var message_braille = document.getElementById("braille")
var message_print = document.getElementById("print")

const BRF = " A1B'K2L@CIF/MSP\"E3H9O6R^DJG>NTQ,*5<-U8V.%[$+X!&;:4\\0Z7(_?W]#Y)="

// Use an actual space for wrapping
const SPACE = " "
const ENTER = "\n"

var braille_mode = true


function hide(e) {
    e.style.display = "none"
}

function show(e) {
    e.style.display = null
}

function toggle_display(e) {
    if (e.style.display == "none") {
        show(e)
    } else {
        hide(e)
    }
}


function switch_mode() {
    toggle_display(message_eight)
    toggle_display(message_six)
    if (six_dot_mode) {
        pips = eight_dot
        six_dot_mode = false
    } else {
        pips = six_dot
        six_dot_mode = true
    }
}

function print_switch() {
    toggle_display(message_print)
    toggle_display(message_braille)
    braille_mode = !braille_mode
}


function punch(idx) {
    punched[idx] = true
    held[idx] = true
}

function unpunch(idx) {
    held[idx] = false
}

function clear() {
    var clr = (pips) => {
        for (var i = 0; i < pips.length; i++) {
            pips[i] = false
        }
    }
    clr(held)
    clr(punched)
}


function current(pips) {
    var bits = 0
    for (var i = 0; i < pips.length; i++) {
        bits |= pips[i] << i
    }
    return String.fromCharCode(0x2800 + bits)
}

function update() {
    label.textContent = current(punched)
}

function send(text) {
    box.setRangeText(text)
    box.SelectionEnd += 2
    box.selectionStart += 1
    clear()
}


function focus() {
    box.focus()
}


function onPress(e) {
    focus()
    var idx = pips.indexOf(e.key.toLowerCase())
    if (idx !== -1 && braille_mode) {
        punch(idx)
        update()
    }
}


var braille_binds = {
    m: (e) => box.value = "",
    " ": (e) => send(SPACE),
    t: switch_mode,
    enter: (e) => send(ENTER)
}

var print_binds = {}


function onRelease(e) {
    focus()
    var key = e.key.toLowerCase()
    var idx = pips.indexOf(key)
    if (idx !== -1 && braille_mode) {
        unpunch(idx)
        if (held.every((e) => !e)) {
            send(current(punched))
        }
        update()
    } else {
        var f = (braille_mode) ? braille_binds[key] : print_binds[key]
        if (f !== undefined) {
            f(e)
        }
    }
}


for (const e of document.querySelectorAll(".textmode")) {
    e.onclick = print_switch
}


document.onkeypress = onPress
document.onkeyup = onRelease
document.onclick = focus

box.onkeypress = (e) => !braille_mode
box.onkeyup = (e) => !braille_mode

function set_clipboard(text) {
    navigator.clipboard.writeText(text)
    .catch((err) => console.log("Cannot set clipboard."))
}

function within(v, start, stop) {
    return start <= v && v <= stop
}

function brf_translate(unicode) {
    return Array.from(unicode)
        .map((c) =>
            (within(c.charCodeAt(0), 0x2800, 0x283F))
                ? BRF[c.charCodeAt(c) - 0x2800]
                : c)
        .join("")
}

document.getElementById("brfcopy").onclick = (
    (e) => set_clipboard(brf_translate(box.value))
)
document.getElementById("copy").onclick = (
    (e) => set_clipboard(box.value)
)
document.getElementById("spacecopy").onclick = (
    (e) => set_clipboard(box.value.replace(" ", "⠀"))
)

update()

focus()
