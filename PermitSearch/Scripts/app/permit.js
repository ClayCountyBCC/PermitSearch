/// <reference path="app.ts" />
var PermitSearch;
(function (PermitSearch) {
    "use strict";
    class Permit {
        constructor() {
            this.permit_number = 0;
            this.address = "";
            this.issue_date = new Date();
            this.co_date = new Date();
            this.is_closed = false;
            this.passed_final_inspection = false;
            this.outstanding_hold_count = 0;
            this.total_charges = 0;
            this.paid_charges = 0;
            this.document_count = 0;
            this.has_related_permits = false;
            this.contractor_number = "";
            this.contractor_name = "";
            this.company_name = "";
            this.owner_name = "";
            this.parcel_number = "";
        }
    }
    PermitSearch.Permit = Permit;
})(PermitSearch || (PermitSearch = {}));
//# sourceMappingURL=permit.js.map