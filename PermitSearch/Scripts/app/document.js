/// <reference path="app.ts" />
var PermitSearch;
(function (PermitSearch) {
    var Document = /** @class */ (function () {
        //static download_icon: string = "content/48x48 document-save.png";
        function Document() {
            this.table_number = -1;
            this.object_id = -1;
            this.permit_number = -1;
            this.document_type = "";
            this.page_count = 0;
            this.created_on = new Date();
        }
        Document.CreateDocumentDownloadLink = function (table_number, object_id) {
            return "https://publicrecords.claycountygov.com/GetFile?t=" + table_number.toString() + "&o=" + object_id.toString();
        };
        Document.QueryDocuments = function (permit_number) {
            Document.ResetDocuments();
            var path = PermitSearch.GetPath();
            Utilities.Get(path + "API/Permit/Documents?permitnumber=" + permit_number.toString())
                .then(function (documents) {
                console.log("documents", documents);
                PermitSearch.permit_documents = documents;
                Document.ResetDocumentTypeFilter();
                if (documents.length === 0) {
                    PermitSearch.CreateMessageRow(Document.documents_container, 4, "No documents were found for this permit.");
                }
                else {
                    Document.CreateDocumentsTable(documents);
                    Document.PopulateDocumentTypeFilter(documents);
                }
            }, function (e) {
                PermitSearch.CreateMessageRow(Document.documents_container, 4, "There was an issue retrieving the documents for this permit.  Please try again.");
                console.log('error getting permits', e);
            });
        };
        Document.ResetDocumentTypeFilter = function () {
            var dtf = document.getElementById(Document.document_type_filter);
            Utilities.Clear_Element(dtf);
            dtf.disabled = true;
            var allTypes = document.createElement("option");
            allTypes.text = "Show All";
            allTypes.value = "all";
            allTypes.selected = true;
            dtf.add(allTypes, 0);
        };
        Document.PopulateDocumentTypeFilter = function (documents) {
            var dtf = document.getElementById(Document.document_type_filter);
            dtf.disabled = false;
            var distinct = [];
            for (var _i = 0, documents_1 = documents; _i < documents_1.length; _i++) {
                var d = documents_1[_i];
                if (distinct.indexOf(d.document_type) === -1) {
                    distinct.push(d.document_type);
                }
            }
            distinct.sort();
            for (var _a = 0, distinct_1 = distinct; _a < distinct_1.length; _a++) {
                var d = distinct_1[_a];
                var option = document.createElement("option");
                option.value = d;
                option.text = d;
                dtf.add(option);
            }
        };
        Document.FilterDocuments = function () {
            var documentType = Utilities.Get_Value("documentTypeFilter");
            if (documentType === "all") {
                Document.CreateDocumentsTable(PermitSearch.permit_documents);
            }
            else {
                var filtered = PermitSearch.permit_documents.filter(function (j) { return j.document_type === documentType; });
                Document.CreateDocumentsTable(filtered);
            }
        };
        Document.CreateDocumentsTable = function (documents) {
            var df = document.createDocumentFragment();
            for (var _i = 0, documents_2 = documents; _i < documents_2.length; _i++) {
                var d = documents_2[_i];
                df.appendChild(Document.CreateDocumentsRow(d));
            }
            var tbody = document.getElementById(Document.documents_container);
            Utilities.Clear_Element(tbody);
            tbody.appendChild(df);
        };
        Document.ResetDocuments = function () {
            PermitSearch.permit_documents = [];
            PermitSearch.CreateMessageRow(Document.documents_container, 4, "Loading Documents...");
        };
        Document.CreateDocumentsRow = function (d) {
            var tr = document.createElement("tr");
            var link = Document.CreateDocumentDownloadLink(d.table_number, d.object_id);
            tr.appendChild(Document.CreateDocumentsCellLink("", link));
            tr.appendChild(Document.CreateDocumentsCell(d.document_type));
            tr.appendChild(Document.CreateDocumentsCell(d.page_count.toString(), "has-text-left"));
            tr.appendChild(Document.CreateDocumentsCell(Utilities.Format_Date(d.created_on)));
            return tr;
        };
        Document.CreateDocumentsCell = function (value, className) {
            if (className === void 0) { className = ""; }
            var td = document.createElement("td");
            if (className.length > 0)
                td.classList.add(className);
            td.appendChild(document.createTextNode(value));
            return td;
        };
        Document.CreateDocumentsCellLink = function (className, href) {
            if (className === void 0) { className = ""; }
            if (href === void 0) { href = ""; }
            var td = document.createElement("td");
            if (className.length > 0)
                td.classList.add(className);
            var link = document.createElement("a");
            var downloadIcon = document.createElement("i");
            downloadIcon.classList.add("show");
            downloadIcon.classList.add("fas");
            downloadIcon.classList.add("fa-download");
            downloadIcon.style.color = "#20bc56";
            link.classList.add("has-text-link");
            link.href = href;
            link.appendChild(downloadIcon);
            link.setAttribute("aria-label", "Download Document");
            link.onclick = function () {
                Utilities.Clear_Element(link);
                var successIcon = document.createElement("i");
                successIcon.classList.add("hide");
                successIcon.classList.add("fas");
                successIcon.classList.add("fa-check-circle");
                successIcon.style.color = "#20bc56";
                link.appendChild(successIcon);
            };
            td.appendChild(link);
            return td;
        };
        Document.documents_container = "documentContainer";
        Document.document_type_filter = "documentTypeFilter";
        return Document;
    }());
    PermitSearch.Document = Document;
})(PermitSearch || (PermitSearch = {}));
//# sourceMappingURL=document.js.map