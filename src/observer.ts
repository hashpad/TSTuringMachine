export interface Observer {
  render () : void;
}

export class Subject {
  private _observers:Array<Observer>;

  constructor() {
    this._observers = new Array<Observer>();
  }
  
  public subscribe (obs:Observer) { this._observers.push(obs); this.notifiy();}
  public notifiy () {
    this._observers.forEach(obs => obs.render());
  }
}
