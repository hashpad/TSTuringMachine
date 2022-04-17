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

class TuringHead {
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

  private render() {
    const tape = document.getElementById("tape_ul");

    tape.innerHTML = "";

    for (let te of this._head.tape.tapeElements){
      const te_li = document.createElement("li");
      te_li.textContent = te.symbol.value;

      tape.appendChild(te_li);

      if (this.head.position === te) te_li.classList.add("head");
        
    }

    if(this._isAccepted) {
      const isAccepted = document.getElementById("is_accepted");
      isAccepted.innerHTML = "<span style='color: green;'>Accepted</span>";
    }

  }

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
    let nextConfig : NextConfig = this.transitionFunction();
    this._currentConfig.state = nextConfig.state;
    this._head.position.symbol = nextConfig.tapeSymbol;
    this._head.move(nextConfig.direction);
    this._currentConfig.tapeSymbol = this._head.position.symbol;

    if(nextConfig.equals(this._currentConfig) && nextConfig.direction === Direction.NO) {
      if(this._acceptSet.includes(this._currentConfig.state)){
        this._isAccepted = true;
      }
    }
    this.render();

  }
}

class Runner {
  private _inputSymbols : Array<InputSymbol>;
  private _tapeElements : Array<TapeElement>;
  private _turingTape : Tape;
  private _turingHead : TuringHead;
  private _stateSet : Array<State>;
  private _acceptSet : Array<State>;
  private _transitionMap : GoodMap;

  private _tm:TuringMachine;

  getState(asStr:string) :State{
    return this._stateSet.find(s=>s.stateName===asStr);
  }
  getSymbol(asStr:string) :InputSymbol{
    return this._inputSymbols.find(s=>s.value===asStr);
  }

  public clear_tm() {
    const tape = document.getElementById("tape_ul");

    tape.innerHTML = "";
  }

  public init() {
    this.clear_tm();

    this._inputSymbols = new Array<InputSymbol>();
    this._tapeElements = new Array<TapeElement>();
    this._stateSet = new Array<State>();
    this._acceptSet = new Array<State>();
    this._transitionMap = new GoodMap();
  }

  public get tm() {return this._tm};
  constructor() {
    this.renderOnce();

    const form = document.querySelector('form')!;

    form.onsubmit = (_) => {
      this.init();

      const data = new FormData(form);
      const inputSymbols = (data.get('input_symbols') as string).split(",");
      const initTape = (data.get('init_tape') as string).split(",");
      const states = (data.get('states') as string).split(",");
      const acceptStates = (data.get('accept_states') as string).split(",");

      const transitionStates = data.getAll('state');
      const transitionRead = data.getAll('read');
      const transitionWrite = data.getAll('write');
      const transitionDirections = data.getAll('direction');
      const transitionNextStates = data.getAll('next_state');

      for(let inputSymbol of inputSymbols) {
        this._inputSymbols.push(new InputSymbol(inputSymbol));
      }

      for(let tapeElement of initTape) {
        let symbol : InputSymbol = this._inputSymbols.find(e => e.value === tapeElement);
        if (symbol === null) {
          if (tapeElement !== "U") throw new Error("not input symbol");
          this._tapeElements.push(new TapeElement(Tape.BLANK));
          continue;
        }
        this._tapeElements.push(new TapeElement(symbol));
      }


      this._turingTape = new Tape(this._tapeElements);
      this._turingHead = new TuringHead(this._turingTape);

      for(let state of states) {
        this._stateSet.push(new State(state));
      }
      for(let acceptState of acceptStates) {
        let state : State = this._stateSet.find(e => e.stateName === acceptState);
        this._acceptSet.push(state);
      }
      this._transitionMap = new GoodMap();


      for(let i = 0; i < transitionStates.length; ++i){
        let transitionState : State = this.getState(transitionStates[i] as string);
        let transitionReadSymbol : TapeSymbol = this.getSymbol(transitionRead[i] as string) ? this.getSymbol(transitionRead[i] as string) : Tape.BLANK;

        let transitionNextState : State = this.getState(transitionNextStates[i] as string);
        let transitionWriteSymbol : TapeSymbol = this.getSymbol(transitionWrite[i] as string) ? this.getSymbol(transitionWrite[i] as string) : Tape.BLANK;
        let direction : Direction = null;
        switch (transitionDirections[i] as string){
          case "R": direction = Direction.RIGHT;
          break;
          case "L": direction = Direction.LEFT;
          break;
          case "N": direction = Direction.NO;
          break;
        }

        this._transitionMap.set(new Config(transitionState, transitionReadSymbol), 
                                new NextConfig(transitionNextState, transitionWriteSymbol, direction));
      }


      this._tm = new TuringMachine(this._turingHead, this._stateSet, this._acceptSet, this._transitionMap);

      return false; // prevent reload
    };

  }

  private renderOnce() {

    const onestepButton = document.getElementById("oneStep");
    onestepButton.addEventListener('click', () => {this._tm.oneStep(); console.log("step")});

    const transitionEntryButton = document.getElementById("addTransitionEntry");
    const transitionEntries = document.getElementsByClassName("transitionEntry");

    transitionEntryButton.addEventListener('click', () => {
      transitionEntryButton.parentNode.insertBefore(transitionEntries[0].cloneNode(true), transitionEntries[transitionEntries.length-1].nextSibling);
    })
  }
}





let runner : Runner = new Runner();

