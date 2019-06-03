/// <reference path="app.ts" />
var PermitSearch;
(function (PermitSearch) {
    "use strict";
    var PlanReview = /** @class */ (function () {
        function PlanReview() {
        }
        PlanReview.QueryHolds = function (permit_number) {
            PermitSearch.Hold.ResetHolds();
            var path = PermitSearch.GetPath();
            Utilities.Get(path + "API/Permit/Holds?permitnumber=" + permit_number.toString())
                .then(function (holds) {
                console.log("holds", holds);
                PermitSearch.permit_holds = holds;
                if (holds.length === 0) {
                    PermitSearch.CreateMessageRow(PermitSearch.Hold.holds_container, 1, "No Holds were found for this permit.");
                }
                else {
                    PermitSearch.Hold.CreateDocumentsTable(holds, PermitSearch.Hold.holds_container);
                }
            }, function (e) {
                PermitSearch.CreateMessageRow(PermitSearch.Hold.holds_container, 1, "There was an issue retrieving the holds for this permit.  Please try again.");
                console.log('error getting holds', e);
            });
        };
        PlanReview.ResetPlanReview = function () {
            PermitSearch.permit_holds = [];
            PermitSearch.CreateMessageRow(PermitSearch.Hold.holds_container, 1, "Loading Holds...");
        };
        PlanReview.CreateDocumentsTable = function (holds, container) {
            var df = document.createDocumentFragment();
            for (var _i = 0, holds_1 = holds; _i < holds_1.length; _i++) {
                var h = holds_1[_i];
                df.appendChild(PermitSearch.Hold.CreateRow(h));
            }
            var tbody = document.getElementById(container);
            Utilities.Clear_Element(tbody);
            tbody.appendChild(df);
        };
        PlanReview.CreateRow = function (h) {
            var tr = document.createElement("tr");
            tr.appendChild(PermitSearch.Hold.CreateCell(h.description));
            return tr;
        };
        PlanReview.CreateCell = function (value, className) {
            if (className === void 0) { className = ""; }
            var td = document.createElement("td");
            if (className.length > 0)
                td.classList.add(className);
            td.appendChild(document.createTextNode(value));
            return td;
        };
        PlanReview.holds_container = "plansReviewContainer";
        return PlanReview;
    }());
    PermitSearch.PlanReview = PlanReview;
})(PermitSearch || (PermitSearch = {}));
//# sourceMappingURL=PlanReview.js.map