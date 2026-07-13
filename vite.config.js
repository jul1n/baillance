import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import fs from "fs";
import path from "path";

// Un plugin Vite pour simuler une API locale et sauvegarder les emails
function localEmailPlugin() {
  return {
    name: "local-email-api",
    configureServer(server) {
      server.middlewares.use("/api/subscribe", (req, res) => {
        if (req.method === "POST") {
          let body = "";
          req.on("data", (chunk) => {
            body += chunk.toString();
          });
          req.on("end", () => {
            try {
              const data = JSON.parse(body);
              if (data.email) {
                const file = path.resolve(process.cwd(), "inscrits.json");
                let emails = [];
                if (fs.existsSync(file)) {
                  emails = JSON.parse(fs.readFileSync(file, "utf-8"));
                }
                // Ajout si non existant
                if (!emails.some((e) => e.email === data.email)) {
                  emails.push({ email: data.email, date: new Date().toISOString() });
                  fs.writeFileSync(file, JSON.stringify(emails, null, 2));
                }
                res.writeHead(200, { "Content-Type": "application/json" });
                res.end(JSON.stringify({ success: true }));
              } else {
                res.writeHead(400);
                res.end(JSON.stringify({ error: "Email manquant" }));
              }
            } catch (e) {
              res.writeHead(500);
              res.end(JSON.stringify({ error: "Erreur serveur" }));
            }
          });
        } else {
          res.statusCode = 404;
          res.end();
        }
      });
    },
  };
}

export default defineConfig({
  plugins: [react(), tailwindcss(), localEmailPlugin()],
});
