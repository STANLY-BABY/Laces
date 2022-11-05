const fetch = require('node-fetch')
require('dotenv').config();
const { CLIENT_ID, APP_SECRET } = process.env;
const base = "https://api-m.sandbox.paypal.com";

exports.createOrder = async function (amount = 0) {
    try{
        
  const accessToken = await generateAccessToken();
  const url = `${base}/v2/checkout/orders`;
  var response = await fetch(url, {
    method: "post",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({
      intent: "CAPTURE",
      purchase_units: [
        {
          amount: {
            currency_code: "USD",
            value: amount,
          },
        },
      ],
    }),
  });
    } catch (err) {
        console.log(err)
    }

  return handleResponse(response);
}

exports.capturePayment = async function (orderId) {
  const accessToken = await generateAccessToken();
  const url = `${base}/v2/checkout/orders/${orderId}/capture`;
  const response = await fetch(url, {
    method: "post",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
  });

  return handleResponse(response);
}

generateAccessToken =  async function () {
 try{
    const auth = Buffer.from(CLIENT_ID + ":" + APP_SECRET).toString("base64");
    console.log(auth)
    var response = await fetch(`${base}/v1/oauth2/token`, {
      method: "post",
      body: "grant_type=client_credentials",
      headers: {
        Authorization: `Basic ${auth}`,
      },
    });
  console.log(response.access_token)
} catch(err) {
   console.log(err)
}
    const jsonData = await handleResponse(response);
    return jsonData.access_token;
}

async function handleResponse(response) {
    // console.log(response)
  if (response.status === 200 || response.status === 201) {
    return response.json();
  }

  const errorMessage = await response.text();
  throw new Error(errorMessage);
}