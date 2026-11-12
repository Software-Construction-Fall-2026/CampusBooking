import Resource from './Resource.js';

class Equipment extends Resource {
    constructor(resourceId, name, availability, type, building) {
        super(resourceId, name, availability, type, building);
    }
}

export default Equipment;
