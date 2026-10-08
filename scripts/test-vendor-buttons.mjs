import { mkdir, readdir } from "node:fs/promises";

const cdpPort = Number(process.env.CDP_PORT ?? 9225);
const baseUrl = process.env.SURFTMARKET_URL ?? "http://127.0.0.1:3000";
const vendorEmail = process.env.VENDOR_TEST_EMAIL ?? "vendor.demo@surftmarket.com";
const vendorPassword = process.env.VENDOR_TEST_PASSWORD ?? "VendorDemo!2026";
const downloadPath = process.env.VENDOR_DOWNLOAD_PATH ?? "/tmp/surftmarket-vendor-downloads";
const testCouponCode = `QA${String(Date.now()).slice(-8)}`;

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const pageTarget = (await fetch(`http://127.0.0.1:${cdpPort}/json/list`).then((response) => response.json())).find((target) => target.type === "page");
if (!pageTarget) throw new Error("No Chrome page target was found");

const socket = new WebSocket(pageTarget.webSocketDebuggerUrl);
await new Promise((resolve, reject) => {
  socket.addEventListener("open", resolve, { once: true });
  socket.addEventListener("error", reject, { once: true });
});

let commandId = 0;
let actionExecutions = 0;
const pending = new Map();
const listeners = new Map();
const browserErrors = [];

socket.addEventListener("message", (event) => {
  const message = JSON.parse(event.data);
  if (message.id) {
    const handler = pending.get(message.id);
    if (!handler) return;
    pending.delete(message.id);
    if (message.error) handler.reject(new Error(`${handler.method}: ${message.error.message}`));
    else handler.resolve(message.result ?? {});
    return;
  }
  for (const listener of listeners.get(message.method) ?? []) listener(message.params ?? {});
});

function on(method, listener) {
  const current = listeners.get(method) ?? [];
  current.push(listener);
  listeners.set(method, current);
  return () => listeners.set(method, (listeners.get(method) ?? []).filter((item) => item !== listener));
}

function command(method, params = {}) {
  const id = ++commandId;
  return new Promise((resolve, reject) => {
    pending.set(id, { resolve, reject, method });
    socket.send(JSON.stringify({ id, method, params }));
  });
}

async function evaluate(expression) {
  const response = await command("Runtime.evaluate", { expression, awaitPromise: true, returnByValue: true, userGesture: true });
  if (response.exceptionDetails) {
    const description = response.exceptionDetails.exception?.description ?? response.exceptionDetails.text;
    throw new Error(description);
  }
  return response.result?.value;
}

async function waitFor(expression, timeout = 8000, message = expression) {
  const started = Date.now();
  while (Date.now() - started < timeout) {
    try {
      if (await evaluate(`Boolean(${expression})`)) return;
    } catch {
      // Navigation can briefly destroy the execution context.
    }
    await delay(75);
  }
  throw new Error(`Timed out waiting for ${message}`);
}

async function navigate(path) {
  await command("Page.navigate", { url: `${baseUrl}${path}` });
  await waitFor("document.readyState === 'complete'", 15000, `${path} to load`);
}

async function click(selector, index = 0) {
  const result = await evaluate(`(() => {
    const element = document.querySelectorAll(${JSON.stringify(selector)})[${index}];
    if (!element) return { ok: false, reason: "missing" };
    if (element.disabled) return { ok: false, reason: "disabled", text: element.textContent };
    element.scrollIntoView({ block: "center", inline: "center" });
    element.click();
    return { ok: true, text: element.textContent?.trim() };
  })()`);
  if (!result?.ok) throw new Error(`Could not click ${selector}[${index}]: ${result?.reason}`);
  actionExecutions += 1;
  await delay(100);
  return result;
}

