import {
  QueryClient,
  setupDistributionExtension,
  SigningStargateClient,
} from "@cosmjs/stargate";
import { Tendermint34Client } from "@cosmjs/tendermint-rpc";
import { coin, coins, Secp256k1HdWallet } from "@cosmjs/launchpad";
import { chainMap } from "./assets/chains.js";
import "dotenv/config";

const MODE = 1;

async function getQueryClient(rpcEndpoint) {
  const tendermint34Client = await Tendermint34Client.connect(rpcEndpoint);
  const queryClient = QueryClient.withExtensions(
    tendermint34Client,
    setupDistributionExtension
  );
  return queryClient;
}

async function delegate(client, address, validators, amount, chain) {
  let ops = [];
  ops.push({
    typeUrl: "/cosmos.staking.v1beta1.MsgDelegate",
    value: {
      delegatorAddress: address,
      validatorAddress: validators[0],
      amount: coin(amount, chain.denom),
    },
  });
  const fee = {
    amount: [coin("410", chain.denom)],
    gas: "165000",
  };
  let result = await client.signAndBroadcast(address, ops, fee, "");
  console.log("Broadcasting result:", result);
}

async function start(chain, mnemonic, amount) {
  const rpcEndpoint = chain.rpc;
  const wallet = await Secp256k1HdWallet.fromMnemonic(mnemonic, {
    prefix: chain.prefix,
  });
  const [account] = await wallet.getAccounts();
  const queryClient = await getQueryClient(rpcEndpoint);
  //   let rewards = await queryClient.distribution.delegationTotalRewards(
  //     account.address
  //   );
  //   let validators = [];
  //   for (let reward of rewards.rewards) {
  //     validators.push(reward.validatorAddress);
  //   }
  const validators = ["celestiavaloper1uwmf03ke52vld2sa9khs0nslpgzwsm5xs5e4pn"];
  // 这是的kepler address
  //可以换成任意validator 的address，
  const client = await SigningStargateClient.connectWithSigner(
    rpcEndpoint,
    wallet
  );
  await delegate(client, account.address, validators, amount, chain);
}

const mnemonics = process.env.MNEMONICS.split(","); //enter mnemonic
const amount = 10000;
//设置amount
for (let mnemonic of mnemonics) {
  start(chainMap["celestia"], mnemonic, amount);
}
