/// <reference path="app.ts" />
var PermitSearch;
(function (PermitSearch) {
    var LocationHash = /** @class */ (function () {
        function LocationHash(locationHash) {
            this.permit_number = "";
            this.permit_display = "";
            this.permit_status = "all";
            this.contractor_number = "";
            this.contractor_name = "";
            this.company_name = "";
            this.street_number = "";
            this.street_name = "";
            this.parcel_number = "";
            this.owner_name = "";
            this.page = "1";
            this.tab = "";
            if (locationHash.length > 0) {
                var ha = locationHash.split("&");
                for (var i = 0; i < ha.length; i++) {
                    var k = ha[i].split("=");
                    switch (k[0].toLowerCase()) {
                        case "permitnumber":
                            this.permit_number = k[1];
                            break;
                        case "permitdisplay":
                            this.permit_display = k[1];
                            break;
                        case "status":
                            this.permit_status = k[1];
                            break;
                        case "contractorid":
                            this.contractor_number = k[1];
                            break;
                        case "contractorname":
                            this.contractor_name = k[1];
                            break;
                        case "companyname":
                            this.company_name = k[1];
                            break;
                        case "streetnumber":
                            this.street_number = k[1];
                            break;
                        case "streetname":
                            this.street_name = k[1];
                            break;
                        case "owner":
                            this.owner_name = k[1];
                            break;
                        case "parcel":
                            this.parcel_number = k[1];
                            break;
                        case "page":
                            this.page = k[1];
                            break;
                    }
                }
                //this.UpdateInputs();
            }
            else {
                this.ReadInputs();
            }
        }
        LocationHash.prototype.UpdateInputs = function () {
            Utilities.Set_Value("permitStatus", this.permit_status);
            Utilities.Set_Value("permitSearch", this.permit_number);
            Utilities.Set_Value("streetNumberSearch", this.street_number);
            Utilities.Set_Value("streetNameSearch", this.street_name);
            Utilities.Set_Value("parcelSearch", this.parcel_number);
            Utilities.Set_Value("ownerSearch", this.owner_name);
            Utilities.Set_Value("contractorNumberSearch", this.contractor_number);
            Utilities.Set_Value("contractorNameSearch", this.contractor_name);
            Utilities.Set_Value("companyNameSearch", this.company_name);
        };
        LocationHash.prototype.ReadInputs = function () {
            this.permit_status = Utilities.Get_Value("permitStatus").trim();
            this.permit_number = Utilities.Get_Value("permitSearch").trim();
            //if (this.permit_number.length > 0) this.permit_display = this.permit_number;
            this.street_number = Utilities.Get_Value("streetNumberSearch").trim();
            this.street_name = Utilities.Get_Value("streetNameSearch").trim();
            this.parcel_number = Utilities.Get_Value("parcelSearch").trim();
            this.owner_name = Utilities.Get_Value("ownerSearch").trim();
            this.contractor_number = Utilities.Get_Value("contractorNumberSearch").trim();
            this.contractor_name = Utilities.Get_Value("contractorNameSearch").trim();
            this.company_name = Utilities.Get_Value("companyNameSearch").trim();
        };
        LocationHash.prototype.ReadyToSearch = function () {
            return (this.permit_number.length > 0) ||
                (this.contractor_number.length > 0) ||
                (this.contractor_name.length > 0) ||
                (this.company_name.length > 0) ||
                (this.street_number.length > 0) ||
                (this.street_name.length > 0) ||
                (this.owner_name.length > 0) ||
                (this.parcel_number.length > 0);
        };
        LocationHash.prototype.ToHash = function () {
            var h = "";
            h += LocationHash.AddToHash(this.permit_number, "permitnumber");
            h += LocationHash.AddToHash(this.permit_display, "permitdisplay");
            h += LocationHash.AddToHash(this.street_number, "streetnumber");
            h += LocationHash.AddToHash(this.street_name, "streetname");
            h += LocationHash.AddToHash(this.contractor_number, "contrctorid");
            h += LocationHash.AddToHash(this.contractor_name, "contractorname");
            h += LocationHash.AddToHash(this.company_name, "companyname");
            h += LocationHash.AddToHash(this.owner_name, "owner");
            h += LocationHash.AddToHash(this.parcel_number, "parcel");
            if (h.length === 0)
                return "";
            h += LocationHash.AddToHash(this.permit_status, "status");
            h += LocationHash.AddToHash(this.page, "page");
            if (h.length > 0) {
                h = "#" + h.substring(1) + "&v=" + new Date().getMilliseconds().toString();
            }
            return h;
        };
        LocationHash.prototype.ReadyToTogglePermit = function (oldHash) {
            // This function simply checks to see if the old search
            // is identical to the new search with the exception of the permit_display
            // argument.  If it is, then we just toggle display of the permit detail,
            // and we don't actually hit the database again.
            if (oldHash === null)
                return false;
            if ((this.permit_display.length > 0 && oldHash.permit_display.length === 0)
                || this.permit_display.length === 0 && oldHash.permit_display.length > 0) {
                return this.permit_number === oldHash.permit_number &&
                    this.company_name === oldHash.company_name &&
                    this.contractor_name === oldHash.contractor_name &&
                    this.contractor_number === oldHash.contractor_number &&
                    this.owner_name === oldHash.owner_name &&
                    this.page === oldHash.page &&
                    this.parcel_number === oldHash.parcel_number &&
                    this.permit_status === oldHash.permit_status &&
                    this.street_name === oldHash.street_name &&
                    this.street_number === oldHash.street_number;
            }
            return false;
        };
        LocationHash.AddToHash = function (field, arg) {
            if (field.length > 0)
                return "&" + arg + "=" + field;
            return "";
        };
        return LocationHash;
    }());
    PermitSearch.LocationHash = LocationHash;
})(PermitSearch || (PermitSearch = {}));
//# sourceMappingURL=locationhash.js.map