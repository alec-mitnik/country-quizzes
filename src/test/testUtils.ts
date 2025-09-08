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
