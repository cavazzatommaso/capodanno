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


route.post("/", (req, res) => {

    con.query(`SELECT * FROM canzoni`, function(err, all, fields) {
        if (err) throw err;
        res.status(200).send(all)
    })
    
})

exports = module.exports = route