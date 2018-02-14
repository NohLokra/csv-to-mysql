require('dotenv').config();

let fs = require('fs');
let csv = require('fast-csv');
let DbManager = require('./db-manager.js');
let records = [];

let fileStream = fs.createReadStream("produits.csv");
let csvStream = csv({
    headers: true
}).on('data', data => {
    records.push(data);
}).on('end', () => {
    DbManager.createTableUsingDataset("products", records)
});

fileStream.pipe(csvStream);