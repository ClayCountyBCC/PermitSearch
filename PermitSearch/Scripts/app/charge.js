/// <reference path="app.ts" />
var PermitSearch;
(function (PermitSearch) {
    "use strict";
    var Charge = /** @class */ (function () {
        function Charge() {
            this.item_id = -1;
            this.permit_number = -1;
            this.charge_description = "";
            this.narrative = "";
            this.amount = 0;
            this.cashier_id = "";
        }
        Charge.QueryCharges = function (permit_number) {
            Charge.ResetCharges();
            var path = PermitSearch.GetPath();
            Utilities.Get(path + "API/Permit/Charges?permitnumber=" + permit_number.toString())
                .then(function (charges) {
                console.log("charges", charges);
                PermitSearch.permit_charges = charges;
                if (charges.length === 0) {
                    PermitSearch.CreateMessageRow(Charge.charges_container, 4, "No charges were found for this permit.");
                }
                else {
                    Charge.CreateTable(charges);
                }
            }, function (e) {
                console.log('error getting charges', e);
            });
        };
        Charge.CreateTable = function (charges) {
            var df = document.createDocumentFragment();
            for (var _i = 0, charges_1 = charges; _i < charges_1.length; _i++) {
                var c = charges_1[_i];
                df.appendChild(Charge.CreateRow(c));
            }
            var tbody = document.getElementById(Charge.charges_container);
            Utilities.Clear_Element(tbody);
            tbody.appendChild(df);
        };
        Charge.ResetCharges = function () {
            PermitSearch.permit_charges = [];
            PermitSearch.CreateMessageRow(Charge.charges_container, 4, "Loading Charges...");
        };
        Charge.CreateRow = function (c) {
            var tr = document.createElement("tr");
            tr.appendChild(Charge.CreateCell(c.charge_description));
            var narrative = c.narrative !== c.charge_description ? c.narrative : "";
            tr.appendChild(Charge.CreateCell(narrative));
            tr.appendChild(Charge.CreateCell(Utilities.Format_Amount(c.amount), "has-text-right"));
            // need to display the following:
            // If the charge is paid, show Paid with a link to the receipt
            // If unpaid, Unpaid, and a link to claypay for that permit
            if (c.cashier_id.length === 0) {
                var permitLink = "https://public.claycountygov.com/claypay/#permit=" + c.permit_number.toString();
                tr.appendChild(Charge.CreateCellLink("Pay Now", "has-text-centered", permitLink));
            }
            else {
                var receiptLink = "https://public.claycountygov.com/claypay/#cashierid=" + c.cashier_id;
                tr.appendChild(Charge.CreateCellLink("View Receipt", "has-text-centered", receiptLink));
            }
            //tr.appendChild(Charge.CreateCell("View", "has-text-centered"));
            return tr;
        };
        Charge.CreateCell = function (value, className) {
            if (className === void 0) { className = ""; }
            var td = document.createElement("td");
            if (className.length > 0)
                td.classList.add(className);
            td.appendChild(document.createTextNode(value));
            return td;
        };
        Charge.CreateCellLink = function (value, className, href) {
            if (className === void 0) { className = ""; }
            if (href === void 0) { href = ""; }
            var td = document.createElement("td");
            if (className.length > 0)
                td.classList.add(className);
            var link = document.createElement("a");
            link.classList.add("has-text-link");
            link.target = "_blank";
            link.rel = "noopener";
            link.href = href;
            link.appendChild(document.createTextNode(value));
            link.setAttribute("aria-label", "View on Claypay");
            td.appendChild(link);
            return td;
        };
        Charge.charges_container = "chargeContainer";
        return Charge;
    }());
    PermitSearch.Charge = Charge;
})(PermitSearch || (PermitSearch = {}));
//# sourceMappingURL=charge.js.map