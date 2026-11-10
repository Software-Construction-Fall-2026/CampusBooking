class Resource {
    constructor(resourceId, name, availability, type, building) {
        if (new.target === Resource) {
            throw new Error('Resource is an abstract class');
        }

        this.resourceId = resourceId;
        this.name = name;
        this.availability = availability;
        this.type = type;
        this.building = building;
    }
}

export default Resource;
