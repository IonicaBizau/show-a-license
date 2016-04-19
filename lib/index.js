// Dependencies
var $ = require("elm-select")
  , _fetch = require("whatwg-fetch")
  , sameTime = require("same-time")
  , barbe = require("barbe")
  , Err = require("err")
  , yearRange = require("year-range")
  ;

// Constants
var HASH_PREFIX = "#license-";

// Get the elements
var licenseTable = $(".license-view table")[0]
  , tableTbody = $("tbody", licenseTable)[0]
  , viewExplanationsEl = $("tfoot", licenseTable)[0]
  , searchLicenseEl = $("input.awesomplete")[0]
  ;

searchLicenseEl.setAttribute("data-list", _licenses.join(","));
searchLicenseEl.addEventListener("awesomplete-selectcomplete", function () {
    location.hash = "license-" + this.value;
});

// Config
var showExplanations;

function checkExplanationState() {
    showExplanations = Url.queryString("hide_explanations") !== "true";
    if (showExplanations) {
        $(".text", viewExplanationsEl)[0].innerHTML = "Hide explanations";
    } else {
        $(".text", viewExplanationsEl)[0].innerHTML = "Show explanations";
    }
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
    searchLicenseEl.focus();

}

function renderInfo(c) {
    var data = {}
      , startYear = parseInt(Url.queryString("year"))
      ;

    data.year = startYear;
    data.fullname = Url.queryString("fullname");

    if (!data.fullname) {
        delete data.fullname;
    }

    if (data.year) {
        data.year = yearRange(data.year);
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
    err = err[0] || err;
    var sweetErr = {
        title: "Oops..."
      , text: err.toString()
      , type: "error"
      , html: true
    };

    // License not found
    if (err.code === 404) {
        sweetErr.text = "Cannot find such a licence. Feel free to <a href='https://github.com/IonicaBizau/showalicense.com#adding-a-new-license'>add it</a>.";
        location.hash = "";
    } else if (err.code === "EXPLANATION_DOES_NOT_EXIST") {
        sweetErr.type = "warning";
        sweetErr.text = "This license doesn't have any explanation. Feel free to <a href='https://github.com/IonicaBizau/showalicense.com#explaining-a-license'>add it</a>.";
    }

    // Show the error
    sweetAlert(sweetErr);
}

function renderLicense(err, data) {

    if (err) {
        return showError(err);
    }

    if (showExplanations) {
        if (!data.explanation.join("")) {
            showError(new Err("Explanation doesn't exist. You can add it ", "EXPLANATION_DOES_NOT_EXIST"));
            showExplanations = false;
            Url.updateSearchParam("hide_explanations", true);
            checkExplanationState();
        } else {
            licenseTable.classList.remove("shadow");
        }
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
    checkExplanationState();
}

window.addEventListener("hashchange", checkHash);
window.addEventListener("load", checkHash);
