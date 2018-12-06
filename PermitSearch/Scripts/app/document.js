/// <reference path="app.ts" />
var PermitSearch;
(function (PermitSearch) {
    class Document {
        constructor() {
            this.table_number = -1;
            this.object_id = -1;
            this.permit_number = -1;
            this.document_type = "";
            this.page_count = 0;
            this.created_on = new Date();
        }
    }
    PermitSearch.Document = Document;
})(PermitSearch || (PermitSearch = {}));
//# sourceMappingURL=document.js.map