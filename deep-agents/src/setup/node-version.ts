export function checkNodeVersion(minimum: number) {
  const major = parseInt(process.versions.node.split(".")[0], 10);
  if (major < minimum) {
    console.error(
      `Error: Node.js >= ${minimum} is required (found: v${process.versions.node})`,
    );
    process.exit(1);
  }
}
