import dataManager from './DataManager.js';

class ResourceManager {
    constructor(data = dataManager) {
        this.dataManager = data;
    }

    //gets all campus resources from the database
    async getResources() {
        const resources = await this.dataManager.load({
            collection: 'resources'
        });

        return resources;
    }
}

export default ResourceManager;
