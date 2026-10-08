import "dotenv/config";
import pg from "pg";

const cdpPort = Number(process.env.CDP_PORT ?? 9227);
const baseUrl = process.env.SURFTMARKET_URL ?? "http://127.0.0.1:3000";
const subject = `Help Center QA ${Date.now()}`;
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const targets = await fetch(`http://127.0.0.1:${cdpPort}/json/list`).then((response) => response.json());
const target = targets.find((item) => item.type === "page");
if (!target) throw new Error("No Chrome page target was found");
const socket = new WebSocket(target.webSocketDebuggerUrl);
await new Promise((resolve, reject) => {
  socket.addEventListener("open", resolve, { once: true });
  socket.addEventListener("error", reject, { once: true });
});

let commandId = 0;
const pending = new Map();
const browserErrors = [];
socket.addEventListener("message", (event) => {
  const message = JSON.parse(event.data);
  if (message.id) {
    const handler = pending.get(message.id);
    if (!handler) return;
    pending.delete(message.id);
    if (message.error) handler.reject(new Error(message.error.message));
    else handler.resolve(message.result ?? {});
    return;
  }
  if (message.method === "Runtime.exceptionThrown") browserErrors.push(message.params.exceptionDetails.exception?.description ?? message.params.exceptionDetails.text);
  if (message.method === "Log.entryAdded" && message.params.entry.level === "error") browserErrors.push(message.params.entry.text);
});

function command(method, params = {}) {
  const id = ++commandId;
  return new Promise((resolve, reject) => {
    pending.set(id, { resolve, reject });
    socket.send(JSON.stringify({ id, method, params }));
  });
}

async function evaluate(expression) {
  const result = await command("Runtime.evaluate", { expression, awaitPromise: true, returnByValue: true, userGesture: true });
  if (result.exceptionDetails) throw new Error(result.exceptionDetails.exception?.description ?? result.exceptionDetails.text);
  return result.result?.value;
}

async function waitFor(expression, label, timeout = 15000) {
  const started = Date.now();
  while (Date.now() - started < timeout) {
    try {
      if (await evaluate(`Boolean(${expression})`)) return;
    } catch {
      // Navigation briefly replaces the execution context.
    }
    await delay(75);
  }
  throw new Error(`Timed out waiting for ${label}`);
}

async function navigate(path) {
  await command("Page.navigate", { url: `${baseUrl}${path}` });
  await waitFor("document.readyState === 'complete'", `${path} to load`);
}

async function setValue(selector, value) {
  const ok = await evaluate(`(() => {
    const element = document.querySelector(${JSON.stringify(selector)});
    if (!element) return false;
    const prototype = element instanceof HTMLSelectElement ? HTMLSelectElement.prototype
      : element instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype
      : HTMLInputElement.prototype;
    Object.getOwnPropertyDescriptor(prototype, 'value').set.call(element, ${JSON.stringify(value)});
    element.dispatchEvent(new Event('input', { bubbles: true }));
    element.dispatchEvent(new Event('change', { bubbles: true }));
    return true;
  })()`);
  if (!ok) throw new Error(`Missing field ${selector}`);
}

function assert(value, message) {
  if (!value) throw new Error(message);
}

const checks = [];
async function check(name, work) {
  try {
    await work();
    checks.push({ name, status: "PASS" });
  } catch (error) {
    checks.push({ name, status: "FAIL", error: error instanceof Error ? error.message : String(error) });
  }
}

await Promise.all([command("Page.enable"), command("Runtime.enable"), command("Log.enable")]);
await command("Emulation.setDeviceMetricsOverride", { width: 390, height: 844, deviceScaleFactor: 2, mobile: true, screenWidth: 390, screenHeight: 844 });

await check("Customer Help Center replaces internal handover content", async () => {
  await navigate("/docs");
  assert(await evaluate("document.querySelector('h1')?.textContent === 'How can we help?'"), "Help Center heading is missing");
  assert(await evaluate("document.querySelectorAll('[data-help-topic]').length === 6"), "Expected six help topics");
  assert(!(await evaluate("document.body.innerText.includes('Packaging Surftmarket to sell') || document.body.innerText.includes('DATABASE_URL')")), "Internal project documentation is still visible");
});

