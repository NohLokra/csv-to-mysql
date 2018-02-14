# CSV to MySQL

## What it does
Its name says it all, it will convert a CSV file into an SQL Table

## How does it work ?

### Features
- Field type guessing (type, length, null)
- Import csv file structure to MySQL database
- Import csv file data to MySQL database

### Setup
First of all, you'll need a `.env` file in your project with the following variables:
 - DB_HOST
 - DB_USER
 - DB_PASS
 - DB_NAME

These variables are used in DbManager to connect to your MySQL server.

Of course, your csv needs to be valid or parsing will be inaccurate and you should expect some unpredictable results during the import.

### How do I use it ?
The file csv-to-mysql.js is a short example of how to use DbManager class (I probably should rename it someday):

- Require everything you'll need
```js
require('dotenv').config();

let fs = require('fs');
let csv = require('fast-csv');
let DbManager = require('./db-manager.js');
```

- Create a readStream on the csv file using fs
```js
    let fileStream = fs.createReadStream("produits.csv");
```

- Extract records from your CSV and once done, use DbManager.createTableUsingDataset()
 ```js
    let records = [];

    let csvStream = csv({
        headers: true
    }).on('data', data => {
        records.push(data);
    }).on('end', () => {
        DbManager.createTableUsingDataset("products", records)
    });

    fileStream.pipe(csvStream);
```

- Once your export JS file is written, just run it using
```sh
    node ./exportFile.js
```

## List of functions given by DbManager
- createTableStructure(tableName: String, fields: Array<Field>) : void
- createTableStructureUsingDataset(tableName: String, records: Array<any>) : void
- createTableUsingDataset(tableName: String, record: Array<any>) : void
- getFieldsFromDataset(records: Array<any>) : Array<Field>

### createTableStructure(tableName: String, fields: Array<Field>) : void
This function will simply create a table using the `tableName` and the `fields`. Its main purpose is to craft the request and send it to the database

### createTableStructureUsingDataset(tableName: String, records: Array<any>) : void
This function is the one you want to use if you have a dataset and want to generate a table from it. It will analyse the fields in every records and guess their type.
Once the fields list is done, it calls **createTableStructure()**

### createTableUsingDataset(tableName: String, record: Array<any>) : void
This one acts just like createTableStructureUsingDataset() except that it will insert the dataset into the table once creation is complete.

### getFieldsFromDataset(records: Array<any>) : Array<Field>
This is what we use to extract a list of Field from a list of records 