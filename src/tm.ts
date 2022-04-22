import {Subject} from './observer'
import {Node, Vertex, Graph} from './graph'

export class GoodMap extends Map<Config, NextConfig> {
  public get(key:Config) : NextConfig {
    for(let [k, v] of this){
      if(k.equals(key)) {
        return v;
      }
    }
    return null;
  }
}

export enum Direction {
  LEFT = "L",
  RIGHT = "R",
  NO = "N"
}

export class State {
  static stateIdStatic : number = 0;
  private readonly _stateId : number;

  constructor (private readonly _stateName : string) {
    this._stateId = State.stateIdStatic++;
  }

  public get stateName() {return this._stateName;}
  public get stateId() {return this._stateId;}

  public toString () { return this._stateName; }
}

export class TuringSymbol {
  constructor (private readonly _value : string) {
    if (_value.length !== 1) throw new Error("Input symbols should be single characters");
  }

  public get value () { return this._value; }
  
  public toString() { return this._value; }
}
export class TapeSymbol extends TuringSymbol {}
export class InputSymbol extends TapeSymbol {}

export class TapeElement {
  constructor(private _symbol : TuringSymbol) {}

  public get symbol () { return this._symbol; }

  public set symbol (_symbol:TapeSymbol) { this._symbol = _symbol; }

  public toString() { return this._symbol.toString(); }
}

export class Tape {
  public static readonly BLANK : TuringSymbol = new TuringSymbol("#");

  constructor(private _tapeElements:Array<TapeElement>) {}

  public get tapeElements() {return this._tapeElements;}

  public getInitHeadElement () : TapeElement { return this._tapeElements[0]; }

  public step (tapeElement: TapeElement, direction:Direction) : TapeElement {
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

  constructor (private _tape : Tape) {
    this._position = _tape.getInitHeadElement();
  }

  public get position() {return this._position;}
  public get tape() {return this._tape;}

  public move(direction:Direction) { this._position = this._tape.step(this._position, direction); }
}


export class Config {
  constructor(private _state:State, private _tapeSymbol:TapeSymbol){}

  public get tapeSymbol() {return this._tapeSymbol;}
  public get state() {return this._state;}

  public set tapeSymbol(_tapeSymbol:TapeSymbol) {this._tapeSymbol = _tapeSymbol;}
  public set state(_state:State) {this._state = _state;}
  
  public equals(c:Config) : boolean { return this._state === c.state && this._tapeSymbol === c.tapeSymbol; }

  public asNextConfig() : NextConfig { return new NextConfig(this._state, this._tapeSymbol, Direction.NO); }
}
export class NextConfig extends Config {
  constructor(_state:State, _tapeSymbol:TapeSymbol, private _direction:Direction){ super (_state, _tapeSymbol); }

  public get direction() {return this._direction;}
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
  public get acceptSet() {return this._acceptSet;}
  public get inputSymbolSet() {return this._inputSymbolSet;}
  public get tapeSymbolSet() {return this._tapeSymbolSet;}
  public get startState() {return this._startState;}
  public get currentConfig() {return this._currentConfig;}
  public get transitionMap() {return this._transitionMap;}


  public transitionFunction() : NextConfig {
    let val:NextConfig = this._transitionMap.get(this._currentConfig);
    return val ? val : this._currentConfig.asNextConfig();
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
        this.accept();
      }
      this.halt();
    }
    this.notifiy();
  }

  public accept() {this._isAccepted = true;}
  public halt() {this._isRunning = false;}
  
  public toGraph() : Graph {
    const nodes : Array<Node> = new Array<Node>();
    const vertices : Array<Vertex> = new Array<Vertex>();
    this._stateSet.forEach(s => {
      nodes.push(new Node(s));
    });

    this._stateSet.forEach(s => {
      let keys : Array<Config> = Array.from(this._transitionMap.keys());

      keys.filter(k => k.state === s).forEach(c => {
        const edgeId : string = s.stateId + '' + this._transitionMap.get(c).state.stateId;
        const edgeCnt : string = c.tapeSymbol.value + '|' + this._transitionMap.get(c).tapeSymbol.value + ',' + this._transitionMap.get(c).direction.toString();

        let existingVertex : Vertex = vertices.find(v => v.from.state === s);
        if(existingVertex && existingVertex.to.state === this._transitionMap.get(c).state){
          existingVertex.content = edgeCnt
        }else {
          vertices.push(new Vertex(
                                    edgeId,
                                    edgeCnt,
                                    nodes.find(n => n.state === s),
                                    nodes.find(n => n.state === this._transitionMap.get(c).state)
                        ));
        }
      });
    });
    return new Graph(nodes, vertices);
  }
}



