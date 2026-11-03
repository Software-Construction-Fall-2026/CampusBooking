import { describe, it, expect, vi } from 'vitest';
import ResourceManager from './ResourceManager.js';

describe('ResourceManager', () => {
    it('should return all campus resources', async () => {
        const resources = [
            { id: '1', name: 'Study Room' },
            { id: '2', name: 'Computer Lab' }
        ];

        const mockDataManager = {
            load: vi.fn().mockResolvedValue(resources)
        };

        const manager = new ResourceManager(mockDataManager);
        const result = await manager.getResources();

        expect(result).toEqual(resources);
        expect(mockDataManager.load).toHaveBeenCalledWith({
            collection: 'resources'
        });
    });

    it('should return an empty list when no resources exist', async () => {
        const mockDataManager = {
            load: vi.fn().mockResolvedValue([])
        };

        const manager = new ResourceManager(mockDataManager);
        const result = await manager.getResources();

        expect(result).toEqual([]);
    });
});
