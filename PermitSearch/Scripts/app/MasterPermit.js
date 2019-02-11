var PermitSearch;
(function (PermitSearch) {
    "use strict";
    var MasterPermit = /** @class */ (function () {
        function MasterPermit() {
        }
        MasterPermit.Get = function (permit_number) {
            var path = PermitSearch.GetPath();
            Utilities.Get(path + "API/Permit/PrintPermit?permit_number=" + permit_number)
                .then(function (permit) {
                PermitSearch.LoadMasterPermit(permit);
            }, function (e) {
                console.log('error getting master permit ' + permit_number, e);
            });
        };
        return MasterPermit;
    }());
    PermitSearch.MasterPermit = MasterPermit;
})(PermitSearch || (PermitSearch = {}));
//# sourceMappingURL=MasterPermit.js.map