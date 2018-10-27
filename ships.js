const express = require ('express');
const router = express.Router();
const bodyParser = require('body-parser');
const ds = require('./datastore');
const datastore = ds.datastore;
const SHIP = "Ship"; // Datastore Kind (akin to RDB tables)
const CARGO = "Cargo"; // Datastore Kind
let cargo_module = require('./cargo');


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
    const new_ship = {"name": name, "type": type, "length": length};
    return datastore.save({"key": key, "data": new_ship})
        .then(() => {return key}); // Return key of new ship
}



/***********************************************************************************
 * Name: put_ship
 * Description: Add a ship to the datastore (cannot modify cargo directly here).
 **********************************************************************************/
function put_ship(id, name, type, length) {
    const key = datastore.key([SHIP, parseInt(id,10)]);
    const ship = {"name": name, "type": type, "length": length};
    return datastore.save({"key": key, "data": ship});
}


/******************************************************************************
 * Name: delete_ship
 * Description: Deletes the ship specified by the id argument.
 *****************************************************************************/
// Pass kind of entity kind (i.e. SHIP or SLIP)
function delete_ship(id) {
    const key = datastore.key([SHIP, parseInt(id, 10)]);
    return datastore.delete(key);
}


/******************************************************************************
 * Name: put_cargo
 * Description: Assigns cargo to a ship.
 *****************************************************************************/
function put_cargo(req, ship_id, cargo_id) {
    const ship_key = datastore.key([SHIP, parseInt(ship_id, 10)]);
    return datastore.get(ship_key)
    .then((ship) => {
        console.log("Ship: " + ship[0]);
        if(typeof(ship[0].cargo) === 'undefined') {
            ship[0].cargo = []; // Add cargo property
            console.log("Adding cargo []");
        }
        new_cargo = {}
        new_cargo.id = cargo_id;
        new_cargo.self =  req.protocol + "://" + ROOT_URL
         + "cargo/" + cargo_id;
         console.log("New cargo: " + new_cargo.id + "   " + new_cargo.self);
        ship[0].cargo.push(new_cargo);

        return datastore.save({"key": ship_key, "data": ship[0]});
    });
}

/******************************************************************************
 * Name: delete_cargo
 * Description: Unloads a ship's cargo.
 *****************************************************************************/
function delete_cargo(ship_id, cargo_id) {
    const ship_key = datastore.key([SHIP, parseInt(ship_id, 10)]);
    return datastore.get(ship_key)
    .then((ship) => {
        if(typeof(ship[0].cargo) !== 'undefined') {
            let updated_manifest = ship[0].cargo;
            let remove_cargo = updated_manifest.map(function(cargo) {
                return cargo.id;
            }).indexOf(cargo_id);
            
            updated_manifest.splice(remove_cargo, 1);
            ship[0].cargo = updated_manifest;

            return datastore.save({"key": ship_key, "data": ship[0]});
        }
    });
}


/******************************************************************************
 * Name: get_ship_cargo
 * Description: Returns a list of a particular ship's cargo.
 *****************************************************************************/
