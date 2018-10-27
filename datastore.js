const Datastore = require('@google-cloud/datastore');
const projectId = 'ship-cargo-api-dubbsc';

// Export for use in other modules
module.exports.Datastore = Datastore;
module.exports.datastore = new Datastore({
	projectId: projectId,
});

module.exports.fromDataStore = function fromDataStore(item) {
	item.id = item[Datastore.KEY].id;
	return item;	
}