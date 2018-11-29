namespace PermitSearch
{

  //let target = document.getElementById("test");

  //export function MenuItem

  //import { html } from 'lit-html'

  //const temp = (firstname, lastname) => html`<div>Heyyyyyyyyyyyyyyy ${firstname + ' ' + lastname}</div>`;

  interface IMenuItem
  {
    id: string;
    title: string;
    subTitle: string;
    icon: string;
    label: string;
    selected: boolean;
  }
  export class MenuItem implements IMenuItem
  {
    public id: string;
    public title: string;
    public subTitle: string;
    public icon: string;
    public label: string;
    public selected: boolean;

    constructor() { }
  }


}