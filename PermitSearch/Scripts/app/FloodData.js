var PermitSearch;
(function (PermitSearch) {
    "use strict";
    var FloodData = /** @class */ (function () {
        function FloodData() {
            this.flood_zone_code = "";
            this.fema_map = "";
            this.special_flood_hazard_area = false;
            this.flood_zone_id = "";
            this.fema_elevation = 0;
            this.conditional_letter_of_map_revision = false;
        }
        return FloodData;
    }());
    PermitSearch.FloodData = FloodData;
})(PermitSearch || (PermitSearch = {}));
//# sourceMappingURL=FloodData.js.map