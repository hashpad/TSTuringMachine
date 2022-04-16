enum Direction {LEFT,RIGHT,NO}

class State {
  static stateIdStatic : number = 0;
  private readonly _stateId : number;
  readonly _stateName : string;

  constructor (_stateName : string) {
    this._stateName = _stateName;
    this._stateId = State.stateIdStatic++;
  }

  get stateName() {return this._stateName;}
  get stateId() {return this._stateId;}
}

class TuringSymbol {
  private readonly _value : string;

  constructor (_value : string) {
    if (_value.length !== 1) throw new Error("Input symbols should be single characters");
    this._value = _value;
  }

  get value () { return this._value; }
}

class TapeSymbol extends TuringSymbol {}

class InputSymbol extends TapeSymbol {}

class TapeElement {
  private _symbol : TuringSymbol;

  constructor(_symbol : TuringSymbol) {
    this._symbol = _symbol;
  }

  get symbol () { return this._symbol; }

  set symbol (_symbol:TapeSymbol) { this._symbol = _symbol;}
}

class Tape {
  static readonly BLANK : TuringSymbol = new TuringSymbol("U");
  private _tapeElements : Array<TapeElement>;

  constructor(_initialTapeElements:Array<TapeElement>) {
    this._tapeElements = _initialTapeElements;
  }

  getInitHeadElement () : TapeElement {
    return this._tapeElements[0];
  }

  step (tapeElement: TapeElement, direction:Direction) : TapeElement {
    if(direction === Direction.NO) {
      return tapeElement;
    }else if(direction === Direction.RIGHT){
      if(this._tapeElements.indexOf(tapeElement) == this._tapeElements.length - 1) {
        this._tapeElements.push(new TapeElement(Tape.BLANK));
      }
      return this._tapeElements[this._tapeElements.indexOf(tapeElement)+1];
    }else {
      if(this._tapeElements.indexOf(tapeElement) == 0) {
        this._tapeElements.unshift(new TapeElement(Tape.BLANK));
      }
      return this._tapeElements[this._tapeElements.indexOf(tapeElement)-1]
    }
  }
}

class TuringHead {
  private _position : TapeElement;
  private _tape : Tape;

  constructor (_tape : Tape) {
    this._position = _tape.getInitHeadElement();
    this._tape = _tape;
  }

  get position() {return this._position;}

  move(direction:Direction) {
    this._position = this._tape.step(this._position, direction);
  }
}


class Config {
  constructor(private _state:State, private _tapeSymbol:TapeSymbol){}

  get tapeSymbol() {return this._tapeSymbol;}
  get state() {return this._state;}

  set tapeSymbol(_tapeSymbol:TapeSymbol) {this._tapeSymbol = _tapeSymbol;}
  set state(_state:State) {this._state = _state;}
  
  public equals(c:Config) : boolean {
    return this._state === c.state && this._tapeSymbol === c.tapeSymbol;
  }

  public asNextConfig() : NextConfig {
    return new NextConfig(this._state, this._tapeSymbol, Direction.NO);
  }
}
class NextConfig extends Config {
  constructor(_state:State, _tapeSymbol:TapeSymbol, private _direction:Direction){
    super (_state, _tapeSymbol);
  }

  get direction() {return this._direction;}
}




class TuringMachine {
  private readonly _head : TuringHead;

  private readonly _stateSet : Array<State>;
  private readonly _acceptSet : Array<State>;
  private readonly _inputSymbolSet : Array<InputSymbol>;
  private readonly _tapeSymbolSet : Array<TapeSymbol>;
  private readonly _startState : State;

  private _currentConfig : Config;

  private _transitionMap : GoodMap;

  constructor(_head:TuringHead,
              _stateSet:Array<State>,
              _acceptSet:Array<State>,
              _transitionMap: GoodMap,
              _inputSymbolSet?:Array<InputSymbol>,
              _startState?:State) {
    this._head = _head;

    this._stateSet = _stateSet;
    this._acceptSet = _acceptSet;
    this._inputSymbolSet = _inputSymbolSet !== undefined ? _inputSymbolSet : [new InputSymbol("0"), new InputSymbol("1")];
    this._tapeSymbolSet = this._inputSymbolSet.concat(Tape.BLANK);
    this._startState = _startState !== undefined ? _startState : this._stateSet[0];
    this._transitionMap = _transitionMap;

    this._currentConfig = new Config(this._startState, this._head.position.symbol);
  }

  public get stateSet() {return this._stateSet;}
  public get inputSymbolSet() {return this._inputSymbolSet;}
  public get tapeSymbolSet() {return this._tapeSymbolSet;}
  public get startState() {return this._startState;}
  public get currentConfig() {return this._currentConfig;}

  public transitionFunction() : NextConfig {
    let val:NextConfig = this._transitionMap.get(this._currentConfig);
    if(val === null) return this._currentConfig.asNextConfig();
    return val;
  }

  public oneStep() {
    let nextConfig : NextConfig = this.transitionFunction();
    if(nextConfig.equals(this._currentConfig) && nextConfig.direction === Direction.NO) {
      if(this._acceptSet.includes(this._currentConfig.state)){
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
const one  = new TapeSymbol("1");


const tapeElements = [new TapeElement(one), new TapeElement(zero), new TapeElement(zero), new TapeElement(zero)];

const turingTape = new Tape(tapeElements);
const turingHead = new TuringHead(turingTape);

const s : State = new State("s");
const q1 : State = new State("q1");
const q2 : State = new State("q2");
const q3 : State = new State("q3");
const q4 : State = new State("q4");
const q5 : State = new State("q5");
const f : State = new State("f");

const stateSet = [s, q1, q2, q3, q4, q5, f];
const acceptSet = [f];

class GoodMap extends Map<Config, NextConfig> {
  
  public get(key:Config) : NextConfig {
    let val:NextConfig = null;
    for(let [k, v] of this){
      if(k.equals(key)) {
        val = v;
        break;
      }
    }
    return val;
  }

}


let transitionMap : GoodMap = new GoodMap();

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

