/// <reference path="app.ts" />
var PermitSearch;
(function (PermitSearch) {
    "use strict";
    var Permit = /** @class */ (function () {
        function Permit() {
            this.permit_number = 0;
            this.permit_type = "";
            this.days_since_last_passed_inspection = 0;
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
            this.pin_complete = "";
        }
        Permit.QueryRelatedPermits = function (permit_number) {
            var path = PermitSearch.GetPath();
            Utilities.Get(path + "API/Permit/Related?permitnumber=" + permit_number.toString())
                .then(function (permits) {
                console.log("related permits", permits);
                if (permits.length === 0) {
                    PermitSearch.CreateMessageRow("relatedPermitsResultsBody", 4, "No documents were found for this permit.");
                }
                else {
                    PermitSearch.CreateResultsTable(permits, "relatedPermitsResultsHead", "relatedPermitsResultsBody", true);
                    //Document.CreateDocumentsTable(permits);
                    //Document.PopulateDocumentTypeFilter(permits);
                }
            }, function (e) {
                PermitSearch.CreateMessageRow("relatedPermitsResultsBody", 4, "There was an issue retrieving the related permits for this permit.  Please refresh this page to try again.");
                console.log('error getting permits', e);
            });
        };
        return Permit;
    }());
    PermitSearch.Permit = Permit;
})(PermitSearch || (PermitSearch = {}));
//# sourceMappingURL=permit.js.map