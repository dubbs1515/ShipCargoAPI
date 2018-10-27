const express = require ('express');
const router = express.Router();
const bodyParser = require('body-parser');
const ds = require('./datastore');
const datastore = ds.datastore;
const SHIP = "Ship"; // Datastore Kind (akin to RDB tables)


const PAGE_LIMIT = 3;   // Set pagination Limit

const ROOT_URL ="localhost:5015/"
// const ROOT_URL = "ship-cargo-api-dubbsc.appspot.com";

// Express Middleware
router.use(bodyParser.json());



/*******************************************************************************
 * MODEL FUNCTIONS  (Used to interact with datastore)
 ******************************************************************************/

 /******************************************************************************
 * Name: get_ships
 * Description: Returns the ship entities held in the datastore.
 *  Uses Google Datastore's cursor to facilitate pagination.  
 ******************************************************************************/
function get_ships(req) {
    var q = datastore.createQuery(SHIP).limit(PAGE_LIMIT); // Create Query (limit results to 3 at a time)
    const ships_results = {};   // Object to hold query results
    if(Object.keys(req.query).includes("cursor")) {
        q = q.start(req.query.cursor);
    }
    return datastore.runQuery(q).then((entities) => {
        ships_results.items = entities[0].map(ds.fromDataStore);
        // Check for additional pages {
        if(entities[1].moreResults !== ds.Datastore.NO_MORE_RESULTS) {
            ships_results.next = req.protocol + "://" + req.get("host") + req.baseUrl
            + "?cursor=" + entities[1].endCursor;
            
        }
        
        return ships_results;
    });
}


/*******************************************************************************
 * Name: get_entity
 * Description: Returns the entity held in the datastore, as specified by the
 *  entity "kind" argument (i.e. SHIP or CARGO) and the id argument
 ******************************************************************************/
function get_ship(id) {
    let key = datastore.key([SHIP, parseInt(id, 10)]);
    const q = datastore.createQuery(SHIP).filter('__key__', '=', key); 
    return datastore.runQuery(q).then((entity) => {                 
        return entity[0].map(ds.fromDataStore);
    });
}

/***********************************************************************************
 * Name: post_ship
 * Description: Adds a new ship to the datastore.
 **********************************************************************************/
function post_ship(name, type, length) {
    let key = datastore.key(SHIP); // Key creation
    const new_ship = {"name": name, "type": type, "length": length, "cargo": []};
    return datastore.save({"key": key, "data": new_ship})
        .then(() => {return key}); // Return key of new ship
}


/*******************************************************************************
 * END OF MODEL FUNCTIONS
 ******************************************************************************/





/*******************************************************************************
 * SHIPS CONTROLLER FUNCTIONS (Handle routing)
 ******************************************************************************/
/*******************************************************************************
 * Route: GET /ships
 * Description: Returns a list of ships currently stored in the datastore.
 *****************************************************************************/
router.get('/', function(req, res) {
    const ships = get_ships(req)
    .then((ships) => {
        // Add self links
        ships.items.forEach(element => {
            element.self = req.protocol + "://" + ROOT_URL + "ships/" + element.id;
        });
        res.status(200).json(ships);
    });
});

/*******************************************************************************
 * Route: GET /id
 * Description: Returns the ship entity specified by the id parameter.
 *****************************************************************************/
router.get('/:id', function(req, res) {
    const ship = get_ship(req.params.id)
    .then((ship) => {
        // Add self link
        ship[0].self = req.protocol + "://" + ROOT_URL + "ships/" + ship[0].id;
        res.status(200).json(ship[0]);
    });
});

/***********************************************************************************
 * Route: POST /ships
 * Description: Add a new ship to the datastore.
 **********************************************************************************/
router.post('/', function(req, res) {
    if((typeof req.body.name != "string") || (typeof req.body.type != "string") || (typeof req.body.length != "number"))
    {
        res.status(400).send("Bad Request: Bad POST data sent"); 
    }  
    else 
    {
        post_ship(req.body.name, req.body.type, req.body.length)
        .then( key => {
            res.status(201).send('{ "id": ' + key.id + ' }'); // 201 => Ship created
        });
    }
});

/*******************************************************************************
 * END OF CONTROLLER FUNCTIONS
 ******************************************************************************/

 module.exports = router;