
import ResourceManager from '#lib/server/ResourceManager.js';

export async function load() {
  const resourceManager = new ResourceManager();

  const resources = await resourceManager.getResources();

  return {
    resources
  };
}

