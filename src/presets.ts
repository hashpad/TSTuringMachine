import {InputSymbol, TapeElement, Tape, TuringHead, State, GoodMap, TuringMachine, Config, NextConfig, TapeSymbol, Direction} from './tm'
import {Preset} from './runner'

export let presets: Array<Preset> = new Array<Preset>();


{
  // accept 0^n1^n
  //input symbols
  const zero:InputSymbol = new InputSymbol("0");
  const one:InputSymbol = new InputSymbol("1");
  const inputSymbols : Array<InputSymbol> = [zero, one];
  const initialTapeContent : Array<TapeElement> = [new TapeElement(zero), new TapeElement(zero), new TapeElement(one), new TapeElement(one)];

  const s:State = new State("s");
  const q1:State = new State("q1");
  const q2:State = new State("q2");
  const q3:State = new State("q3");
  const q4:State = new State("q4");
  const q5:State = new State("q5");

  const states : Array<State> = [s, q1, q2, q3, q4, q5];
  const acceptingStates : Array<State> = [q5];

  const transitionMap : GoodMap = new GoodMap(
  );

  transitionMap.set(new Config(s, zero), new NextConfig(q1, Tape.BLANK, Direction.RIGHT));
  transitionMap.set(new Config(q1, zero), new NextConfig(q1, zero, Direction.RIGHT));
  transitionMap.set(new Config(q1, one), new NextConfig(q1, one, Direction.RIGHT));
  transitionMap.set(new Config(q1, Tape.BLANK), new NextConfig(q2, Tape.BLANK, Direction.LEFT));
  transitionMap.set(new Config(q2, one), new NextConfig(q3, Tape.BLANK, Direction.LEFT));
  transitionMap.set(new Config(q3, one), new NextConfig(q4, one, Direction.LEFT));
  transitionMap.set(new Config(q3, Tape.BLANK), new NextConfig(q5, Tape.BLANK, Direction.NO));
  transitionMap.set(new Config(q4, one), new NextConfig(q4, one, Direction.LEFT));
  transitionMap.set(new Config(q4, zero), new NextConfig(q4, zero, Direction.LEFT));
  transitionMap.set(new Config(q4, Tape.BLANK), new NextConfig(s, Tape.BLANK, Direction.RIGHT));

  const th : TuringHead = new TuringHead(new Tape(initialTapeContent));
  const tm : TuringMachine = new TuringMachine(th, states, acceptingStates, transitionMap, inputSymbols, s);
  const preset : Preset = new Preset("0^n1^n", tm);

  presets.push(preset);
}



{
  // add one
  //input symbols
  const zero:InputSymbol = new InputSymbol("0");
  const one:InputSymbol = new InputSymbol("1");
  const inputSymbols : Array<InputSymbol> = [zero, one];
  const initialTapeContent : Array<TapeElement> = [new TapeElement(one), new TapeElement(one)];

  const s:State = new State("s");
  const q1:State = new State("q1");
  const q2:State = new State("q2");
  const q3:State = new State("q3");
  const q4:State = new State("q4");
  const q5:State = new State("q5");
  const f:State = new State("f");

  const states : Array<State> = [s, q1, q2, q3, q4, q5, f];
  const acceptingStates : Array<State> = [f];

  const transitionMap : GoodMap = new GoodMap(
  );

  transitionMap.set(new Config(s, zero), new NextConfig(q4, zero, Direction.RIGHT));
  transitionMap.set(new Config(s, one), new NextConfig(q1, one, Direction.RIGHT));
  transitionMap.set(new Config(q1, zero), new NextConfig(q1, zero, Direction.RIGHT));
  transitionMap.set(new Config(q1, one), new NextConfig(q1, one, Direction.RIGHT));
  transitionMap.set(new Config(q1, Tape.BLANK), new NextConfig(q2, Tape.BLANK, Direction.LEFT));
  transitionMap.set(new Config(q2, one), new NextConfig(q2, zero, Direction.LEFT));
  transitionMap.set(new Config(q2, zero), new NextConfig(q3, one, Direction.LEFT));
  transitionMap.set(new Config(q2, Tape.BLANK), new NextConfig(f, one, Direction.LEFT));
  transitionMap.set(new Config(q3, zero), new NextConfig(q3, zero, Direction.LEFT));
  transitionMap.set(new Config(q3, one), new NextConfig(q3, one, Direction.LEFT));
  transitionMap.set(new Config(q3, Tape.BLANK), new NextConfig(f, Tape.BLANK, Direction.LEFT));
  transitionMap.set(new Config(q4, Tape.BLANK), new NextConfig(q5, Tape.BLANK, Direction.LEFT));
  transitionMap.set(new Config(q5, zero), new NextConfig(f, one, Direction.LEFT));

  const th : TuringHead = new TuringHead(new Tape(initialTapeContent));
  const tm : TuringMachine = new TuringMachine(th, states, acceptingStates, transitionMap, inputSymbols, s);
  const preset : Preset = new Preset("add one", tm);
  presets.push(preset);
}

