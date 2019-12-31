const fs = require("fs");
var express = require("express");
const path = require("path");
var app = express();

app.use("/", express.static(path.join(__dirname, "public")));
app.use("/api", require("./routes/api").route);

app.listen(8080, function () {
    console.log("Listening on port localhost:8080");
});