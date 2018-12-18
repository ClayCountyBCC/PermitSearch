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
                if (PermitSearch.search_results.length > 0) {
                    Utilities.Show("searchResults");
                    CreateResultsTable(PermitSearch.search_results);
                }
                else {
                    Utilities.Hide("searchResults");
                }
            }, function (e) {
                console.log('error getting permits', e);
            });
            Utilities.Get(path + "API/Search/Count" + searchHash)
                .then(function (permitCount) {
                PermitSearch.permit_count = permitCount;
                HandlePagination(PermitSearch.permit_count, parseInt(currentHash.page), 20, currentHash);
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
        //tr.appendChild(CreateResultsCell(Utilities.Format_Amount(p.total_charges), "has-text-right"));
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
    function HandlePagination(totalCount, currentPage, pageSize, currentHash) {
        // we'll need to enable/disable the previous / next buttons based on 
        // if we're on the first/last page
        var totalPages = Math.ceil(totalCount / pageSize);
        var previousPage = document.getElementById("resultsPreviousPage");
        var nextPage = document.getElementById("resultsNextPage");
        if (currentPage === 1) {
            previousPage.setAttribute("disabled", "");
        }
        else {
            previousPage.removeAttribute("disabled");
        }
        if (currentPage === totalPages) {
            nextPage.setAttribute("disabled", "");
        }
        else {
            nextPage.removeAttribute("disabled");
        }
        var pageList = document.getElementById("resultsPaginationList");
        Utilities.Clear_Element(pageList);
        pageList.appendChild(CreatePaginationLinks(totalPages, currentPage, currentHash));
    }
    function CreatePaginationLinks(totalPages, currentPage, currentHash) {
        // Scenarios
        // if the number of pages is 7 or less
        //    create a link for every page
        //    nothing else to worry about
        // if the number of pages is > 7 
        //    if the current page is 3 or less or total pages - 3 or more
        //    show pages 1 through 3 an ellipsis, and then last page - 3 to last page
        // Otherwise
        //    show page 1 then an ellipsis then currentpage - 1 through current page + 1 then last page
        var df = document.createDocumentFragment();
        if (currentPage < 1)
            currentPage = 1;
        if (currentPage > totalPages)
            currentPage = totalPages;
        if (totalPages < 8) {
            // add a link to every page
            for (var i = 1; i <= totalPages; i++) {
                df.appendChild(CreatePaginationLink(i, i === currentPage, currentHash));
            }
            return df;
        }
        if (currentPage < 4 || currentPage > totalPages - 4) {
            // add links to the first 3 pages and last 3 pages
            for (var i = 1; i <= 3; i++) {
                df.appendChild(CreatePaginationLink(i, i === currentPage, currentHash));
            }
            df.appendChild(CreatePaginationEllipsis());
            for (var i = totalPages - 2; i <= totalPages; i++) {
                df.appendChild(CreatePaginationLink(i, i === currentPage, currentHash));
            }
            return df;
        }
        // add links to the first page, currentpage -1 through currentpage + 1, and last page
        df.appendChild(CreatePaginationLink(1, false, currentHash));
        df.appendChild(CreatePaginationEllipsis());
        for (var i = currentPage - 1; i <= currentPage + 1; i++) {
            df.appendChild(CreatePaginationLink(i, i === currentPage, currentHash));
        }
        df.appendChild(CreatePaginationEllipsis());
        df.appendChild(CreatePaginationLink(totalPages, false, currentHash));
        return df;
    }
    function CreatePaginationLink(page, isSelected, currentHash) {
        // scroll back up to the top when a page is clicked
        currentHash.page = page.toString();
        var li = document.createElement("li");
        var a = document.createElement("a");
        a.classList.add("pagination-link");
        a.setAttribute("aria-label", "Goto page " + currentHash.page);
        a.href = currentHash.ToHash();
        if (isSelected) {
            a.classList.add("is-current");
            a.setAttribute("aria-current", "page");
        }
        a.appendChild(document.createTextNode(currentHash.page));
        li.appendChild(a);
        return li;
    }
    function CreatePaginationEllipsis() {
        var li = document.createElement("li");
        var span = document.createElement("span");
        span.classList.add("pagination-ellipsis");
        span.innerHTML = "&hellip;";
        li.appendChild(span);
        return li;
    }
})(PermitSearch || (PermitSearch = {}));
//# sourceMappingURL=app.js.map