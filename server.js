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
const bodyParser = require('body-parser');
const PORT = process.env.PORT || 5015;
var path = require("path");
app.use(express.static(__dirname));

const projectId = 'ship-cargo-api-dubbsc';
const datastore = new Datastore({
	projectId: projectId,
});

// Express Routing
const router = express.Router();

// Express Middleware
app.use(bodyParser.json());

// API Datastore Kinds (akin to RDB tables)
const SHIP = "Ship"; 
const CARGO = "Cargo";

const ROOT_URL ="localhost:5015/"
// const ROOT_URL = "http://ship-cargo-api-dubbsc.appspot.com";



/*******************************************************************************
 * HELPER FUNCTIONS
 ******************************************************************************/
 /******************************************************************************
 * Name: fromDataStore
 * Description: Helper function for datastore interaction. A key is stored 
 ******************************************************************************/
function fromDataStore(item) {
	item.id = item[Datastore.KEY].id;
	return item;	
}

/*******************************************************************************
 * MODEL FUNCTIONS  (Used to interact with datastore)
 ******************************************************************************/

 /******************************************************************************
 * Name: get_entities
 * Description: Returns the entities held in the datastore, as specified by the
 *  entity "kind" argument (i.e. SHIP or CARGO)
 ******************************************************************************/
function get_entities(kind) {
    const q = datastore.createQuery(kind); // Create Query
    // Run Query
    return datastore.runQuery(q).then((entities) => {
        return entities[0].map(fromDataStore);
    });
}


/*******************************************************************************
 * Name: get_entity
 * Description: Returns the entity held in the datastore, as specified by the
 *  entity "kind" argument (i.e. SHIP or CARGO) and the id argument
 ******************************************************************************/
function get_entity(kind, id) {
    let key = datastore.key([kind, parseInt(id, 10)]);
    const q = datastore.createQuery(kind).filter('__key__', '=', key); 
    return datastore.runQuery(q).then((entity) => {                 
        return entity[0].map(fromDataStore);
    });
}


/*******************************************************************************
 * CONTROLLER FUNCTIONS (Handle routing)
 ******************************************************************************/
/*******************************************************************************
 * Route: GET /ships
 * Description: Returns a list of ships currently stored in the datastore.
 *****************************************************************************/
router.get('/ships', function(req, res) {
    const ships = get_entities(SHIP)
    .then((ships) => {
        res.status(200).json(ships);
    });
});

/*******************************************************************************
 * Route: GET /cargo
 * Description: Returns a list of cargoes currently stored in the datastore.
 *****************************************************************************/
router.get('/cargo', function(req, res) {
    const cargo = get_entities(CARGO)
    .then((cargo) => {
        res.status(200).json(cargo);
    });
});

/*******************************************************************************
 * END OF CONTROLLER FUNCTIONS
 ******************************************************************************/

app.use(express.static("public"));
app.use('', router);

// Listen on App-Engine Port or 5015
app.listen(PORT, () => {
	console.log(`Listening on port ${PORT}... :)`);
});


