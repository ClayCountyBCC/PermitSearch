/// <reference path="app.ts" />
var PermitSearch;
(function (PermitSearch) {
    "use strict";
    class Charge {
        constructor() {
            this.item_id = -1;
            this.permit_number = -1;
            this.charge_description = "";
            this.narrative = "";
            this.amount = 0;
            this.cashier_id = "";
        }
    }
    PermitSearch.Charge = Charge;
})(PermitSearch || (PermitSearch = {}));
//# sourceMappingURL=charge.js.map