async function clickText(scope, text) {
  const result = await evaluate(`(() => {
    const element = [...document.querySelectorAll(${JSON.stringify(`${scope} button`)})].find((button) => button.textContent?.trim() === ${JSON.stringify(text)});
    if (!element) return { ok: false, reason: "missing" };
    if (element.disabled) return { ok: false, reason: "disabled" };
    element.scrollIntoView({ block: "center", inline: "center" });
    element.click();
    return { ok: true };
  })()`);
  if (!result?.ok) throw new Error(`Could not click button “${text}” in ${scope}: ${result?.reason}`);
  actionExecutions += 1;
  await delay(100);
}

async function setValue(selector, value, index = 0) {
  const result = await evaluate(`(() => {
    const element = document.querySelectorAll(${JSON.stringify(selector)})[${index}];
    if (!element) return false;
    const prototype = element instanceof HTMLSelectElement ? HTMLSelectElement.prototype
      : element instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype
      : HTMLInputElement.prototype;
    const setter = Object.getOwnPropertyDescriptor(prototype, "value")?.set;
    setter?.call(element, ${JSON.stringify(value)});
    element.dispatchEvent(new Event("input", { bubbles: true }));
    element.dispatchEvent(new Event("change", { bubbles: true }));
    return true;
  })()`);
  if (!result) throw new Error(`Could not set ${selector}[${index}]`);
  await delay(50);
}

