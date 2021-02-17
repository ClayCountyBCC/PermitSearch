/// <reference path="menuitem.ts" />
var Utilities;
(function (Utilities) {
    function Hide(e) {
        if (typeof e == "string") {
            e = document.getElementById(e);
        }
        e.classList.add("hide");
        e.classList.remove("show");
        e.classList.remove("show-inline");
        e.classList.remove("show-flex");
    }
    Utilities.Hide = Hide;
    function Show(e) {
        if (typeof e == "string") {
            e = document.getElementById(e);
        }
        e.classList.add("show");
        e.classList.remove("hide");
        e.classList.remove("show-inline");
        e.classList.remove("show-flex");
    }
    Utilities.Show = Show;
    function Show_Inline(e) {
        if (typeof e == "string") {
            e = document.getElementById(e);
        }
        e.classList.add("show-inline");
        e.classList.remove("hide");
        e.classList.remove("show");
        e.classList.remove("show-flex");
    }
    Utilities.Show_Inline = Show_Inline;
    function Show_Flex(e) {
        if (typeof e == "string") {
            e = document.getElementById(e);
        }
        e.classList.add("show-flex");
        e.classList.remove("hide");
        e.classList.remove("show-inline");
        e.classList.remove("show");
    }
    Utilities.Show_Flex = Show_Flex;
    function Error_Show(e, errorText, timeout) {
        if (typeof e == "string") {
            e = document.getElementById(e);
        }
        if (errorText) {
            //Set_Text(e, errorText);
            Clear_Element(e);
            var notification = document.createElement("div");
            notification.classList.add("notification");
            notification.classList.add("is-danger");
            var deleteButton = document.createElement("button");
            deleteButton.classList.add("delete");
            deleteButton.onclick = function () {
                Hide(e);
            };
            notification.appendChild(deleteButton);
            if (Array.isArray(errorText)) {
                // we're assuming that errorText is an array if we get here.
                var ul_1 = document.createElement("ul");
                errorText.forEach(function (et) {
                    var li = document.createElement("li");
                    li.appendChild(document.createTextNode(et));
                    ul_1.appendChild(li);
                });
                notification.appendChild(ul_1);
            }
            else {
                notification.appendChild(document.createTextNode(errorText));
            }
            e.appendChild(notification);
        }
        Show(e);
        if (timeout == undefined || timeout === true) {
            window.setTimeout(function (j) {
                Hide(e);
            }, 10000);
        }
    }
    Utilities.Error_Show = Error_Show;
    function Clear_Element(node) {
        if (node === null || node === undefined)
            return;
        while (node.firstChild) {
            node.removeChild(node.firstChild);
        }
    }
    Utilities.Clear_Element = Clear_Element;
    function Create_Option(value, label, selected) {
        if (selected === void 0) { selected = false; }
        var o = document.createElement("option");
        o.value = value;
        o.text = label;
        o.selected = selected;
        return o;
    }
    Utilities.Create_Option = Create_Option;
    function Get_Value(e) {
        if (typeof e == "string") {
            e = document.getElementById(e);
        }
        return e.value;
    }
    Utilities.Get_Value = Get_Value;
    function Set_Value(e, value) {
        if (typeof e == "string") {
            e = document.getElementById(e);
        }
        e.value = value;
    }
    Utilities.Set_Value = Set_Value;
    function Set_Text(e, value) {
        if (typeof e == "string") {
            e = document.getElementById(e);
        }
        Clear_Element(e);
        e.appendChild(document.createTextNode(value));
    }
    Utilities.Set_Text = Set_Text;
    function Show_Menu(elementId) {
        //let element = e.srcElement;
        // we expect the element's id to be in a "nav-XXX" name format, where 
        // XXX is the element we want to show 
        var id = elementId.replace("nav-", "");
        var menuItems = document.querySelectorAll("#menuTabs > li > a");
        if (menuItems.length > 0) {
            for (var i = 0; i < menuItems.length; i++) {
                var item = menuItems.item(i);
                if (item.id === elementId) {
                    item.parentElement.classList.add("is-active");
                }
                else {
                    item.parentElement.classList.remove("is-active");
                }
            }
        }
        Show_Hide_Selector("#views > section", id);
    }
    Utilities.Show_Menu = Show_Menu;
    function Handle_Tabs(tabSelector, containerSelector, id) {
        Activate_Inactivate_Selector(tabSelector, "nav-" + id);
        Show_Hide_Selector(containerSelector, id);
    }
    Utilities.Handle_Tabs = Handle_Tabs;
    function Activate_Inactivate_Selector(selector, id) {
        var sections = document.querySelectorAll(selector);
        if (sections.length > 0) {
            for (var i = 0; i < sections.length; i++) {
                var item = sections.item(i);
                if (item.id === id) {
                    item.classList.add("is-active");
                }
                else {
                    item.classList.remove("is-active");
                }
            }
        }
    }
    Utilities.Activate_Inactivate_Selector = Activate_Inactivate_Selector;
    function Show_Hide_Selector(selector, id) {
        var sections = document.querySelectorAll(selector);
        if (sections.length > 0) {
            for (var i = 0; i < sections.length; i++) {
                var item = sections.item(i);
                if (item.id === id) {
                    Show(item);
                }
                else {
                    Hide(item);
                }
            }
        }
    }
    Utilities.Show_Hide_Selector = Show_Hide_Selector;
    function Get(url) {
        return fetch(url, {
            method: "GET",
            headers: {
                "Content-Type": "application/json" //,"Upgrade-Insecure-Requests": "1"
            },
            cache: "no-cache",
            credentials: "include"
        })
            .then(function (response) {
            if (!response.ok) {
                throw new Error(response.statusText);
            }
            return response.json();
        });
    }
    Utilities.Get = Get;
    function Post(url, data) {
        return fetch(url, {
            method: "POST",
            body: JSON.stringify(data),
            cache: "no-cache",
            headers: {
                "Content-Type": "application/json"
            },
            credentials: "include"
        }).then(function (response) {
            console.log('Post Response', response);
            if (!response.ok) {
                throw new Error(response.statusText);
            }
            return response.json();
        });
    }
    Utilities.Post = Post;
    function Format_Amount(amount) {
        return amount.toLocaleString('en-US', { style: 'currency', currency: 'USD' });
    }
    Utilities.Format_Amount = Format_Amount;
    function Format_Date(date) {
        if (date instanceof Date) {
            if (date.getFullYear() < 1000)
                return '';
            return date.toLocaleDateString('en-us');
        }
        if (new Date(date).getFullYear() < 1000)
            return '';
        return new Date(date).toLocaleDateString('en-US');
    }
    Utilities.Format_Date = Format_Date;
    function Validate_Text(e, errorElementId, errorText) {
        // this should only be used for required elements.
        if (typeof e == "string") {
            e = document.getElementById(e);
        }
        var ele = e;
        ele.tagName.toLowerCase() === "select" ? ele.parentElement.classList.remove("is-danger") : ele.classList.remove("is-danger");
        var v = Get_Value(ele).trim();
        if (v.length == 0) {
            ele.tagName.toLowerCase() === "select" ? ele.parentElement.classList.add("is-danger") : ele.classList.add("is-danger");
            Error_Show(errorElementId, errorText);
            ele.focus();
            ele.scrollTo();
            return "";
        }
        return v;
    }
    Utilities.Validate_Text = Validate_Text;
    function Toggle_Loading_Button(e, disabled) {
        if (typeof e == "string") {
            e = document.getElementById(e);
        }
        var b = e;
        b.disabled = disabled;
        b.classList.toggle("is-loading", disabled);
    }
    Utilities.Toggle_Loading_Button = Toggle_Loading_Button;
    function Create_Menu_Element(menuItem) {
        var li = document.createElement("li");
        if (menuItem.selected)
            li.classList.add("is-active");
        var a = document.createElement("a");
        a.id = menuItem.id;
        a.onclick = function () {
            Update_Menu(menuItem);
        };
        if (menuItem.icon.length > 0) {
            var span = document.createElement("span");
            span.classList.add("icon");
            span.classList.add("is-medium");
            var i = document.createElement("i");
            var icons = menuItem.icon.split(" ");
            for (var _i = 0, icons_1 = icons; _i < icons_1.length; _i++) {
                var icon = icons_1[_i];
                i.classList.add(icon);
            }
            span.appendChild(i);
            a.appendChild(span);
        }
        a.appendChild(document.createTextNode(menuItem.label));
        li.appendChild(a);
        return li;
    }
    Utilities.Create_Menu_Element = Create_Menu_Element;
    function Update_Menu(menuItem) {
        Set_Text("menuTitle", menuItem.title);
        Set_Text("menuSubTitle", menuItem.subTitle);
        Show_Menu(menuItem.id);
        document.getElementById(menuItem.autofocusId).focus();
        PermitSearch.selected_tab = menuItem.label;
    }
    Utilities.Update_Menu = Update_Menu;
    function Build_Menu_Elements(target, Menus) {
        var menu = document.getElementById(target);
        for (var _i = 0, Menus_1 = Menus; _i < Menus_1.length; _i++) {
            var menuItem = Menus_1[_i];
            menu.appendChild(Utilities.Create_Menu_Element(menuItem));
        }
    }
    Utilities.Build_Menu_Elements = Build_Menu_Elements;
    function CheckBrowser() {
        var browser = "";
        if ((navigator.userAgent.indexOf("Opera") || navigator.userAgent.indexOf('OPR')) != -1) {
            browser = 'Opera';
        }
        else if (navigator.userAgent.indexOf("Chrome") != -1) {
            browser = 'Chrome';
        }
        else if (navigator.userAgent.indexOf("Safari") != -1) {
            browser = 'Safari';
        }
        else if (navigator.userAgent.indexOf("Firefox") != -1) {
            browser = 'Firefox';
        }
        else if ((navigator.userAgent.indexOf("MSIE") != -1) || (!!document.DOCUMENT_NODE == true)) //IF IE > 10
         {
            browser = 'IE';
        }
        else {
            browser = 'unknown';
        }
        return browser;
    }
    Utilities.CheckBrowser = CheckBrowser;
})(Utilities || (Utilities = {}));
//# sourceMappingURL=utilities.js.map