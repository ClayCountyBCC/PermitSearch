/// <reference path="app.ts" />
var PermitSearch;
(function (PermitSearch) {
    "use strict";
    var PlanReview = /** @class */ (function () {
        function PlanReview() {
        }
        PlanReview.QueryPlanReview = function (permit_number, has_plans) {
            PlanReview.ResetPlanReview();
            if (!has_plans) {
                PermitSearch.CreateMessageRow(PlanReview.plans_review_container, 7, "No Plans were found for this permit.");
                return;
            }
            var path = PermitSearch.GetPath();
            Utilities.Get(path + "API/Permit/PlansReview?permitnumber=" + permit_number.toString())
                .then(function (planreviews) {
                console.log("plans reviews", planreviews);
                PermitSearch.plan_reviews = planreviews;
                if (planreviews.length === 0) {
                    PermitSearch.CreateMessageRow(PlanReview.plans_review_container, 7, "No Plans were found for this permit.");
                }
                else {
                    PlanReview.CreateTable(planreviews, PlanReview.plans_review_container);
                }
            }, function (e) {
                PermitSearch.CreateMessageRow(PlanReview.plans_review_container, 7, "There was an issue retrieving the Plans for this permit.  Please try again.");
                console.log('error getting holds', e);
            });
        };
        PlanReview.ResetPlanReview = function () {
            PermitSearch.plan_reviews = [];
            PermitSearch.CreateMessageRow(PlanReview.plans_review_container, 7, "Loading Plans...");
        };
        PlanReview.CreateTable = function (planreviews, container) {
            var df = document.createDocumentFragment();
            var plan_id = 0;
            for (var _i = 0, planreviews_1 = planreviews; _i < planreviews_1.length; _i++) {
                var p = planreviews_1[_i];
                if (p.plan_id != plan_id) {
                    plan_id = p.plan_id;
                    df.appendChild(PlanReview.CreateRow(p));
                    // need to handle when there are no issues
                    // because the plans haven't been reviewed yet.
                    df.appendChild(PlanReview.CreateInitialIssueRow(p));
                }
                PermitSearch.plan_reviews_tbody.appendChild(PlanReview.CreateIssueRow(p));
            }
            var tbody = document.getElementById(container);
            Utilities.Clear_Element(tbody);
            tbody.appendChild(df);
        };
        PlanReview.CreateRow = function (p) {
            var tr = document.createElement("tr");
            tr.appendChild(PlanReview.CreateCell(p.clearance_sheet));
            tr.appendChild(PlanReview.CreateCell(p.plan_type));
            tr.appendChild(PlanReview.CreateCell(Utilities.Format_Date(p.received_date)));
            tr.appendChild(PlanReview.CreateCell(p.plan_reviewed_by));
            if (new Date(p.plan_reviewed_date.toString()).getFullYear() < 1000) {
                tr.appendChild(PlanReview.CreateCell(""));
            }
            else {
                tr.appendChild(PlanReview.CreateCell(Utilities.Format_Date(p.plan_reviewed_date)));
            }
            tr.appendChild(PlanReview.CreateCell(p.review_status));
            tr.appendChild(PlanReview.CreateCell(PermitSearch.stripHtml(p.comment)));
            if (p.issue_id === -1) {
                tr.appendChild(PlanReview.CreateCell("No Issues"));
            }
            else {
                var buttonTd = document.createElement("td");
                var link = document.createElement("a");
                link.onclick = function () {
                    var e = tr.nextElementSibling;
                    if (e.style.display === "none") {
                        e.style.display = "table-row";
                    }
                    else {
                        e.style.display = "none";
                    }
                };
                link.appendChild(document.createTextNode("View Issues"));
                buttonTd.appendChild(link);
                tr.appendChild(buttonTd);
            }
            return tr;
        };
        PlanReview.CreateIssueRow = function (p) {
            var tr = document.createElement("tr");
            if (new Date(p.issue_added_on.toString()).getFullYear() < 1000) {
                var td = document.createElement("td");
                td.colSpan = 7;
                td.appendChild(document.createTextNode("No Issues have been added."));
                tr.appendChild(td);
            }
            else {
                tr.appendChild(PlanReview.CreateCell(PermitSearch.stripHtml(p.plan_review_issue)));
                tr.appendChild(PlanReview.CreateCell(Utilities.Format_Date(p.issue_added_on)));
                tr.appendChild(PlanReview.CreateCell(p.issue_added_by));
                if (new Date(p.signed_off_on.toString()).getFullYear() < 1000) {
                    tr.appendChild(PlanReview.CreateCell(""));
                }
                else {
                    tr.appendChild(PlanReview.CreateCell(Utilities.Format_Date(p.signed_off_on)));
                }
                tr.appendChild(PlanReview.CreateCell(p.signed_off_by));
            }
            return tr;
        };
        PlanReview.CreateInitialIssueRow = function (p) {
            var tr = document.createElement("tr");
            tr.style.display = "none";
            tr.appendChild(PlanReview.CreateCell(""));
            var td = document.createElement("td");
            td.colSpan = 7;
            td.appendChild(PlanReview.CreateIssueTable());
            tr.appendChild(td);
            return tr;
        };
        PlanReview.CreateIssueTable = function () {
            var table = document.createElement("table");
            table.classList.add("table");
            table.classList.add("is-fullwidth");
            var thead = document.createElement("thead");
            table.appendChild(thead);
            thead.appendChild(PlanReview.CreateIssueHeaderRow());
            var tbody = document.createElement("tbody");
            table.appendChild(tbody);
            PermitSearch.plan_reviews_tbody = tbody;
            return table;
        };
        PlanReview.CreateIssueHeaderRow = function () {
            var tr = document.createElement("tr");
            tr.appendChild(PlanReview.CreateHeaderCell("Issue", "40%"));
            tr.appendChild(PlanReview.CreateHeaderCell("Added On", "15%"));
            tr.appendChild(PlanReview.CreateHeaderCell("Added By", "15%"));
            tr.appendChild(PlanReview.CreateHeaderCell("Signed Off On", "15%"));
            tr.appendChild(PlanReview.CreateHeaderCell("Signed Off By", "15%"));
            return tr;
        };
        PlanReview.CreateCell = function (value, className) {
            if (className === void 0) { className = ""; }
            var td = document.createElement("td");
            if (className.length > 0)
                td.classList.add(className);
            td.appendChild(document.createTextNode(value));
            return td;
        };
        PlanReview.CreateHeaderCell = function (value, width, className) {
            if (className === void 0) { className = ""; }
            var td = document.createElement("th");
            if (className.length > 0)
                td.classList.add(className);
            td.style.width = width;
            td.appendChild(document.createTextNode(value));
            return td;
        };
        PlanReview.plans_review_container = "plansReviewContainer";
        return PlanReview;
    }());
    PermitSearch.PlanReview = PlanReview;
})(PermitSearch || (PermitSearch = {}));
//# sourceMappingURL=plan_review.js.map