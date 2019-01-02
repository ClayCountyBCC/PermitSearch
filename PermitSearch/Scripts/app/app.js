/// <reference path="../utilities/menuitem.ts" />
/// <reference path="../utilities/utilities.ts" />
/// <reference path="locationhash.ts" />
/// <reference path="permit.ts" />
var PermitSearch;
(function (PermitSearch) {
    "use strict";
    PermitSearch.permit_count = 0;
    PermitSearch.search_results = [];
    PermitSearch.permit_documents = [];
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
            subTitle: "Search for permits by any combination of Street Number and Street Name.  Partial street names are allowed. ",
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
            HandleHash(null);
        }
    }
    PermitSearch.Start = Start;
    function Search() {
        Toggle_Loading_Search_Buttons(true);
        var newHash = new PermitSearch.LocationHash("");
        location.hash = newHash.ToHash();
    }
    PermitSearch.Search = Search;
    function Toggle_Loading_Search_Buttons(disabled) {
        var sections = document.querySelectorAll("#views > section button");
        if (sections.length > 0) {
            for (var i = 0; i < sections.length; i++) {
                var item = sections.item(i);
                Utilities.Toggle_Loading_Button(item, disabled);
            }
        }
    }
    function HandleHash(event) {
        var currentHash = new PermitSearch.LocationHash(location.hash.substring(1));
        var newHash = new PermitSearch.LocationHash(location.hash.substring(1));
        var oldHash = null;
        if (event !== null) {
            var hash = event.oldURL.split("#");
            if (hash.length === 2) {
                oldHash = new PermitSearch.LocationHash(hash[1]);
            }
        }
        if (newHash.ReadyToTogglePermit(oldHash)) {
            var permitModal = document.getElementById("selectedPermit");
            if (newHash.permit_display.length > 0) {
                permitModal.classList.add("is-active");
                // let's find the permit in the search_results variable
                var permit = PermitSearch.search_results.filter(function (j) {
                    return j.permit_number.toString() === newHash.permit_display;
                });
                if (permit.length === 1) {
                    ViewPermitDetail(permit[0]);
                }
            }
            else {
                permitModal.classList.remove("is-active");
            }
            Toggle_Loading_Search_Buttons(false);
        }
        else {
            if (currentHash.ReadyToSearch()) {
                Query(currentHash);
            }
        }
    }
    PermitSearch.HandleHash = HandleHash;
    function Query(currentHash) {
        var path = GetPath();
        var newHash = currentHash.ToHash();
        var searchHash = "?" + newHash.substring(1);
        // Get the list of permits for this search
        Utilities.Get(path + "API/Search/Permit" + searchHash)
            .then(function (permits) {
            console.log("permits", permits);
            PermitSearch.search_results = permits;
            if (PermitSearch.search_results.length > 0) {
                Utilities.Show("searchResults");
                CreateResultsTable(PermitSearch.search_results);
                Toggle_Loading_Search_Buttons(false);
            }
            else {
                Utilities.Hide("searchResults");
            }
        }, function (e) {
            console.log('error getting permits', e);
            Toggle_Loading_Search_Buttons(false);
        });
        // Get the number of permits returned for this search to be used by 
        // our pagination system.
        Utilities.Get(path + "API/Search/Count" + searchHash)
            .then(function (permitCount) {
            PermitSearch.permit_count = permitCount;
            HandlePagination(PermitSearch.permit_count, parseInt(currentHash.page), 20, currentHash);
            // update pagination here
            console.log("count", permitCount, new Date());
        }, function (e) {
            console.log('error getting permit count', e);
        });
    }
    function CreateResultsTable(permits) {
        // The table and headers will already exist, we'll just
        // clear and populate the table body with table rows.
        var currentHash = new PermitSearch.LocationHash(location.hash.substring(1));
        var df = document.createDocumentFragment();
        for (var _i = 0, permits_1 = permits; _i < permits_1.length; _i++) {
            var p = permits_1[_i];
            df.appendChild(CreateResultsRow(p, currentHash));
        }
        var tbody = document.getElementById("resultsBody");
        Utilities.Clear_Element(tbody);
        tbody.appendChild(df);
    }
    function CreateResultsRow(p, currentHash) {
        currentHash.permit_display = p.permit_number.toString();
        var inspectionLink = "https://public.claycountygov.com/inspectionscheduler/#permit=" + p.permit_number.toString();
        var tr = document.createElement("tr");
        tr.appendChild(CreateResultsCellLink(p.permit_number.toString().padStart(8, "0"), "", currentHash.ToHash()));
        tr.appendChild(CreateResultsCell(p.is_closed ? "Yes" : "No"));
        tr.appendChild(CreateResultsCell(Utilities.Format_Date(p.issue_date)));
        tr.appendChild(CreateResultsCell(p.address, "has-text-left"));
        tr.appendChild(CreateResultsCell(Utilities.Format_Amount(p.total_charges - p.paid_charges), "has-text-right"));
        tr.appendChild(CreateResultsCell(p.document_count.toString()));
        tr.appendChild(CreateResultsCellLink(p.passed_final_inspection ? "Completed" : "View", "", inspectionLink));
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
    function CreateResultsCellLink(value, className, href) {
        if (className === void 0) { className = ""; }
        if (href === void 0) { href = ""; }
        var td = document.createElement("td");
        if (className.length > 0)
            td.classList.add(className);
        var link = document.createElement("a");
        link.classList.add("has-text-link");
        link.href = href;
        link.appendChild(document.createTextNode(value));
        td.appendChild(link);
        return td;
    }
    function HandlePagination(totalCount, currentPage, pageSize, currentHash) {
        // we'll need to enable/disable the previous / next buttons based on 
        // if we're on the first/last page
        var totalPages = Math.ceil(totalCount / pageSize);
        // Handle next/previous pages
        var previousPage = document.getElementById("resultsPreviousPage");
        var nextPage = document.getElementById("resultsNextPage");
        if (currentPage === 1) {
            previousPage.setAttribute("disabled", "");
            previousPage.href = "";
        }
        else {
            previousPage.removeAttribute("disabled");
            currentHash.page = (currentPage - 1).toString();
            previousPage.href = currentHash.ToHash();
        }
        if (currentPage === totalPages) {
            nextPage.href = "";
            nextPage.setAttribute("disabled", "");
        }
        else {
            nextPage.removeAttribute("disabled");
            currentHash.page = (currentPage + 1).toString();
            nextPage.href = currentHash.ToHash();
        }
        // now that we've handled the next/previous buttons, let's reset the current page in the hash.
        currentHash.page = currentPage.toString();
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
        //    if the current page is 2 or less or total pages - 2 or more
        //      show pages 1 through 3 an ellipsis, and then last page - 3 to last page
        //    if the current page is 3 or total pages - 3 
        //      show pages 1 through 4 an ellipsis, and then last page - 2 to last page
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
        if (currentPage === 3) {
            for (var i = 1; i <= 4; i++) {
                df.appendChild(CreatePaginationLink(i, i === currentPage, currentHash));
            }
            df.appendChild(CreatePaginationEllipsis());
            for (var i = totalPages - 1; i <= totalPages; i++) {
                df.appendChild(CreatePaginationLink(i, i === currentPage, currentHash));
            }
            return df;
        }
        if (currentPage === (totalPages - 2)) {
            for (var i = 1; i <= 2; i++) {
                df.appendChild(CreatePaginationLink(i, i === currentPage, currentHash));
            }
            df.appendChild(CreatePaginationEllipsis());
            for (var i = totalPages - 3; i <= totalPages; i++) {
                df.appendChild(CreatePaginationLink(i, i === currentPage, currentHash));
            }
            return df;
        }
        if (currentPage < 3 || currentPage > totalPages - 3) {
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
    function CloseModals() {
        var modals = document.querySelectorAll(".modal");
        if (modals.length > 0) {
            for (var i = 0; i < modals.length; i++) {
                var modal = modals.item(i);
                modal.classList.remove("is-active");
            }
        }
    }
    PermitSearch.CloseModals = CloseModals;
    function ClosePermitModal() {
        var currentHash = new PermitSearch.LocationHash(location.hash.substring(1));
        currentHash.permit_display = "";
        location.hash = currentHash.ToHash();
    }
    PermitSearch.ClosePermitModal = ClosePermitModal;
    function ViewPermitDetail(permit) {
        PopulatePermitHeading(permit);
        PopulatePermitInformation(permit);
        QueryDocuments(permit.permit_number);
    }
    function PopulatePermitHeading(permit) {
        var permitHeading = document.getElementById("permitHeading");
        Utilities.Clear_Element(permitHeading);
        var permitNumberContainer = CreateLevelItem("PERMIT #", permit.permit_number.toString().padStart(8, "0"));
        permitNumberContainer.style.flexGrow = "3";
        permitHeading.appendChild(permitNumberContainer);
        if (new Date(permit.issue_date).getFullYear() !== 1) {
            // permit is issued
            permitHeading.appendChild(CreateLevelItem("ISSUE DATE", Utilities.Format_Date(permit.issue_date)));
        }
        else {
            permitHeading.appendChild(CreateLevelItem("ISSUE DATE", "Not Issued"));
        }
        if (new Date(permit.void_date).getFullYear() !== 1) {
            // permit is voided
            permitHeading.appendChild(CreateLevelItem("VOID DATE", Utilities.Format_Date(permit.void_date)));
        }
        else {
            if (new Date(permit.co_date).getFullYear() !== 1) {
                permitHeading.appendChild(CreateLevelItem("CO DATE", Utilities.Format_Date(permit.co_date)));
            }
        }
    }
    function PopulatePermitInformation(permit) {
        Utilities.Set_Value("permitCompleted", permit.is_closed ? "Yes" : "No");
        Utilities.Set_Value("permitFinalInspection", permit.passed_final_inspection ? "Yes" : "No");
        Utilities.Set_Value("permitAddress", permit.address);
        Utilities.Set_Value("permitOwner", permit.owner_name);
        Utilities.Set_Value("permitParcel", permit.parcel_number);
        Utilities.Set_Value("permitContractorNumber", permit.contractor_number);
        Utilities.Set_Value("permitContractorName", permit.contractor_name);
        Utilities.Set_Value("permitCompanyName", permit.company_name);
    }
    function CreateLevelItem(label, value) {
        var container = document.createElement("div");
        container.classList.add("level-item");
        container.classList.add("has-text-centered");
        var div = document.createElement("div");
        var heading = document.createElement("p");
        heading.classList.add("heading");
        heading.appendChild(document.createTextNode(label));
        var title = document.createElement("p");
        title.classList.add("title");
        title.appendChild(document.createTextNode(value));
        div.appendChild(heading);
        div.appendChild(title);
        container.appendChild(div);
        return container;
        //<div class="level-item has-text-centered" >
        //  <div>
        //  <p class="heading" >
        //    ISSUE DATE
        //      < /p>
        //      < p class="title" >
        //        11 / 15 / 2018
        //        < /p>
        //        < /div>
        //        < /div>
    }
    function GetPath() {
        var path = "/";
        var i = window.location.pathname.toLowerCase().indexOf("/permitsearch");
        if (i == 0) {
            path = "/permitsearch/";
        }
        return path;
    }
    function QueryDocuments(permit_number) {
        var path = GetPath();
        Utilities.Get(path + "API/Permit/Documents?permitnumber=" + permit_number.toString())
            .then(function (documents) {
            console.log("documents", documents);
            PermitSearch.permit_documents = documents;
            if (PermitSearch.permit_documents.length > 0) {
                //Utilities.Show("searchResults");
                //CreateResultsTable(search_results);
                //Toggle_Loading_Search_Buttons(false);
            }
            else {
                //Utilities.Hide("searchResults");
            }
        }, function (e) {
            console.log('error getting permits', e);
            //Toggle_Loading_Search_Buttons(false);
        });
    }
    function QueryHolds(permit_number) {
    }
    function QueryCharges(permit_number) {
    }
})(PermitSearch || (PermitSearch = {}));
//# sourceMappingURL=app.js.map