import cytoscape from 'cytoscape';
import {State} from './tm'

export class Node {
  constructor(private _state:State) {}
  public get state() {return this._state;}
}
export class Vertex {
  constructor(private _id:string, private _content:string, private _from:Node, private _to:Node) {}
  public get id() {return this._id;}
  public get content() {return this._content;}
  public set content(str:string) {this._content+=('\n' + str);}

  public get from() {return this._from;}
  public get to() {return this._to;}

  public has(node:Node) {return node === this._from || node === this._to;}
  public hasFrom(node:Node) {return node === this._from;}
  public hasTo(node:Node) {return node === this._to;}
}

export class Graph {
  private _cy : cytoscape.Core;
  
  constructor(private _nodes:Array<Node>, private _vertices:Array<Vertex>) {
    
  }

  public getNode(state:State) {return this._nodes.find(n => n.state === state);}

  public render(html_id:string) {
    this.initCytoscape(html_id);

    this._cy.elements().remove();

    this._nodes.forEach(n => {
      this._cy.add({
          data: { id: '' + n.state.stateId, name: n.state.stateName }
          }
      );
    });
    this._nodes.forEach(n => {

      this._vertices.filter(v => v.from === n).forEach(v => {

          this._cy.add({
              data: {
                  id: v.id,
                  label: v.content,
                  source: v.from.state.stateId,
                  target: v.to.state.stateId
              }
          });
        });
      });
      
    this._cy.style([{
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
    this._cy.layout({
        name: 'circle',
    }).run();
  }

  private initCytoscape(html_id:string) {
    this._cy = cytoscape({
      container: document.getElementById(html_id),
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
  }
}
