import dotenv from "dotenv";
dotenv.config();

import { createRazorpayOrderDirect, verifyRazorpayPaymentDirect } from "./src/controllers/paymentController.js";
import crypto from "crypto";

async function runTests() {
  console.log("Starting Razorpay Integration Verification Tests...\n");

  // Mock response object helper
  const mockResponse = () => {
    const res = {};
    res.status = (code) => {
      res.statusCode = code;
      return res;
    };
    res.json = (data) => {
      res.body = data;
      return res;
    };
    return res;
  };

  // Test 1: createRazorpayOrderDirect - invalid amount (< 100 paise)
  console.log("Test 1: createRazorpayOrderDirect with amount < 100 paise");
  const req1 = { body: { amount: 50, currency: "INR" } };
  const res1 = mockResponse();
  await createRazorpayOrderDirect(req1, res1);
  console.log("Status Code (Expected 400):", res1.statusCode);
  console.log("Response Body:", res1.body);
  if (res1.statusCode === 400 && res1.body.message.includes("at least 100 paise")) {
    console.log("✅ Test 1 Passed\n");
  } else {
    console.log("❌ Test 1 Failed\n");
  }

  // Test 2: createRazorpayOrderDirect - success (amount >= 100 paise)
  console.log("Test 2: createRazorpayOrderDirect with valid amount");
  const req2 = { body: { amount: 150, currency: "INR", receipt: "receipt_test_123" } };
  const res2 = mockResponse();
  await createRazorpayOrderDirect(req2, res2);
  console.log("Response Body:", res2.body);
  if (res2.body && res2.body.order_id && res2.body.amount === 150) {
    console.log("✅ Test 2 Passed\n");
  } else {
    console.log("❌ Test 2 Failed\n");
  }

  // Test 3: verifyRazorpayPaymentDirect - missing fields
  console.log("Test 3: verifyRazorpayPaymentDirect with missing fields");
  const req3 = { body: { razorpay_order_id: "order_123" } };
  const res3 = mockResponse();
  await verifyRazorpayPaymentDirect(req3, res3);
  console.log("Status Code (Expected 400):", res3.statusCode);
  console.log("Response Body:", res3.body);
  if (res3.statusCode === 400 && res3.body.message.includes("Missing required signature fields")) {
    console.log("✅ Test 3 Passed\n");
  } else {
    console.log("❌ Test 3 Failed\n");
  }

  // Test 4: verifyRazorpayPaymentDirect - invalid signature
  console.log("Test 4: verifyRazorpayPaymentDirect with invalid signature");
  const req4 = {
    body: {
      razorpay_order_id: "order_123",
      razorpay_payment_id: "pay_123",
      razorpay_signature: "wrong_sig"
    }
  };
  const res4 = mockResponse();
  await verifyRazorpayPaymentDirect(req4, res4);
  console.log("Status Code (Expected 400):", res4.statusCode);
  console.log("Response Body:", res4.body);
  if (res4.statusCode === 400 && res4.body.message.includes("Invalid payment signature")) {
    console.log("✅ Test 4 Passed\n");
  } else {
    console.log("❌ Test 4 Failed\n");
  }

  // Test 5: verifyRazorpayPaymentDirect - success with correct signature
  console.log("Test 5: verifyRazorpayPaymentDirect with correct signature");
  const orderId = "order_abc123";
  const paymentId = "pay_xyz789";
  const payload = orderId + "|" + paymentId;
  const signature = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
    .update(payload)
    .digest("hex");

  const req5 = {
    body: {
      razorpay_order_id: orderId,
      razorpay_payment_id: paymentId,
      razorpay_signature: signature
    }
  };
  const res5 = mockResponse();
  await verifyRazorpayPaymentDirect(req5, res5);
  console.log("Response Body:", res5.body);
  if (res5.body && res5.body.success === true) {
    console.log("✅ Test 5 Passed\n");
  } else {
    console.log("❌ Test 5 Failed\n");
  }
}

runTests().catch(console.error);
