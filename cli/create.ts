#!/usr/bin/env bun

import { existsSync, mkdirSync, readdirSync, statSync } from "fs";
import { join, resolve } from "path";
import { copyFileSync, readFileSync, writeFileSync } from "fs";

const args = process.argv.slice(2);
const projectName = args[0] || "my-notelink-app";

console.log("🚀 Creating NoteLink project...");
console.log(`📁 Project name: ${projectName}\n`);

// Get the template directory
const templateDir = join(__dirname, "../template");
const targetDir = resolve(process.cwd(), projectName);

// Check if target directory exists
if (existsSync(targetDir)) {
  console.error(`❌ Error: Directory "${projectName}" already exists.`);
  process.exit(1);
}

// Create target directory
mkdirSync(targetDir, { recursive: true });

// Function to copy directory recursively
function copyDirectory(src: string, dest: string) {
  const entries = readdirSync(src, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = join(src, entry.name);
    const destPath = join(dest, entry.name);

    if (entry.isDirectory()) {
      mkdirSync(destPath, { recursive: true });
      copyDirectory(srcPath, destPath);
    } else {
      let content = readFileSync(srcPath, "utf-8");
      
      // Replace template variables
      content = content.replace(/\{\{project-name\}\}/g, projectName);
      
      writeFileSync(destPath, content);
    }
  }
}

// Copy template files
try {
  copyDirectory(templateDir, targetDir);
  
  // Copy .env.example to .env
  const envExamplePath = join(targetDir, ".env.example");
  const envPath = join(targetDir, ".env");
  if (existsSync(envExamplePath)) {
    copyFileSync(envExamplePath, envPath);
  }
  
  console.log("✅ Project created successfully!\n");
  console.log("📦 Next steps:\n");
  console.log(`   cd ${projectName}`);
  console.log("   bun install");
  console.log("   bun dev\n");
  console.log("📚 Your API documentation will be available at http://localhost:8080/swagger");
  
} catch (error) {
  console.error("❌ Error creating project:", error);
  process.exit(1);
}
