// const axios = require("axios");
const axios = require("axios").default;
let config = require("./config.json");
const Table = require("cli-table");

// curl -X POST -H 'Content-type: application/json' \
//  -d '{
//    "jsonrpc":"2.0",
//    "id":1, "method": "account_info",
//    "params": ["0x6xxxxxx"]
//    }' \
//
const sleep = (n) => new Promise((res, rej) => setTimeout(res, n));

let address_balance = new Map();

async function account_info(address) {
  try {
    let resp = await axios.post(
      "https://api.zksync.io/jsrpc",
      {
        jsonrpc: "2.0",
        id: 1,
        method: "account_info",
        params: [`${address}`],
      },
      {
        headers: {
          "Content-type": "application/json",
          "User-Agent":
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/102.0.5005.61 Safari/537.36",
        },
        timeout: 2000,
      }
    );
    //console.log('d:', resp.data)
    //let data = resp
    if (resp.data == undefined) {
      //console.log('fetch error:', resp.data)
      return false;
    }

    const balances = resp.data.result.committed.balances;
    const nonce = resp.data.result.committed.nonce;
    const id = resp.data.result.id;
    return { balances: balances, nonce: nonce, id: id };
  } catch (e) {
    //console.error(e)
    return false;
  }
}

async function zksyncBalances2(address) {
  let data;
  let i = 0;

  try {
    process.stdout.write(".");

    data = await account_info(address);
    while (data == false && i++ <= 5) {
      process.stdout.write(i + ".");
      await sleep(Math.random() * 3000);
      data = await account_info(address);
    }
    if (data != false) address_balance.set(address_nickname.get(address), data);
    return data;
  } catch (err) {
    process.stdout.write("e");
  }
}

let address_nickname = new Map();
for (let val of Object.keys(config.accounts)) {
  address_nickname.set(config.accounts[val], val);
}

let sum_u = 0,
  sum_eth = 0;
let sum_nonce = 0;

async function main() {
  try {
    //const address = "0x";
    const accounts = Object.values(config.accounts);
    console.log("accounts:", accounts);
    const promises = accounts.map((a) => zksyncBalances2(a));
    await Promise.all(promises);
    process.stdout.write("over\n");
    var positionTable = new Table({
      head: [
        "Nickname",
        "Nonce",
        "ETH",
        "USDC",
        "USDT",
        "DAI",
        "COMP",
        "ENS",
        "CRV",
        "METIS",
        "ID",
      ],
    });

    const nicknames = Object.keys(config.accounts);

    for (let nickname of nicknames) {
      const v = address_balance.get(nickname);
      if (v == undefined) {
        console.error("undefined:", nickname, v);
        continue;
      }
      const eth =
        v.balances.ETH == undefined ? "" : `${v.balances.ETH / 1e18} ETH`;
      const usdc =
        v.balances.USDC == undefined ? "" : `${v.balances.USDC / 1e6} USDC`;
      const usdt =
        v.balances.USDT == undefined ? "" : `${v.balances.USDT / 1e6} USDT`;
      const dai =
          v.balances.DAI == undefined ? "" : `${v.balances.DAI / 1e18} DAI`;
      const comp =
        v.balances.COMP == undefined ? "" : `${v.balances.COMP / 1e18} COMP`;
      const ens =
        v.balances.ENS == undefined ? "" : `${v.balances.ENS / 1e18} ENS`;
      const crv =
        v.balances.CRV == undefined ? "" : `${v.balances.CRV / 1e18} CRV`;
      const metis =
        v.balances.METIS == undefined ? "" : `${v.balances.METIS / 1e18} METIS`;
      // console.log('v:',nickname, v)
      if (v.balances.USDC != undefined) sum_u += v.balances.USDC / 1e6;
      if (v.balances.ETH != undefined) sum_eth += v.balances.ETH / 1e18;
      sum_nonce += v.nonce;

      console.log(
        `${nickname} nonce: ${v.nonce} ${eth}  ${usdc} ${usdt} ${dai} ${comp} ${ens} ${crv} ${metis} id:${v.id}`
      );
      const id = v.id == null ? "" : v.id.toString();
      // const nonce = v.nonce
      positionTable.push([
        nickname,
        v.nonce.toString(),
        eth,
        usdc,
        usdt,
        dai,
        comp,
        ens,
        crv,
        metis,
        id,
      ]);
      //positionTable.push([nickname, "1", eth, usdc, "2"])
    }

    console.log(positionTable.toString());
    console.log(
      `Total: ${sum_eth} ETH ${sum_u} USDC - totoal transactions: ${sum_nonce}`
    );
  } catch (e) {
    console.error(e);
  }
  // address_balance.forEach((v, k) => {
  //   console.log(k, JSON.stringify(v))
  //
  // });

  // console.log(JSON.stringify(address_balance))
  //console.log('name:', address_nickname)
}

main();
