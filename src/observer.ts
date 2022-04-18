export interface Observer {
  render () : void;
}

export class Subject {
  private _observers:Array<Observer>;

  constructor() {
    this._observers = new Array<Observer>();
  }
  
  subscribe (obs:Observer) { this._observers.push(obs); this.notifiy();}
  notifiy () {
    this._observers.forEach(obs => obs.render());
  }
}
