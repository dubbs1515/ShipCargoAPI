const express = require ('express');
const router = express.Router();
const bodyParser = require('body-parser');
const ds = require('./datastore');
const datastore = ds.datastore;
const SHIP = "Ship"; // Datastore Kind (akin to RDB tables)
const CARGO = "Cargo"; // Datastore Kind


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
function delete_ship(ship_id) {
    const ship_key = datastore.key([SHIP, parseInt(ship_id, 10)]);
    return datastore.get(ship_key)
    .then((ship) => {
        // Unload ship if necessary
        if(typeof(ship[0].cargo) !== 'undefined' || ship[0].cargo === []) {
            ship[0].cargo.forEach(element => {
                cargo_id = element.id;
                const cargo_key = datastore.key([CARGO, parseInt(cargo_id, 10)]);
                return datastore.get(cargo_key)
                .then((cargo) => {
                    cargo[0].carrier = {};
                    return datastore.save({"key": cargo_key, "data": cargo[0]});
                });
                
            });
        }
        return datastore.delete(ship_key);
    });
}


/******************************************************************************
 * Name: put_cargo
 * Description: Assigns cargo to a ship.
 *****************************************************************************/
function put_cargo(req, ship_id, cargo_id, res) {
    // 1. Assign carrier to cargo
    const cargo_key = datastore.key([CARGO, parseInt(cargo_id, 10)]);
    return datastore.get(cargo_key)
    .then((cargoes) => {
        let cargo = cargoes[0];
        // Ensure that the cargo is not already assigned to another carrier
        try 
        {
            if(cargo.carrier !== {} && cargo.carrier !== null) {
                console.log("Quiting 403...");
                throw "Carrier already assigned!";
            }
        } 
        catch (error) {
            return
        }
        const ship_key = datastore.key([SHIP, parseInt(ship_id, 10)]);
        return datastore.get(ship_key)
        .then((ships) => {
            let ship = ships[0];
            // 1. Assign carrier to cargo
            ship_info = {};
            ship_info.name = ship.name;
            ship_info.id = ship_id;
            ship_info.self = req.protocol + "://" + ROOT_URL + "ships/" + ship_id;
            cargo.carrier = ship_info;
            return datastore.save({"key": cargo_key, "data": cargo})
            // 2. Assign cargo to ship
            .then(() => {
                if(typeof(ship.cargo) === 'undefined') {
                    ship.cargo = []; // Add cargo property
                }
                new_cargo = {}
                new_cargo.id = cargo_id;
                new_cargo.self =  req.protocol + "://" + ROOT_URL
                    + "cargo/" + cargo_id;
                ship.cargo.push(new_cargo);
        
                return datastore.save({"key": ship_key, "data": ship});
            })
            .catch();
        })
        .catch();     
    })
    .catch(res.status(403).end());
}

/******************************************************************************
 * Name: delete_ship_cargo
 * Description: Unloads a ship's cargo.
 *****************************************************************************/
function delete_ship_cargo(ship_id, cargo_id) {
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
            cargo_results.next = req.protocol + "://" + req.get("host") + 'ships/'
            + ship_id + '/cargo'+ "?cursor=" + entities[1].endCursor; 
        }
        return cargo_results;
    });
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

    if((typeof req.body.name != "string") || (typeof req.body.type != "string")
     || (typeof req.body.length != "number"))
    {
        res.status(400).send("Invalid Ship PUT Values Received"); 
    }  
    else 
    {
        put_ship(req.params.id, req.body.name, req.body.type, req.body.length)
        .then(res.status(200).end());
    }
});


/******************************************************************************
 * Route: DELETE /ships/:id
 * Description: Deletes a ship by id.
 *****************************************************************************/
router.delete('/:id', function(req,res) {    
        delete_ship(req.params.id)
        .then(res.status(200).end());
}); 


/*******************************************************************************
 * Name: /ships/:ship_id/cargo/:cargo_id
 * Description: Assigns cargo to a ship.
 ******************************************************************************/
router.put('/:ship_id/cargo/:cargo_id', function(req, res) { 
    
    put_cargo(req, req.params.ship_id, req.params.cargo_id, res)
        .then(res.status(200).end())
        .catch(res.status(400).end()); 
});
    
    


/*******************************************************************************
 * Name: /ships/:ship_id/cargo/:cargo_id
 * Description: Deletes the specified piece of cargo from a ship.
 ******************************************************************************/
router.delete('/:ship_id/cargo/:cargo_id', function(req, res) {
    delete_ship_cargo(req.params.ship_id, req.params.cargo_id)
    .then(res.status(200).end())
    
});


/*******************************************************************************
 * Name: /ships/:ship_id/cargo
 * Description: Returns a list of a ship's cargo.
 ******************************************************************************/
router.get('/:ship_id/cargo', function(req, res) {
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