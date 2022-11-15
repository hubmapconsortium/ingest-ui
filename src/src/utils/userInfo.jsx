export function DataProviders(groups) {
    // Returns an array of all the "True" data providers in the groups provided
    try {
        return groups.reduce((acc, obj) => {
            const key = obj["data_provider"];
            const curGroup = acc[key] ?? [];
            return { ...acc, [key]: [...curGroup, obj] };
        }, {});
    } catch (error) {
        return error
        
    }
    
}
