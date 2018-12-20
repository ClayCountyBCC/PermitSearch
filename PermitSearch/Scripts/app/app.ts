/// <reference path="../utilities/menuitem.ts" />
/// <reference path="../utilities/utilities.ts" />
/// <reference path="locationhash.ts" />
/// <reference path="permit.ts" />



namespace PermitSearch
{
  "use strict";

  export let permit_count: number = 0;
  export let search_results: Array<Permit> = [];

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

  export function Start()
  {
    Utilities.Build_Menu_Elements("menuTabs", Menus);
    window.onhashchange = HandleHash;
    if (location.hash.length > 1)
    {
      HandleHash();
    }
  }

  // Need to 

  export function Search(): void
  {
    console.log('Searching');
    let newHash = new LocationHash("");
    console.log('Search Hash', newHash);
    location.hash = newHash.ToHash();
  }

  export function HandleHash()
  {
    let originalHash = location.hash;
    let currentHash = new LocationHash(originalHash.substring(1));

    let path = "/";
    let i = window.location.pathname.toLowerCase().indexOf("/permitsearch");
    if (i == 0)
    {
      path = "/permitsearch/";
    }
    let newHash = currentHash.ToHash();
    if (newHash.length > 0 && currentHash.ReadyToSearch())
    {
      let searchHash = "?" + newHash.substring(1)
      Utilities.Get<Array<PermitSearch.Permit>>(path + "API/Search/Permit" + searchHash)
        .then(function (permits: Array<PermitSearch.Permit>)
        {
          console.log("permits", permits);
          search_results = permits;
          if (search_results.length > 0)
          {
            Utilities.Show("searchResults");
            CreateResultsTable(search_results);
          }
          else
          {
            Utilities.Hide("searchResults");
          }

        }, function (e)
          {
            console.log('error getting permits', e);
        });

      Utilities.Get<number>(path + "API/Search/Count" + searchHash)
        .then(function (permitCount: number)
        {
          permit_count = permitCount;
          HandlePagination(permit_count, parseInt(currentHash.page), 20, currentHash);
          // update pagination here
          console.log("count", permitCount);

        }, function (e)
          {
            console.log('error getting permit count', e);
          });
    }
  }


  function CreateResultsTable(permits: Array<Permit>)
  {
    // The table and headers will already exist, we'll just
    // clear and populate the table body with table rows.
    let df = document.createDocumentFragment();
    for (let p of permits)
    {
      df.appendChild(CreateResultsRow(p));
    }
    let tbody = (<HTMLTableSectionElement>document.getElementById("resultsBody"));
    Utilities.Clear_Element(tbody);
    tbody.appendChild(df);
  }

  

  function CreateResultsRow(p: Permit): HTMLTableRowElement
  {
    let tr = document.createElement("tr");
    tr.appendChild(CreateResultsCell(p.permit_number.toString().padStart(8, "0")));
    tr.appendChild(CreateResultsCell(p.is_closed ? "Yes" : "No"));
    tr.appendChild(CreateResultsCell(Utilities.Format_Date(p.issue_date)));
    tr.appendChild(CreateResultsCell(p.address, "has-text-left"));
    tr.appendChild(CreateResultsCell(Utilities.Format_Amount(p.total_charges - p.paid_charges), "has-text-right"));
    tr.appendChild(CreateResultsCell(p.document_count.toString()));
    tr.appendChild(CreateResultsCell(p.passed_final_inspection ? "Completed" : "View"));
    return tr;
  }

  function CreateResultsCell(value: string, className: string = ""): HTMLTableCellElement
  {
    let td = document.createElement("td");
    if (className.length > 0) td.classList.add(className);
    td.appendChild(document.createTextNode(value));
    return td;
  }

  function HandlePagination(totalCount: number, currentPage: number, pageSize: number, currentHash: LocationHash)
  {
    // we'll need to enable/disable the previous / next buttons based on 
    // if we're on the first/last page
    let totalPages = Math.ceil(totalCount / pageSize);
    let previousPage = <HTMLAnchorElement>document.getElementById("resultsPreviousPage");
    let nextPage = <HTMLAnchorElement>document.getElementById("resultsNextPage");
    if (currentPage === 1)
    {
      previousPage.setAttribute("disabled", "");
    }
    else
    {
      previousPage.removeAttribute("disabled");
    }

    if (currentPage === totalPages)
    {
      nextPage.setAttribute("disabled", "");
    }
    else
    {
      nextPage.removeAttribute("disabled");
    }

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
    //    if the current page is 3 or less or total pages - 3 or more
    //    show pages 1 through 3 an ellipsis, and then last page - 3 to last page
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

    if (currentPage < 4 || currentPage > totalPages - 4)
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

}