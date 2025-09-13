/**
 * Handles checking that a value is not visible without
 * requiring that it not be null, as not.toBeVisible() does
 * @param received The value to check
 */
export function expectNotToBeVisibleInDocument(received: unknown) {
  if (received) {
    expect(received).not.toBeVisible();
  }
}

/**
 * Makes an object into a copy of another while preserving references to it
 * @param objectToModify The object to transfer properties to
 * @param objectToCopy The object to transfer properties from
 */
export function copyObjectWithoutReassignment(
    objectToModify: Record<string | number | symbol, unknown>, objectToCopy: object) {
  // Delete all properties from the object to modify
  for (const property in objectToModify) {
    delete objectToModify[property];
  }

  // Copy all properties from the object to copy
  Object.assign(objectToModify, objectToCopy);
}
