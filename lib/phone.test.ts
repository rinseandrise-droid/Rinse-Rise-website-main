import assert from "node:assert/strict";
import { test } from "node:test";
import { isIndianMobile, normalizeIndianMobile } from "./phone.ts";

test("normalizes spacing, dashes and +91 prefixes", () => {
  assert.equal(normalizeIndianMobile("95915 06548"), "9591506548");
  assert.equal(normalizeIndianMobile("+91 95915-06548"), "9591506548");
  assert.equal(normalizeIndianMobile("919591506548"), "9591506548");
  assert.equal(normalizeIndianMobile("9175504996"), "9175504996");
  assert.equal(normalizeIndianMobile("+91 91755 04996"), "9175504996");
  assert.equal(normalizeIndianMobile("(91) 7550-4996"), "9175504996");
});

test("accepts valid Indian mobiles and rejects invalid ones", () => {
  assert.equal(isIndianMobile("9591506548"), true);
  assert.equal(isIndianMobile("+91 95915 06548"), true);
  assert.equal(isIndianMobile("9175504996"), true);
  assert.equal(isIndianMobile("919175504996"), true);
  assert.equal(isIndianMobile("0591506548"), false);
  assert.equal(isIndianMobile("12345"), false);
  assert.equal(isIndianMobile("abcdefghij"), false);
  assert.equal(isIndianMobile(""), false);
});
