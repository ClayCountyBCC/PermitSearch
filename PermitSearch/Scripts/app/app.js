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
    PermitSearch.permit_holds = [];
    PermitSearch.permit_charges = [];
    PermitSearch.selected_tab = "permit";
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
        GetDateUpdated();
        setInterval(function () { GetDateUpdated(); }, 60000);
        HandleInputs();
        HandleResetButtons();
    }
    PermitSearch.Start = Start;
    function HandleInputs() {
        var sections = document.querySelectorAll("#views > section input");
        if (sections.length > 0) {
            for (var i = 0; i < sections.length; i++) {
                var item = sections.item(i);
                item.onkeydown = function (event) {
                    var e = event || window.event;
                    if (event.keyCode == 13) {
                        Search();
                    }
                };
            }
        }
    }
    function HandleResetButtons() {
        var sections = document.querySelectorAll("#searchButtons button.is-reset");
        if (sections.length > 0) {
            for (var i = 0; i < sections.length; i++) {
                var item = sections.item(i);
                item.onclick = function () { return ResetSearch(); };
            }
        }
    }
    function GetDateUpdated() {
        var path = GetPath();
        Utilities.Get(path + "API/Timing")
            .then(function (dateUpdated) {
            PermitSearch.date_updated = dateUpdated;
            var timeContainer = document.getElementById("updateTimeContainer");
            var time = document.getElementById("updateTime");
            Utilities.Clear_Element(time);
            time.appendChild(document.createTextNode(new Date(PermitSearch.date_updated).toLocaleString('en-us')));
            Utilities.Show(timeContainer);
        }, function (e) {
            console.log('error getting date updated', e);
        });
    }
    function Search() {
        Toggle_Loading_Search_Buttons(true);
        var newHash = new PermitSearch.LocationHash("");
        newHash.tab = PermitSearch.selected_tab;
        location.hash = newHash.ToHash();
    }
    PermitSearch.Search = Search;
    function CreatePrintPermitPreview() {
        var path = GetPath();
        var permit_num = document.getElementById("PermitPrintButton").getAttribute("value");
        var permitNumber = 11802222;
        var permit_number = parseInt(permit_num);
        if ((permit_number > 10000 && permit_number < 20000000 /* LOWEST PERMITNUMBER FOUND is 00010001 */) ||
            (permit_number > 89999999 && permit_number < 100000000)) {
            Utilities.Get(path + "API/Permit/PrintPermit?permit_number=" + permit_number);
        }
        else {
            Utilities.Get(path + "API/Permit/PrintPermit?permit_number=" + permit_number);
        }
    }
    PermitSearch.CreatePrintPermitPreview = CreatePrintPermitPreview;
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
        Utilities.Clear_Element(document.getElementById("permitSearchError"));
        var currentHash = new PermitSearch.LocationHash(location.hash.substring(1));
        var newHash = new PermitSearch.LocationHash(location.hash.substring(1));
        var oldHash = null;
        // if the event is null, we're loading this off of the initial
        // page load.  
        if (event !== null) {
            var hash = event.oldURL.split("#");
            if (hash.length === 2) {
                oldHash = new PermitSearch.LocationHash(hash[1]);
            }
        }
        else {
            currentHash.UpdateInputs();
        }
        if (newHash.ReadyToTogglePermit(oldHash)) {
            TogglePermitDisplay(newHash.permit_display);
            Toggle_Loading_Search_Buttons(false);
        }
        else {
            if (currentHash.ReadyToSearch()) {
                Query(currentHash);
            }
            else {
                Toggle_Loading_Search_Buttons(false);
            }
        }
    }
    PermitSearch.HandleHash = HandleHash;
    function TogglePermitDisplay(permit_number) {
        // this function will either hide or show the the permit modals
        // based on if the permit number has a length or not.
        var permitModal = document.getElementById("selectedPermit");
        var permitErrorModal = document.getElementById("selectedPermitError");
        if (permit_number.length === 0) {
            permitErrorModal.classList.remove("is-active");
            permitModal.classList.remove("is-active");
            return;
        }
        var permit = PermitSearch.search_results.filter(function (j) {
            return j.permit_number.toString() === permit_number;
        });
        if (permit.length > 0) {
            ViewPermitDetail(permit[0]);
            permitModal.classList.add("is-active");
        }
        else {
            Utilities.Set_Text("permitNumberError", permit_number);
            permitErrorModal.classList.add("is-active");
        }
    }
    function Query(currentHash) {
        var path = GetPath();
        var newHash = currentHash.ToHash();
        var searchHash = "?" + newHash.substring(1);
        console.log('hash', newHash);
        // Get the list of permits for this search
        Utilities.Get(path + "API/Search/Permit" + searchHash)
            .then(function (permits) {
            console.log("permits", permits);
            PermitSearch.search_results = permits;
            if (PermitSearch.search_results.length > 0) {
                console.log('permits found');
                Utilities.Show("searchResults");
                CreateResultsTable(PermitSearch.search_results);
                if (currentHash.permit_display.length > 0) {
                    TogglePermitDisplay(currentHash.permit_display);
                }
            }
            else {
                console.log('no permits found');
                Utilities.Hide("searchResults");
                Utilities.Error_Show("permitSearchError", "No permits found for this search.", true);
                // Show that we got no search results
            }
            Toggle_Loading_Search_Buttons(false);
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
        CreateResultsHeaderRow(currentHash.tab);
        for (var _i = 0, permits_1 = permits; _i < permits_1.length; _i++) {
            var p = permits_1[_i];
            df.appendChild(CreateResultsRow(p, currentHash));
        }
        var tbody = document.getElementById("resultsBody");
        Utilities.Clear_Element(tbody);
        tbody.appendChild(df);
        var results = document.getElementById("searchResults");
        results.scrollIntoView();
    }
    function CreateResultsHeaderRow(rowType) {
        var df = document.createDocumentFragment();
        var tr = document.createElement("tr");
        tr.appendChild(CreateResultsHeaderCell("Permit", "", "8.5%", "permit"));
        tr.appendChild(CreateResultsHeaderCell("Status", "", "9%", "status"));
        tr.appendChild(CreateResultsHeaderCell("Issued", "", "7.5%", "issuedate"));
        tr.appendChild(CreateResultsHeaderCell("Address", "has-text-left", "30%", "address"));
        switch (rowType.toLowerCase()) {
            case "contractor":
                tr.appendChild(CreateResultsHeaderCell("Contractor", "", "12%", "contractorname"));
                tr.appendChild(CreateResultsHeaderCell("Company", "", "15%", "company"));
                tr.appendChild(CreateResultsHeaderCell("Age", "has-text-right", "8%", "age"));
                break;
            case "owner":
                tr.appendChild(CreateResultsHeaderCell("Owner Name", "", "15%", "owner"));
                tr.appendChild(CreateResultsHeaderCell("Unpaid Charges", "has-text-right", "20%", "charges"));
                break;
            case "parcel":
                tr.appendChild(CreateResultsHeaderCell("Parcel #", "", "15%", "parcel"));
                tr.appendChild(CreateResultsHeaderCell("Unpaid Charges", "has-text-right", "20%", "charges"));
                break;
            case "permit":
            case "address":
            default:
                // we want permit / address to be the default
                tr.appendChild(CreateResultsHeaderCell("Unpaid Charges", "has-text-right", "20%", "charges"));
                tr.appendChild(CreateResultsHeaderCell("Documents", "", "15%", "documents"));
        }
        tr.appendChild(CreateResultsHeaderCell("Inspections", "", "10%", ""));
        df.appendChild(tr);
        var head = document.getElementById("resultsHead");
        Utilities.Clear_Element(head);
        head.appendChild(df);
    }
    function CreateResultsRow(p, currentHash) {
        currentHash.permit_display = p.permit_number.toString();
        var inspectionLink = "https://public.claycountygov.com/inspectionscheduler/#permit=" + p.permit_number.toString();
        var tr = document.createElement("tr");
        tr.appendChild(CreateResultsCellLink(p.permit_number.toString().padStart(8, "0"), "", currentHash.ToHash()));
        tr.appendChild(CreateResultsCell(p.is_closed ? "Closed" : "Open"));
        if (new Date(p.issue_date).getFullYear() !== 1) {
            tr.appendChild(CreateResultsCell(Utilities.Format_Date(p.issue_date)));
        }
        else {
            tr.appendChild(CreateResultsCell("Not Issued"));
        }
        tr.appendChild(CreateResultsCell(p.address, "has-text-left"));
        switch (currentHash.tab.toLowerCase()) {
            case "contractor":
                tr.appendChild(CreateResultsCell(p.contractor_name));
                tr.appendChild(CreateResultsCell(p.company_name));
                tr.appendChild(CreateResultsCell(p.days_since_last_passed_inspection.toString()));
                break;
            case "owner":
                tr.appendChild(CreateResultsCell(p.owner_name));
                tr.appendChild(CreateResultsCell(Utilities.Format_Amount(p.total_charges - p.paid_charges), "has-text-right"));
                break;
            case "parcel":
                tr.appendChild(CreateResultsCell(p.parcel_number));
                tr.appendChild(CreateResultsCell(Utilities.Format_Amount(p.total_charges - p.paid_charges), "has-text-right"));
                break;
            case "permit":
            case "address":
            default:
                tr.appendChild(CreateResultsCell(Utilities.Format_Amount(p.total_charges - p.paid_charges), "has-text-right"));
                tr.appendChild(CreateResultsCell(p.document_count.toString()));
        }
        tr.appendChild(CreateResultsCellLink(p.passed_final_inspection ? "Completed" : "View", "", inspectionLink, true));
        return tr;
    }
    function CreateResultsHeaderCell(heading, className, width, field) {
        if (className === void 0) { className = ""; }
        var currentHash = new PermitSearch.LocationHash(location.hash.substring(1));
        var th = document.createElement("th");
        th.style.width = width;
        if (className.length > 0)
            th.classList.add(className);
        if (field.length > 0) {
            var link = document.createElement("a");
            currentHash.sort_on = field;
            currentHash.sort_direction = currentHash.sort_direction == "A" ? "D" : "A";
            currentHash.page = "1";
            link.href = currentHash.ToHash();
            link.classList.add("has-text-link");
            link.appendChild(document.createTextNode(heading));
            var icon = document.createElement("span");
            icon.classList.add("icon");
            var i = document.createElement("i");
            i.classList.add("fas");
            i.classList.add("fa-sort");
            icon.appendChild(i);
            link.appendChild(icon);
            th.appendChild(link);
        }
        else {
            th.appendChild(document.createTextNode(heading));
        }
        return th;
    }
    function CreateResultsCell(value, className) {
        if (className === void 0) { className = ""; }
        var td = document.createElement("td");
        if (className.length > 0)
            td.classList.add(className);
        td.appendChild(document.createTextNode(value));
        return td;
    }
    function CreateResultsCellLink(value, className, href, newTab) {
        if (className === void 0) { className = ""; }
        if (href === void 0) { href = ""; }
        if (newTab === void 0) { newTab = false; }
        var td = document.createElement("td");
        if (className.length > 0)
            td.classList.add(className);
        var link = document.createElement("a");
        link.classList.add("has-text-link");
        if (newTab) {
            link.rel = "noopener";
            link.target = "_blank";
        }
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
        PermitSearch.Document.QueryDocuments(permit.permit_number);
        PermitSearch.Hold.QueryHolds(permit.permit_number);
        PermitSearch.Charge.QueryCharges(permit.permit_number);
    }
    function PopulatePermitHeading(permit) {
        var permitHeading = document.getElementById("permitHeading");
        Utilities.Clear_Element(permitHeading);
        var permitNumberContainer = CreateLevelItem("PERMIT #", permit.permit_number.toString().padStart(8, "0"));
        permitNumberContainer.style.flexGrow = "2";
        permitHeading.appendChild(permitNumberContainer);
        if (permit.permit_type.length > 0) {
            permitHeading.appendChild(CreateLevelItem("PERMIT TYPE", permit.permit_type));
        }
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
        var permitInspectionButton = document.getElementById("permitInspectionSchedulerLink");
        var inspectionLink = "https://public.claycountygov.com/inspectionscheduler/#permit=" + permit.permit_number.toString();
        permitInspectionButton.href = inspectionLink;
        Build_Property_Information_Display(permit);
        Build_Contractor_Information_Display(permit);
    }
    function Build_Property_Information_Display(permit) {
        var propertyContainer = document.getElementById("propertyFieldset");
        var df = document.createDocumentFragment();
        var legend = document.createElement("legend");
        legend.classList.add("label");
        legend.appendChild(document.createTextNode("Property Information"));
        df.appendChild(legend);
        if (permit.address.length > 0)
            df.appendChild(Create_Field("Address", permit.address));
        if (permit.owner_name.length > 0)
            df.appendChild(Create_Field("Owner", permit.owner_name));
        if (permit.parcel_number.length > 0) {
            if (permit.pin_complete.length > 0) {
                var link = "https://qpublic.schneidercorp.com/Application.aspx?AppID=830&LayerID=15008&PageTypeID=4&KeyValue=" + permit.pin_complete;
                df.appendChild(Create_Field_Link("Parcel Number", permit.parcel_number, "View on CCPAO", link));
            }
            else {
                df.appendChild(Create_Field("Parcel Number", permit.parcel_number));
            }
        }
        Utilities.Clear_Element(propertyContainer);
        propertyContainer.appendChild(df);
    }
    function Build_Contractor_Information_Display(permit) {
        var contractorContainer = document.getElementById("contractorFieldset");
        Utilities.Clear_Element(contractorContainer);
        var df = document.createDocumentFragment();
        var legend = document.createElement("legend");
        legend.classList.add("label");
        legend.appendChild(document.createTextNode("Contractor Information"));
        df.appendChild(legend);
        if (permit.contractor_name.length === 0 &&
            permit.contractor_number.length === 0 &&
            permit.company_name.length === 0) {
            var p = document.createElement("p");
            p.appendChild(document.createTextNode("No Contractor Information found."));
            df.appendChild(p);
        }
        else {
            if (permit.contractor_number.length > 0) {
                df.appendChild(Create_Field("Contractor Number", permit.contractor_number));
                df.appendChild(Create_Field("Days Since Last Passed Inspection", permit.days_since_last_passed_inspection.toString()));
            }
            if (permit.contractor_name.length > 0)
                df.appendChild(Create_Field("Contractor Name", permit.contractor_name));
            if (permit.company_name.length > 0)
                df.appendChild(Create_Field("Company Name", permit.company_name));
        }
        contractorContainer.appendChild(df);
    }
    function Create_Field(label, value) {
        var field = document.createElement("div");
        field.classList.add("field");
        var fieldLabel = document.createElement("label");
        fieldLabel.classList.add("label");
        fieldLabel.classList.add("is-medium");
        fieldLabel.appendChild(document.createTextNode(label));
        field.appendChild(fieldLabel);
        var control = document.createElement("div");
        control.classList.add("control");
        var input = document.createElement("input");
        input.classList.add("input");
        input.classList.add("is-medium");
        input.readOnly = true;
        input.type = "text";
        input.value = value;
        control.appendChild(input);
        field.appendChild(control);
        return field;
        //<div class="field" >
        //  <label class="label is-medium" > Contractor Number < /label>
        //    < div class="control" >
        //      <input id="permitContractorNumber"
        //class="input is-medium" type = "text" disabled value = "" />
        //  </div>
        //  < /div>
    }
    function Create_Field_Link(label, value, buttonLabel, link) {
        var field = document.createElement("div");
        field.classList.add("field");
        var fieldLabel = document.createElement("label");
        fieldLabel.classList.add("label");
        fieldLabel.classList.add("is-medium");
        fieldLabel.appendChild(document.createTextNode(label));
        field.appendChild(fieldLabel);
        var innerField = document.createElement("div");
        innerField.classList.add("field");
        innerField.classList.add("is-grouped");
        var inputControl = document.createElement("div");
        inputControl.classList.add("control");
        var buttonControl = document.createElement("div");
        buttonControl.classList.add("control");
        var input = document.createElement("input");
        input.classList.add("input");
        input.classList.add("is-medium");
        input.readOnly = true;
        input.type = "text";
        input.value = value;
        var button = document.createElement("a");
        button.classList.add("button");
        button.classList.add("is-medium");
        button.classList.add("is-primary");
        button.href = link;
        button.target = "_blank";
        button.rel = "noopener";
        button.appendChild(document.createTextNode(buttonLabel));
        inputControl.appendChild(input);
        buttonControl.appendChild(button);
        innerField.appendChild(inputControl);
        innerField.appendChild(buttonControl);
        field.appendChild(innerField);
        return field;
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
    }
    function GetPath() {
        var path = "/";
        var i = window.location.pathname.toLowerCase().indexOf("/permitsearch");
        if (i == 0) {
            path = "/permitsearch/";
        }
        return path;
    }
    PermitSearch.GetPath = GetPath;
    function CreateMessageRow(container_id, colspan, message) {
        var container = document.getElementById(container_id);
        Utilities.Clear_Element(container);
        var tr = document.createElement("tr");
        var td = document.createElement("td");
        td.colSpan = colspan;
        td.appendChild(document.createTextNode(message));
        tr.appendChild(td);
        container.appendChild(tr);
    }
    PermitSearch.CreateMessageRow = CreateMessageRow;
    function ResetSearch() {
        // this function is going to empty the search form inputs and the search results.
        Utilities.Hide(document.getElementById("searchResults"));
        Utilities.Clear_Element(document.getElementById("resultsbody"));
        Utilities.Set_Value("permitStatus", "all");
        Utilities.Set_Value("permitSearch", "");
        Utilities.Set_Value("streetNumberSearch", "");
        Utilities.Set_Value("streetNameSearch", "");
        Utilities.Set_Value("parcelSearch", "");
        Utilities.Set_Value("ownerSearch", "");
        Utilities.Set_Value("contractorNumberSearch", "");
        Utilities.Set_Value("contractorNameSearch", "");
        Utilities.Set_Value("companyNameSearch", "");
        location.hash = "";
    }
    PermitSearch.ResetSearch = ResetSearch;
})(PermitSearch || (PermitSearch = {}));
//# sourceMappingURL=app.js.map