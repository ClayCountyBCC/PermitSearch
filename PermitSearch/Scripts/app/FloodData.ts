namespace PermitSearch
{
  "use strict";

  interface IFloodData
  {
    flood_zone_code: string;
    fema_map: string;
    special_flood_hazard_area: boolean;
    flood_zone_id: string;
    fema_elevation: number;
    conditional_letter_of_map_revision: boolean;
  }

  export class FloodData implements IFloodData
  {
    public flood_zone_code: string = "";
    public fema_map: string = "";
    public special_flood_hazard_area: boolean = false
    public flood_zone_id: string = "";
    public fema_elevation: number = 0;
    public conditional_letter_of_map_revision: boolean = false;

    constructor() { }

  }
}

