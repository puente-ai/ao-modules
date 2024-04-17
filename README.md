# AO Modules

This repo contains AO modules designed to improve composibility within the AO smart contract ecosystem.

## Instructions

### Load module

Create two dev wallets - for example through [ArConnect](https://www.arconnect.io/) - export and save these these as `./wallet.json` and `./wallet2.json`. 

Install aos 
```
npm i -g https://get_ao.g8way.io
```

Select the desired blueprint, e.g. `ao20` and update the `ao20.token.configurator` call to include your own variables. At a minimum you should update `balances` and `owner` to ensure that you have sufficient initial balances and maintain ownership.

Run aos with a unique run id, e.g.
```
aos ao20 v0.1.0 run-1
```
... and load the blueprint
```
.load src/blueprints/ao20.lua
```

### Run tests

Copy the `aos` process from the previous step and hard code it to the `processId` variable, line 26 in `test/blueprints/test-ao20.js`.

Import dependencies
```
yarn
```

Run tests
```
yarn tests
```

#### Troubleshooting

You should expect to see all 46 passing and 4 failing tests on the first run. This is expected. `ao20.TransferOwnership` tests fail because `ao20.RenounceOwnership` tests are executed before them. 

Go back to your aos terminal and reload the blueprint. 

Run tests
```
yarn test 'ao20.TransferOwnership'
```

Testing `...send required notices` usually works but may fail now and then due to the order in which messages are received. If this bothers you please feel free to submit a PR.

**Always ensure to reload the module in aos before rerunning any test to revert to initial state.**