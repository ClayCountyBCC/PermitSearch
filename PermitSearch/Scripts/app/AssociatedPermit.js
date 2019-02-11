var PermitSearch;
(function (PermitSearch) {
    "use strict";
    var AssociatedPermit = /** @class */ (function () {
        function AssociatedPermit() {
        }
        AssociatedPermit.Get = function (permit_number) {
            var path = PermitSearch.GetPath();
            Utilities.Get(path + "API/Permit/PrintPermit?permit_number=" + permit_number)
                .then(function (permit) {
                PermitSearch.LoadAssocPermit(permit);
            }, function (e) {
                console.log('error getting assoc permit ' + permit_number, e);
            });
        };
        return AssociatedPermit;
    }());
    PermitSearch.AssociatedPermit = AssociatedPermit;
})(PermitSearch || (PermitSearch = {}));
//public string general_contractor_license_number { get; set; } = "";
//public string general_contractor_name { get; set; } = "";
//public DateTime void_date { get; set; } = DateTime.MinValue;
//public List < string > notes => permit.GetPermitNotes(permit_number);
//public List < hold > outstanding_holds
//public List < charge > permit_fees => charge.GetCharges(int.Parse(permit_number));
//# sourceMappingURL=AssociatedPermit.js.map