function get_ship_cargo(req, ship_id) {
    // List of cargo assigned to the ship
    let q = datastore.createQuery(CARGO)
        .filter('carrier.id', '=', ship_id) // Filter by ship
        .limit(PAGE_LIMIT); // Limit results for pagination
    const cargo_results = {};
    if(Object.keys(req.query).includes("cursor")) {
        q = q.start(req.query.cursor);
    }

    return datastore.runQuery(q).then((entities) => {
        cargo_results.items = entities[0].map(ds.fromDataStore); 
        // Check for additional pages
        if(entities[1].moreResults !== ds.Datastore.NO_MORE_RESULTS) {
            cargo_results.next = req.protocol + "://" + req.get("host") + req.baseUrl
            + "?cursor=" + entities[1].endCursor; 
        }
        return cargo_results;
    });

    /*
    const ship_key = datastore.key([SHIP, parseInt(ship_id, 10)]);
    return datastore.get(ship_key)
    .then((ships) => {
        const ship = ships[0];
        // Get cargo keys (map a function to the array of cargo keys)
        const cargo_keys = ship.cargo.map((nextObj) => {
            // Returns array of keys for use by datastore
            return datastore.key([CARGO, parseInt(nextObj.id, 10)]);
        });
        // Get the cargo items (entities)
        const cargo_results =  datastore.get(cargo_keys);
    })
    .then((cargoes) => {
        console.log("returning cargo list");
        // Make keys readable form 
        cargoes = cargoes[0].map(ds.fromDataStore);
        // Add self links
        cargoes.forEach(element => {
            element.self = req.protocol + "://" + ROOT_URL + "cargo/" 
            + element.id;
        });
        return cargoes;*/
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

/******************************************************************************
 * Route: GET /ships/id
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

/******************************************************************************
 * Route: POST /ships
 * Description: Add a new ship to the datastore.
 *****************************************************************************/
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

/******************************************************************************
 * Route: PUT /ships/:ids
 * Description: Update a ship's properties by ship id.
 *****************************************************************************/
router.put('/ships/:id', function(req, res) {

    if((typeof req.body.name != "string") || (typeof req.body.type != "string") || (typeof req.body.length != "number"))
    {
        res.status(400).send("Invalid Ship PUT Values Received"); 
    }  
    else 
    {
        put_ship(req.params.id, req.body.name, req.body.type, req.body.length)
        .then(res.status(200).end())
        .catch(e => {
            console.log(e.message);
            res.status(400).send(e.message);
        });
    }
});


/******************************************************************************
 * Route: DELETE /ships/:id
 * Description: Deletes a ship by id.
 *****************************************************************************/
router.delete('/:id', function(req,res) {
    // First, unload any cargo
    get_ship(req.params.id)
    .then((ship) => {
        // Free ship from slip if ship was docked
        if(typeof(ship[0].cargo) != 'undefined'){
            console.log("Amount of cargo: " + ship[0].cargo.length)
            if(ship[0].cargo.length != 0) {
                console.log("Unloading Ship's Cargo");
                // Unload Cargo -> Update cargo carrier property
            }
        }
        
        delete_ship(req.params.id)
        .then(res.status(200).end());
    });
}); 


/*******************************************************************************
 * Name: /ships/:ship_id/cargo/:cargo_id
 * Description: Assigns cargo to a ship.
 ******************************************************************************/
router.put('/:ship_id/cargo/:cargo_id', function(req, res) {
    put_cargo(req, req.params.ship_id, req.params.cargo_id)
    .then(res.status(200).end());

});
    /*
    .then(
        // Update cargo with carrier
    cargo_module.update_cargo_carrier(req, req.params.cargo_id, req.params.ship_id)
    .then(res.status(200).end())*/
    
    


/*******************************************************************************
 * Name: /ships/:ship_id/cargo/:cargo_id
 * Description: Deletes the specified piece of cargo from a ship.
 ******************************************************************************/
router.delete('/:ship_id/cargo/:cargo_id', function(req, res) {
    delete_cargo(req.params.ship_id, req.params.cargo_id)
    .then(res.status(200).end());
    

    
});


/*******************************************************************************
 * Name: /ships/:ship_id/cargo
 * Description: Returns a list of a ship's cargo.
 ******************************************************************************/
router.get('/:ship_id/cargo', function(req, res) {
    console.log("from route, ship id: " + req.params.ship_id);
    const cargoes = get_ship_cargo(req, req.params.ship_id)
    .then((cargoes) => {
        // Add self links
        cargoes.items.forEach(element => {
            element.self = req.protocol + "://" + ROOT_URL + "cargo/" 
            + element.id;
        });
        res.status(200).json(cargoes);
    });
});

/*******************************************************************************
 * END OF CONTROLLER FUNCTIONS
 ******************************************************************************/

 module.exports = router;