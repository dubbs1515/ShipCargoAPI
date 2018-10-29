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
  *  id.
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
async function put_ship(ship_id, name, type, length) {
    var save_cargo;
    let this_ship = await get_ship(ship_id);
    this_ship = this_ship[0];
    const this_ship_key = datastore.key([SHIP, parseInt(ship_id, 10)]);
    /*async function saveCargo () {
        
        if((typeof(this_ship.cargo)) !== 'undefined') {
            save_cargo = this_ship.cargo;
        }
    }
        
    await saveCargo();*/
    this_ship.name = name;
    this_ship.type = type;
    this_ship.length = length;   
    /*
    const key = datastore.key([SHIP, parseInt(ship_id,10)]);

    if(((typeof(this_ship.cargo)) === 'undefined')) {
        
        ship = {"name": name, "type": type, "length": length};
    } else {
        ship = {"name": name, "type": type, "length": length, "cargo": this_ship.cargo,
            this_ship.self};
    }*/
    
    return datastore.save({"key": this_ship_key, "data": this_ship});
}


/******************************************************************************
 * Name: delete_ship
 * Description: Deletes the ship specified by the id argument.
 *****************************************************************************/
async function delete_ship(ship_id) {
    let ship_removed = await get_ship(ship_id);
    ship_removed = ship_removed[0];
    //let removed_cargo = await cargo_to_move(cargo_id);
    //removed_cargo = removed_cargo[0];

    async function delete_ships_cargoes() {
        console.log("Position 2...");
        ship_removed.cargo.forEach(async cargoItem => {
            console.log("Position 3...");
            cargo_id = cargoItem.id;
            const cargo_key = datastore.key([CARGO, parseInt(cargo_id, 10)]);
            let removed_cargo = await cargo_to_move(cargo_id);
            removed_cargo = removed_cargo[0];
            console.log(removed_cargo.name);
            removed_cargo.carrier = null;
            return datastore.save({"key": cargo_key, "data": removed_cargo});
        });
    }
    const ship_key = datastore.key([SHIP, parseInt(ship_id, 10)]);
    //const cargo_key = datastore.key([CARGO, parseInt(cargo_id, 10)]);
    console.log("removed ship name: " + ship_removed.name);
    console.log("removed ship cargo: " + ship_removed);
    
    if((typeof(ship_removed) != 'undefined'))
    {
        console.log("Position 1...");
        if((typeof(ship_removed.cargo) !== 'undefined'))
        {
            await delete_ships_cargoes();
        }
    }
    //console.log("removed ship cargo: " + ship_removed.cargo);

    //let cargo_asignment = await cargo_to_move(cargo_id);    // Check if already assigned
    
    


  
    return  datastore.delete(ship_key);
    /*
    
    function updateCargoCarrier() {
        removed_cargo.carrier = null;
        console.log("Deleting carrier: " + removed_cargo.carrier);
        // Save updated carrier info
        console.log("carrier now: " + removed_cargo.carrier);
        return datastore.save({"key": cargo_key, "data": removed_cargo});
    }
    
    function updateShipManifest() {
        let updated_manifest = current_ship.cargo;
        // Find index of cargo to remove from array and remove
        let remove_me = updated_manifest.map(function(cargo) {
            return cargo.id;
        }).indexOf(cargo_id);
        updated_manifest.splice(removed_cargo, 1);
        // Save updated cargo
        current_ship.cargo = updated_manifest;
        return datastore.save({"key": ship_key, "data": current_ship});
    }

    if((typeof(current_ship.cargo) != 'undefined')) {
        // 1. Update cargo carrier to null
        await updateCargoCarrier();

        console.log("after update cargo carrier");
        // 2. Remove cargo from ship's cargo array
        await updateShipManifest();
        
        return 1;
    }
    return 0;

    let ship_removed = await get_ship(ship_id);
    ship_removed = ship_removed;
    const ship_key = datastore.key([SHIP, parseInt(ship_id, 10)]);
    console.log("Ship 1 before deleting: " + ship_removed[0].cargo);
    console.log("Position 1...");
    if((typeof(ship_removed.cargo)) != 'undefined')
    {
        if(typeof(ship_removed.cargo) != 'undefined') 
        {
            console.log("Position 2...");
            ship_removed.cargo.forEach(async cargoItem => {
                console.log("Position 3...");
                cargo_id = cargoItem.id;
                const cargo_key = datastore.key([CARGO, parseInt(cargo_id, 10)]);
                let removed_cargo = await cargo_to_move(cargo_id);
                removed_cargo = removed_cargo[0];
                console.log(removed_cargo.name);
                removed_cargo.carrier = null;
                return datastore.save({"key": cargo_key, "data": removed_cargo});
            });
        }
    */
    
} 






/******************************************************************************
 * Name: cargo_is_assigned
 * Description: Helper to determine if cargo is already assigned to a
 *  ship.
 *****************************************************************************/
function cargo_to_move(cargo_id) {
    // List of cargo assigned to the ship
    let key = datastore.key([CARGO, parseInt(cargo_id, 10)]);
    const q = datastore.createQuery(CARGO).filter('__key__', '=', key); 
    return datastore.runQuery(q).then((entity) => {                 
        return entity[0].map(ds.fromDataStore);
    });
}

