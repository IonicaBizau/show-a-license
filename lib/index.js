require("whatwg-fetch");

var $ = require("elm-select")
  , sameTime = require("same-time")
  ;

var HASH_PREFIX = "#license-";
var licenseTable = $(".license-view table")[0];
var tableTbody = $(licenseTable, "tbody")[0];

function showNormalView() {

}

function getLicense(license, fn) {
    sameTime([
        function (done) {
            fetch("/licenses/" + license + ".txt").then(function (res) {
                return res.text();
            }).then(function (text) {
                done(null, text);
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
    var html = "<tbody>";
    data.license.forEach(function (c, i) {
        html += "<tr>";
        html += "<td class='explanation'>" + data.explanation[i] + "</td>";
        html += "<td><pre>" + c + "</pre></td>";
        html += "</tr>";
    });

    html += "</tbody>";
    tableTbody.innerHTML = html;
}

function showLicenseView(license) {
    getLicense(license, renderLicense);
}

function checkHash() {
    var hash = location.hash;
    if (hash.indexOf(HASH_PREFIX) !== 0) { return showNormalView(); }
    var license = hash.substring(HASH_PREFIX.length).toLowerCase();
    showLicenseView(license);
}

checkHash();
window.addEventListener("hashchange", checkHash);
