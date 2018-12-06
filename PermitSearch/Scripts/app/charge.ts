/// <reference path="app.ts" />

namespace PermitSearch
{
  "use strict";

  interface ICharge
  {
    item_id: number;
    permit_number: number;
    charge_description: string;
    narrative: string;
    amount: number;
    cashier_id: string;
  }

  export class Charge implements ICharge
  {
    public item_id: number = -1;
    public permit_number: number = -1;
    public charge_description: string = "";
    public narrative: string = "";
    public amount: number = 0;
    public cashier_id: string = "";

    constructor() { }
  }
}