await check("Help search filters articles and handles no results", async () => {
  await setValue("[data-testid=help-search]", "coupon");
  await waitFor("document.querySelectorAll('[data-help-topic]').length === 2", "coupon help results");
  assert(await evaluate("document.body.innerText.includes('Why did my coupon fail?')"), "Coupon article was not found");
  await setValue("[data-testid=help-search]", "zz-no-such-help-topic");
  await waitFor("document.querySelector('[data-testid=no-help-results]')", "empty help result");
});

await check("FAQ accordion opens and closes accessibly", async () => {
  await navigate("/docs");
  const selector = "[data-testid=faq-toggle]";
  assert(await evaluate(`document.querySelectorAll('${selector}').length === 5`), "FAQ buttons are missing");
  await evaluate(`document.querySelectorAll('${selector}')[1].click()`);
  await waitFor(`document.querySelectorAll('${selector}')[1].getAttribute('aria-expanded') === 'true'`, "FAQ to expand");
  await evaluate(`document.querySelectorAll('${selector}')[1].click()`);
  await waitFor(`document.querySelectorAll('${selector}')[1].getAttribute('aria-expanded') === 'false'`, "FAQ to collapse");
});

await check("Order tracker sends the customer to their order", async () => {
  await setValue("[aria-label='Order code']", "sf10000001");
  await evaluate("document.querySelector('[data-testid=track-order-form]').requestSubmit()");
  await waitFor("location.pathname === '/track/SF10000001'", "order tracking route");
});

await check("Support request form creates a ticket and returns a reference", async () => {
  await navigate("/docs");
  await setValue("#contact-support [name=name]", "Help Center Tester");
  await setValue("#contact-support [name=email]", "help-qa@example.com");
  await setValue("#contact-support [name=category]", "Something else");
  await setValue("#contact-support [name=subject]", subject);
  await setValue("#contact-support [name=message]", "Automated verification of the customer support request workflow.");
  await evaluate("document.querySelector('#contact-support').requestSubmit()");
  await waitFor("document.querySelector('[data-testid=support-status]')?.textContent.includes('T-')", "support reference", 10000);
});

await check("Mobile and desktop layouts do not overflow", async () => {
  assert(await evaluate("document.documentElement.scrollWidth <= window.innerWidth"), "Help Center overflows on mobile");
  await command("Emulation.setDeviceMetricsOverride", { width: 1280, height: 900, deviceScaleFactor: 1, mobile: false, screenWidth: 1280, screenHeight: 900 });
  await navigate("/docs");
  assert(await evaluate("document.documentElement.scrollWidth <= window.innerWidth"), "Help Center overflows on desktop");
  assert(await evaluate("Boolean(document.querySelector('#contact-support'))"), "Support form is missing on desktop");
});

await check("Footer help links point to the correct sections", async () => {
  assert(await evaluate("Boolean(document.querySelector('footer a[href=\"/docs#returns\"]') && document.querySelector('footer a[href=\"/docs#payments\"]') && document.querySelector('footer a[href=\"/docs#contact-support\"]'))"), "Footer support links are incorrect");
});

socket.close();

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
try {
  const deleted = await pool.query("DELETE FROM tickets WHERE subject = $1 RETURNING id", [`[Something else] ${subject}`]);
  for (const row of deleted.rows) await pool.query("DELETE FROM audit_logs WHERE entity = 'ticket' AND entity_id = $1", [row.id]);
} finally {
  await pool.end();
}

const relevantErrors = browserErrors.filter((error) => !error.includes("favicon") && !error.includes("Failed to load resource"));
for (const result of checks) console.log(`${result.status}: ${result.name}${result.error ? ` — ${result.error}` : ""}`);
console.log(`\n${checks.filter((result) => result.status === "PASS").length}/${checks.length} checks passed; ${relevantErrors.length} browser errors`);
if (checks.some((result) => result.status === "FAIL") || relevantErrors.length) process.exitCode = 1;
