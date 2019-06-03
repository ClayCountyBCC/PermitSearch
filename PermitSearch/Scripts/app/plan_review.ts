/// <reference path="app.ts" />

namespace PermitSearch
{
  "use strict";

  interface IPlanReview
  {
    clearance_sheet: string;
    plan_id: number;
    plan_type: string;
    received_date: Date;
    plan_reviewed_date: Date;
    plan_reviewed_by: string;
    review_status: string;
    issue_id: number;
    plan_review_issue: string;
    issue_added_on: Date;
    issue_added_by: string;
    signed_off_on: Date;
    signed_off_by: string;
  }

  export class PlanReview implements IPlanReview
  {
    public clearance_sheet: string;
    public plan_id: number;
    public plan_type: string;
    public received_date: Date;
    public plan_reviewed_date: Date;
    public plan_reviewed_by: string;
    public review_status: string;
    public issue_id: number;
    public plan_review_issue: string;
    public issue_added_on: Date;
    public issue_added_by: string;
    public signed_off_on: Date;
    public signed_off_by: string;
    static plans_review_container: string = "plansReviewContainer";
    constructor() { }

    static QueryPlanReview(permit_number: number, has_plans: boolean): void
    {
      PlanReview.ResetPlanReview();
      if (!has_plans)
      {
        PermitSearch.CreateMessageRow(PlanReview.plans_review_container, 7, "No Plans were found for this permit.");
        return;
      }
      let path = PermitSearch.GetPath();
      Utilities.Get<Array<PlanReview>>(path + "API/Permit/PlansReview?permitnumber=" + permit_number.toString())
        .then(function (planreviews: Array<PlanReview>)
        {
          console.log("plans reviews", planreviews);
          PermitSearch.plan_reviews = planreviews;
          if (planreviews.length === 0)
          {
            PermitSearch.CreateMessageRow(PlanReview.plans_review_container, 7, "No Plans were found for this permit.");
          }
          else
          {
            PlanReview.CreateTable(planreviews, PlanReview.plans_review_container);
          }

        }, function (e)
          {
            PermitSearch.CreateMessageRow(PlanReview.plans_review_container, 7, "There was an issue retrieving the Plans for this permit.  Please try again.");
            console.log('error getting holds', e);
          });
    }

    static ResetPlanReview(): void
    {
      PermitSearch.plan_reviews = [];
      PermitSearch.CreateMessageRow(PlanReview.plans_review_container, 7, "Loading Plans...")
    }

    static CreateTable(planreviews: Array<PlanReview>, container: string): void
    {
      let df = document.createDocumentFragment();
      let plan_id = 0;
      for (let p of planreviews)
      {
        if (p.plan_id != plan_id)
        {
          plan_id = p.plan_id;
          df.appendChild(PlanReview.CreateRow(p));          
          // need to handle when there are no issues
          // because the plans haven't been reviewed yet.
          df.appendChild(PlanReview.CreateInitialIssueRow(p));
        }        
        PermitSearch.plan_reviews_tbody.appendChild(PlanReview.CreateIssueRow(p));
      }
      let tbody = (<HTMLTableSectionElement>document.getElementById(container));
      Utilities.Clear_Element(tbody);
      tbody.appendChild(df);
    }

    static CreateRow(p: PlanReview): HTMLTableRowElement
    {
      let tr = document.createElement("tr");
      tr.appendChild(PlanReview.CreateCell(p.clearance_sheet));
      tr.appendChild(PlanReview.CreateCell(p.plan_type));
      tr.appendChild(PlanReview.CreateCell(Utilities.Format_Date(p.received_date)));
      if (new Date(p.plan_reviewed_date.toString()).getFullYear() < 1000)
      {
        tr.appendChild(PlanReview.CreateCell(""));
      }
      else
      {
        tr.appendChild(PlanReview.CreateCell(Utilities.Format_Date(p.plan_reviewed_date)));
      }
      
      tr.appendChild(PlanReview.CreateCell(p.plan_reviewed_by));
      tr.appendChild(PlanReview.CreateCell(p.review_status));      
      return tr;
    }

    static CreateIssueRow(p: PlanReview): HTMLTableRowElement
    {
      let tr = document.createElement("tr");
      if (new Date(p.issue_added_on.toString()).getFullYear() < 1000)
      {
        let td = document.createElement("td");
        td.colSpan = 5;
        td.appendChild(document.createTextNode("No Issues have been added."));
        tr.appendChild(td);
      }
      else
      {
        tr.appendChild(PlanReview.CreateCell(PermitSearch.stripHtml(p.plan_review_issue)));
        tr.appendChild(PlanReview.CreateCell(Utilities.Format_Date(p.issue_added_on)));
        tr.appendChild(PlanReview.CreateCell(p.issue_added_by));
        if (new Date(p.signed_off_on.toString()).getFullYear() < 1000)
        {
          tr.appendChild(PlanReview.CreateCell(""));
        }
        else
        {
          tr.appendChild(PlanReview.CreateCell(Utilities.Format_Date(p.signed_off_on)));
        }
        tr.appendChild(PlanReview.CreateCell(p.signed_off_by));
      }

      return tr;
    }

    static CreateInitialIssueRow(p: PlanReview): HTMLTableRowElement
    {
      let tr = document.createElement("tr");
      tr.appendChild(PlanReview.CreateCell(""));
      let td = document.createElement("td");
      td.colSpan = 5;
      td.appendChild(PlanReview.CreateIssueTable());
      tr.appendChild(td);      
      return tr;
    }

    static CreateIssueTable(): HTMLTableElement
    {
      let table = document.createElement("table");
      table.classList.add("table");
      table.classList.add("is-fullwidth");
      let thead = document.createElement("thead");
      table.appendChild(thead);
      thead.appendChild(PlanReview.CreateIssueHeaderRow());
      let tbody = document.createElement("tbody");
      table.appendChild(tbody);
      PermitSearch.plan_reviews_tbody = tbody;
      return table;
    }

    static CreateIssueHeaderRow() :HTMLTableRowElement
    {
      let tr = document.createElement("tr");
      tr.appendChild(PlanReview.CreateHeaderCell("Issue", "40%"));
      tr.appendChild(PlanReview.CreateHeaderCell("Added On", "15%"));
      tr.appendChild(PlanReview.CreateHeaderCell("Added By", "15%"));
      tr.appendChild(PlanReview.CreateHeaderCell("Signed Off On", "15%"));
      tr.appendChild(PlanReview.CreateHeaderCell("Signed Off By", "15%"));
      return tr;
    }

    static CreateCell(value: string, className: string = ""): HTMLTableCellElement
    {
      let td = document.createElement("td");
      if (className.length > 0) td.classList.add(className);
      td.appendChild(document.createTextNode(value));
      return td;
    }

    static CreateHeaderCell(value: string, width: string, className: string = ""): HTMLTableHeaderCellElement
    {
      let td = document.createElement("th");
      if (className.length > 0) td.classList.add(className);
      td.style.width = width;
      td.appendChild(document.createTextNode(value));
      return td;
    }



  }
}