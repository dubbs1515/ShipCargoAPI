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
//const bodyParser = require('body-parser');
const PORT = process.env.PORT || 5015;
var path = require("path");
app.use(express.static(__dirname));

app.use(express.static("public"));
app.use('/', require('./index'));
//const projectId = 'ship-cargo-api-dubbsc';
//const datastore = new Datastore({
//	projectId: projectId,
//});

// Express Routing
//const router = express.Router();



// API Datastore Kinds (akin to RDB tables)
//const SHIP = "Ship"; 


const ROOT_URL ="localhost:5015/"
// const ROOT_URL = "http://ship-cargo-api-dubbsc.appspot.com";



/*******************************************************************************
 * HELPER FUNCTIONS
 ******************************************************************************/
 /******************************************************************************
 * Name: fromDataStore
 * Description: Helper function for datastore interaction. A key is stored 
 ******************************************************************************/
/*function fromDataStore(item) {
	item.id = item[Datastore.KEY].id;
	return item;	
}*/

/*******************************************************************************
 * MODEL FUNCTIONS  (Used to interact with datastore)
 ******************************************************************************/

 /******************************************************************************
 * Name: get_entities
 * Description: Returns the entities held in the datastore, as specified by the
 *  entity "kind" argument (i.e. SHIP or CARGO)
 ******************************************************************************/
/*function get_entities(kind) {
    const q = datastore.createQuery(kind); // Create Query
    // Run Query
    return datastore.runQuery(q).then((entities) => {
        return entities[0].map(fromDataStore);
    });
}*/


/*******************************************************************************
 * Name: get_entity
 * Description: Returns the entity held in the datastore, as specified by the
 *  entity "kind" argument (i.e. SHIP or CARGO) and the id argument
 ******************************************************************************/
/*function get_entity(kind, id) {
    let key = datastore.key([kind, parseInt(id, 10)]);
    const q = datastore.createQuery(kind).filter('__key__', '=', key); 
    return datastore.runQuery(q).then((entity) => {                 
        return entity[0].map(fromDataStore);
    });
}*/

/***********************************************************************************
 * Name: post_ship
 * Description: Adds a new ship to the datastore.
 **********************************************************************************/
/*function post_ship(name, type, length) {
    let key = datastore.key(SHIP); // Key creation
    const new_ship = {"name": name, "type": type, "length": length, "self": ""};
    return datastore.save({"key": key, "data": new_ship})
        .then(() => {return key}); // Return key of new ship
}*/




/*******************************************************************************
 * END OF CONTROLLER FUNCTIONS
 ******************************************************************************/


//app.use('', router);

// Listen on App-Engine Port or 5015
app.listen(PORT, () => {
	console.log(`Listening on port ${PORT}... :)`);
});


