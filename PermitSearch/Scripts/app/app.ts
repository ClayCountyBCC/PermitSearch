/// <reference path="menuitem.ts" />

namespace PermitSearch
{
  "use strict";


  export let Menus: Array<MenuItem> = [
    {
      id: "nav-permit",
      title: "Search by Permit Number",
      subTitle: "Searching by Permit number will show you all of the information for that specific permit.",
      icon: "fas fa-file",
      label: "Permit",
      selected: true
    },
    {
      id: "nav-address",
      title: "Search by Street Address",
      subTitle: "Search for permits by any combination of Street Number, Street Name, and City.  Partial street names are allowed. ",
      icon: "fas fa-home",
      label: "Address",
      selected: false
    },
    {
      id: "nav-contractor",
      title: "Search by Contractor",
      subTitle: "Search for permits by Contractor Name, Company Name, or Contractor ID.",
      icon: "fas fa-users",
      label: "Contractor",
      selected: false
    },
    {
      id: "nav-owner",
      title: "Search by Owner Name",
      subTitle: "Search for permits by Owner Name.  Partial owner names are permitted.",
      icon: "fas fa-user",
      label: "Owner",
      selected: false
    },
    {
      id: "nav-parcel",
      title: "Search by Parcel Number",
      subTitle: "Search for permits by parcel number.",
      icon: "fas fa-map",
      label: "Parcel",
      selected: false
    },
  ];


}