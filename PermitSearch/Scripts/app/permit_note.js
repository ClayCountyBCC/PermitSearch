/// <reference path="app.ts" />
var PermitSearch;
(function (PermitSearch) {
    "use strict";
    var PermitNote = /** @class */ (function () {
        function PermitNote() {
        }
        PermitNote.QueryPermitNotes = function (permit_number) {
            PermitNote.ResetPermitNotes();
            var path = PermitSearch.GetPath();
            Utilities.Get(path + "API/Permit/PermitNotes?permitnumber=" + permit_number.toString())
                .then(function (notes) {
                console.log("permit notes", notes);
                PermitSearch.permit_notes = notes;
                if (notes.length === 0) {
                    PermitSearch.CreateMessageRow(PermitNote.permit_notes_container, 5, "No notes were found for this permit.");
                }
                else {
                    PermitNote.CreateDocumentsTable(notes, PermitNote.permit_notes_container);
                }
            }, function (e) {
                PermitSearch.CreateMessageRow(PermitNote.permit_notes_container, 5, "There was an issue retrieving the notes for this permit.  Please try again.");
                console.log('error getting permit notes', e);
            });
        };
        PermitNote.ResetPermitNotes = function () {
            PermitSearch.permit_notes = [];
            PermitSearch.CreateMessageRow(PermitNote.permit_notes_container, 5, "Loading Notes...");
        };
        PermitNote.CreateDocumentsTable = function (notes, container) {
            var df = document.createDocumentFragment();
            for (var _i = 0, notes_1 = notes; _i < notes_1.length; _i++) {
                var n = notes_1[_i];
                df.appendChild(PermitNote.CreateRow(n));
            }
            var tbody = document.getElementById(container);
            Utilities.Clear_Element(tbody);
            tbody.appendChild(df);
        };
        PermitNote.CreateRow = function (n) {
            var tr = document.createElement("tr");
            tr.appendChild(PermitNote.CreateCell(n.permit_number.toString().padStart(8, "0")));
            tr.appendChild(PermitNote.CreateCell(PermitSearch.stripHtml(n.note)));
            tr.appendChild(PermitNote.CreateCell(n.note_type));
            if (new Date(n.created_on.toString()).getFullYear() < 1000) {
                tr.appendChild(PermitNote.CreateCell(""));
            }
            else {
                tr.appendChild(PermitNote.CreateCell(Utilities.Format_Date(n.created_on)));
            }
            tr.appendChild(PermitNote.CreateCell(n.created_by));
            return tr;
        };
        PermitNote.CreateCell = function (value, className) {
            if (className === void 0) { className = ""; }
            var td = document.createElement("td");
            if (className.length > 0)
                td.classList.add(className);
            td.appendChild(document.createTextNode(value));
            return td;
        };
        PermitNote.permit_notes_container = "permitNotesContainer";
        return PermitNote;
    }());
    PermitSearch.PermitNote = PermitNote;
})(PermitSearch || (PermitSearch = {}));
//# sourceMappingURL=permit_note.js.map