import assert from "node:assert/strict";
import test from "node:test";
import { authActionSchema } from "./validation";

test("customer registration accepts email or phone", () => {
  assert.equal(authActionSchema.safeParse({
    action: "register",
    name: "Ada Shopper",
    email: "ada@example.com",
    password: "a-secure-password",
    role: "customer",
  }).success, true);
});

test("public registration rejects privileged roles", () => {
  assert.equal(authActionSchema.safeParse({
    action: "register",
    name: "Fake Admin",
    email: "admin@example.com",
    password: "a-secure-password",
    role: "admin",
  }).success, false);
});

test("login requires an identity and password", () => {
  assert.equal(authActionSchema.safeParse({ action: "login", password: "password" }).success, false);
  assert.equal(authActionSchema.safeParse({ action: "login", email: "ada@example.com" }).success, false);
});
