/// <reference path="menuitem.ts" />
/// <reference path="utilities.ts" />
var PermitSearch;
(function (PermitSearch) {
    "use strict";
    PermitSearch.Menus = [
        {
            id: "nav-permitSearchOptions",
            title: "Search by Permit Number",
            subTitle: "Searching by Permit number will show you all of the information for that specific permit.",
            icon: "fas fa-file",
            label: "Permit",
            selected: true,
            autofocusId: "permitSearch"
        },
        {
            id: "nav-addressSearchOptions",
            title: "Search by Street Address",
            subTitle: "Search for permits by any combination of Street Number, Street Name, and City.  Partial street names are allowed. ",
            icon: "fas fa-home",
            label: "Address",
            selected: false,
            autofocusId: "streetNumberSearch"
        },
        {
            id: "nav-contractorSearchOptions",
            title: "Search by Contractor",
            subTitle: "Search for permits by Contractor Name, Company Name, or Contractor ID.  Enter any combination of Name, Number, or Company Name.",
            icon: "fas fa-users",
            label: "Contractor",
            selected: false,
            autofocusId: "contractorNumberSearch"
        },
        {
            id: "nav-ownerSearchOptions",
            title: "Search by Owner Name",
            subTitle: "Search for permits by Owner Name.  Partial owner names are permitted.",
            icon: "fas fa-user",
            label: "Owner",
            selected: false,
            autofocusId: "ownerSearch"
        },
        {
            id: "nav-parcelSearchOptions",
            title: "Search by Parcel Number",
            subTitle: "Search for permits by parcel number.",
            icon: "fas fa-map",
            label: "Parcel",
            selected: false,
            autofocusId: "parcelSearch"
        },
    ];
    function Start() {
        Utilities.Build_Menu_Elements("menuTabs", PermitSearch.Menus);
        window.onhashchange = HandleHash;
    }
    PermitSearch.Start = Start;
    function HandleHash() {
        //let hash = location.hash;
        //let currentHash = new LocationHash(location.hash.substring(1));
        //if (currentHash.Permit.length > 0)
        //{
        //  Utilities.Update_Menu(UI.Menus[1]);
        //  HandleSearch('permitSearchButton', 'permitSearch', currentHash.Permit);
        //  return;
        //}
        //if (currentHash.CashierId.length > 0)
        //{
        //  Utilities.Update_Menu(UI.Menus[5]);
        //  HandleSearch('receiptSearchButton', 'receiptSearch', currentHash.CashierId);
        //  return;
        //}
        //if (currentHash.ContractorId.length > 0)
        //{
        //  Utilities.Update_Menu(UI.Menus[2]);
        //  HandleSearch('contractorSearchButton', 'contractorSearch', currentHash.ContractorId);
        //  return;
        //}
        //if (currentHash.ApplicationNumber.length > 0)
        //{
        //  Utilities.Update_Menu(UI.Menus[3]);
        //  HandleSearch('applicationSearchButton', 'applicationSearch', currentHash.ApplicationNumber);
        //  return;
        //}
    }
    PermitSearch.HandleHash = HandleHash;
})(PermitSearch || (PermitSearch = {}));
//# sourceMappingURL=app.js.map