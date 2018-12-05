namespace Utilities
{
  "use strict";

  interface IMenuItem
  {
    id: string;
    title: string;
    subTitle: string;
    icon: string;
    label: string;
    selected: boolean;
    autofocusId: string;
  }
  export class MenuItem implements IMenuItem
  {
    public id: string;
    public title: string;
    public subTitle: string;
    public icon: string;
    public label: string;
    public selected: boolean;
    public autofocusId: string;

    constructor() { }
  }


}