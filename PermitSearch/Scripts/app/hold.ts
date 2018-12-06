namespace PermitSearch
{
  "use strict";

  interface IHold
  {
    description: string;
  }

  export class Hold implements IHold
  {
    public description: string;

    constructor() {}
  }
}