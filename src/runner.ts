import {InputSymbol, TapeElement, Tape, TuringHead, State, GoodMap, TuringMachine, Config, NextConfig, TapeSymbol, Direction} from './tm'

import {Observer} from './observer'

import {Preset} from './presets'

class Runner implements Observer {

  private _tm : TuringMachine;
  private _presets : Array<Preset>;

  constructor(preset?:Array<Preset>) {
    // if preset is passed render the preset select field
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

  // add as much options as the number of presets, and fill out the form corresponding to the selected preset (on change)
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
      // initializes the form using the chosen preset
      this.initFormUsingPreset(this.getPresetUsingId(sel_val.value), document.getElementById("data_form") as HTMLFormElement);
    });
  }

  private initFormUsingPreset(p: Preset, form:HTMLFormElement) {
    // clear old form content (transitionMap)
    this.clearTransitionEntries();
    // fill out the upper fields (fields that always occur once)
    form.elements["input_symbols"].value = p.tm.inputSymbolSet;
    form.elements["init_tape"].value = p.tm.head.tape.tapeElements;
    form.elements["states"].value = p.tm.stateSet;
    form.elements["accept_states"].value = p.tm.acceptSet;

    // fill out the trasitionMaps => append transitionEntries as much as needed
    let i = 0;
    for(let [k, v] of p.tm.transitionMap){
      const line = document.getElementsByClassName("transitionEntry")[i];
      (line.querySelector('[name=state]') as HTMLInputElement).value = k.state.toString();
      (line.querySelector('[name=read]') as HTMLInputElement).value = k.tapeSymbol.toString();
      (line.querySelector('[name=write]') as HTMLInputElement).value = v.tapeSymbol.toString();
      (line.querySelector('[name=direction]') as HTMLInputElement).value = v.direction.toString();
      (line.querySelector('[name=next_state]') as HTMLInputElement).value = v.state.toString();

      // if last entry dont add a new transitionEntry
      if(Array.from(p.tm.transitionMap.keys()).length - 1 !== i) {
        this.insertTransitionEntry();
      }
      i++;
    }
    // start the tm using the new filled form (prevent old tm from being displayed)
    this.initTmUsingForm(form);
  }

  // remove all transitionMap entry/line (at the end) except the first one
  private clearTransitionEntries() {
    const transitionEntries = document.getElementsByClassName("transitionEntry") as HTMLCollectionOf<HTMLDivElement>;
    while(transitionEntries.length > 1) transitionEntries[1].parentNode.removeChild(transitionEntries[1])
  }

  // add transitionMap entry/line (at the end)
  private insertTransitionEntry() {
    const transitionEntries = document.getElementsByClassName("transitionEntry");
    const transitionEntryButton = document.getElementById("addTransitionEntry");
    transitionEntryButton.parentNode.insertBefore(transitionEntries[0].cloneNode(true), transitionEntries[transitionEntries.length-1].nextSibling);
  }

  // takes  in a form (HTMLFormElement) and creates the corresponding TuringMachine, also subscribes the tm to this observer instance (Runner)
  private initTmUsingForm(form:HTMLFormElement) {

    // clears the tape
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
      // formInputSymbols has at least one element due to the fast that str.split(",") always returns an array with at least one element 
      // e.g str = "" => str.split(",") = [""]
      if(inputSymbol === "") throw new Error("input symbol cannot be empty");
      try {
        inputSymbols.push(new InputSymbol(inputSymbol));
      }catch (e) {
        console.log(e);
        return false;
      }
    }

    for(let tapeElement of initTape) {
      // if a tape element is empty => assign it the Tape.BLANK object
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

    // if str.split.length === 1 and str[0] === "", that mean that the field was left completely empty
    if(states.length === 1 && states[0] === "") throw new Error("no states are provided");
    for(let state of states) {
      if(state === "") throw new Error("States cannot have empty string as a name");
      stateSet.push(new State(state));
    }

    for(let acceptState of acceptStates) {
      // in contrast to states, acceptStates can be left empty but if the length !=== 1 (there are entries) those entries shouldn't be the empty string
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

    // rendering the graph should be done once, and the perfect time is here, when creating the tm
    this._tm.toGraph().render("cy");
  }

  // clear the tm (only the tape and the results if there is any); graphs won't be cleared they will rather be replaced if there is a new tm
  private clear_tm() {
    const tape = document.getElementById("tape_ul");
    const isAccepted = document.getElementById("is_accepted");

    tape.innerHTML, isAccepted.innerHTML = "";
  }


  // render the graph (should be only called once at the creation of the tm)

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


  public get tm() {return this._tm;}
  public getPresetUsingId(id:string) : Preset { return this._presets.find(p => p.id.toString() === id);}
}


import {presets} from './presets'

let runner : Runner = new Runner(presets);


