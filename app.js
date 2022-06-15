// app.js
const WebSocket = require("ws");
const zksync = require("zksync");
let config = require("./config.json");
const cmd = require("node-cmd");

async function main() {
  // Get the provider. It's important to specify the correct network.
  const provider = await zksync.getDefaultProvider("mainnet");
  console.log("tokenSets:", provider.tokenSet);
  // Connect to the event server.
  const ws = new WebSocket("wss://events.zksync.io/");
  console.log("Connection established");
  // Change the address to the account you're intrested in.
  const ACCOUNT_ADDRESS = "0x";

  const accounts = Object.values(config.accounts);
  const accounts_lower = accounts.map((element) => {
    return element.toLowerCase();
  });
  console.log("lower:", accounts_lower);
  // Once connected, start sending ping frames.
  setInterval(function () {
    ws.ping();
  }, 10000);

  let address_nickname = new Map();
  for (let val of Object.keys(config.accounts)) {
    address_nickname.set(config.accounts[val].toLowerCase(), val);
  }
  console.log(address_nickname);

  // Register filters.
  ws.on("open", function open() {
    ws.send("{}");
  });

  ws.on("close", function close(code, reason) {
    console.log(`Connection closed with code ${code}, reason: ${reason}`);
  });

  ws.on("message", function (data) {
    try {
      const event = JSON.parse(data);
      console.log(event.block_number, event.data.tx_hash, event.data.tx.type);

      const recipient = event.data.tx.to;
      //console.log('recipient:', recipient, '\n', event)
      //if (accounts_lower.includes(recipient)) {
      //console.log('e:', event)
      //cmd.runSync("say " + event.data.tx.type);
      // return;
      //}

      // We are looking for transfers to the specific account.
      if (event.type == "transaction" && event.data.tx.type == "Transfer") {
        //const recipient = event.data.tx.to;
        // if (recipient != ACCOUNT_ADDRESS) {
        //   return;
        // }
        if (accounts_lower.includes(recipient) == false) {
          console.log("r:", recipient);
          return;
        }
        // Use the provider for formatting.
        const token = provider.tokenSet.resolveTokenSymbol(event.data.token_id);
        const amount = provider.tokenSet.formatToken(
          token,
          event.data.tx.amount
        );

        const status = event.data.status;
        const fromAddr = event.data.tx.from;
        const blockNumber = event.block_number;

        console.log(`There was a transfer to ${recipient}`);
        console.log(`Block number: ${blockNumber}`);
        console.log(`From: ${fromAddr}`);
        console.log(`Token: ${token}`);
        console.log(`Amount: ${amount}`);
        console.log(`Status: ${status}\n`);
      } else if (event.type == "transaction" && event.data.tx.type == "Swap") {
        //console.log('Swap orders:', event.data.tx.orders)
        //let accounts=new Array();
        for (let order of event.data.tx.orders) {
          //accounts.push(order.recipient)
          if (accounts_lower.includes(order.recipient)) {
            console.log(
              "recp:",
              order.recipient,
              address_nickname.get(order.recipient)
            );
            cmd.runSync(
              "say " +
                event.data.tx.type +
                address_nickname.get(order.recipient)
            );
            return;
          }
        }
      }
    } catch (e) {
      console.error(e, data);
    }
  });
}

main();
