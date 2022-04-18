import {InputSymbol, TapeElement, Tape, TuringHead, State, GoodMap, TuringMachine, Config, NextConfig, TapeSymbol, Direction} from './tm'

import {Observer} from './observer'

class Runner extends Observer {
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
    const isAccepted = document.getElementById("is_accepted");

    tape.innerHTML, isAccepted.innerHTML = "";
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
    super();
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
      this._tm.subscribe(this);

      return false; // prevent reload
    };

  }

  public render(): void {
    
    const tape = document.getElementById("tape_ul");

    tape.innerHTML = "";

    for (let te of this._tm.head.tape.tapeElements){
      const te_li = document.createElement("li");
      te_li.textContent = te.symbol.value;

      tape.appendChild(te_li);

      if (this._tm.head.position === te) te_li.classList.add("head");
        
    }

    if(!this._tm.isRunning){
      const isAccepted = document.getElementById("is_accepted");
      let [msg, color] : [string, string] = this._tm.isAccepted ? ["Accepted", "green"] : ["Rejected", "red"];
      isAccepted.innerHTML = `<span style='color: ${color};'>${msg}</span>`;
    }

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

new Runner();

