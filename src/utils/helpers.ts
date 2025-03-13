// Utility functions

// Basic escaping function
export function escapeInput(input: string): string {
  return input.replace(/[<>&"]/g, function (char) {
    switch (char) {
      case "<":
        return "&lt;";
      case ">":
        return "&gt;";
      case "&":
        return "&amp;";
      case '"':
        return "&quot;";
      default:
        return char;
    }
  });
}