async function resetVendorState() {
  await evaluate("localStorage.removeItem('surftmarket-vendor-demo'); true");
  await command("Page.reload", { ignoreCache: true });
  await waitFor("document.querySelector('[data-testid=vendor-hub]')", 15000, "Vendor Hub after reset");
  await waitFor("Object.keys(document.querySelector('[data-testid=tab-products]') ?? {}).some((key) => key.startsWith('__reactProps') || key.startsWith('__reactFiber'))", 15000, "Vendor Hub React hydration");
  await delay(100);
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

await Promise.all([command("Page.enable"), command("Runtime.enable"), command("Network.enable"), command("Log.enable")]);
on("Runtime.exceptionThrown", ({ exceptionDetails }) => browserErrors.push(exceptionDetails.exception?.description ?? exceptionDetails.text));
on("Log.entryAdded", ({ entry }) => {
  if (entry.level === "error") browserErrors.push(entry.text);
});
await command("Emulation.setDeviceMetricsOverride", { width: 390, height: 844, deviceScaleFactor: 2, mobile: true, screenWidth: 390, screenHeight: 844 });
await mkdir(downloadPath, { recursive: true });
await command("Browser.setDownloadBehavior", { behavior: "allow", downloadPath, eventsEnabled: true });

await navigate("/auth");
const login = await evaluate(`fetch('/api/auth', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ action: 'login', email: ${JSON.stringify(vendorEmail)}, password: ${JSON.stringify(vendorPassword)} })
}).then(async (response) => ({ status: response.status, body: await response.json() }))`);
assert(login.status === 200 && login.body?.user?.role === "vendor", `Vendor login failed with ${login.status}`);
await evaluate("localStorage.removeItem('surftmarket-vendor-demo'); true");
await navigate("/vendor");
await waitFor("document.querySelector('[data-testid=vendor-hub]')", 15000, "Vendor Hub");
const activeSession = await evaluate("fetch('/api/auth', { cache: 'no-store' }).then(async (response) => ({ status: response.status, body: await response.json() }))");
assert(activeSession.status === 200 && activeSession.body?.user?.email === vendorEmail && activeSession.body?.user?.role === "vendor", "Browser session is not authenticated as the vendor demo account");
await evaluate("localStorage.removeItem('surftmarket-vendor-demo'); true");
await resetVendorState();

await check("All eight Vendor Hub navigation buttons", async () => {
  for (const tab of ["overview", "products", "orders", "wallet", "promos", "reviews", "settings", "team"]) {
    await click(`[data-testid=tab-${tab}]`);
    assert(await evaluate(`Boolean(document.querySelector('[data-testid=panel-${tab}]'))`), `${tab} panel did not open`);
  }
});

await check("Vacation mode toggle", async () => {
  const before = await evaluate("document.querySelector('[data-testid=vacation-toggle]').checked");
  await click("[data-testid=vacation-toggle]");
  const after = await evaluate("document.querySelector('[data-testid=vacation-toggle]').checked");
  assert(after !== before && await evaluate("document.body.innerText.includes('Vacation mode')"), "Vacation mode did not change");
});

await check("Add product, dialog close, cancel, and create", async () => {
  await click("[data-testid=add-product]");
  assert(await evaluate("Boolean(document.querySelector('[role=dialog]'))"), "Add-product dialog did not open");
  await click("[data-testid=modal-close]");
  assert(!(await evaluate("Boolean(document.querySelector('[role=dialog]'))")), "Dialog close button failed");
  await click("[data-testid=add-product]");
  await clickText("[role=dialog]", "Cancel");
  assert(!(await evaluate("Boolean(document.querySelector('[role=dialog]'))")), "Dialog cancel button failed");
  await click("[data-testid=add-product]");
  await setValue("[aria-label='Product name']", "Automation Test Product");
  await setValue("[aria-label='Product brand']", "Surft Test");
  await setValue("[aria-label='Product price']", "19999");
  await setValue("[aria-label='Product stock']", "7");
  await evaluate(`(() => {
    const input = document.querySelector('[data-testid=product-image-input]');
    const binary = atob('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=');
    const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0));
    const transfer = new DataTransfer();
    transfer.items.add(new File([bytes], 'front-view.png', { type: 'image/png' }));
    transfer.items.add(new File([bytes], 'side-view.png', { type: 'image/png' }));
    input.files = transfer.files;
    input.dispatchEvent(new Event('change', { bubbles: true }));
    return true;
  })()`);
  await waitFor("document.querySelectorAll('[data-testid=product-image-gallery] img').length === 2", 8000, "two uploaded product previews");
  const secondImage = await evaluate("document.querySelectorAll('[data-testid=product-image-gallery] img')[1].getAttribute('src')");
  await click("[data-action=make-cover-image]", 1);
  assert(await evaluate(`document.querySelector('[data-testid=product-image-gallery] img').getAttribute('src') === ${JSON.stringify(secondImage)}`), "Cover-image selection did not reorder the gallery");
  await click("[data-action=remove-product-image]", 1);
  assert(await evaluate("document.querySelectorAll('[data-testid=product-image-gallery] img').length === 1"), "Image removal did not update the gallery");
  await click("[data-testid=save-product]");
  await waitFor("document.body.innerText.includes('Product created')", 3000, "product-created confirmation");
  await click("[data-testid=tab-products]");
  assert(await evaluate("document.body.innerText.includes('Automation Test Product')"), "Created product is missing");
  const createdImage = await evaluate("document.querySelector('[data-product-slug^=automation-test-product] img').getAttribute('src')");
  assert(createdImage === secondImage, "Saved product did not use the selected cover image");
  const imageResponse = await evaluate(`fetch(${JSON.stringify(secondImage)}).then((response) => ({ status: response.status, type: response.headers.get('content-type') }))`);
  assert(imageResponse.status === 200 && imageResponse.type?.startsWith("image/"), "Uploaded product image is not being served");
});

await resetVendorState();
await click("[data-testid=tab-products]");
await check("Every product stock decrease and increase button", async () => {
  const count = await evaluate("document.querySelectorAll('[data-product-slug]').length");
  assert(count === 6, `Expected 6 initial products, found ${count}`);
  for (let index = 0; index < count; index += 1) {
    const before = await evaluate(`Number(document.querySelectorAll('[data-product-slug]')[${index}].querySelector('[data-testid^=stock-]').textContent)`);
    await click("[data-action=stock-decrease]", index);
    const decreased = await evaluate(`Number(document.querySelectorAll('[data-product-slug]')[${index}].querySelector('[data-testid^=stock-]').textContent)`);
    assert(decreased === Math.max(0, before - 1), `Product ${index + 1} stock did not decrease safely`);
    await click("[data-action=stock-increase]", index);
    const restored = await evaluate(`Number(document.querySelectorAll('[data-product-slug]')[${index}].querySelector('[data-testid^=stock-]').textContent)`);
    assert(restored === Math.max(0, before - 1) + 1, `Product ${index + 1} stock did not increase`);
  }
});

await check("Every product edit button and save action", async () => {
  const count = await evaluate("document.querySelectorAll('[data-action=edit-product]').length");
  for (let index = 0; index < count; index += 1) {
    await click("[data-action=edit-product]", index);
    assert(await evaluate("document.querySelector('[role=dialog]')?.getAttribute('aria-label') === 'Edit product'"), `Edit ${index + 1} did not open`);
    await click("[data-testid=save-product]");
    assert(!(await evaluate("Boolean(document.querySelector('[role=dialog]'))")), `Edit ${index + 1} did not save`);
  }
});

await check("Product search", async () => {
  await setValue("[aria-label='Search products']", "Samsung");
  assert(await evaluate("document.querySelectorAll('[data-product-slug]').length === 1 && document.body.innerText.includes('Samsung Galaxy')"), "Product search did not filter rows");
  await setValue("[aria-label='Search products']", "");
  assert(await evaluate("document.querySelectorAll('[data-product-slug]').length === 6"), "Clearing product search did not restore rows");
});

await check("Bulk edit button and apply action", async () => {
  const before = await evaluate("Number(document.querySelector('[data-testid^=stock-]').textContent)");
  await click("[data-testid=bulk-edit]");
  await setValue("[aria-label='Bulk stock adjustment']", "2");
  await setValue("[aria-label='Bulk product status']", "paused");
  await click("[data-testid=apply-bulk-edit]");
  const after = await evaluate("Number(document.querySelector('[data-testid^=stock-]').textContent)");
  assert(after === before + 2 && await evaluate("document.body.innerText.includes('paused')"), "Bulk edit was not applied");
});

await check("Bulk CSV download button", async () => {
  const before = new Set(await readdir(downloadPath));
  let downloadEvent;
  const eventPromise = new Promise((resolve) => {
    const off = on("Page.downloadWillBegin", (event) => { off(); resolve(event); });
    setTimeout(() => { off(); resolve(null); }, 4000);
  });
  await click("[data-testid=download-csv]");
  downloadEvent = await eventPromise;
  await delay(300);
  const after = await readdir(downloadPath);
  assert(downloadEvent?.suggestedFilename === "surftmarket-products.csv" || after.some((file) => !before.has(file)), "CSV download did not begin");
});

await resetVendorState();
await click("[data-testid=tab-orders]");
await check("Every packing-slip and print button", async () => {
  await evaluate("window.__vendorPrintCount = 0; window.print = () => { window.__vendorPrintCount += 1; }; true");
  const count = await evaluate("document.querySelectorAll('[data-action=print-slip]').length");
  for (let index = 0; index < count; index += 1) {
    await click("[data-action=print-slip]", index);
    assert(await evaluate("Boolean(document.querySelector('[data-testid=packing-slip]'))"), `Packing slip ${index + 1} did not open`);
    await click("[data-testid=print-packing-slip]");
    await click("[data-testid=modal-close]");
  }
  assert(await evaluate(`window.__vendorPrintCount === ${count}`), "One or more print buttons failed");
});

await check("Every reject button plus confirmed rejection", async () => {
  const count = await evaluate("document.querySelectorAll('[data-action=reject-order]').length");
  for (let index = 0; index < count; index += 1) {
    await click("[data-action=reject-order]", index);
    assert(await evaluate("document.querySelector('[role=dialog]')?.getAttribute('aria-label')?.startsWith('Reject ')"), `Reject ${index + 1} did not open`);
    await clickText("[role=dialog]", "Cancel");
  }
  await click("[data-action=reject-order]", 0);
  await setValue("[aria-label='Rejection reason']", "Inventory unavailable");
  await click("[data-testid=confirm-reject]");
  assert(await evaluate("document.querySelector('[data-testid=" + JSON.stringify("order-status-SF10000001-A") + "]')?.textContent === 'Rejected'"), "Confirmed rejection did not change order status");
});

await resetVendorState();
await click("[data-testid=tab-orders]");
await check("Every accept-order button", async () => {
  const count = await evaluate("document.querySelectorAll('[data-action=accept-order]').length");
  for (let index = 0; index < count; index += 1) await click("[data-action=accept-order]", index);
  assert(await evaluate("[...document.querySelectorAll('[data-testid^=order-status-]')].every((node) => node.textContent === 'Preparing')"), "One or more accept buttons failed");
});

await resetVendorState();
await click("[data-testid=tab-orders]");
await check("Every request-rider button and delivery API response", async () => {
  const count = await evaluate("document.querySelectorAll('[data-action=request-rider]').length");
  for (let index = 0; index < count; index += 1) {
    await click("[data-action=request-rider]", index);
    await waitFor(`document.querySelectorAll('[data-testid^=order-status-]')[${index}]?.textContent === 'Rider assigned'`, 5000, `rider assignment ${index + 1}`);
  }
  assert(await evaluate("document.body.innerText.includes('Emeka R.')"), "Assigned rider details are missing");
});

await resetVendorState();
await click("[data-testid=tab-wallet]");
await check("Withdraw button and payout submission", async () => {
  await click("[data-testid=withdraw]");
  await setValue("[aria-label='Withdrawal amount']", "10000");
  await click("[data-testid=submit-withdrawal]");
  assert(await evaluate("document.querySelector('[data-testid=available-balance]').textContent === '₦1,190,000'"), "Withdrawal did not reduce available balance");
  assert(await evaluate("document.querySelector('[data-testid=panel-wallet]').innerText.includes('₦10,000')"), "Withdrawal was not added to payout history");
});

await check("Commission breakdown open and Done buttons", async () => {
  await click("[data-testid=commission-breakdown]");
  assert(await evaluate("document.body.innerText.includes('Weighted average')"), "Commission breakdown did not open");
  await click("[data-testid=close-commission]");
  assert(!(await evaluate("Boolean(document.querySelector('[role=dialog]'))")), "Commission Done button did not close dialog");
});

await check("Pending escrow View orders button", async () => {
  await click("[data-testid=view-escrow-orders]");
  assert(await evaluate("Boolean(document.querySelector('[data-testid=panel-orders]'))"), "View escrow orders did not open Orders");
});

await click("[data-testid=tab-promos]");
await check("New coupon button and create action", async () => {
  await click("[data-testid=new-coupon]");
  await setValue("[aria-label='Coupon code']", testCouponCode);
  await setValue("[aria-label='Coupon discount']", "15");
  await setValue("[aria-label='Coupon minimum order']", "0");
  await click("[data-testid=create-coupon]");
  await waitFor(`document.querySelector('[data-testid=panel-promos]')?.innerText.includes(${JSON.stringify(`${testCouponCode} — 15% off`)})`, 5000, "database-backed coupon creation");
});

await check("Featured-slot request and submit action", async () => {
  await click("[data-testid=request-featured]");
  await setValue("[aria-label='Featured duration']", "14");
  await click("[data-testid=submit-featured]");
  assert(await evaluate("document.querySelector('[data-testid=panel-promos]').innerText.includes('14 days — Pending review')"), "Featured request was not recorded");
});

await click("[data-testid=tab-reviews]");
await check("Public review reply button", async () => {
  await setValue("[aria-label='Public review reply']", "Thank you for shopping with us!");
  await click("[data-testid=publish-reply]");
  assert(await evaluate("document.querySelector('[data-testid=published-reply]')?.textContent.includes('Thank you for shopping with us!')"), "Review reply was not published");
});

await check("Customer chats and Mark all read buttons", async () => {
  await click("[data-testid=open-chats]");
  assert(await evaluate("document.body.innerText.includes('Is the black colour still available?')"), "Chat dialog did not open");
  await click("[data-testid=mark-chats-read]");
  assert(await evaluate("document.querySelector('[data-testid=open-chats]').textContent.includes('(0 unread)')"), "Chats were not marked read");
});

await click("[data-testid=tab-settings]");
await check("Save store settings button", async () => {
  await setValue("[aria-label='Store name']", "TechHub Lagos QA");
  await click("[data-testid=save-settings]");
  assert(await evaluate("document.querySelector('[data-testid=vendor-hub] h1').textContent.includes('TechHub Lagos QA')"), "Saved store name did not update the Vendor Hub");
  assert(await evaluate("document.querySelector('[data-testid=vendor-notice]')?.textContent === 'Store settings saved.'"), "Settings save confirmation is missing");
  await setValue("[aria-label='Store name']", "TechHub Lagos");
  await click("[data-testid=save-settings]");
  assert(await evaluate("document.querySelector('[data-testid=vendor-hub] h1').textContent.includes('TechHub Lagos')"), "Store name was not restored after the settings test");
});

await click("[data-testid=tab-team]");
await check("Invite staff and Send invitation buttons", async () => {
  await click("[data-testid=invite-staff]");
  await setValue("[aria-label='Staff name']", "Automation Staff");
  await setValue("[aria-label='Staff email']", "automation.staff@example.com");
  await setValue("[aria-label='Staff permissions']", "Reports only");
  await click("[data-testid=send-invite]");
  assert(await evaluate("document.querySelector('[data-testid=panel-team]').innerText.includes('automation.staff@example.com')"), "Staff invitation was not listed");
  assert(await evaluate("document.querySelector('[data-testid=panel-team]').innerText.includes('Staff (3/5 seats)')"), "Staff seat count did not update");
});

await check("Vendor coupon changes cart and checkout prices", async () => {
  await evaluate("localStorage.setItem('sf_cart', '[]'); localStorage.setItem('sf_coupon', 'null'); true");
  await navigate(`/products/${encodeURIComponent("oraimo-freepods-pro anc")}`);
  await waitFor("[...document.querySelectorAll('button')].some((button) => button.textContent?.trim() === 'Add to cart' && Object.keys(button).some((key) => key.startsWith('__reactProps') || key.startsWith('__reactFiber')))", 15000, "product page hydration");
  await clickText("body", "Add to cart");
  await waitFor("document.querySelector('[aria-label=\"Drawer coupon code\"]')", 3000, "cart drawer coupon form");
  await setValue("[aria-label='Drawer coupon code']", "NOTREAL");
  await click("[data-testid=drawer-apply-coupon]");
  await waitFor("document.querySelector('[data-testid=drawer-coupon-status]')?.textContent.includes('not found')", 5000, "invalid coupon feedback");
  assert(await evaluate("document.body.innerText.includes('Checkout • ₦28,500')"), "Invalid coupon changed the cart price");
  await setValue("[aria-label='Drawer coupon code']", testCouponCode);
  await click("[data-testid=drawer-apply-coupon]");
  await waitFor(`document.querySelector('[data-testid=drawer-coupon-status]')?.textContent.includes(${JSON.stringify(`${testCouponCode} applied`)})`, 5000, "vendor coupon application");
  assert(await evaluate("document.body.innerText.includes('−₦4,275') && document.body.innerText.includes('Checkout • ₦24,225')"), "Vendor coupon did not affect the drawer price");

  await navigate("/cart");
  await waitFor("document.querySelector('[data-testid=cart-total]')?.textContent === '₦24,225'", 8000, "discounted cart total");
  assert(await evaluate("document.querySelector('[data-testid=coupon-discount]')?.textContent === '−₦4,275'"), "Cart discount line is incorrect");
  await click("[data-testid=remove-coupon]");
  assert(await evaluate("document.querySelector('[data-testid=cart-total]')?.textContent === '₦28,500'"), "Removing the coupon did not restore the cart total");
  await setValue("[aria-label='Coupon code']", testCouponCode);
  await click("[data-testid=apply-coupon]");
  await waitFor("document.querySelector('[data-testid=cart-total]')?.textContent === '₦24,225'", 5000, "reapplied cart coupon");

  await navigate("/checkout");
  await waitFor("document.querySelector('[data-testid=checkout-total]')", 8000, "checkout pricing");
  assert(await evaluate("document.querySelector('[data-testid=checkout-discount]')?.textContent === '−₦4,275'"), "Coupon did not persist to checkout");
  assert(await evaluate("document.querySelector('[data-testid=checkout-total]')?.textContent === '₦25,725'"), "Checkout total does not include the coupon and standard shipping");
  const cleanup = await evaluate(`fetch('/api/coupons', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'delete', code: ${JSON.stringify(testCouponCode)} }) }).then(async (response) => ({ status: response.status, body: await response.json() }))`);
  assert(cleanup.status === 200 && cleanup.body?.ok, "Temporary coupon cleanup failed");
  await evaluate(`(() => { const key = 'surftmarket-vendor-demo'; const saved = JSON.parse(localStorage.getItem(key) ?? '{}'); if (Array.isArray(saved.coupons)) saved.coupons = saved.coupons.filter((coupon) => coupon.code !== ${JSON.stringify(testCouponCode)}); localStorage.setItem(key, JSON.stringify(saved)); return true; })()`);
});

await check("Mobile layout does not overflow the viewport", async () => {
  await navigate("/vendor");
  await waitFor("document.querySelector('[data-testid=vendor-hub]')", 15000, "Vendor Hub after coupon pricing test");
  const metrics = await evaluate("({ innerWidth, scrollWidth: document.documentElement.scrollWidth, hubWidth: document.querySelector('[data-testid=vendor-hub]').getBoundingClientRect().width })");
  assert(metrics.scrollWidth <= metrics.innerWidth + 1, `Mobile document overflows: ${metrics.scrollWidth}px > ${metrics.innerWidth}px`);
  assert(metrics.hubWidth <= metrics.innerWidth + 1, "Vendor Hub exceeds mobile viewport");
});

await check("Desktop Vendor Hub smoke check", async () => {
  await command("Emulation.setDeviceMetricsOverride", { width: 1280, height: 900, deviceScaleFactor: 1, mobile: false, screenWidth: 1280, screenHeight: 900 });
  await command("Page.reload", { ignoreCache: true });
  await waitFor("document.querySelector('[data-testid=vendor-hub]')", 15000, "desktop Vendor Hub");
  await waitFor("Object.keys(document.querySelector('[data-testid=tab-products]') ?? {}).some((key) => key.startsWith('__reactProps') || key.startsWith('__reactFiber'))", 15000, "desktop Vendor Hub React hydration");
  const metrics = await evaluate("({ innerWidth, scrollWidth: document.documentElement.scrollWidth })");
  assert(metrics.scrollWidth <= metrics.innerWidth + 1, "Desktop document overflows");
  for (const tab of ["overview", "products", "orders", "wallet", "promos", "reviews", "settings", "team"]) {
    await click(`[data-testid=tab-${tab}]`);
    assert(await evaluate(`Boolean(document.querySelector('[data-testid=panel-${tab}]'))`), `Desktop ${tab} panel failed`);
  }
});

const failures = results.filter((result) => result.status === "FAIL");
const meaningfulBrowserErrors = [...new Set(browserErrors)].filter((message) => !message.includes("favicon") && !message.includes("ERR_BLOCKED_BY_CLIENT") && !message.includes("status of 400") && !message.includes("status of 404") && !message.includes("status of 401"));
const report = {
  account: vendorEmail,
  viewportCoverage: ["390x844 mobile", "1280x900 desktop"],
  checks: results,
  passed: results.length - failures.length,
  failed: failures.length,
  actionExecutions,
  browserErrors: meaningfulBrowserErrors,
};
console.log(JSON.stringify(report, null, 2));
socket.close();
if (failures.length || meaningfulBrowserErrors.length) process.exitCode = 1;
