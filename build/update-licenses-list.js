const fs = require("fs")
    , abs = require("abs")
    ;

var licenses = fs.readdirSync(abs(__dirname + "/../licenses")).filter(
    c => c.charAt(0) !== "."
).map(c => c.replace(".txt", ""));

fs.writeFileSync(__dirname + "/../js/meta.js", "_licenses = " + JSON.stringify(licenses) + ";");
