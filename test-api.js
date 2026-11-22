// Runs the Step 7 checks. Start the server first, then: npm run test:api
// For the hosted API: BASE_URL=https://your-backend.onrender.com npm run test:api
const BASE = (process.env.BASE_URL || "http://localhost:3000").replace(/\/$/, "");
const good = { title: "Test broken tap", category: "Plumbing", description: "Tap in Block A drips.", status: "Pending" };
let passed = 0, failed = 0;

async function call(method, path, body, raw) {
  const res = await fetch(BASE + path, {
    method,
    headers: body !== undefined ? { "Content-Type": "application/json" } : {},
    body: raw !== undefined ? raw : body !== undefined ? JSON.stringify(body) : undefined
  });
  let json = null;
  try { json = await res.json(); } catch {}
  return { status: res.status, json };
}
function check(name, ok) { ok ? passed++ : failed++; console.log(`${ok ? "PASS" : "FAIL"}  ${name}`); }

(async () => {
  let r = await call("GET", "/health"); check("GET /health -> 200", r.status === 200);
  r = await call("GET", "/api/records"); check("GET all -> 200 array", r.status === 200 && Array.isArray(r.json));
  r = await call("POST", "/api/records", { ...good, id: 9999 });
  check("POST valid -> 201 with new id (client id ignored)", r.status === 201 && r.json.id !== 9999);
  const id = r.json && r.json.id;
  r = await call("GET", `/api/records/${id}`); check("GET one -> 200 exact record", r.status === 200 && r.json.title === good.title);
  r = await call("PUT", `/api/records/${id}`, { ...good, title: "Test fixed tap", status: "Completed" });
  check("PUT -> 200 same id, new values", r.status === 200 && r.json.id === id && r.json.status === "Completed");
  r = await call("POST", "/api/records", { ...good, title: "  " }); check("POST spaces-only title -> 400", r.status === 400 && r.json.message);
  r = await call("POST", "/api/records", { ...good, status: "Done" }); check("POST bad status -> 400", r.status === 400);
  r = await call("POST", "/api/records", { ...good, title: 123 }); check("POST non-string title -> 400", r.status === 400);
  r = await call("POST", "/api/records", undefined, "{bad json"); 
  const rr = await fetch(BASE + "/api/records", { method: "POST", headers: { "Content-Type": "application/json" }, body: "{bad json" });
  check("POST malformed JSON -> 400 JSON", rr.status === 400 && (await rr.json()).message);
  r = await call("GET", "/api/records/abc"); check("GET invalid id -> 400", r.status === 400);
  r = await call("GET", "/api/records/99999999"); check("GET missing id -> 404", r.status === 404);
  r = await call("PUT", "/api/records/99999999", good); check("PUT missing id -> 404", r.status === 404);
  r = await call("DELETE", "/api/records/99999999"); check("DELETE missing id -> 404", r.status === 404);
  r = await call("GET", "/nope"); check("Unknown route -> 404 JSON", r.status === 404 && r.json.message);
  r = await call("DELETE", `/api/records/${id}`); check("DELETE -> 200 message", r.status === 200 && r.json.message === "Record deleted.");
  r = await call("GET", `/api/records/${id}`); check("GET deleted id -> 404", r.status === 404);
  console.log(`\n${passed} passed, ${failed} failed`);
  process.exit(failed ? 1 : 0);
})().catch(e => { console.error("Could not reach the API:", e.message); process.exit(1); });
