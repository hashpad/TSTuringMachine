class GoodMap extends Map {
    get(key) {
        let val = null;
        for (let [k, v] of this) {
            if (k.equals(key)) {
                val = v;
                break;
            }
        }
        return val;
    }
}
var Direction;
(function (Direction) {
    Direction[Direction["LEFT"] = 0] = "LEFT";
    Direction[Direction["RIGHT"] = 1] = "RIGHT";
    Direction[Direction["NO"] = 2] = "NO";
})(Direction || (Direction = {}));
class State {
    constructor(_stateName) {
        this._stateName = _stateName;
        this._stateId = State.stateIdStatic++;
    }
    get stateName() { return this._stateName; }
    get stateId() { return this._stateId; }
}
State.stateIdStatic = 0;
class TuringSymbol {
    constructor(_value) {
        if (_value.length !== 1)
            throw new Error("Input symbols should be single characters");
        this._value = _value;
    }
    get value() { return this._value; }
}
class TapeSymbol extends TuringSymbol {
}
class InputSymbol extends TapeSymbol {
}
class TapeElement {
    constructor(_symbol) {
        this._symbol = _symbol;
    }
    get symbol() { return this._symbol; }
    set symbol(_symbol) { this._symbol = _symbol; }
}
class Tape {
    constructor(_initialTapeElements) {
        this._tapeElements = _initialTapeElements;
    }
    get tapeElements() { return this._tapeElements; }
    getInitHeadElement() {
        return this._tapeElements[0];
    }
    step(tapeElement, direction) {
        if (direction === Direction.NO) {
            return tapeElement;
        }
        else if (direction === Direction.RIGHT) {
            if (this._tapeElements.indexOf(tapeElement) == this._tapeElements.length - 1) {
                this._tapeElements.push(new TapeElement(Tape.BLANK));
            }
            return this._tapeElements[this._tapeElements.indexOf(tapeElement) + 1];
        }
        else {
            if (this._tapeElements.indexOf(tapeElement) == 0) {
                this._tapeElements.unshift(new TapeElement(Tape.BLANK));
            }
            return this._tapeElements[this._tapeElements.indexOf(tapeElement) - 1];
        }
    }
}
Tape.BLANK = new TuringSymbol("U");
class TuringHead {
    constructor(_tape) {
        this._position = _tape.getInitHeadElement();
        this._tape = _tape;
    }
    get position() { return this._position; }
    get tape() { return this._tape; }
    move(direction) {
        this._position = this._tape.step(this._position, direction);
    }
}
class Config {
    constructor(_state, _tapeSymbol) {
        this._state = _state;
        this._tapeSymbol = _tapeSymbol;
    }
    get tapeSymbol() { return this._tapeSymbol; }
    get state() { return this._state; }
    set tapeSymbol(_tapeSymbol) { this._tapeSymbol = _tapeSymbol; }
    set state(_state) { this._state = _state; }
    equals(c) {
        return this._state === c.state && this._tapeSymbol === c.tapeSymbol;
    }
    asNextConfig() {
        return new NextConfig(this._state, this._tapeSymbol, Direction.NO);
    }
}
class NextConfig extends Config {
    constructor(_state, _tapeSymbol, _direction) {
        super(_state, _tapeSymbol);
        this._direction = _direction;
    }
    get direction() { return this._direction; }
}
class TuringMachine {
    constructor(_head, _stateSet, _acceptSet, _transitionMap, _inputSymbolSet, _startState) {
        this._isRunning = true;
        this._isAccepted = false;
        this._head = _head;
        this._stateSet = _stateSet;
        this._acceptSet = _acceptSet;
        this._inputSymbolSet = _inputSymbolSet !== undefined ? _inputSymbolSet : [new InputSymbol("0"), new InputSymbol("1")];
        this._tapeSymbolSet = this._inputSymbolSet.concat(Tape.BLANK);
        this._startState = _startState !== undefined ? _startState : this._stateSet[0];
        this._transitionMap = _transitionMap;
        this._currentConfig = new Config(this._startState, this._head.position.symbol);
        this.render();
    }
    render() {
        const tape = document.getElementById("tape_ul");
        tape.innerHTML = "";
        for (let te of this._head.tape.tapeElements) {
            const te_li = document.createElement("li");
            te_li.textContent = te.symbol.value;
            tape.appendChild(te_li);
            if (this.head.position === te)
                te_li.classList.add("head");
        }
        if (!this._isRunning) {
            const isAccepted = document.getElementById("is_accepted");
            let [msg, color] = this._isAccepted ? ["Accepted", "green"] : ["Rejected", "red"];
            isAccepted.innerHTML = `<span style='color: ${color};'>${msg}</span>`;
        }
    }
    get head() { return this._head; }
    get stateSet() { return this._stateSet; }
    get inputSymbolSet() { return this._inputSymbolSet; }
    get tapeSymbolSet() { return this._tapeSymbolSet; }
    get startState() { return this._startState; }
    get currentConfig() { return this._currentConfig; }
    transitionFunction() {
        let val = this._transitionMap.get(this._currentConfig);
        if (val === null)
            return this._currentConfig.asNextConfig();
        return val;
    }
    oneStep() {
        if (!this._isRunning)
            return;
        let nextConfig = this.transitionFunction();
        this._currentConfig.state = nextConfig.state;
        this._head.position.symbol = nextConfig.tapeSymbol;
        this._head.move(nextConfig.direction);
        this._currentConfig.tapeSymbol = this._head.position.symbol;
        if (nextConfig.equals(this._currentConfig) && nextConfig.direction === Direction.NO) {
            if (this._acceptSet.includes(this._currentConfig.state)) {
                this._isAccepted = true;
            }
            this._isRunning = false;
        }
        this.render();
    }
}
class Runner {
    constructor() {
        this.renderOnce();
        const form = document.querySelector('form');
        form.onsubmit = (_) => {
            this.init();
            const data = new FormData(form);
            const inputSymbols = data.get('input_symbols').split(",");
            const initTape = data.get('init_tape').split(",");
            const states = data.get('states').split(",");
            const acceptStates = data.get('accept_states').split(",");
            const transitionStates = data.getAll('state');
            const transitionRead = data.getAll('read');
            const transitionWrite = data.getAll('write');
            const transitionDirections = data.getAll('direction');
            const transitionNextStates = data.getAll('next_state');
            for (let inputSymbol of inputSymbols) {
                this._inputSymbols.push(new InputSymbol(inputSymbol));
            }
            for (let tapeElement of initTape) {
                let symbol = this._inputSymbols.find(e => e.value === tapeElement);
                if (symbol === null) {
                    if (tapeElement !== "U")
                        throw new Error("not input symbol");
                    this._tapeElements.push(new TapeElement(Tape.BLANK));
                    continue;
                }
                this._tapeElements.push(new TapeElement(symbol));
            }
            this._turingTape = new Tape(this._tapeElements);
            this._turingHead = new TuringHead(this._turingTape);
            for (let state of states) {
                this._stateSet.push(new State(state));
            }
            for (let acceptState of acceptStates) {
                let state = this._stateSet.find(e => e.stateName === acceptState);
                this._acceptSet.push(state);
            }
            this._transitionMap = new GoodMap();
            for (let i = 0; i < transitionStates.length; ++i) {
                let transitionState = this.getState(transitionStates[i]);
                let transitionReadSymbol = this.getSymbol(transitionRead[i]) ? this.getSymbol(transitionRead[i]) : Tape.BLANK;
                let transitionNextState = this.getState(transitionNextStates[i]);
                let transitionWriteSymbol = this.getSymbol(transitionWrite[i]) ? this.getSymbol(transitionWrite[i]) : Tape.BLANK;
                let direction = null;
                switch (transitionDirections[i]) {
                    case "R":
                        direction = Direction.RIGHT;
                        break;
                    case "L":
                        direction = Direction.LEFT;
                        break;
                    case "N":
                        direction = Direction.NO;
                        break;
                }
                this._transitionMap.set(new Config(transitionState, transitionReadSymbol), new NextConfig(transitionNextState, transitionWriteSymbol, direction));
            }
            this._tm = new TuringMachine(this._turingHead, this._stateSet, this._acceptSet, this._transitionMap);
            return false; // prevent reload
        };
    }
    getState(asStr) {
        return this._stateSet.find(s => s.stateName === asStr);
    }
    getSymbol(asStr) {
        return this._inputSymbols.find(s => s.value === asStr);
    }
    clear_tm() {
        const tape = document.getElementById("tape_ul");
        const isAccepted = document.getElementById("is_accepted");
        tape.innerHTML, isAccepted.innerHTML = "";
    }
    init() {
        this.clear_tm();
        this._inputSymbols = new Array();
        this._tapeElements = new Array();
        this._stateSet = new Array();
        this._acceptSet = new Array();
        this._transitionMap = new GoodMap();
    }
    get tm() { return this._tm; }
    ;
    renderOnce() {
        const onestepButton = document.getElementById("oneStep");
        onestepButton.addEventListener('click', () => { this._tm.oneStep(); console.log("step"); });
        const transitionEntryButton = document.getElementById("addTransitionEntry");
        const transitionEntries = document.getElementsByClassName("transitionEntry");
        transitionEntryButton.addEventListener('click', () => {
            transitionEntryButton.parentNode.insertBefore(transitionEntries[0].cloneNode(true), transitionEntries[transitionEntries.length - 1].nextSibling);
        });
    }
}
let runner = new Runner();
