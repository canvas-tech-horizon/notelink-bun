import { newApiNote } from "notelink";
import { apiConfig, getJwtSecret } from "@/config/api.config";
import { registerAllRoutes } from "@/books/note.books";

/**
 * Main function to demonstrate notelink usage
 */
async function main() {
  // Initialize API with notelink
  // Custom middleware will be automatically applied from apiConfig
  const api = newApiNote(apiConfig, getJwtSecret());

  // Register all routes (user routes, auth routes, health routes)
  registerAllRoutes(api);

  // Start the server
  try {
    await api.listen();
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
}

// Run the example
main().catch(console.error);

