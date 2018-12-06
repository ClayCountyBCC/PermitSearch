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

    constructor() {}
  }


}