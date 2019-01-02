/// <reference path="../utilities/menuitem.ts" />
/// <reference path="../utilities/utilities.ts" />
/// <reference path="locationhash.ts" />
/// <reference path="permit.ts" />



namespace PermitSearch
{
  "use strict";

  export let permit_count: number = 0;
  export let search_results: Array<Permit> = [];
  export let permit_documents: Array<Document> = [];

  export let Menus: Array<Utilities.MenuItem> = [
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

  export function Start()
  {
    Utilities.Build_Menu_Elements("menuTabs", Menus);
    window.onhashchange = HandleHash;
    if (location.hash.length > 1)
    {
      HandleHash(null);
    }
  }

  export function Search(): void
  {
    Toggle_Loading_Search_Buttons(true);
    let newHash = new LocationHash("");
    location.hash = newHash.ToHash();
  }

  function Toggle_Loading_Search_Buttons(disabled: boolean)
  {
    let sections = <NodeListOf<HTMLElement>>document.querySelectorAll("#views > section button");
    if (sections.length > 0)
    {
      for (let i = 0; i < sections.length; i++)
      {
        let item = <HTMLButtonElement>sections.item(i);
        Utilities.Toggle_Loading_Button(item, disabled);
      }
    }
  }

  export function HandleHash(event: HashChangeEvent)
  {
    let currentHash = new LocationHash(location.hash.substring(1));
    let newHash = new LocationHash(location.hash.substring(1));
    let oldHash: LocationHash = null;
    if (event !== null)
    {
      let hash = event.oldURL.split("#");
      if (hash.length === 2)
      {
        oldHash = new LocationHash(hash[1]);
      }
    }

    if (newHash.ReadyToTogglePermit(oldHash))
    {
      let permitModal = document.getElementById("selectedPermit");
      if (newHash.permit_display.length > 0)
      {
        permitModal.classList.add("is-active");
        // let's find the permit in the search_results variable
        let permit = search_results.filter(function (j)
        {
          return j.permit_number.toString() === newHash.permit_display;
        });
        if (permit.length === 1)
        {
          ViewPermitDetail(permit[0]);
        }


      }
      else
      {
        permitModal.classList.remove("is-active");
      }
      Toggle_Loading_Search_Buttons(false);
    }
    else
    {
      if (currentHash.ReadyToSearch())
      {
        Query(currentHash);
      }
    }
  }

  function Query(currentHash: LocationHash):void
  {
    let path = GetPath();

    let newHash = currentHash.ToHash();
    let searchHash = "?" + newHash.substring(1)
    // Get the list of permits for this search
    Utilities.Get<Array<PermitSearch.Permit>>(path + "API/Search/Permit" + searchHash)
      .then(function (permits: Array<PermitSearch.Permit>)
      {
        console.log("permits", permits);
        search_results = permits;
        if (search_results.length > 0)
        {

          Utilities.Show("searchResults");
          CreateResultsTable(search_results);
          Toggle_Loading_Search_Buttons(false);
        }
        else
        {
          Utilities.Hide("searchResults");
        }

      }, function (e)
        {
          console.log('error getting permits', e);
          Toggle_Loading_Search_Buttons(false);
        });
    // Get the number of permits returned for this search to be used by 
    // our pagination system.
    Utilities.Get<number>(path + "API/Search/Count" + searchHash)
      .then(function (permitCount: number)
      {
        permit_count = permitCount;
        HandlePagination(permit_count, parseInt(currentHash.page), 20, currentHash);
        // update pagination here
        console.log("count", permitCount, new Date());

      }, function (e)
        {
          console.log('error getting permit count', e);
        });
  }

  function CreateResultsTable(permits: Array<Permit>)
  {
    // The table and headers will already exist, we'll just
    // clear and populate the table body with table rows.
    let currentHash = new LocationHash(location.hash.substring(1));
    let df = document.createDocumentFragment();
    for (let p of permits)
    {
      df.appendChild(CreateResultsRow(p, currentHash));
    }
    let tbody = (<HTMLTableSectionElement>document.getElementById("resultsBody"));
    Utilities.Clear_Element(tbody);
    tbody.appendChild(df);
  }

  function CreateResultsRow(p: Permit, currentHash: LocationHash): HTMLTableRowElement
  {
    currentHash.permit_display = p.permit_number.toString();
    let inspectionLink = "https://public.claycountygov.com/inspectionscheduler/#permit=" + p.permit_number.toString();
    let tr = document.createElement("tr");
    tr.appendChild(CreateResultsCellLink(p.permit_number.toString().padStart(8, "0"), "", currentHash.ToHash()));
    tr.appendChild(CreateResultsCell(p.is_closed ? "Yes" : "No"));
    tr.appendChild(CreateResultsCell(Utilities.Format_Date(p.issue_date)));
    tr.appendChild(CreateResultsCell(p.address, "has-text-left"));
    tr.appendChild(CreateResultsCell(Utilities.Format_Amount(p.total_charges - p.paid_charges), "has-text-right"));
    tr.appendChild(CreateResultsCell(p.document_count.toString()));
    tr.appendChild(CreateResultsCellLink(p.passed_final_inspection ? "Completed" : "View", "",  inspectionLink));
    return tr;
  }

  function CreateResultsCell(value: string, className: string = ""): HTMLTableCellElement
  {
    let td = document.createElement("td");
    if (className.length > 0) td.classList.add(className);
    td.appendChild(document.createTextNode(value));
    return td;
  }

  function CreateResultsCellLink(value: string, className: string = "", href: string = ""): HTMLTableCellElement
  {
    let td = document.createElement("td");
    if (className.length > 0) td.classList.add(className);
    let link = document.createElement("a");
    link.classList.add("has-text-link");
    link.href = href;
    link.appendChild(document.createTextNode(value));
    td.appendChild(link);
    return td;
  }

  function HandlePagination(totalCount: number, currentPage: number, pageSize: number, currentHash: LocationHash)
  {
    // we'll need to enable/disable the previous / next buttons based on 
    // if we're on the first/last page
    let totalPages = Math.ceil(totalCount / pageSize);
    // Handle next/previous pages
    let previousPage = <HTMLAnchorElement>document.getElementById("resultsPreviousPage");
    let nextPage = <HTMLAnchorElement>document.getElementById("resultsNextPage");
    if (currentPage === 1)
    {
      previousPage.setAttribute("disabled", "");
      previousPage.href = "";
    }
    else
    {
      previousPage.removeAttribute("disabled");
      currentHash.page = (currentPage - 1).toString();
      previousPage.href = currentHash.ToHash();
    }

    if (currentPage === totalPages)
    {
      nextPage.href = "";
      nextPage.setAttribute("disabled", "");
    }
    else
    {
      nextPage.removeAttribute("disabled");
      currentHash.page = (currentPage + 1).toString();
      nextPage.href = currentHash.ToHash();
    }
    
    // now that we've handled the next/previous buttons, let's reset the current page in the hash.
    currentHash.page = currentPage.toString();
    let pageList = document.getElementById("resultsPaginationList");
    Utilities.Clear_Element(pageList);
    pageList.appendChild(CreatePaginationLinks(totalPages, currentPage, currentHash));
  }

  function CreatePaginationLinks(totalPages: number, currentPage: number, currentHash: LocationHash):DocumentFragment
  {
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
    let df = document.createDocumentFragment();    
    if (currentPage < 1) currentPage = 1;
    if (currentPage > totalPages) currentPage = totalPages;
    if (totalPages < 8)
    {
      // add a link to every page
      for (let i = 1; i <= totalPages; i++)
      {
        df.appendChild(CreatePaginationLink(i, i === currentPage, currentHash));
      }
      return df;
    }
    if (currentPage === 3)
    {
      for (let i = 1; i <= 4; i++)
      {
        df.appendChild(CreatePaginationLink(i, i === currentPage, currentHash));
      }
      df.appendChild(CreatePaginationEllipsis());
      for (let i = totalPages - 1; i <= totalPages; i++)
      {
        df.appendChild(CreatePaginationLink(i, i === currentPage, currentHash));
      }
      return df;
    }
    if (currentPage === (totalPages - 2))
    {
      for (let i = 1; i <= 2; i++)
      {
        df.appendChild(CreatePaginationLink(i, i === currentPage, currentHash));
      }
      df.appendChild(CreatePaginationEllipsis());
      for (let i = totalPages - 3; i <= totalPages; i++)
      {
        df.appendChild(CreatePaginationLink(i, i === currentPage, currentHash));
      }
      return df;
    }

    if (currentPage < 3 || currentPage > totalPages - 3)
    {
      // add links to the first 3 pages and last 3 pages
      for (let i = 1; i <= 3; i++)
      {
        df.appendChild(CreatePaginationLink(i, i === currentPage, currentHash));
      }
      df.appendChild(CreatePaginationEllipsis());
      for (let i = totalPages - 2; i <= totalPages; i++)
      {
        df.appendChild(CreatePaginationLink(i, i === currentPage, currentHash));
      }
      return df;
    }

    // add links to the first page, currentpage -1 through currentpage + 1, and last page
    df.appendChild(CreatePaginationLink(1, false, currentHash));
    df.appendChild(CreatePaginationEllipsis());
    for (let i = currentPage - 1; i <= currentPage + 1; i++)
    {
      df.appendChild(CreatePaginationLink(i, i === currentPage, currentHash));
    }
    df.appendChild(CreatePaginationEllipsis());
    df.appendChild(CreatePaginationLink(totalPages, false, currentHash));

    return df;
  }

  function CreatePaginationLink(page: number, isSelected: boolean, currentHash: LocationHash):HTMLLIElement
  {
    // scroll back up to the top when a page is clicked
    currentHash.page = page.toString();
    let li = document.createElement("li");
    let a = document.createElement("a");
    a.classList.add("pagination-link");
    a.setAttribute("aria-label", "Goto page " + currentHash.page);    
    a.href = currentHash.ToHash();
    if (isSelected)
    {
      a.classList.add("is-current");
      a.setAttribute("aria-current", "page");
    }
    a.appendChild(document.createTextNode(currentHash.page));
    li.appendChild(a);
    return li;
  }

  function CreatePaginationEllipsis(): HTMLLIElement
  {
    let li = document.createElement("li");
    let span = document.createElement("span");
    span.classList.add("pagination-ellipsis");
    span.innerHTML = "&hellip;";
    li.appendChild(span);
    return li;
  }

  export function CloseModals(): void
  {
    let modals = document.querySelectorAll(".modal");
    if (modals.length > 0)
    {
      for (let i = 0; i < modals.length; i++)
      {
        let modal = modals.item(i);
        modal.classList.remove("is-active");
      }
    }
  }

  export function ClosePermitModal(): void
  {
    let currentHash = new LocationHash(location.hash.substring(1));
    currentHash.permit_display = "";
    location.hash = currentHash.ToHash();
  }

  function ViewPermitDetail(permit: Permit):void
  {
    PopulatePermitHeading(permit);
    PopulatePermitInformation(permit);
    QueryDocuments(permit.permit_number);
  }

  function PopulatePermitHeading(permit: Permit)
  {
    let permitHeading = document.getElementById("permitHeading");
    Utilities.Clear_Element(permitHeading);
    let permitNumberContainer = CreateLevelItem("PERMIT #", permit.permit_number.toString().padStart(8, "0"));
    permitNumberContainer.style.flexGrow = "3";
    permitHeading.appendChild(permitNumberContainer);
    if (new Date(permit.issue_date).getFullYear() !== 1)
    {
      // permit is issued
      permitHeading.appendChild(CreateLevelItem("ISSUE DATE", Utilities.Format_Date(permit.issue_date)));
    }
    else
    {
      permitHeading.appendChild(CreateLevelItem("ISSUE DATE", "Not Issued"));
    }

    if (new Date(permit.void_date).getFullYear() !== 1)
    {
      // permit is voided
      permitHeading.appendChild(CreateLevelItem("VOID DATE", Utilities.Format_Date(permit.void_date)));
    }
    else
    {
      if (new Date(permit.co_date).getFullYear() !== 1)
      {
        permitHeading.appendChild(CreateLevelItem("CO DATE", Utilities.Format_Date(permit.co_date)));
      }
    }
  }

  function PopulatePermitInformation(permit: Permit)
  {
    Utilities.Set_Value("permitCompleted", permit.is_closed ? "Yes" : "No");
    Utilities.Set_Value("permitFinalInspection", permit.passed_final_inspection ? "Yes" : "No");
    Utilities.Set_Value("permitAddress", permit.address);
    Utilities.Set_Value("permitOwner", permit.owner_name);
    Utilities.Set_Value("permitParcel", permit.parcel_number);
    Utilities.Set_Value("permitContractorNumber", permit.contractor_number);
    Utilities.Set_Value("permitContractorName", permit.contractor_name);
    Utilities.Set_Value("permitCompanyName", permit.company_name);

  }

  function CreateLevelItem(label: string, value: string): HTMLDivElement
  {
    let container = document.createElement("div");
    container.classList.add("level-item");
    container.classList.add("has-text-centered");
    let div = document.createElement("div");
    let heading = document.createElement("p");
    heading.classList.add("heading");
    heading.appendChild(document.createTextNode(label));
    let title = document.createElement("p");
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

  function GetPath(): string
  {
    let path = "/";
    let i = window.location.pathname.toLowerCase().indexOf("/permitsearch");
    if (i == 0)
    {
      path = "/permitsearch/";
    }
    return path;
  }

  function QueryDocuments(permit_number: number) : void
  {
    let path = GetPath();
    Utilities.Get<Array<Document>>(path + "API/Permit/Documents?permitnumber=" + permit_number.toString())
      .then(function (documents: Array<Document>)
      {
        console.log("documents", documents);
        permit_documents = documents;
        if (permit_documents.length > 0)
        {

          //Utilities.Show("searchResults");
          //CreateResultsTable(search_results);
          //Toggle_Loading_Search_Buttons(false);
        }
        else
        {
          //Utilities.Hide("searchResults");
        }

      }, function (e)
        {
          console.log('error getting permits', e);
          //Toggle_Loading_Search_Buttons(false);
        });
  }

  function QueryHolds(permit_number: number): void
  {

  }

  function QueryCharges(permit_number: number): void
  {

  }
}