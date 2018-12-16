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
          CreateResultsTable(search_results);
        }, function (e)
          {
            console.log('error getting permits', e);
        });

      Utilities.Get<number>(path + "API/Search/Count" + searchHash)
        .then(function (permitCount: number)
        {
          permit_count = permitCount;
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
    tr.appendChild(CreateResultsCell(Utilities.Format_Amount(p.total_charges), "has-text-right"));
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



}