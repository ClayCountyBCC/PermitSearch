/// <reference path="app.ts" />

namespace PermitSearch
{
  "use strict";

  interface IPermitNote
  {
    note_id: number;
    permit_number: number;
    note: string;
    note_type: string;
    created_on: Date;
    created_by: string;
  }

  export class PermitNote implements IPermitNote
  {
    public note_id: number;
    public permit_number: number;
    public note: string;
    public note_type: string;
    public created_on: Date;
    public created_by: string;
    static permit_notes_container: string = "permitNotesContainer";
    constructor() { }

    static QueryPermitNotes(permit_number: number): void
    {
      PermitNote.ResetPermitNotes();
      let path = PermitSearch.GetPath();
      Utilities.Get<Array<PermitNote>>(path + "API/Permit/PermitNotes?permitnumber=" + permit_number.toString())
        .then(function (notes: Array<PermitNote>)
        {
          console.log("permit notes", notes);
          PermitSearch.permit_notes = notes;
          if (notes.length === 0)
          {
            PermitSearch.CreateMessageRow(PermitNote.permit_notes_container, 5, "No notes were found for this permit.");
          }
          else
          {
            PermitNote.CreateDocumentsTable(notes, PermitNote.permit_notes_container);
          }

        }, function (e)
          {
            PermitSearch.CreateMessageRow(PermitNote.permit_notes_container, 5, "There was an issue retrieving the notes for this permit.  Please try again.");
            console.log('error getting permit notes', e);
          });
    }

    static ResetPermitNotes(): void
    {
      PermitSearch.permit_notes = [];
      PermitSearch.CreateMessageRow(PermitNote.permit_notes_container, 5, "Loading Notes...")
    }

    static CreateDocumentsTable(notes: Array<PermitNote>, container: string): void
    {
      let df = document.createDocumentFragment();
      for (let n of notes)
      {
        df.appendChild(PermitNote.CreateRow(n));
      }
      let tbody = (<HTMLTableSectionElement>document.getElementById(container));
      Utilities.Clear_Element(tbody);
      tbody.appendChild(df);
    }

    static CreateRow(n: PermitNote): HTMLTableRowElement
    {
      let tr = document.createElement("tr");
      tr.appendChild(PermitNote.CreateCell(n.permit_number.toString().padStart(8, "0")));
      tr.appendChild(PermitNote.CreateCell(PermitSearch.stripHtml(n.note)));
      tr.appendChild(PermitNote.CreateCell(n.note_type));
      if (new Date(n.created_on.toString()).getFullYear() < 1000)
      {
        tr.appendChild(PermitNote.CreateCell(""));
      }
      else
      {
        tr.appendChild(PermitNote.CreateCell(Utilities.Format_Date(n.created_on)));
      }
      tr.appendChild(PermitNote.CreateCell(n.created_by));
      return tr;
    }

    static CreateCell(value: string, className: string = ""): HTMLTableCellElement
    {
      let td = document.createElement("td");
      if (className.length > 0) td.classList.add(className);
      td.appendChild(document.createTextNode(value));
      return td;
    }



  }
}