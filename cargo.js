const express = require ('express');
const router = express.Router();
const bodyParser = require('body-parser');
const ds = require('./datastore');
const datastore = ds.datastore;
const SHIP = "Ship"; // Datastore Kind (akin to RDB tables)
const CARGO = "Cargo";  // Datastore Kind (akin to RDB tables)



const PAGE_LIMIT = 3;   // Set pagination Limit

const ROOT_URL ="localhost:5015/"
// const ROOT_URL = "ship-cargo-api-dubbsc.appspot.com";

// Express Middleware
router.use(bodyParser.json()); 


/*******************************************************************************
 * MODEL FUNCTIONS  (Used to interact with datastore)
 ******************************************************************************/

 /******************************************************************************
 * Name: get_cargoes
 * Description: Returns the cargoes held in the datastore
 ******************************************************************************/
function get_cargoes(req) {
    var q = datastore.createQuery(CARGO).limit(PAGE_LIMIT);
    const cargo_results = {};   // Object to hold query results
    if(Object.keys(req.query).includes("cursor")) {
        q = q.start(req.query.cursor);  // Set start of next page
        
    }
    return datastore.runQuery(q).then((entities) => {
        cargo_results.items = entities[0].map(ds.fromDataStore); // 0 Index holds results
        // Check for additional pages
        if(entities[1].moreResults !== ds.Datastore.NO_MORE_RESULTS) {
            cargo_results.next = req.protocol + "://" + req.get("host") + req.baseUrl
            + "?cursor=" + entities[1].endCursor; 
        }
        return cargo_results;
    });
}


/***********************************************************************************
 * Name: delete_cargo
 * Description: Deletes the cargo specified by the id argument.
 **********************************************************************************/
// Pass kind of entity kind (i.e. SHIP or SLIP)
function delete_cargo(id) {
    const key = datastore.key([CARGO, parseInt(id, 10)]);
    return datastore.delete(key);
}


/*******************************************************************************
 * Name: get_cargo
 * Description: Returns the entity held in the datastore, as specified by the
 *  entity "kind" argument (i.e. SHIP or CARGO) and the id argument
 ******************************************************************************/
function get_cargo(id) {
    let key = datastore.key([CARGO, parseInt(id, 10)]);
    const q = datastore.createQuery(CARGO).filter('__key__', "=", key);
    return datastore.runQuery(q).then((entity) => {
       return entity[0].map(ds.fromDataStore); 
    });
}


/***********************************************************************************
 * Name: post_cargo
 * Description: Adds a new cargo to the datastore.
 **********************************************************************************/
function post_cargo(weight, content, delivery_date) {
    let key = datastore.key(CARGO); // Key creation
    const new_ship = {"weight": weight, "content": content, "carrier": null, 
    "delivery_date": delivery_date};
    return datastore.save({"key": key, "data": new_ship})
        .then(() => {return key}); // Return key of new ship
}


/******************************************************************************
 * Route: put_carrier
 * Description: Add carrier information to a cargo item.
 *****************************************************************************/
function put_carrier(req, cargo_id, ship_id) {
    const cargo_key = datastore.key([CARGO, parseInt(cargo_id, 10)]);
    return datastore.get(cargo_key)
    .then((cargo) => {
        // Get ship info to add 
        const ship_key = datastore.key([SHIP, parseInt(ship_id, 10)]);
            return datastore.get(ship_key)
        .then((ship) => {
            ship_info = {};
            ship_info.name = ship[0].name;
            ship_info.id = ship_id;
            ship_info.self = req.protocol + "://" + ROOT_URL + "ships/" + ship_id;
                
            cargo[0].carrier = ship_info;
            return datastore.save({"key": cargo_key, "data": cargo[0]});
        });     
    });
}

/******************************************************************************
 * Route: delete_carrier
 * Description: Remove carrier information from a cargo item.
 *****************************************************************************/
function delete_carrier(cargo_id, ship_id) {
    const cargo_key = datastore.key([CARGO, parseInt(cargo_id, 10)]);
    return datastore.get(cargo_key)
    .then((cargo) => { 
        cargo[0].carrier = {};
        return datastore.save({"key": cargo_key, "data": cargo[0]});
    });
}

/*******************************************************************************
 * END OF MODEL FUNCTIONS
 ******************************************************************************/





/*******************************************************************************
 * CARGO CONTROLLER FUNCTIONS (Handle routing)
 ******************************************************************************/

/*******************************************************************************
 * Route: GET /cargo
 * Description: Returns a list of cargoes currently stored in the datastore.
 *****************************************************************************/
router.get('/', function(req, res) {
    const cargo = get_cargoes(req)
    .then((cargo) => {
        // Add self links
        cargo.items.forEach(element => {
            element.self = req.protocol + "://" + ROOT_URL + 
            "cargo/" + element.id;
        });
        res.status(200).json(cargo);
    });
    
});


/******************************************************************************
 * Route: GET /id
 * Description: Returns the ship entity specified by the id parameter.
 *****************************************************************************/
router.get('/:id', function(req, res) {
    const cargo = get_cargo(req.params.id)
    .then((cargo) => {
        // Add self link
        cargo[0].self = req.protocol + "://" + ROOT_URL + "cargo/" + cargo[0].id;
        res.status(200).json(cargo[0]);
    });
});

/******************************************************************************
 * Route: POST /
 * Description: Add a new ship to the datastore.
 *****************************************************************************/
router.post('/', function(req, res) {
    if((typeof req.body.weight != "number") || (typeof req.body.content != "string")
     || (typeof req.body.delivery_date != "string"))
    {
        res.status(400).send("Bad Request: Bad POST data sent"); 
    }  
    else 
    {
        post_cargo(req.body.weight, req.body.content, req.body.delivery_date)
        .then( key => {
            res.status(201).send('{ "id": ' + key.id + ' }'); // 201 => Ship created
        });
    }
});


/***********************************************************************************
 * Route: PUT /cargo/:id
 * Description: Update a ship's properties by ship id.
 **********************************************************************************/
router.put('/cargo/:id', function(req, res) {

    if((typeof req.body.weight != "number") || (typeof req.body.content != "string") 
    || (typeof req.body.delivery_date != "string"))
    {
        res.status(400).send("Invalid Cargo PUT Values Received"); 
    }  
    else 
    {
        put_cargo(req.params.id, req.body.weight, req.body.content, 
            req.body.delivery_date)
        .then(res.status(200).end());
    }
});


/******************************************************************************
 * Route: DELETE /:id
 * Description: Deletes a cargo by id.
 *****************************************************************************/
router.delete('/:id', function(req,res) {
    delete_cargo(req.params.id)
    .then(res.status(200).end());
}); 


/******************************************************************************
 * Route: PUT cargo/:cargo_id/ship/:ship_id
 * Description: Assign carrier.
 *****************************************************************************/
router.put('/:cargo_id/ships/:ship_id', function(req, res) {
    put_carrier(req, req.params.cargo_id, req.params.ship_id)
    .then(res.status(200).end());
});



/******************************************************************************
 * Route: PUT cargo/:cargo_id/ship/:ship_id
 * Description: Unassign carrier.
 *****************************************************************************/
router.delete('/:cargo_id/ships/:ship_id', function(req, res) {
    delete_carrier(req, req.params.cargo_id, req.params.ship_id)
    .then(res.status(200).end());
});


/*******************************************************************************
 * END OF CONTROLLER FUNCTIONS
 ******************************************************************************/

 module.exports = router;
