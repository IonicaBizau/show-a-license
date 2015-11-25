// Dependencies
var $ = require("elm-select")
  , _fetch = require("whatwg-fetch")
  , sameTime = require("same-time")
  , barbe = require("barbe")
  , Err = require("err")
  ;

// Constants
var HASH_PREFIX = "#license-";

// Get the elements
var licenseTable = $(".license-view table")[0]
  , tableTbody = $("tbody", licenseTable)[0]
  , viewExplanationsEl = $("tfoot", licenseTable)[0]
  ;

// Config
var showExplanations = Url.queryString("hide_explanations") !== "true";

if (showExplanations) {
    $(".text", viewExplanationsEl)[0].innerHTML = "Hide explanations";
}

// Handle the view explanation url
viewExplanationsEl.addEventListener("click", function (e) {
    e.preventDefault();
    Url.updateSearchParam("hide_explanations", showExplanations ? "true" : undefined);
    location.reload()
});

function showNormalView() {
    $(".license-view", function (elm) {
        elm.classList.add("hide");
    });
    $(".main-view", function (elm) {
        elm.classList.remove("hide");
    });
}

function renderInfo(c) {
    var data = {}
      , thisYear = new Date().getFullYear().toString()
      , startYear = Url.queryString("year")
      ;

    data.year = startYear;
    data.fullname = Url.queryString("fullname");

    if (!data.fullname) {
        delete data.fullname;
    }

    if (data.year) {
        if (data.year < thisYear) {
            data.year += "-" + thisYear.substring(2);
        }
    } else {
        delete data.year;
    }

    return barbe(c, ["[", "]"], data).replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function doRequest(url) {
    return function (done) {
        fetch(url).then(function (res) {
            if (res.status === 404) {
                throw new Err("Not found: " + url, 404);
            }
            if (res.status >= 400) {
                throw new Err("Failed to fetch the url: " + url, res.status);
            }
            return res.text();
        }).then(function (text) {
            done(null, renderInfo(text));
        }).catch(done);
    };
}

function getLicense(license, fn) {
    sameTime([
        doRequest("/licenses/" + license + ".txt")
      , doRequest("/explanations/" + license + ".txt")
    ], function (err, data) {
        if (err) { return fn(err); }
        data = data.map(function (c) {
            return c.split("\n\n");
        });
        fn(null, {
            license: data[0]
          , explanation: data[1]
        });
    });
}

function showError(err) {
    err = err[0];
    var message = "Something";
    if (err.code === 404) {
        message = "Cannot find such a licence.";
    }
    sweetAlert("Oops...", message, "error");
}

function renderLicense(err, data) {

    if (err) {
        return showError(err);
    }

    if (showExplanations) {
        licenseTable.classList.remove("shadow");
    }

    var html = "";
    data.license.forEach(function (c, i) {
        html += "<tr>";
        if (showExplanations) {
            html += "<td class='explanation'>" + data.explanation[i] + "</td>";
        }
        html += "<td><pre>" + c + "</pre></td>";
        html += "</tr>";
    });

    tableTbody.innerHTML = html;
}

function showLicenseView(license) {
    getLicense(license, renderLicense);
    $(".main-view", function (elm) {
        elm.classList.add("hide");
    });
    $(".license-view", function (elm) {
        elm.classList.remove("hide");
    });
}

function checkHash() {
    var hash = location.hash;
    if (hash.indexOf(HASH_PREFIX) !== 0) { return showNormalView(); }
    var license = hash.substring(HASH_PREFIX.length).toLowerCase();
    showLicenseView(license);
}

window.addEventListener("hashchange", checkHash);
window.addEventListener("load", checkHash);
