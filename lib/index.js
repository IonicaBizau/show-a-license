require("whatwg-fetch");

var $ = require("elm-select")
  , sameTime = require("same-time")
  , barbe = require("barbe")
  ;

var HASH_PREFIX = "#license-";
var licenseTable = $(".license-view table")[0];
var tableTbody = $("tbody", licenseTable)[0];

function showNormalView() {
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

function getLicense(license, fn) {
    sameTime([
        function (done) {
            fetch("/licenses/" + license + ".txt").then(function (res) {
                return res.text();
            }).then(function (text) {
                done(null, renderInfo(text));
            }).catch(done);
        }
      , function (done) {
            fetch("/explanations/" + license + ".txt").then(function (res) {
                return res.text();
            }).then(function (text) {
                done(null, text);
            }).catch(done);
        }
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

function renderLicense(err, data) {
    var showExplanations = Url.queryString("hide_explanations") !== "true";
    if (showExplanations) {
        licenseTable.classList.remove("shadow");
    }
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
}

function checkHash() {
    var hash = location.hash;
    if (hash.indexOf(HASH_PREFIX) !== 0) { return showNormalView(); }
    var license = hash.substring(HASH_PREFIX.length).toLowerCase();
    showLicenseView(license);
}

checkHash();
window.addEventListener("hashchange", checkHash);
