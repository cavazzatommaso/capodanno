const route = require('express').Router()
var mysql = require("mysql");
var con = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "",
    database: "capodanno"
  });
  
  con.connect(function(err) {
    if (err) throw err;
  });

route.post("/:raw", (req, res) => {
    var raw = req.params.raw;
    var name = raw.split("|")[0];
    var artist = raw.split("|")[1];
    con.query(`INSERT INTO canzoni VALUES (null,'${name}','${artist}')`, function(err, all, fields) {
        if (err) throw err;
        res.status(200).send(all)
    })
    
})

route.post("/showAll", (req, res) => {

    con.query(`SELECT * FROM canzoni)`, function(err, all, fields) {
        if (err) throw err;
        res.status(200).send(all)
    })
    
})

exports = module.exports = route