/******************************************************************************
 * Name: put_cargo
 * Description: Assigns cargo to a ship.
 *****************************************************************************/
async function put_ship_cargo(req, ship_id, cargo_id, res) {
    
    
    let cargo_asignment = await cargo_to_move(cargo_id);    // Check if already assigned
    cargo_asignment = cargo_asignment[0];
    let carrier_ship = await get_ship(ship_id);
    carrier_ship = carrier_ship[0];
    
    // cargo_asignment.carrier === null
    if(cargo_asignment.carrier === null) {
    
        // 2. Assign carrier to cargo 
        const cargo_key = datastore.key([CARGO, parseInt(cargo_id, 10)]);
        ship_info = {};
        ship_info.name = carrier_ship.name;
        ship_info.id = ship_id;
        ship_info.self = req.protocol + "://" + ROOT_URL + "ships/" + ship_id;
        cargo_asignment.carrier = ship_info;
        datastore.save({"key": cargo_key, "data": cargo_asignment})
        
        // 2. Assign cargo to ship
        const ship_key = datastore.key([SHIP, parseInt(ship_id, 10)]);
        if(typeof(carrier_ship.cargo) === 'undefined') {
            carrier_ship.cargo = []; // Add cargo property
        }
        
        new_cargo = {}
        new_cargo.id = cargo_id;
        new_cargo.self =  req.protocol + "://" + ROOT_URL
            + "cargo/" + cargo_id;
        carrier_ship.cargo.push(new_cargo);
        datastore.save({"key": ship_key, "data": carrier_ship});

        return true;
    }

    return false; 
    
}

/******************************************************************************
 * Name: delete_ship_cargo
 * Description: Unloads a the cargo specified from a ship.
 *****************************************************************************/
async function delete_ship_cargo(ship_id, cargo_id) {

    let current_ship = await get_ship(ship_id);
    current_ship = current_ship[0];
    let removed_cargo = await cargo_to_move(cargo_id);
    removed_cargo = removed_cargo[0];

    const ship_key = datastore.key([SHIP, parseInt(ship_id, 10)]);
    const cargo_key = datastore.key([CARGO, parseInt(cargo_id, 10)]);
    //console.log("current ship name: " + current_ship.name);
    //console.log("current ship cargo: " + current_ship.cargo);
    //console.log("removed cargo content: " + removed_cargo.content);
    
    function updateCargoCarrier() {
        removed_cargo.carrier = null;
        //console.log("Deleting carrier: " + removed_cargo.carrier);
        // Save updated carrier info
        //console.log("carrier now: " + removed_cargo.carrier);
        return datastore.save({"key": cargo_key, "data": removed_cargo});
    }
    
    function updateShipManifest() {
        let updated_manifest = current_ship.cargo;
        // Find index of cargo to remove from array and remove
        let remove_me = updated_manifest.map(function(cargo) {
            return cargo.id;
        }).indexOf(cargo_id);
        updated_manifest.splice(removed_cargo, 1);
        // Save updated cargo
        current_ship.cargo = updated_manifest;
        return datastore.save({"key": ship_key, "data": current_ship});
    }

    if((typeof(current_ship.cargo) != 'undefined')) {
        // 1. Update cargo carrier to null
        await updateCargoCarrier();

        //console.log("after update cargo carrier");
        // 2. Remove cargo from ship's cargo array
        await updateShipManifest();
        
        return 1;
    }
    return 0;

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
            cargo_results.next = req.protocol + "://" + req.get("host") + '/ships/'
            + ship_id + '/cargo'+ "?cursor=" + entities[1].endCursor; 
        }
        return cargo_results;
    });
}


/******************************************************************************
 * Name: delete_ships
 * Description: Deletes all ships.
 *****************************************************************************/
async function delete_ships(req) {

    let ships = await get_ships(req);
    //ships = ships[0];
    console.log(ships);
    ships.items.forEach( async ship =>  {
        //console.log("deleting id: " + ship.id);
        const ship_key = datastore.key([SHIP, parseInt(ship.id, 10)]);
        return await datastore.delete(ship_key);
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
router.put('/:id', function(req, res) {

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
        console.log("Ship id in route to delete: " + req.params.id);    
        delete_ship(req.params.id)
        .then(res.status(200).end());
}); 


/*******************************************************************************
 * Name: /ships/:ship_id/cargo/:cargo_id
 * Description: Assigns cargo to a ship.
 ******************************************************************************/
router.put('/:ship_id/cargo/:cargo_id', async function(req, res) { 
    let assignmentSuccess = await put_ship_cargo(req, req.params.ship_id, req.params.cargo_id, res)
    //console.log(assignmentSuccess);
    if(assignmentSuccess) {
        res.status(200).end();
    } else {
        res.status(403).send("The cargo is currently assigned to another ship");
    }
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
 * Name: DELETE /ships
 * Description: Deletes all ships.
 ******************************************************************************/
router.delete('/', function(req, res) {
    delete_ships(req)
    .then(res.status(200).end());
});

/*******************************************************************************
 * END OF CONTROLLER FUNCTIONS
 ******************************************************************************/

 module.exports = router;