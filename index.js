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
        this._head = _head;
        this._stateSet = _stateSet;
        this._acceptSet = _acceptSet;
        this._inputSymbolSet = _inputSymbolSet !== undefined ? _inputSymbolSet : [new InputSymbol("0"), new InputSymbol("1")];
        this._tapeSymbolSet = this._inputSymbolSet.concat(Tape.BLANK);
        this._startState = _startState !== undefined ? _startState : this._stateSet[0];
        this._transitionMap = _transitionMap;
        this._currentConfig = new Config(this._startState, this._head.position.symbol);
    }
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
        let nextConfig = this.transitionFunction();
        if (nextConfig.equals(this._currentConfig) && nextConfig.direction === Direction.NO) {
            if (this._acceptSet.includes(this._currentConfig.state)) {
                console.log("accept");
            }
            return;
        }
        this._currentConfig.state = nextConfig.state;
        this._head.position.symbol = nextConfig.tapeSymbol;
        this._head.move(nextConfig.direction);
        this._currentConfig.tapeSymbol = this._head.position.symbol;
    }
}
const zero = new TapeSymbol("0");
const one = new TapeSymbol("1");
const tapeElements = [new TapeElement(one), new TapeElement(zero), new TapeElement(zero), new TapeElement(zero)];
const turingTape = new Tape(tapeElements);
const turingHead = new TuringHead(turingTape);
const s = new State("s");
const q1 = new State("q1");
const q2 = new State("q2");
const q3 = new State("q3");
const q4 = new State("q4");
const q5 = new State("q5");
const f = new State("f");
const stateSet = [s, q1, q2, q3, q4, q5, f];
const acceptSet = [f];
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
let transitionMap = new GoodMap();
transitionMap.set(new Config(s, zero), new NextConfig(q4, zero, Direction.RIGHT));
transitionMap.set(new Config(s, one), new NextConfig(q1, one, Direction.RIGHT));
transitionMap.set(new Config(q1, zero), new NextConfig(q1, zero, Direction.RIGHT));
transitionMap.set(new Config(q1, one), new NextConfig(q1, one, Direction.RIGHT));
transitionMap.set(new Config(q1, Tape.BLANK), new NextConfig(q2, Tape.BLANK, Direction.LEFT));
transitionMap.set(new Config(q2, zero), new NextConfig(q3, one, Direction.LEFT));
transitionMap.set(new Config(q2, one), new NextConfig(q2, zero, Direction.LEFT));
transitionMap.set(new Config(q2, Tape.BLANK), new NextConfig(f, one, Direction.LEFT));
transitionMap.set(new Config(q3, zero), new NextConfig(q3, zero, Direction.LEFT));
transitionMap.set(new Config(q3, one), new NextConfig(q3, one, Direction.LEFT));
transitionMap.set(new Config(q3, Tape.BLANK), new NextConfig(f, Tape.BLANK, Direction.LEFT));
transitionMap.set(new Config(q4, Tape.BLANK), new NextConfig(q5, Tape.BLANK, Direction.LEFT));
transitionMap.set(new Config(q5, zero), new NextConfig(f, one, Direction.LEFT));
const tm = new TuringMachine(turingHead, stateSet, acceptSet, transitionMap);
console.log(tm.currentConfig.state._stateName);
tm.oneStep();
console.log(tm.currentConfig.state._stateName);
tm.oneStep();
console.log(tm.currentConfig.state._stateName);
tm.oneStep();
console.log(tm.currentConfig.state._stateName);
tm.oneStep();
console.log(tm.currentConfig.state._stateName);
tm.oneStep();
console.log(tm.currentConfig.state._stateName);
tm.oneStep();
console.log(tm.currentConfig.state._stateName);
tm.oneStep();
console.log(tm.currentConfig.state._stateName);
tm.oneStep();
console.log(tm.currentConfig.state._stateName);
tm.oneStep();
console.log(tm.currentConfig.state._stateName);
tm.oneStep();
console.log(tm.currentConfig.state._stateName);
tm.oneStep();
console.log(tm.currentConfig.state._stateName);
tm.oneStep();
console.log(tm.currentConfig.state._stateName);
tm.oneStep();
console.log(tm.currentConfig.state._stateName);
tm.oneStep();
console.log(tm.currentConfig.state._stateName);
tm.oneStep();
console.log(tm.currentConfig.state._stateName);
tm.oneStep();
console.log(tm.currentConfig.state._stateName);
tm.oneStep();
console.log(tm.currentConfig.state._stateName);
tm.oneStep();
console.log(tm.currentConfig.state._stateName);
tm.oneStep();
console.log(tm.currentConfig.state._stateName);
tm.oneStep();
console.log(tm.currentConfig.state._stateName);
tm.oneStep();
console.log(tm.currentConfig.state._stateName);
tm.oneStep();
console.log(tm.currentConfig.state._stateName);
tm.oneStep();
console.log(tm.currentConfig.state._stateName);
tm.oneStep();
