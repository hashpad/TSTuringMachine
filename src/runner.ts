import cytoscape from 'cytoscape';

import {InputSymbol, TapeElement, Tape, TuringHead, State, GoodMap, TuringMachine, Config, NextConfig, TapeSymbol, Direction} from './tm'

import {Observer} from './observer'

let cy = cytoscape({
  container: document.getElementById('cy'),
  style: [
    {
        selector: 'node',
        style: {
            content: 'data(name)',
            shape: 'hexagon',
            'background-color': 'red',
            label: 'data(id)'
        }
    }]


});


class Runner implements Observer {

  private _tm:TuringMachine;


  public clear_tm() {
    const tape = document.getElementById("tape_ul");
    const isAccepted = document.getElementById("is_accepted");

    tape.innerHTML, isAccepted.innerHTML = "";
  }

  public init() {
  }

  public get tm() {return this._tm};
  constructor() {
    this.renderOnce();

    const form = document.querySelector('form')!;

    form.onsubmit = (_) => {
      this.clear_tm();

      let inputSymbols : Array<InputSymbol> = new Array<InputSymbol>();
      let tapeElements : Array<TapeElement>= new Array<TapeElement>();
      let stateSet : Array<State> = new Array<State>();
      let acceptSet : Array<State>= new Array<State>();
      let transitionMap : GoodMap = new GoodMap();

      const data = new FormData(form);
      const formInputSymbols = (data.get('input_symbols') as string).split(",");
      const initTape = (data.get('init_tape') as string).split(",");
      const states = (data.get('states') as string).split(",");
      const acceptStates = (data.get('accept_states') as string).split(",");

      const transitionStates = data.getAll('state');
      const transitionRead = data.getAll('read');
      const transitionWrite = data.getAll('write');
      const transitionDirections = data.getAll('direction');
      const transitionNextStates = data.getAll('next_state');

      for(let inputSymbol of formInputSymbols) {
        inputSymbols.push(new InputSymbol(inputSymbol));
      }

      for(let tapeElement of initTape) {
        let symbol : InputSymbol = inputSymbols.find(e => e.value === tapeElement);
        if (symbol === null) {
          if (tapeElement !== "U") throw new Error("not input symbol");
          tapeElements.push(new TapeElement(Tape.BLANK));
          continue;
        }
        tapeElements.push(new TapeElement(symbol));
      }


      let turingTape = new Tape(tapeElements);
      let turingHead = new TuringHead(turingTape);

      for(let state of states) {
        stateSet.push(new State(state));
      }
      for(let acceptState of acceptStates) {
        let state : State = stateSet.find(e => e.stateName === acceptState);
        acceptSet.push(state);
      }
      transitionMap = new GoodMap();


      for(let i = 0; i < transitionStates.length; ++i){
        let transitionState : State = stateSet.find(s => s.stateName === transitionStates[i] as string);
        let transitionReadSymbol : TapeSymbol = inputSymbols.filter(is => is.value === transitionRead[i] as string).length > 0 ? 
                                                inputSymbols.find(is => is.value === transitionRead[i] as string) : 
                                                Tape.BLANK;

        let transitionNextState : State = stateSet.find(s => s.stateName === transitionNextStates[i] as string);
        let transitionWriteSymbol : TapeSymbol = inputSymbols.filter(is => is.value === transitionWrite[i] as string).length > 0 ? 
                                                 inputSymbols.find(is => is.value === transitionWrite[i] as string) : 
                                                 Tape.BLANK;
        let direction : Direction = null;

        switch (transitionDirections[i] as string){
          case "R": direction = Direction.RIGHT;
          break;
          case "L": direction = Direction.LEFT;
          break;
          case "N": direction = Direction.NO;
          break;
        }

        if(Array.from(transitionMap.keys()).filter(c => c.state === transitionState && c.tapeSymbol === transitionReadSymbol).length > 0){
          console.log("an entry will be skipped, duplicate (state, symbol) combos are not allowed");continue;
        }

        transitionMap.set(new Config(transitionState, transitionReadSymbol), 
                          new NextConfig(transitionNextState, transitionWriteSymbol, direction));
      }


      this._tm = new TuringMachine(turingHead, stateSet, acceptSet, transitionMap);
      this._tm.subscribe(this);
      this.renderGraph();

      return false; // prevent reload
    };

  }

  public renderGraph () : void {
    cy.elements().remove();

    this._tm.stateSet.forEach(s => {
      cy.add({
          data: { id: '' + s.stateId, name: s.stateName }
          }
      );
    });
    this._tm.stateSet.forEach(s => {
      let keys : Array<Config> = Array.from(this._tm.transitionMap.keys());

      let edges : Map<State, State> = new Map<State, State>();
      keys.filter(k => k.state === s).forEach(c => {
        const edgeId : string = s.stateId + '' + this._tm.transitionMap.get(c).state.stateId;

        if(edges.has(s) && edges.get(s) === this._tm.transitionMap.get(c).state) {
          cy.getElementById(edgeId).data({
            label: 
              cy.getElementById(edgeId).data('label') + '\n' + 
              c.tapeSymbol.value + '|' + this._tm.transitionMap.get(c).tapeSymbol.value + ',' + this._tm.transitionMap.get(c).direction.toString()
          });
        }else {
          cy.add({
              data: {
                  id: edgeId,
                  label: c.tapeSymbol.value + '|' + this._tm.transitionMap.get(c).tapeSymbol.value + ',' + this._tm.transitionMap.get(c).direction.toString(),
                  source: '' + s.stateId,
                  target: '' + this._tm.transitionMap.get(c).state.stateId
              }
          });
          edges.set(s, this.tm.transitionMap.get(c).state);
        }
      });
    });
      
    cy.style([{
      'selector': 'node',
      'css': {
          'content': 'data(name)',
          'text-valign': 'center',
          'color': 'white',
          'text-outline-width': 2,
          'text-outline-color': 'green',
          'background-color': 'green'
      }
      },
      {
      'selector': ':selected',
      'css': {
          'background-color': 'black',
          'line-color': 'black',
          'target-arrow-color': 'black',
          'source-arrow-color': 'black',
          'text-outline-color': 'black'
      }},
      {
      'selector': 'edge',
      'css': {
          'content': 'data(label)',
          'text-rotation': 'autorotate',
          'text-margin-y': -20,
          'target-arrow-color': '#000',
          'curve-style': 'bezier',
          'target-arrow-shape': 'triangle',
          'text-wrap': 'wrap',
      }}
    ]);
    cy.layout({
        name: 'circle',
    }).run();

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

let runner : Runner = new Runner();
console.log(runner.tm);

