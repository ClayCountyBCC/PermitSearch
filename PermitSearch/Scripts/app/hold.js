/// <reference path="app.ts" />
var PermitSearch;
(function (PermitSearch) {
    "use strict";
    var Hold = /** @class */ (function () {
        function Hold() {
        }
        Hold.QueryHolds = function (permit_number) {
            var path = PermitSearch.GetPath();
            Utilities.Get(path + "API/Permit/Holds?permitnumber=" + permit_number.toString())
                .then(function (holds) {
                console.log("holds", holds);
                PermitSearch.permit_holds = holds;
                if (holds.length === 0) {
                    PermitSearch.CreateMessageRow(Hold.holds_container, 1, "No Holds were found for this permit.");
                }
                else {
                    Hold.CreateDocumentsTable(holds, Hold.holds_container);
                }
            }, function (e) {
                PermitSearch.CreateMessageRow(Hold.holds_container, 4, "There was an issue retrieving the holds for this permit.  Please try again.");
                console.log('error getting holds', e);
            });
        };
        Hold.ResetHolds = function () {
            PermitSearch.permit_holds = [];
            PermitSearch.CreateMessageRow(Hold.holds_container, 4, "Loading Holds...");
        };
        Hold.CreateDocumentsTable = function (holds, container) {
            var df = document.createDocumentFragment();
            for (var _i = 0, holds_1 = holds; _i < holds_1.length; _i++) {
                var h = holds_1[_i];
                df.appendChild(Hold.CreateRow(h));
            }
            var tbody = document.getElementById(container);
            Utilities.Clear_Element(tbody);
            tbody.appendChild(df);
        };
        Hold.CreateRow = function (h) {
            var tr = document.createElement("tr");
            tr.appendChild(Hold.CreateCell(h.description));
            return tr;
        };
        Hold.CreateCell = function (value, className) {
            if (className === void 0) { className = ""; }
            var td = document.createElement("td");
            if (className.length > 0)
                td.classList.add(className);
            td.appendChild(document.createTextNode(value));
            return td;
        };
        Hold.holds_container = "holdContainer";
        return Hold;
    }());
    PermitSearch.Hold = Hold;
})(PermitSearch || (PermitSearch = {}));
//# sourceMappingURL=hold.js.map