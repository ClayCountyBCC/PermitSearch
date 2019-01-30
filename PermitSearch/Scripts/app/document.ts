/// <reference path="app.ts" />

namespace PermitSearch
{
  interface IDocument
  {
    table_number: number;
    object_id: number;
    permit_number: number;
    document_type: string;
    page_count: number;
    created_on: Date;
  }

  export class Document implements IDocument
  {
    public table_number: number = -1;
    public object_id: number = -1;
    public permit_number: number = -1;
    public document_type: string = "";
    public page_count: number = 0;
    public created_on: Date = new Date();

    static documents_container: string = "documentContainer";
    static document_type_filter: string = "documentTypeFilter";
    //static download_icon: string = "content/48x48 document-save.png";

    constructor() { }

    private static CreateDocumentDownloadLink(table_number: number, object_id: number): string
    {
      return "//publicrecords.claycountygov.com/GetFile?t=" + table_number.toString() + "&o=" + object_id.toString();
    }

    public static QueryDocuments(permit_number: number): void
    {
      Document.ResetDocuments();
      let permitPrintButton = document.getElementById("PermitPrintButton");
      permitPrintButton.setAttribute("value", permit_number.toString());
      let path = PermitSearch.GetPath();
      Utilities.Get<Array<Document>>(path + "API/Permit/Documents?permitnumber=" + permit_number.toString())
        .then(function (documents: Array<Document>)
        {
          console.log("documents", documents);
          PermitSearch.permit_documents = documents;
          Document.ResetDocumentTypeFilter();
          if (documents.length === 0)
          {
            PermitSearch.CreateMessageRow(Document.documents_container, 4, "No documents were found for this permit.");
          }
          else
          {
            Document.CreateDocumentsTable(documents);
            Document.PopulateDocumentTypeFilter(documents);
          }
        }, function (e)
          {
            PermitSearch.CreateMessageRow(Document.documents_container, 4, "There was an issue retrieving the documents for this permit.  Please try again.");
            console.log('error getting permits', e);
          });
    }

    static ResetDocumentTypeFilter()
    {
      let dtf = <HTMLSelectElement>document.getElementById(Document.document_type_filter);
      Utilities.Clear_Element(dtf);
      dtf.disabled = true;
      let allTypes = document.createElement("option");
      allTypes.text = "Show All";
      allTypes.value = "all";
      allTypes.selected = true;
      dtf.add(allTypes, 0);
    }

    static PopulateDocumentTypeFilter(documents: Array<Document>): void
    {
      let dtf = <HTMLSelectElement>document.getElementById(Document.document_type_filter);
      dtf.disabled = false;
      let distinct: Array<string> = [];
      for (let d of documents)
      {
        if (distinct.indexOf(d.document_type) === -1)
        {
          distinct.push(d.document_type);
        }
      }
      distinct.sort();
      for (let d of distinct)
      {
        let option = document.createElement("option");
        option.value = d;
        option.text = d;
        dtf.add(option);
      }
    }

    public static FilterDocuments()
    {
      let documentType = Utilities.Get_Value("documentTypeFilter");
      if (documentType === "all")
      {
        Document.CreateDocumentsTable(PermitSearch.permit_documents);
      }
      else
      {
        let filtered = PermitSearch.permit_documents.filter(function (j) { return j.document_type === documentType });
        Document.CreateDocumentsTable(filtered);
      }

    }

    static CreateDocumentsTable(documents: Array<Document>): void
    {
      let df = document.createDocumentFragment();
      for (let d of documents)
      {
        df.appendChild(Document.CreateDocumentsRow(d));
      }
      let tbody = (<HTMLTableSectionElement>document.getElementById(Document.documents_container));
      Utilities.Clear_Element(tbody);
      tbody.appendChild(df);
    }

    static ResetDocuments(): void
    {
      PermitSearch.permit_documents = [];
      PermitSearch.CreateMessageRow(Document.documents_container, 4, "Loading Documents...")
    }
    
    static CreateDocumentsRow(d: Document): HTMLTableRowElement
    {
      let tr = document.createElement("tr");
      let link = Document.CreateDocumentDownloadLink(d.table_number, d.object_id);
      tr.appendChild(Document.CreateDocumentsCellLink("", link));
      tr.appendChild(Document.CreateDocumentsCell(d.document_type));
      tr.appendChild(Document.CreateDocumentsCell(d.page_count.toString(), "has-text-left"));
      tr.appendChild(Document.CreateDocumentsCell(Utilities.Format_Date(d.created_on)));
      return tr;
    }

    static CreateDocumentsCell(value: string, className: string = ""): HTMLTableCellElement
    {
      let td = document.createElement("td");
      if (className.length > 0) td.classList.add(className);
      td.appendChild(document.createTextNode(value));
      return td;
    }

    static CreateDocumentsCellLink(className: string = "", href: string = ""): HTMLTableCellElement
    {
      let td = document.createElement("td");
      if (className.length > 0) td.classList.add(className);
      let link = document.createElement("a");
      let downloadIcon = document.createElement("i");
      downloadIcon.classList.add("show");
      downloadIcon.classList.add("fas")
      downloadIcon.classList.add("fa-download");
      downloadIcon.style.color = "#20bc56";
      link.classList.add("has-text-link");
      link.href = href;      
      link.appendChild(downloadIcon);
      
      link.setAttribute("aria-label", "Download Document");
      link.onclick = function ()
      {
        Utilities.Clear_Element(link);
        let successIcon = document.createElement("i");
        successIcon.classList.add("hide");
        successIcon.classList.add("fas")
        successIcon.classList.add("fa-check-circle");
        successIcon.style.color = "#20bc56";
        link.appendChild(successIcon);
      }
      td.appendChild(link);
      return td;
    }

  }


}