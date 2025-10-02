const fs = require('fs');
const { execSync } = require('child_process');

const baseRef = process.env.BASE_REF;

/**
 * Gets a list of manifest files that have changed between the base branch and the current HEAD.
 * @returns {string[]} An array of changed manifest file paths.
 */
const getChangedManifests = () => {
  console.log(`Comparing against base ref: origin/${baseRef}`);
  const output = execSync(`git diff --name-only origin/${baseRef} HEAD`).toString();
  const files = output
    .split('\n')
    .filter(
      (file) =>
        file === 'packages/icons/manifest.json' ||
        file === 'packages/illustrations/manifest.json',
    );
  console.log('Found changed manifest files:', files);
  return files;
};

/**
 * Retrieves the JSON content of a file from a specific git ref.
 * @param {string} ref - The git ref (e.g., 'HEAD', 'origin/main').
 * @param {string} path - The path to the manifest file.
 * @returns {object | null} The parsed JSON content of the file, or null if an error occurs.
 */
const getManifestContent = (ref, path) => {
  try {
    console.log(`Getting content for ${path} at ref ${ref}`);
    const content = execSync(`git show ${ref}:${path}`, { maxBuffer: 10 * 1024 * 1024 }).toString();
    return JSON.parse(content);
  } catch (error) {
    console.error(`Failed to get content for ${path} at ref ${ref}:`, error);
    return null;
  }
};

/**
 * Compares two manifest files and identifies new, updated, and removed items.
 * @param {string} manifestPath - The path to the manifest file.
 * @param {object} baseContent - The JSON content of the base manifest.
 * @param {object} headContent - The JSON content of the head manifest.
 * @returns {{newItems: object, updatedItems: object, removedItems: object}} An object containing the new, updated, and removed items.
 */
const compareManifests = (manifestPath, baseContent, headContent) => {
  const newItems = {};
  const updatedItems = {};
  const removedItems = {};

  console.log(`Comparing manifests for ${manifestPath}`);

  if (manifestPath.includes('icons')) {
    const baseItems = new Map(baseContent.iconSets.map((item) => [item.name, item]));
    const headItems = new Map(headContent.iconSets.map((item) => [item.name, item]));
    newItems['Icons'] = [];
    updatedItems['Icons'] = [];
    removedItems['Icons'] = [];

    for (const headItem of headContent.iconSets) {
      const baseItem = baseItems.get(headItem.name);
      if (!baseItem) {
        newItems['Icons'].push(headItem.name);
      } else if (baseItem.assetsHash !== headItem.assetsHash) {
        updatedItems['Icons'].push(headItem.name);
      }
    }

    for (const baseItem of baseContent.iconSets) {
      if (!headItems.has(baseItem.name)) {
        removedItems['Icons'].push(baseItem.name);
      }
    }
  } else if (manifestPath.includes('illustrations')) {
    const baseItems = baseContent.items;
    const headItems = headContent.items;

    for (const [headKey, headItem] of Object.entries(headItems)) {
      const baseItem = baseItems[headKey];
      if (!baseItem) {
        if (!newItems[headItem.type]) newItems[headItem.type] = [];
        newItems[headItem.type].push(headItem.name);
      } else if (baseItem.hash !== headItem.hash) {
        if (!updatedItems[headItem.type]) updatedItems[headItem.type] = [];
        updatedItems[headItem.type].push(headItem.name);
      }
    }

    for (const [baseKey, baseItem] of Object.entries(baseItems)) {
      if (!headItems[baseKey]) {
        if (!removedItems[baseItem.type]) removedItems[baseItem.type] = [];
        removedItems[baseItem.type].push(baseItem.name);
      }
    }
  }

  console.log('New items found:', newItems);
  console.log('Updated items found:', updatedItems);
  console.log('Removed items found:', removedItems);
  return { newItems, updatedItems, removedItems };
};

/**
 * Formats a section of the comment (e.g., Added, Updated, Removed).
 * @param {string} title - The title of the section (e.g., '🚀 Added').
 * @param {object} items - An object where keys are categories and values are arrays of item names.
 * @returns {string} The formatted markdown section.
 */
const formatSection = (title, items) => {
    let section = '';
    const keys = Object.keys(items).filter((key) => items[key] && items[key].length > 0);
    if (keys.length > 0) {
      section += `### ${title}\n\n`;
      for (const key of keys) {
        if (key !== 'Icons') {
          const formattedKey = key
            .replace(/([A-Z])/g, ' $1')
            .replace(/^./, (str) => str.toUpperCase());
          section += `#### ${formattedKey}\n\n`;
        }
        section += `- ${items[key].join('\n- ')}\n\n`;
      }
    }
    return section;
  };

/**
 * Formats the entire comment for a given manifest file.
 * @param {string} manifest - The path to the manifest file.
 * @param {object} newItems - An object of new items, categorized by type.
 * @param {object} updatedItems - An object of updated items, categorized by type.
 * @param {object} removedItems - An object of removed items, categorized by type.
 * @returns {string} The formatted markdown comment.
 */
const formatComment = (manifest, newItems, updatedItems, removedItems) => {
  let comment = `### Changes for \`${manifest}\`\n\n`;

  comment += formatSection('🚀 Added', newItems);
  comment += formatSection('🐞 Updated', updatedItems);
  comment += formatSection('🗑️ Removed', removedItems);

  return comment;
};

/**
 * Main function to run the script. It identifies changed manifests,
 * compares them, generates a comment, and writes it to a file.
 */
const main = () => {
  if (!baseRef) {
    console.error('BASE_REF environment variable is not set.');
    process.exit(1);
  }
  const changedManifests = getChangedManifests();
  let commentBody = '';

  for (const manifest of changedManifests) {
    console.log(`Processing manifest: ${manifest}`);
    const baseContent = getManifestContent(`origin/${baseRef}`, manifest);
    const headContent = getManifestContent('HEAD', manifest);

    if (baseContent && headContent) {
      const { newItems, updatedItems, removedItems } = compareManifests(
        manifest,
        baseContent,
        headContent,
      );
      if (
        Object.keys(newItems).length > 0 ||
        Object.keys(updatedItems).length > 0 ||
        Object.keys(removedItems).length > 0
      ) {
        commentBody += formatComment(manifest, newItems, updatedItems, removedItems);
      }
    } else {
      console.log(`Skipping comparison for ${manifest} due to missing content.`);
    }
  }

  console.log('Final comment body:', `\n${commentBody}`);
  if (commentBody) {
    console.log('Writing to manifest-diff.md');
    fs.writeFileSync('manifest-diff.md', commentBody);
  } else {
    console.log('No changes found, not writing to manifest-diff.md');
  }
};

main();
