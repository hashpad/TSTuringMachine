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

export class Preset {
  private _id:number;
  private static idInc : number = 0;
  constructor(private _name:string, private _tm:TuringMachine){
    this._id = Preset.idInc++;
  }

  get tm() {return this._tm;}
  get name() {return this._name;}
  get id() {return this._id;}
}


class Runner implements Observer {

  private _tm:TuringMachine;
  private _presets:Array<Preset>;


  public clear_tm() {
    const tape = document.getElementById("tape_ul");
    const isAccepted = document.getElementById("is_accepted");

    tape.innerHTML, isAccepted.innerHTML = "";
  }

  public get tm() {return this._tm};

  private renderPresets() {

    const presets = document.getElementById("presets_select");
    this._presets.forEach(p => {
      const preset = document.createElement("option");
      preset.setAttribute("value", p.id.toString());
      preset.textContent = p.name;
      presets.appendChild(preset);
    });
    presets.addEventListener('change', e => {
      const sel_val = e.target as HTMLSelectElement;
      this.initFormUsingPreset(this.getPresetUsingId(sel_val.value), document.getElementById("data_form") as HTMLFormElement);

    });
  }
  initFormUsingPreset(p: Preset, form:HTMLFormElement) {
    this.clearTransitionEntries();
    form.elements["input_symbols"].value = p.tm.inputSymbolSet;
    form.elements["init_tape"].value = p.tm.head.tape.tapeElements;
    form.elements["states"].value = p.tm.stateSet;
    form.elements["accept_states"].value = p.tm.acceptSet;

    let i = 0;
    for(let [k, v] of p.tm.transitionMap){
      const line = document.getElementsByClassName("transitionEntry")[i];
      (line.querySelector('[name=state]') as HTMLInputElement).value = k.state.toString();
      (line.querySelector('[name=read]') as HTMLInputElement).value = k.tapeSymbol.toString();
      (line.querySelector('[name=write]') as HTMLInputElement).value = v.tapeSymbol.toString();
      (line.querySelector('[name=direction]') as HTMLInputElement).value = v.direction.toString();
      (line.querySelector('[name=next_state]') as HTMLInputElement).value = v.state.toString();
      if(Array.from(p.tm.transitionMap.keys()).length - 1 !== i) {
        this.insertTransitionEntry();
      }
      i++;
    }
    this.initTmUsingForm(form);
  }

  getPresetUsingId(id:string) : Preset {
    return this._presets.find(p => p.id.toString() === id);
  }
  constructor(preset?:Array<Preset>) {
    if(preset) {
      this._presets = preset;
      this.renderPresets();
    }

    this.renderOnce();

    const form = document.querySelector('form')!;

    form.onsubmit = (_) => {
      this.initTmUsingForm(form);

      return false; // prevent reload
    };

  }

  private initTmUsingForm(form:HTMLFormElement) {

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
        if(inputSymbol === "") throw new Error("input symbol cannot be empty");
        try {
          inputSymbols.push(new InputSymbol(inputSymbol));
        }catch (e) {
          console.log(e);
          return false;
        }
      }

      for(let tapeElement of initTape) {
        if(tapeElement === "") {
          tapeElements.push(new TapeElement(Tape.BLANK));
          continue;
        }
        let symbol : InputSymbol = inputSymbols.find(e => e.value === tapeElement);
        if (symbol == null) {
          if (tapeElement !== "#") throw new Error("not input symbol");
          tapeElements.push(new TapeElement(Tape.BLANK));
          continue;
        }
        tapeElements.push(new TapeElement(symbol));
      }


      let turingTape = new Tape(tapeElements);
      let turingHead = new TuringHead(turingTape);

      if(states.length === 1 && states[0] === "") throw new Error("no states are provided");
      for(let state of states) {
        if(state === "") throw new Error("States cannot have empty string as a name");
        stateSet.push(new State(state));
      }

