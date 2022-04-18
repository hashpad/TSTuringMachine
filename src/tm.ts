import {Subject} from './observer'

export class GoodMap extends Map<Config, NextConfig> {
  
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

export enum Direction {
  LEFT,
  RIGHT,
  NO
}

export class State {
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

export class TuringSymbol {
  private readonly _value : string;

  constructor (_value : string) {
    if (_value.length !== 1) throw new Error("Input symbols should be single characters");
    this._value = _value;
  }

  get value () { return this._value; }
}

export class TapeSymbol extends TuringSymbol {}

export class InputSymbol extends TapeSymbol {}

export class TapeElement {
  private _symbol : TuringSymbol;

  constructor(_symbol : TuringSymbol) {
    this._symbol = _symbol;
  }

  get symbol () { return this._symbol; }

  set symbol (_symbol:TapeSymbol) { this._symbol = _symbol;}
}

export class Tape {
  static readonly BLANK : TuringSymbol = new TuringSymbol("#");
  private _tapeElements : Array<TapeElement>;

  constructor(_initialTapeElements:Array<TapeElement>) {
    this._tapeElements = _initialTapeElements;
  }

  get tapeElements() {return this._tapeElements;}

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

export class TuringHead {
  private _position : TapeElement;
  private _tape : Tape;

  constructor (_tape : Tape) {
    this._position = _tape.getInitHeadElement();
    this._tape = _tape;
  }

  get position() {return this._position;}
  get tape() {return this._tape;}

  move(direction:Direction) {
    this._position = this._tape.step(this._position, direction);
  }
}


export class Config {
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
export class NextConfig extends Config {
  constructor(_state:State, _tapeSymbol:TapeSymbol, private _direction:Direction){
    super (_state, _tapeSymbol);
  }

  get direction() {return this._direction;}
}




export class TuringMachine extends Subject {
  private _isRunning : boolean;
  private _isAccepted : boolean;


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
    super();

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

    this.notifiy();
  }


  public get isRunning() {return this._isRunning;}
  public get isAccepted() {return this._isAccepted;}
  public get head() {return this._head;}
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
    if(!this._isRunning) return;
    let nextConfig : NextConfig = this.transitionFunction();
    this._currentConfig.state = nextConfig.state;
    this._head.position.symbol = nextConfig.tapeSymbol;
    this._head.move(nextConfig.direction);
    this._currentConfig.tapeSymbol = this._head.position.symbol;

    if(nextConfig.equals(this._currentConfig) && nextConfig.direction === Direction.NO) {
      if(this._acceptSet.includes(this._currentConfig.state)){
        this._isAccepted = true;
      }
      this._isRunning = false;
    }
    this.notifiy();

  }
}


