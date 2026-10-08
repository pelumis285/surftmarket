const cdpPort = Number(process.env.CDP_PORT ?? 9226);
const baseUrl = process.env.SURFTMARKET_URL ?? "http://127.0.0.1:3000";
const vendorEmail = process.env.VENDOR_TEST_EMAIL ?? "vendor.demo@surftmarket.com";
const vendorPassword = process.env.VENDOR_TEST_PASSWORD ?? "VendorDemo!2026";

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const targets = await fetch(`http://127.0.0.1:${cdpPort}/json/list`).then((response) => response.json());
const pageTarget = targets.find((target) => target.type === "page");
if (!pageTarget) throw new Error("No Chrome page target was found");

const socket = new WebSocket(pageTarget.webSocketDebuggerUrl);
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

async function waitFor(expression, message, timeout = 15000) {
  const started = Date.now();
  while (Date.now() - started < timeout) {
    try {
      if (await evaluate(`Boolean(${expression})`)) return;
    } catch {
      // Navigation briefly replaces the JavaScript context.
    }
    await delay(100);
  }
  throw new Error(`Timed out waiting for ${message}`);
}

async function navigate(path) {
  await command("Page.navigate", { url: `${baseUrl}${path}` });
  await waitFor("document.readyState === 'complete'", `${path} to load`);
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const results = [];
async function check(name, work) {
  try {
    await work();
    results.push({ name, status: "PASS" });
  } catch (error) {
    results.push({ name, status: "FAIL", error: error instanceof Error ? error.message : String(error) });
  }
}

await Promise.all([command("Page.enable"), command("Runtime.enable"), command("Log.enable")]);
await command("Emulation.setDeviceMetricsOverride", { width: 390, height: 844, deviceScaleFactor: 2, mobile: true, screenWidth: 390, screenHeight: 844 });
await navigate("/auth");
const login = await evaluate(`fetch('/api/auth', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ action: 'login', email: ${JSON.stringify(vendorEmail)}, password: ${JSON.stringify(vendorPassword)} })
}).then(async (response) => ({ status: response.status, body: await response.json() }))`);
assert(login.status === 200 && login.body?.user?.role === "vendor", "Vendor login failed");

const catalog = await fetch(`${baseUrl}/api/catalog`).then((response) => response.json());
const product = catalog.items?.find((item) => item.name.toLowerCase() === "food") ?? catalog.items?.find((item) => item.id.includes("-"));
assert(product, "No saved vendor product was available for the catalogue audit");
const encodedSlug = encodeURIComponent(product.slug);

await check("Vendor product form offers every marketplace category", async () => {
  await navigate("/vendor");
  await waitFor("document.querySelector('[data-testid=add-product]')", "Vendor Hub");
  await evaluate("document.querySelector('[data-testid=add-product]').click()");
  await waitFor("document.querySelector('[aria-label=\"Product category\"]')", "product category field");
  const categories = await evaluate("[...document.querySelector('[aria-label=\"Product category\"]').options].map(option => option.value)");
  assert(categories.length === 10 && categories.includes("fashion") && categories.includes("automobile"), `Expected 10 categories, found ${categories.length}`);
});

await check("Saved vendor product appears in Vendor Hub", async () => {
  await navigate("/vendor");
  await waitFor("document.querySelector('[data-testid=tab-products]')", "Vendor Hub products tab");
  await evaluate("document.querySelector('[data-testid=tab-products]').click()");
  await waitFor(`document.body.innerText.toLowerCase().includes(${JSON.stringify(product.name.toLowerCase())})`, "saved vendor product in Vendor Hub");
});

await check("Marketplace search returns saved vendor product", async () => {
  await navigate(`/search?q=${encodeURIComponent(product.name)}`);
  await waitFor(`document.querySelector('a[href^=\"/products/${encodedSlug}\"]')`, "vendor product search result");
});

await check("Category-filtered products page returns saved vendor product", async () => {
  await navigate(`/products?cat=${encodeURIComponent(product.category)}`);
  await waitFor(`document.querySelector('a[href^=\"/products/${encodedSlug}\"]')`, "vendor product in its category");
});

await check("Header live search suggests saved vendor product", async () => {
  await navigate("/");
  await waitFor("document.querySelector('[aria-label=Search]')", "header search input");
  await evaluate(`(() => {
    const input = document.querySelector('[aria-label=Search]');
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(input, ${JSON.stringify(product.name)});
    input.dispatchEvent(new Event('input', { bubbles: true }));
  })()`);
  await waitFor(`document.querySelector('header a[href^=\"/products/${encodedSlug}\"]')`, "vendor product search suggestion");
});

await check("Vendor product detail page opens the correct product", async () => {
  await navigate(`/products/${encodedSlug}`);
  await waitFor(`document.querySelector('h1')?.textContent === ${JSON.stringify(product.name)}`, "vendor product detail title");
});

await check("Vendor storefront includes its published product", async () => {
  await navigate(`/stores/${product.vendorSlug}`);
  await waitFor(`document.querySelector('a[href^=\"/products/${encodedSlug}\"]')`, "vendor product on store page");
});

await check("Homepage catalogue includes newly published vendor products", async () => {
  await navigate("/");
  await waitFor(`document.querySelector('a[href^=\"/products/${encodedSlug}\"]')`, "vendor product on homepage");
});

const relevantBrowserErrors = browserErrors.filter((error) => !error.includes("favicon") && !error.includes("Failed to load resource"));
for (const result of results) console.log(`${result.status}: ${result.name}${result.error ? ` — ${result.error}` : ""}`);
console.log(`\n${results.filter((result) => result.status === "PASS").length}/${results.length} checks passed; ${relevantBrowserErrors.length} browser errors`);
socket.close();
if (results.some((result) => result.status === "FAIL") || relevantBrowserErrors.length) process.exitCode = 1;