      for(let acceptState of acceptStates) {
        if(acceptState === "" && acceptStates.length !== 1) throw new Error("States cannot have empty string as a name")
        let state : State = stateSet.find(e => e.stateName === acceptState);
        acceptSet.push(state);
      }
      transitionMap = new GoodMap();


      for(let i = 0; i < transitionStates.length; ++i){
        let transitionState : State = stateSet.find(s => s.stateName === transitionStates[i] as string) || null;
        let transitionReadSymbol : TapeSymbol = inputSymbols.find(is => is.value === transitionRead[i] as string) || Tape.BLANK;

        let transitionNextState : State = stateSet.find(s => s.stateName === transitionNextStates[i] as string) || null;
        let transitionWriteSymbol : TapeSymbol = inputSymbols.find(is => is.value === transitionWrite[i] as string) || Tape.BLANK;
        let direction : Direction = null;

        switch (transitionDirections[i] as string){
          case "R": direction = Direction.RIGHT;
          break;
          case "L": direction = Direction.LEFT;
          break;
          case "N": direction = Direction.NO;
          break;
          default: direction = null;
        }

        if(Array.from(transitionMap.keys()).filter(c => c.state === transitionState && c.tapeSymbol === transitionReadSymbol).length > 0){
          console.log("an entry will be skipped, duplicate (state, symbol) combos are not allowed");continue;
        }

        if(!transitionState || !transitionNextState || !direction) throw new Error("Transition map contains element that are not defined above");
        transitionMap.set(new Config(transitionState, transitionReadSymbol), 
                          new NextConfig(transitionNextState, transitionWriteSymbol, direction));
      }


      this._tm = new TuringMachine(turingHead, stateSet, acceptSet, transitionMap);
      this._tm.subscribe(this);
      this.renderGraph();

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
    console.log(this._tm.head.tape.tapeElements);
    if(this._tm.head.tape.tapeElements.length === 1) { // BLANK is a default tape element
      const te_li = document.createElement("li");
      te_li.textContent = Tape.BLANK.value;
      tape.appendChild(te_li);
      te_li.classList.add("head");
    }else {
      for (let te of this._tm.head.tape.tapeElements){
        const te_li = document.createElement("li");
        te_li.textContent = te.symbol.value;

        tape.appendChild(te_li);

        if (this._tm.head.position === te) te_li.classList.add("head");
          
      }
    }


    if(!this._tm.isRunning){
      const isAccepted = document.getElementById("is_accepted");
      let [msg, color] : [string, string] = this._tm.isAccepted ? ["Accepted", "green"] : ["Rejected", "red"];
      isAccepted.innerHTML = `<span style='color: ${color};'>${msg}</span>`;
    }

    const config = document.getElementById("configuration");
    config.innerHTML = 'current state: <span style="color: green;">' + this._tm.currentConfig.state.stateName + '</span>';

  }

  private renderOnce() {

    const onestepButton = document.getElementById("oneStep");
    onestepButton.addEventListener('click', () => {this._tm.oneStep();});

    const transitionEntryButton = document.getElementById("addTransitionEntry");

    transitionEntryButton.addEventListener('click', () => {
      this.insertTransitionEntry();
    })
  }
  private insertTransitionEntry() {
    const transitionEntries = document.getElementsByClassName("transitionEntry");
    const transitionEntryButton = document.getElementById("addTransitionEntry");
    transitionEntryButton.parentNode.insertBefore(transitionEntries[0].cloneNode(true), transitionEntries[transitionEntries.length-1].nextSibling);
  }
  private clearTransitionEntries() {
    const transitionEntries = document.getElementsByClassName("transitionEntry") as HTMLCollectionOf<HTMLDivElement>;
    while(transitionEntries.length > 1) transitionEntries[1].parentNode.removeChild(transitionEntries[1])
  }
}


import {presets} from './presets'

let runner : Runner = new Runner(presets);


