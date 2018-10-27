/*******************************************************************************
 Author: Christopher Dubbs
 API Name: Cargo Ship API
 Date Last Modified: October 27, 2018
 Last Modified By: Christopher Dubbs
 Hosting: Google Cloud AppEngine and Google Cloud Datastore
*******************************************************************************/
const express = require ('express');
const app = express();
const Datastore = require('@google-cloud/datastore');
const PORT = process.env.PORT || 5015;
var path = require("path");
app.use(express.static(__dirname));

app.use(express.static("public"));
app.use('/', require('./index'));



// Listen on App-Engine Port or 5015
app.listen(PORT, () => {
	console.log(`Listening on port ${PORT}... :)`);
});


