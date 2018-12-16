/// <reference path="../utilities/menuitem.ts" />
/// <reference path="../utilities/utilities.ts" />
/// <reference path="locationhash.ts" />
/// <reference path="permit.ts" />
var PermitSearch;
(function (PermitSearch) {
    "use strict";
    PermitSearch.permit_count = 0;
    PermitSearch.search_results = [];
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
        if (location.hash.length > 1) {
            HandleHash();
        }
    }
    PermitSearch.Start = Start;
    // Need to 
    function Search() {
        console.log('Searching');
        var newHash = new PermitSearch.LocationHash("");
        console.log('Search Hash', newHash);
        location.hash = newHash.ToHash();
    }
    PermitSearch.Search = Search;
    function HandleHash() {
        var originalHash = location.hash;
        var currentHash = new PermitSearch.LocationHash(originalHash.substring(1));
        var path = "/";
        var i = window.location.pathname.toLowerCase().indexOf("/permitsearch");
        if (i == 0) {
            path = "/permitsearch/";
        }
        var newHash = currentHash.ToHash();
        if (newHash.length > 0 && currentHash.ReadyToSearch()) {
            var searchHash = "?" + newHash.substring(1);
            Utilities.Get(path + "API/Search/Permit" + searchHash)
                .then(function (permits) {
                console.log("permits", permits);
                PermitSearch.search_results = permits;
                CreateResultsTable(PermitSearch.search_results);
            }, function (e) {
                console.log('error getting permits', e);
            });
            Utilities.Get(path + "API/Search/Count" + searchHash)
                .then(function (permitCount) {
                PermitSearch.permit_count = permitCount;
                // update pagination here
                console.log("count", permitCount);
            }, function (e) {
                console.log('error getting permit count', e);
            });
        }
    }
    PermitSearch.HandleHash = HandleHash;
    function CreateResultsTable(permits) {
        // The table and headers will already exist, we'll just
        // clear and populate the table body with table rows.
        var df = document.createDocumentFragment();
        for (var _i = 0, permits_1 = permits; _i < permits_1.length; _i++) {
            var p = permits_1[_i];
            df.appendChild(CreateResultsRow(p));
        }
        var tbody = document.getElementById("resultsBody");
        Utilities.Clear_Element(tbody);
        tbody.appendChild(df);
    }
    function CreateResultsRow(p) {
        var tr = document.createElement("tr");
        tr.appendChild(CreateResultsCell(p.permit_number.toString().padStart(8, "0")));
        tr.appendChild(CreateResultsCell(p.is_closed ? "Yes" : "No"));
        tr.appendChild(CreateResultsCell(Utilities.Format_Date(p.issue_date)));
        tr.appendChild(CreateResultsCell(p.address, "has-text-left"));
        tr.appendChild(CreateResultsCell(Utilities.Format_Amount(p.total_charges - p.paid_charges), "has-text-right"));
        tr.appendChild(CreateResultsCell(Utilities.Format_Amount(p.total_charges), "has-text-right"));
        tr.appendChild(CreateResultsCell(p.document_count.toString()));
        tr.appendChild(CreateResultsCell(p.passed_final_inspection ? "Completed" : "View"));
        return tr;
    }
    function CreateResultsCell(value, className) {
        if (className === void 0) { className = ""; }
        var td = document.createElement("td");
        if (className.length > 0)
            td.classList.add(className);
        td.appendChild(document.createTextNode(value));
        return td;
    }
})(PermitSearch || (PermitSearch = {}));
//# sourceMappingURL=app.js.map