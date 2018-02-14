let mysql = require('mysql');

function normalizeFieldName(fieldName) {
    return fieldName.replace(/[A-Z]{1}[^A-Z]+/g, "_$&").replace(/__| /g, "_").replace(/^_/g, "").toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, "") 
}

class Field {
    constructor(label) {
        this.label = normalizeFieldName(label);
        this.length = 10;
        this.type = "integer";
        this.possibleValues = [];
        this.null = false;
    }

    addData(value) {
        if ( this.possibleValues.indexOf(value) == -1 ) {
            this.possibleValues.push(value);
        }
    }

    getSqlText() {
        let noSizeTypes = ["double", "text"];

        let requestPart = '`' + this.label + "` " + this.type.toUpperCase();

        if ( noSizeTypes.indexOf(this.type) == -1 ) {
            requestPart += "(" + this.length + ")";
        }

        if ( this.null == false ) {
            requestPart += " NOT NULL";
        } else {
            requestPart += " NULL";
        }

        return requestPart;
    }

    guessType() {
        for ( let i = 0 ; i < this.possibleValues.length ; i++ ) {
            let value = this.possibleValues[i].trim();

            if ( value && value != "" && value != null ) {
                this._adaptLength(value);
                this._numericTypeVerifications(value);
                this._litteralTypeVerifications(value);
            } else {
                this.null = true;
            }
        }
    }

    _numericTypeVerifications(value) {
        let numericTypes = ["integer", "double"];
        
        // D'abord, on vérifie int/double
        if ( this.type == "integer" && parseInt(value) != parseFloat(value) && parseFloat(value) && parseFloat(value) !== 0 ) {
            this.type = "double";
        }

        // Ensuite, numérique/littéral
        if ( numericTypes.indexOf(this.type) != -1 ) {
            if ( !value.match(/^-?[\d\s.,]+$/gi) ) {
                // console.log("Champs", this.label, "converti en varchar après traitement de", value);
                this.type = "varchar";
            }

            if ( value.match(/^-?0\d+$/gi) ) {
                // console.log(this.label, "converti en varchar après traitement de",value);
                this.type = "varchar";
            }
        }
    }

    _litteralTypeVerifications(value) {
        // Maintenant varchar/text
        if ( this.type == "varchar" && value.length > 150 ) {
            this.type = "text";
        }
    }

    _adaptLength(value) {
        if ( this.type != "text" && value.length > this.length ) {
            this.length = Math.ceil(value.length / 10) * 10; // On arrondi à la dizaine supérieure
        }
    }
}

class DbManager {
    constructor() {
        this.connection = mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASS,
            database: process.env.DB_NAME
        });
    }

    normalizeFieldName(fieldName) {
        return fieldName.replace(/[A-Z]{1}[^A-Z]+/g, "_$&").replace(/__| /g, "_").replace(/^_/g, "").toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, "")
    }

    createTableStructure(tableName, fields) {
        let request = "CREATE TABLE IF NOT EXISTS " + tableName + " (";

        for ( let i = 0 ; i < fields.length ; i++ ) {
            let field = fields[i];
            fields[i] = field.getSqlText();
        }

        request += fields.join(", ") + ")";

        this.connection.query(request, (err, result) => {
            if ( err ) {
                console.error(request);
                console.error(err);
                throw err;
            } else {
                console.log("Structure de la table " + tableName + " créée avec succès");
            }
        });
    }

    createTableStructureUsingDataset(tableName, records) {
        let fields = this.getFieldsFromDataset(records);

        this.createTableStructure(tableName, fields);
    }

    createTableUsingDataset(tableName, records) {
        this.createTableStructureUsingDataset(tableName, records);

        // TODO insérer les données dans la table
        let fields = [];
        for ( let key in records[0] ) {
            fields.push(normalizeFieldName(key));
        }

        let sql = "INSERT INTO " + tableName + " (" + fields.join(', ') + ") VALUES (?)";
        let values = [];
        for ( let i = 0 ; i < records.length ; i++ ) {
            let record = records[i];
            let value = [];

            for ( let key in record ) {
                if ( record[key] == "" ) {
                    value.push(null);
                } else {
                    value.push(record[key].trim());
                }
            }

            if ( value.length != fields.length ) {
                throw "Erreur sur la ligne " + (i+1) + " qui contient " + value.length + "champs au lieu de " + fields.length + "\n" + value;
            }
            
            this.connection.query(sql, [value], (err, result) => {
                if ( err ) {
                    console.error(value);
                    console.error(err);
                    throw err;
                } else {
                    console.log("Insertion terminée sans problème");
                }
            })
            values.push(value);
        }

    }

    getFieldsFromDataset(records) {
        let fields = {};

        for ( let i in records[0] ) {
            let field = new Field(i);
            fields[i] = field;
        }

        for ( let i = 0; i < records.length ; i++ ) {
            let record = records[i];

            for ( let field in record ) {
                fields[field].addData(record[field]);
            }
        }

        let result = [];
        for ( let i in fields ) {
            fields[i].guessType();
            result.push(fields[i]);
        }

        return result;
    }
}

exports = module.exports = new DbManager();