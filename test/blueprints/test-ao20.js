const { message, createDataItemSigner, result, results } = require("@permaweb/aoconnect");
const { getMessageData, getNoticeData, getNoticeAction, getErrorMessage, parseAmount, parseBalances, delay } = require("./utils");
const { expect } = require("chai")
const { readFileSync } = require("fs")
const path = require("path");
const { error } = require("console");

/* 
* Global variables
*/
let processId
let messageId
let wallet 
let walletAddress
let wallet2 
let walletAddress2
let totalSupply
let balances = new Object()
let initData = new Object()

/* 
* Tests
*/
describe("blueprints.ao20", function () {
  before(async () => ( 
    processId = 'StuERWgMgDvCdo73c7Ncq1R2HoUhbSs2h5sJ0tKZobQ',
    wallet = JSON.parse(
      readFileSync(path.join(__dirname, '../../wallet.json')).toString(),
    ),
    wallet2 = JSON.parse(
      readFileSync(path.join(__dirname, '../../wallet2.json')).toString(),
    ),
    walletAddress = 'XkVOo16KMIHK-zqlR67cuNY0ayXIkPWODWw_HXAE20I',
    walletAddress2 = 'm6W6wreOSejTb2WRHoALM6M7mw3H8D2KmFVBYC1l0O0',
    balances[processId] = parseAmount(100, 10),
    balances[walletAddress] = parseAmount(300, 10),
    balances[walletAddress2] = parseAmount(100, 10),
    totalSupply = parseAmount(400, 10),
    initData = {
        balances: JSON.stringify(balances),
        name: 'My Coin', 
        ticker: 'COIN',
        denomination: '10',
        totalSupply: totalSupply,
        logo: "TXID of logo image",
        initializable: "true",
        burnable: "true",
        mintable: "true",
        pausable: "true",
        paused: "false"
    }
  ))

  /* 
  * Info
  */
  describe("ao20.Info", function () {
    it("+ve should have correct info", async () => {
      // Get info
      await message({
        process: processId,
        tags: [
          { name: "Action", value: "Info" }
        ],
        signer: createDataItemSigner(wallet),
        data: "",
      })
      .then((id) => {
        messageId = id;
      })
      .catch(console.error);

      let { Messages, Errors } = await result({
        message: messageId,
        process: processId,
      });

      if (Errors) {
        console.log(Errors)
      }

      expect(Messages.length).to.be.greaterThanOrEqual(1)
      let { tags } = getMessageData(Messages);

      expect(tags.Name).to.eql(initData.name)
      expect(tags.Ticker).to.eql(initData.ticker)
      expect(tags.Denomination).to.eql(initData.denomination)
      expect(tags.Logo).to.eql(initData.logo)
      expect(tags.Burnable).to.eql(initData.burnable)
      expect(tags.Mintable).to.eql(initData.mintable)
      expect(tags.Pausable).to.eql(initData.pausable)
      expect(tags.Paused).to.eql(initData.paused)
      expect(tags.Owner).to.eql(walletAddress)
    })
  })

  /* 
  * Total Supply
  */
  describe("ao20.TotalSupply", function () {
    it("+ve should have correct totalSupply", async () => {
      // Get total supply
      await message({
        process: processId,
        tags: [
          { name: "Action", value: "TotalSupply" }
        ],
        signer: createDataItemSigner(wallet),
        data: "",
      })
      .then((id) => {
        messageId = id;
      })
      .catch(console.error);

      let { Messages, Errors } = await result({
        message: messageId,
        process: processId,
      });

      if (Errors) {
        console.log(Errors)
      }

      expect(Messages.length).to.be.greaterThanOrEqual(1)
      let { data, tags } = getMessageData(Messages);

      expect(tags.TotalSupply).to.eql(parseAmount(500, 10))
      expect(data).to.eql(parseAmount(500, 10))
    })
  })

  /* 
  * Balance
  */
  describe("ao20.Balance", function () {
    it("+ve should return balance of Sender", async () => {
      let messageId
      await message({
        process: processId,
        tags: [
          { name: "Action", value: "Balance" }
        ],
        signer: createDataItemSigner(wallet),
        data: "",
      })
      .then((id) => {
        messageId = id;
      })
      .catch(console.error);
    
      let { Messages } = await result({
        message: messageId,
        process: processId,
      });
  
      let { target, data, tags } = getMessageData(Messages);
  
      expect(target).to.eql(walletAddress)
      expect(tags.Balance).to.eql(balances[walletAddress])
      expect(tags.Ticker).to.eql(initData.ticker)
      expect(tags.Account).to.eql(walletAddress)
      expect(data).to.eql(balances[walletAddress])
    })

    it("+ve should return positive balance of Target", async () => {
      // Get balance
      await message({
        process: processId,
        tags: [
          { name: "Action", value: "Balance" },
          { name: "Target", value: processId } 
        ],
        signer: createDataItemSigner(wallet),
        data: "",
      })
      .then((id) => {
        messageId = id;
      })
      .catch(console.error);
    
      let { Messages } = await result({
        message: messageId,
        process: processId,
      });

      let { target, data, tags } = getMessageData(Messages);

      expect(target).to.eql(walletAddress)
      expect(data).to.eql(balances[processId])
      expect(tags.Account).to.eql(processId)
      expect(tags.Balance).to.eql(balances[processId])
      expect(tags.Ticker).to.eql(initData.ticker)
    })
  })

  /* 
  * Balances
  */
  describe("ao20.Balances", function () {
    it("+ve should return balances", async () => {
      let messageId
      await message({
        process: processId,
        tags: [
          { name: "Action", value: "Balances" }
        ],
        signer: createDataItemSigner(wallet),
        data: "",
      })
      .then((id) => {
        messageId = id;
      })
      .catch(console.error);
    
      let { Messages } = await result({
        message: messageId,
        process: processId,
      });

      let { target, data } = getMessageData(Messages);

      data = parseBalances(data)

      expect(target).to.eql(walletAddress)
      expect(data).to.have.property(processId)
      expect(data[processId]).to.eql(balances[processId])
    })
  })
  
  /* 
  * Transfer
  */
  describe("ao20.Transfer", function () {
    it("+ve should transfer tokens", async () => {
      // Approve transfer 
      await message({
          process: processId,
          tags: [
            { name: "Action", value: "Approve" },
            { name: "Spender", value: processId },
            { name: "Quantity", value: parseAmount(50, 10) }
          ],
          signer: createDataItemSigner(wallet),
          data: "",
        })
        .then((id) => {
          messageId = id;
        })
        .catch(console.error);
  
      // Transfer tokens
      await message({
        process: processId,
        tags: [
          { name: "Action", value: "Transfer" },
          { name: "Recipient", value: processId },
          { name: "Quantity", value: parseAmount(50, 10) }
        ],
        signer: createDataItemSigner(wallet),
        data: "",
      })
      .then((id) => {
        messageId = id;
      })
      .catch(console.error);
  
      let { Error } = await result({
          message: messageId,
          process: processId,
        });
  
      // Get balance
      await message({
        process: processId,
        tags: [
          { name: "Action", value: "Balances" }
        ],
        signer: createDataItemSigner(wallet),
        data: "",
      })
      .then((id) => {
        messageId = id;
      })
      .catch(console.error);
    
      let { Messages } = await result({
        message: messageId,
        process: processId,
      });
  
      if (Error) {
        console.log(Error)
      }
  
      let { data } = getMessageData(Messages);
      data = parseBalances(data)

      // update global balances
      balances[processId] = (Number(balances[processId]) + Number(parseAmount(50, 10))).toString()
      balances[walletAddress] = (Number(balances[walletAddress]) - Number(parseAmount(50, 10))).toString()
  
      expect(data[processId]).to.eql(balances[processId])
      expect(data[walletAddress]).to.eql(balances[walletAddress])
    })

    it("-ve should fail when Recipient not provided", async () => {
      // Approve transfer 
      await message({
          process: processId,
          tags: [
            { name: "Action", value: "Approve" },
            { name: "Spender", value: processId },
            { name: "Quantity", value: parseAmount(50, 10) }
          ],
          signer: createDataItemSigner(wallet),
          data: "",
        })
        .then((id) => {
          messageId = id;
        })
        .catch(console.error);
  
      // Transfer tokens
      await message({
        process: processId,
        tags: [
          { name: "Action", value: "Transfer" },
          { name: "Quantity", value: parseAmount(50, 10) }
        ],
        signer: createDataItemSigner(wallet),
        data: "",
      })
      .then((id) => {
        messageId = id;
      })
      .catch(console.error);
  
      let { Error } = await result({
        message: messageId,
        process: processId,
      });
  
      let errorMessage = getErrorMessage(Error);
  
      // Get balance
      await message({
        process: processId,
        tags: [
          { name: "Action", value: "Balances" }
        ],
        signer: createDataItemSigner(wallet),
        data: "",
      })
      .then((id) => {
        messageId = id;
      })
      .catch(console.error);
    
      let { Messages } = await result({
        message: messageId,
        process: processId,
      });
  
      let { data } = getMessageData(Messages);
      
      data = parseBalances(data)
  
      expect(errorMessage).to.eql("Recipient is required!")
      expect(data[processId]).to.eql(balances[processId])
      expect(data[walletAddress]).to.eql(balances[walletAddress])
    })

    it("-ve should fail when Quantity not provided", async () => {
      // Approve transfer 
      await message({
        process: processId,
        tags: [
            { name: "Action", value: "Approve" },
            { name: "Spender", value: processId },
            { name: "Quantity", value: parseAmount(50, 10) }
        ],
        signer: createDataItemSigner(wallet),
        data: "",
      })
      .then((id) => {
      messageId = id;
      })
      .catch(console.error);

      // Transfer tokens
      await message({
        process: processId,
        tags: [
          { name: "Action", value: "Transfer" },
          { name: "Recipient", value: processId }
        ],
        signer: createDataItemSigner(wallet),
        data: "",
      })
      .then((id) => {
        messageId = id;
      })
      .catch(console.error);

      let { Error } = await result({
        message: messageId,
        process: processId,
      });

      let errorMessage = getErrorMessage(Error);

      // Get balance
      await message({
        process: processId,
        tags: [
          { name: "Action", value: "Balances" }
        ],
        signer: createDataItemSigner(wallet),
        data: "",
      })
      .then((id) => {
        messageId = id;
      })
      .catch(console.error);
    
      let { Messages } = await result({
        message: messageId,
        process: processId,
      });

      let { data } = getMessageData(Messages);
      
      data = parseBalances(data)

      expect(errorMessage).to.eql("Quantity is required!")
      expect(data[processId]).to.eql(balances[processId])
      expect(data[walletAddress]).to.eql(balances[walletAddress])
    })

    it("-ve should fail when Quantity not valid", async () => {
      // Approve transfer 
      await message({
        process: processId,
        tags: [
            { name: "Action", value: "Approve" },
            { name: "Spender", value: processId },
            { name: "Quantity", value: parseAmount(50, 10) }
        ],
        signer: createDataItemSigner(wallet),
        data: "",
      })
      .then((id) => {
      messageId = id;
      })
      .catch(console.error);

      // Transfer tokens
      await message({
        process: processId,
        tags: [
          { name: "Action", value: "Transfer" },
          { name: "Recipient", value: processId },
          { name: "Quantity", value: parseAmount(50, 10, true) } // negative quantity
        ],
        signer: createDataItemSigner(wallet),
        data: "",
      })
      .then((id) => {
        messageId = id;
      })
      .catch(console.error);

      let { Error } = await result({
        message: messageId,
        process: processId,
      });

      let errorMessage = getErrorMessage(Error);

      // Get balance
      await message({
        process: processId,
        tags: [
          { name: "Action", value: "Balances" }
        ],
        signer: createDataItemSigner(wallet),
        data: "",
      })
      .then((id) => {
        messageId = id;
      })
      .catch(console.error);
    
      let { Messages } = await result({
        message: messageId,
        process: processId,
      });

      let { data } = getMessageData(Messages);
      
      data = parseBalances(data)

      expect(errorMessage).to.eql("Quantity must be greater than zero!")
      expect(data[processId]).to.eql(balances[processId])
      expect(data[walletAddress]).to.eql(balances[walletAddress])
    })

    it("+ve should send required notices", async () => {
      // Approve transfer 
      await message({
        process: processId,
        tags: [
          { name: "Action", value: "Approve" },
          { name: "Spender", value: processId },
          { name: "Quantity", value: parseAmount(50, 10) }
        ],
        signer: createDataItemSigner(wallet),
        data: "",
      })
      .then((id) => {
        messageId = id;
      })
      .catch(console.error);

      // Transfer tokens
      await message({
        process: processId,
        tags: [
          { name: "Action", value: "Transfer" },
          { name: "Recipient", value: processId },
          { name: "Quantity", value: parseAmount(50, 10) }
        ],
        signer: createDataItemSigner(wallet),
        data: "",
      })
      .then((id) => {
        messageId = id;
      })
      .catch(console.error);

      // Get notice cursor
      let resultsOut = await results({
        process: processId,
        sort: 'ASC',
        limit: 25,
      })

      // Get latest notices
      let resultsOut2 = resultsOut
      let nextPage = true
      while (nextPage) {
        let resultsOut_ = await results({
          process: processId,
          from: resultsOut2.edges?.[resultsOut2.edges.length - 1]?.cursor ?? null,
          sort: 'ASC',
          limit: 25,
        })
        nextPage = resultsOut_['edges'].length > 0
        resultsOut2 = nextPage ? resultsOut_ : resultsOut2

        if (resultsOut2['edges'].length < 25) {
          resultsOut_['edges'] = resultsOut2['edges'].concat(resultsOut_['edges'])
          resultsOut2 = resultsOut_
        }
      }

      // update global balances
      balances[processId] = (Number(balances[processId]) + Number(parseAmount(50, 10))).toString()
      balances[walletAddress] = (Number(balances[walletAddress]) - Number(parseAmount(50, 10))).toString()

      // Get notice data
      let noticeData = getNoticeData(resultsOut2)
      // console.log("Notice Data: ", noticeData)
      // console.log("noticeData[noticeData.length-4]: ", noticeData[noticeData.length-4])
      // console.log("noticeData[noticeData.length-3]: ", noticeData[noticeData.length-3])
      // console.log("noticeData[noticeData.length-2]: ", noticeData[noticeData.length-2])

      // Approval Notice
      expect(noticeData[noticeData.length-4]["data_array"][1]).to.equal(`You received an allowance of ${parseAmount(50, 10)} from ${walletAddress}`)
      expect(noticeData[noticeData.length-4]["tags_array"][1]["Action"]).to.equal("Approval-Notice")
      expect(noticeData[noticeData.length-4]["tags_array"][1]["Sender"]).to.equal(walletAddress)
      expect(noticeData[noticeData.length-4]["tags_array"][1]["Allowance"]).to.equal(parseAmount(50, 10))

      // Approve Notice
      expect(noticeData[noticeData.length-4]["data_array"][0]).to.equal(`You granted an allowance of ${parseAmount(50, 10)} to ${processId}`)
      expect(noticeData[noticeData.length-4]["tags_array"][0]["Action"]).to.equal("Approve-Notice")
      expect(noticeData[noticeData.length-4]["tags_array"][0]["Spender"]).to.equal(processId)
      expect(noticeData[noticeData.length-4]["tags_array"][0]["Allowance"]).to.equal(parseAmount(50, 10))

      // Credit Notice
      expect(noticeData[noticeData.length-3]["data_array"][1]).to.equal(`You received ${parseAmount(50, 10)} from ${walletAddress} initiated by ${walletAddress}`)
      expect(noticeData[noticeData.length-3]["tags_array"][1]["Action"]).to.equal("Credit-Notice")
      expect(noticeData[noticeData.length-3]["tags_array"][1]["Spender"]).to.equal(walletAddress)
      expect(noticeData[noticeData.length-3]["tags_array"][1]["Sender"]).to.equal(walletAddress)
      expect(noticeData[noticeData.length-3]["tags_array"][1]["Quantity"]).to.equal(parseAmount(50, 10))

      // Debit Notice
      expect(noticeData[noticeData.length-3]["data_array"][0]).to.equal(`You transferred ${parseAmount(50, 10)} to ${processId} initiated by ${walletAddress}`)
      expect(noticeData[noticeData.length-3]["tags_array"][0]["Action"]).to.equal("Debit-Notice")
      expect(noticeData[noticeData.length-3]["tags_array"][0]["Spender"]).to.equal(walletAddress)
      expect(noticeData[noticeData.length-3]["tags_array"][0]["Recipient"]).to.equal(processId)
      expect(noticeData[noticeData.length-3]["tags_array"][0]["Quantity"]).to.equal(parseAmount(50, 10))

      // Credit Notice
      expect(getNoticeAction(noticeData[noticeData.length-1]["data"])).to.equal("Credit-Notice")
    })
  })

  /* 
  * Allowance
  */
  describe("ao20.Allowance", function () {
    it("+ve should return allowance for Sender", async () => {
      let _messageId
      // Approve allowance
      await message({
        process: processId,
        tags: [
          { name: "Action", value: "Approve" },
          { name: "Spender", value: processId },
          { name: "Quantity", value: parseAmount(50, 10) }
        ],
        signer: createDataItemSigner(wallet),
        data: "",
      })
      .then((id) => {
        _messageId = id;
      })
      .catch(console.error);

      await message({
        process: processId,
        tags: [
          { name: "Action", value: "Allowance" },
          { name: "Spender", value: processId }
        ],
        signer: createDataItemSigner(wallet),
        data: "",
      })
      .then((id) => {
        _messageId = id;
      })
      .catch(console.error);

      let { Messages, Error } = await result({
        message: _messageId,
        process: processId,
      })

      if (Error) {
        console.log(Error)
      }

      let { data, tags } = getMessageData(Messages);
    
      data = parseBalances(data)

      expect(data).to.eql(Number(parseAmount(50, 10)))
      expect(tags.Allowance).to.eql(parseAmount(50, 10))
      expect(tags.Ticker).to.eql(initData.ticker)
      expect(tags.Account).to.eql(walletAddress)
      expect(tags.Spender).to.eql(processId)
    })

    it("+ve should return allowance for Target", async () => {
      // Approve allowance
      await message({
        process: processId,
        tags: [
          { name: "Action", value: "Approve" },
          { name: "Spender", value: processId },
          { name: "Quantity", value: parseAmount(50, 10) }
        ],
        signer: createDataItemSigner(wallet),
        data: "",
      })
      .then((id) => {
        messageId = id;
      })
      .catch(console.error);

      await message({
        process: processId,
        tags: [
          { name: "Action", value: "Allowance" },
          { name: "Spender", value: walletAddress },
          { name: "Target", value: processId }
        ],
        signer: createDataItemSigner(wallet),
        data: "",
      })
      .then((id) => {
        messageId = id;
      })
      .catch(console.error);

      let { Messages } = await result({
        message: messageId,
        process: processId,
      })

      let { data, tags } = getMessageData(Messages);
    
      data = parseBalances(data)

      expect(data).to.eql(0)
      expect(tags.Allowance).to.eql('0')
      expect(tags.Ticker).to.eql(initData.ticker)
      expect(tags.Account).to.eql(processId)
      expect(tags.Spender).to.eql(walletAddress)
    })

    it("-ve should fail when Spender is not provided", async () => {
      // Approve allowance
      await message({
        process: processId,
        tags: [
          { name: "Action", value: "Approve" },
          { name: "Quantity", value: parseAmount(50, 10) }
        ],
        signer: createDataItemSigner(wallet),
        data: "",
      })
      .then((id) => {
        messageId = id;
      })
      .catch(console.error);

      let { Error } = await result({
        message: messageId,
        process: processId,
      })

      expect(getErrorMessage(Error)).to.eql("Spender is required!")
    })
  })

  /* 
  * Allowances
  */
  describe("ao20.Allowances", function () {
    it("+ve should return allowances for all participants", async () => {
      // Approve allowance
      await message({
        process: processId,
        tags: [
          { name: "Action", value: "Approve" },
          { name: "Spender", value: processId },
          { name: "Quantity", value: parseAmount(50, 10) }
        ],
        signer: createDataItemSigner(wallet),
        data: "",
      })
      .then((id) => {
        messageId = id;
      })
      .catch(console.error);

      await message({
        process: processId,
        tags: [
          { name: "Action", value: "Allowances" }
        ],
        signer: createDataItemSigner(wallet),
        data: "",
      })
      .then((id) => {
        messageId = id;
      })
      .catch(console.error);

      let { Messages } = await result({
        message: messageId,
        process: processId,
      })

      let { data } = getMessageData(Messages);
    
      data = parseBalances(data)

      expect(typeof(data)).to.eql('object')
      expect(data[walletAddress][processId]).to.eql(parseAmount(50, 10))
    })
  })

  /* 
  * Approve
  */
  describe("ao20.Approve", function () {
    it("-ve should fail when Spender is not provided", async () => {
      await message({
        process: processId,
        tags: [
          { name: "Action", value: "Approve" },
          { name: "Quantity", value: parseAmount(50, 10) }
        ],
        signer: createDataItemSigner(wallet),
        data: "",
      })
      .then((id) => {
        messageId = id;
      })
      .catch(console.error);

      let { Error } = await result({
        message: messageId,
        process: processId,
      })

       // Get balance
       await message({
        process: processId,
        tags: [
          { name: "Action", value: "Balances" }
        ],
        signer: createDataItemSigner(wallet),
        data: "",
      })
      .then((id) => {
        messageId = id;
      })
      .catch(console.error);
    
      let { Messages } = await result({
        message: messageId,
        process: processId,
      });

      let { data } = getMessageData(Messages);
      data = parseBalances(data)

      expect(getErrorMessage(Error)).to.eql("Spender is required!")
      expect(data[processId]).to.eql(balances[processId])
      expect(data[walletAddress]).to.eql(balances[walletAddress])
    })

    it("-ve should fail when Quantity is not provided", async () => {
      await message({
        process: processId,
        tags: [
          { name: "Action", value: "Approve" },
          { name: "Spender", value: processId }
        ],
        signer: createDataItemSigner(wallet),
        data: "",
      })
      .then((id) => {
        messageId = id;
      })
      .catch(console.error);

      let { Error } = await result({
        message: messageId,
        process: processId,
      })

       // Get balance
       await message({
        process: processId,
        tags: [
          { name: "Action", value: "Balances" }
        ],
        signer: createDataItemSigner(wallet),
        data: "",
      })
      .then((id) => {
        messageId = id;
      })
      .catch(console.error);
    
      let { Messages } = await result({
        message: messageId,
        process: processId,
      });

      let { data } = getMessageData(Messages);
      data = parseBalances(data)

      expect(getErrorMessage(Error)).to.eql("Quantity is required!")
      expect(data[processId]).to.eql(balances[processId])
      expect(data[walletAddress]).to.eql(balances[walletAddress])
    })

    it("-ve should fail when Quantity is not valid", async () => {
      await message({
        process: processId,
        tags: [
          { name: "Action", value: "Approve" },
          { name: "Spender", value: processId },
          { name: "Quantity", value: parseAmount(50, 12, true) } // negative quantity
        ],
        signer: createDataItemSigner(wallet),
        data: "",
      })
      .then((id) => {
        messageId = id;
      })
      .catch(console.error);

      let { Error } = await result({
        message: messageId,
        process: processId,
      })

       // Get balance
       await message({
        process: processId,
        tags: [
          { name: "Action", value: "Balances" }
        ],
        signer: createDataItemSigner(wallet),
        data: "",
      })
      .then((id) => {
        messageId = id;
      })
      .catch(console.error);
    
      let { Messages } = await result({
        message: messageId,
        process: processId,
      });

      let { data } = getMessageData(Messages);
      data = parseBalances(data)

      expect(getErrorMessage(Error)).to.eql("Quantity must be greater than or equal to zero!")
      expect(data[processId]).to.eql(balances[processId])
      expect(data[walletAddress]).to.eql(balances[walletAddress])
    })

    it("-ve should prevent token transfer when insufficient allowance", async () => {      
      // Approve insufficient allowance
      await message({
        process: processId,
        tags: [
          { name: "Action", value: "Approve" },
          { name: "Spender", value: processId },
          { name: "Quantity", value: parseAmount(49, 10) }
        ],
        signer: createDataItemSigner(wallet),
        data: "",
      })
      .then((id) => {
        messageId = id;
      })
      .catch(console.error);

      // Transfer tokens
      await message({
        process: processId,
        tags: [
          { name: "Action", value: "Transfer" },
          { name: "Recipient", value: processId },
          { name: "Quantity", value: parseAmount(50, 10) }
        ],
        signer: createDataItemSigner(wallet),
        data: "",
      })
      .then((id) => {
        messageId = id;
      })
      .catch(console.error);

      let { Error } = await result({
          message: messageId,
          process: processId,
        });

      // Get balance
      await message({
        process: processId,
        tags: [
          { name: "Action", value: "Balances" }
        ],
        signer: createDataItemSigner(wallet),
        data: "",
      })
      .then((id) => {
        messageId = id;
      })
      .catch(console.error);
    
      let { Messages } = await result({
        message: messageId,
        process: processId,
      });

      let { data } = getMessageData(Messages);
      data = parseBalances(data)

      expect(getErrorMessage(Error)).to.eql("Quantity must be less than or equal to allowance!")
      expect(data[processId]).to.eql(balances[processId])
      expect(data[walletAddress]).to.eql(balances[walletAddress])
    })

    it("-ve should prevent token transferFrom when insufficient allowance", async () => {
      // Approve transferFrom to processId with insufficient allowance
      await message({
        process: processId,
        tags: [
          { name: "Action", value: "Approve" },
          { name: "Spender", value: processId },
          { name: "Quantity", value: parseAmount(49, 10) }
        ],
        signer: createDataItemSigner(wallet),
        data: "",
      })
      .then((id) => {
        messageId = id;
      })
      .catch(console.error);

      // Initiate transferFrom by wallet2
      await message({
        process: processId,
        tags: [
          { name: "Action", value: "TransferFrom" },
          { name: "Sender", value: walletAddress },
          { name: "Recipient", value: processId },
          { name: "Quantity", value: parseAmount(50, 10) }
        ],
        signer: createDataItemSigner(wallet2),
        data: "",
      })
      .then((id) => {
        messageId = id;
      })
      .catch(console.error);

      let { Error } = await result({
          message: messageId,
          process: processId,
        });

      // Get balance
      await message({
        process: processId,
        tags: [
          { name: "Action", value: "Balances" }
        ],
        signer: createDataItemSigner(wallet),
        data: "",
      })
      .then((id) => {
        messageId = id;
      })
      .catch(console.error);
    
      let { Messages } = await result({
        message: messageId,
        process: processId,
      });

      let { data } = getMessageData(Messages);
      
      data = parseBalances(data)

      expect(getErrorMessage(Error)).to.eql("Quantity must be less than or equal to allowance!")
      expect(data[processId]).to.eql(balances[processId])
      expect(data[walletAddress]).to.eql(balances[walletAddress])
    })

    it("-ve should prevent token burnFrom when not insufficient allowance", async () => {})
  })

  /* 
  * Transfer From
  */
  describe("ao20.TransferFrom", function () {
    it("+ve should execute transferFrom Spender to Recipient", async () => {
      // Approve transfer to processId
      await message({
        process: processId,
        tags: [
          { name: "Action", value: "Approve" },
          { name: "Spender", value: walletAddress2 },
          { name: "Quantity", value: parseAmount(50, 10) }
        ],
        signer: createDataItemSigner(wallet),
        data: "",
      })
      .then((id) => {
        messageId = id;
      })
      .catch(console.error);

      // Initiate transferFrom by wallet2
      await message({
        process: processId,
        tags: [
          { name: "Action", value: "TransferFrom" },
          { name: "Sender", value: walletAddress },
          { name: "Recipient", value: processId },
          { name: "Quantity", value: parseAmount(50, 10) }
        ],
        signer: createDataItemSigner(wallet2),
        data: "",
      })
      .then((id) => {
        messageId = id;
      })
      .catch(console.error);

      let { Error } = await result({
          message: messageId,
          process: processId,
        });

      // Get balance
      await message({
        process: processId,
        tags: [
          { name: "Action", value: "Balances" }
        ],
        signer: createDataItemSigner(wallet),
        data: "",
      })
      .then((id) => {
        messageId = id;
      })
      .catch(console.error);
    
      let { Messages } = await result({
        message: messageId,
        process: processId,
      });

      if (Error) {
        console.log(Error)
      }

      let { data } = getMessageData(Messages);
      
      data = parseBalances(data)

      // update global balances
      balances[processId] = (Number(balances[processId]) + Number(parseAmount(50, 10))).toString()
      balances[walletAddress] = (Number(balances[walletAddress]) - Number(parseAmount(50, 10))).toString()

      expect(data[processId]).to.eql(balances[processId])
      expect(data[walletAddress]).to.eql(balances[walletAddress])
    })

    it("-ve should fail when Spender not provided", async () => {
      // Approve transfer to processId
      await message({
        process: processId,
        tags: [
          { name: "Action", value: "Approve" },
          { name: "Spender", value: processId },
          { name: "Quantity", value: parseAmount(50, 10) }
        ],
        signer: createDataItemSigner(wallet),
        data: "",
      })
      .then((id) => {
        messageId = id;
      })
      .catch(console.error);

      // Initiate transferFrom by wallet2 w/o Spender
      await message({
        process: processId,
        tags: [
          { name: "Action", value: "TransferFrom" },
          { name: "Recipient", value: processId },
          { name: "Quantity", value: parseAmount(50, 10) }
        ],
        signer: createDataItemSigner(wallet2),
        data: "",
      })
      .then((id) => {
        messageId = id;
      })
      .catch(console.error);

      let { Error } = await result({
          message: messageId,
          process: processId,
        });

      // Get balance
      await message({
        process: processId,
        tags: [
          { name: "Action", value: "Balances" }
        ],
        signer: createDataItemSigner(wallet),
        data: "",
      })
      .then((id) => {
        messageId = id;
      })
      .catch(console.error);
    
      let { Messages } = await result({
        message: messageId,
        process: processId,
      });

      let { data } = getMessageData(Messages);
      
      data = parseBalances(data)

      expect(getErrorMessage(Error)).to.eql("Sender is required!")
      expect(data[processId]).to.eql(balances[processId])
      expect(data[walletAddress]).to.eql(balances[walletAddress])
    })

    it("-ve should fail when Recipient not provided", async () => {
      // Approve transfer to processId
      await message({
        process: processId,
        tags: [
          { name: "Action", value: "Approve" },
          { name: "Spender", value: processId },
          { name: "Quantity", value: parseAmount(50, 10) }
        ],
        signer: createDataItemSigner(wallet),
        data: "",
      })
      .then((id) => {
        messageId = id;
      })
      .catch(console.error);

      // Initiate transferFrom by wallet2 w/o Spender
      await message({
        process: processId,
        tags: [
          { name: "Action", value: "TransferFrom" },
          { name: "Sender", value: walletAddress },
          { name: "Quantity", value: parseAmount(50, 10) }
        ],
        signer: createDataItemSigner(wallet2),
        data: "",
      })
      .then((id) => {
        messageId = id;
      })
      .catch(console.error);

      let { Error } = await result({
          message: messageId,
          process: processId,
        });

      // Get balance
      await message({
        process: processId,
        tags: [
          { name: "Action", value: "Balances" }
        ],
        signer: createDataItemSigner(wallet),
        data: "",
      })
      .then((id) => {
        messageId = id;
      })
      .catch(console.error);
    
      let { Messages } = await result({
        message: messageId,
        process: processId,
      });

      let { data } = getMessageData(Messages);
      
      data = parseBalances(data)

      expect(getErrorMessage(Error)).to.eql("Recipient is required!")
      expect(data[processId]).to.eql(balances[processId])
      expect(data[walletAddress]).to.eql(balances[walletAddress])    
    })

    it("-ve should fail when Quantity not provided", async () => {
      // Approve transfer to processId
      await message({
        process: processId,
        tags: [
          { name: "Action", value: "Approve" },
          { name: "Spender", value: processId },
          { name: "Quantity", value: parseAmount(50, 10) }
        ],
        signer: createDataItemSigner(wallet),
        data: "",
      })
      .then((id) => {
        messageId = id;
      })
      .catch(console.error);

      // Initiate transferFrom by wallet2 w/o Spender
      await message({
        process: processId,
        tags: [
          { name: "Action", value: "TransferFrom" },
          { name: "Sender", value: walletAddress },
          { name: "Recipient", value: processId }
        ],
        signer: createDataItemSigner(wallet2),
        data: "",
      })
      .then((id) => {
        messageId = id;
      })
      .catch(console.error);

      let { Error } = await result({
          message: messageId,
          process: processId,
        });

      // Get balance
      await message({
        process: processId,
        tags: [
          { name: "Action", value: "Balances" }
        ],
        signer: createDataItemSigner(wallet),
        data: "",
      })
      .then((id) => {
        messageId = id;
      })
      .catch(console.error);
    
      let { Messages } = await result({
        message: messageId,
        process: processId,
      });

      let { data } = getMessageData(Messages);
      
      data = parseBalances(data)

      expect(getErrorMessage(Error)).to.eql("Quantity is required!")
      expect(data[processId]).to.eql(balances[processId])
      expect(data[walletAddress]).to.eql(balances[walletAddress]) 
    })

    it("-ve should fail when Quantity not valid", async () => {
      // Approve transfer to processId
       await message({
        process: processId,
        tags: [
          { name: "Action", value: "Approve" },
          { name: "Spender", value: processId },
          { name: "Quantity", value: parseAmount(50, 10) }
        ],
        signer: createDataItemSigner(wallet),
        data: "",
      })
      .then((id) => {
        messageId = id;
      })
      .catch(console.error);

      // Initiate transferFrom by wallet2 w/o Spender
      await message({
        process: processId,
        tags: [
          { name: "Action", value: "TransferFrom" },
          { name: "Sender", value: walletAddress },
          { name: "Recipient", value: processId },
          { name: "Quantity", value: parseAmount(50, 12, true) } // negative quantity
        ],
        signer: createDataItemSigner(wallet2),
        data: "",
      })
      .then((id) => {
        messageId = id;
      })
      .catch(console.error);

      let { Error } = await result({
          message: messageId,
          process: processId,
        });

      // Get balance
      await message({
        process: processId,
        tags: [
          { name: "Action", value: "Balances" }
        ],
        signer: createDataItemSigner(wallet),
        data: "",
      })
      .then((id) => {
        messageId = id;
      })
      .catch(console.error);
    
      let { Messages } = await result({
        message: messageId,
        process: processId,
      });

      let { data } = getMessageData(Messages);
      
      data = parseBalances(data)

      expect(getErrorMessage(Error)).to.eql("Quantity must be greater than zero!")
      expect(data[processId]).to.eql(balances[processId])
      expect(data[walletAddress]).to.eql(balances[walletAddress]) 
    })

    it("+ve should send required notices", async () => {
      // Approve transfer to processId
      await message({
        process: processId,
        tags: [
          { name: "Action", value: "Approve" },
          { name: "Spender", value: walletAddress2 },
          { name: "Quantity", value: parseAmount(50, 10) }
        ],
        signer: createDataItemSigner(wallet),
        data: "",
      })
      .then((id) => {
        messageId = id;
      })
      .catch(console.error);

      // Initiate transferFrom by wallet2
      await message({
        process: processId,
        tags: [
          { name: "Action", value: "TransferFrom" },
          { name: "Sender", value: walletAddress },
          { name: "Recipient", value: processId },
          { name: "Quantity", value: parseAmount(50, 10) }
        ],
        signer: createDataItemSigner(wallet2),
        data: "",
      })
      .then((id) => {
        messageId = id;
      })
      .catch(console.error);

      // Get notice cursor
      let resultsOut = await results({
        process: processId,
        sort: 'ASC',
        limit: 25,
      })

      // Get latest notices
      let resultsOut2 = resultsOut
      let nextPage = true
      while (nextPage) {
        let resultsOut_ = await results({
          process: processId,
          from: resultsOut2.edges?.[resultsOut2.edges.length - 1]?.cursor ?? null,
          sort: 'ASC',
          limit: 25,
        })
        nextPage = resultsOut_['edges'].length > 0
        resultsOut2 = nextPage ? resultsOut_ : resultsOut2

        if (resultsOut2['edges'].length < 25) {
          resultsOut_['edges'] = resultsOut2['edges'].concat(resultsOut_['edges'])
          resultsOut2 = resultsOut_
        }
      }

      // Get notice data
      let noticeData = getNoticeData(resultsOut2)

      // update global balances
      balances[processId] = (Number(balances[processId]) + Number(parseAmount(50, 10))).toString()
      balances[walletAddress] = (Number(balances[walletAddress]) - Number(parseAmount(50, 10))).toString()

      // Approve Notice
      expect(noticeData[noticeData.length-3]["data_array"][0]).to.equal(`You granted an allowance of ${parseAmount(50, 10)} to ${walletAddress2}`)
      expect(noticeData[noticeData.length-3]["tags_array"][0]["Action"]).to.equal("Approve-Notice")
      expect(noticeData[noticeData.length-3]["tags_array"][0]["Spender"]).to.equal(walletAddress2)
      expect(noticeData[noticeData.length-3]["tags_array"][0]["Allowance"]).to.equal(parseAmount(50, 10))

      // // Approval Notice
      expect(noticeData[noticeData.length-3]["data_array"][1]).to.equal(`You received an allowance of ${parseAmount(50, 10)} from ${walletAddress}`)
      expect(noticeData[noticeData.length-3]["tags_array"][1]["Action"]).to.equal("Approval-Notice")
      expect(noticeData[noticeData.length-3]["tags_array"][1]["Sender"]).to.equal(walletAddress)
      expect(noticeData[noticeData.length-3]["tags_array"][1]["Allowance"]).to.equal(parseAmount(50, 10))

      // Transfer Notice
      expect(noticeData[noticeData.length-2]["data_array"][2]).to.equal(`You initiated the transfer of ${parseAmount(50, 10)} from ${walletAddress} to ${processId}`)
      expect(noticeData[noticeData.length-2]["tags_array"][2]["Action"]).to.equal("Transfer-Notice")
      expect(noticeData[noticeData.length-2]["tags_array"][2]["Spender"]).to.equal(walletAddress2)
      expect(noticeData[noticeData.length-2]["tags_array"][2]["Sender"]).to.equal(walletAddress)
      expect(noticeData[noticeData.length-2]["tags_array"][2]["Recipient"]).to.equal(processId)
      expect(noticeData[noticeData.length-2]["tags_array"][2]["Quantity"]).to.equal(parseAmount(50, 10))

      // Credit Notice
      expect(noticeData[noticeData.length-2]["data_array"][1]).to.equal(`You received ${parseAmount(50, 10)} from ${walletAddress} initiated by ${walletAddress2}`)
      expect(noticeData[noticeData.length-2]["tags_array"][1]["Action"]).to.equal("Credit-Notice")
      expect(noticeData[noticeData.length-2]["tags_array"][1]["Spender"]).to.equal(walletAddress2)
      expect(noticeData[noticeData.length-2]["tags_array"][1]["Sender"]).to.equal(walletAddress)
      expect(noticeData[noticeData.length-2]["tags_array"][1]["Quantity"]).to.equal(parseAmount(50, 10))

      // Debit Notice
      expect(noticeData[noticeData.length-2]["data_array"][0]).to.equal(`You transferred ${parseAmount(50, 10)} to ${processId} initiated by ${walletAddress2}`)
      expect(noticeData[noticeData.length-2]["tags_array"][0]["Action"]).to.equal("Debit-Notice")
      expect(noticeData[noticeData.length-2]["tags_array"][0]["Spender"]).to.equal(walletAddress2)
      expect(noticeData[noticeData.length-2]["tags_array"][0]["Recipient"]).to.equal(processId)
      expect(noticeData[noticeData.length-2]["tags_array"][0]["Quantity"]).to.equal(parseAmount(50, 10))

      // Credit Notice
      expect(getNoticeAction(noticeData[noticeData.length-1]["data"])).to.equal("Credit-Notice")
    })
  })

  /* 
  * Mint
  */
  describe("ao20.Mint", function () {
    it("+ve should mint to Recipient when provided", async () => {
      let messageId
      await message({
        process: processId,
        tags: [
          { name: "Action", value: "Mint" },
          { name: "Recipient", value: walletAddress2 },
          { name: "Quantity", value: parseAmount(50, 10) }
        ],
        signer: createDataItemSigner(wallet),
        data: "",
      })
      .then((id) => {
        messageId = id;
      })
      .catch(console.error);

      // Get balance
      await message({
        process: processId,
        tags: [
          { name: "Action", value: "Balances" }
        ],
        signer: createDataItemSigner(wallet),
        data: "",
      })
      .then((id) => {
        messageId = id;
      })
      .catch(console.error);

      let { Messages } = await result({
        message: messageId,
        process: processId,
      });

      let { data } = getMessageData(Messages);

      data = parseBalances(data)

      // update global balances
      balances[walletAddress2] = (Number(balances[walletAddress2]) + Number(parseAmount(50, 10))).toString()
  
      expect(data[processId]).to.eql(balances[processId])
      expect(data[walletAddress]).to.eql(balances[walletAddress])
      expect(data[walletAddress2]).to.eql(balances[walletAddress2])
    })

    it("+ve should mint to Process when Recipient not provided", async () => {
      let messageId
      await message({
        process: processId,
        tags: [
          { name: "Action", value: "Mint" },
          { name: "Quantity", value: parseAmount(50, 10) }
        ],
        signer: createDataItemSigner(wallet),
        data: "",
      })
      .then((id) => {
        messageId = id;
      })
      .catch(console.error);
    
      let { Error } = await result({
        message: messageId,
        process: processId,
      });

      // Get balance
      await message({
        process: processId,
        tags: [
          { name: "Action", value: "Balances" }
        ],
        signer: createDataItemSigner(wallet),
        data: "",
      })
      .then((id) => {
        messageId = id;
      })
      .catch(console.error);

      let { Messages } = await result({
        message: messageId,
        process: processId,
      });

      let { data } = getMessageData(Messages);
      data = parseBalances(data)

      // update global balances
      balances[processId] = (Number(balances[processId]) + Number(parseAmount(50, 10))).toString()

      expect(data[processId]).to.eql(balances[processId])
      expect(data[walletAddress]).to.eql(balances[walletAddress])
    })

    it("+ve should mint to Process when Quantity not provided", async () => {
      let messageId
      await message({
        process: processId,
        tags: [
          { name: "Action", value: "Mint" },
          { name: "Recipient", value: processId }
        ],
        signer: createDataItemSigner(wallet),
        data: "",
      })
      .then((id) => {
        messageId = id;
      })
      .catch(console.error);
    
      let { Error } = await result({
        message: messageId,
        process: processId,
      });
  
      let errorMessage = getErrorMessage(Error);

      // Get balance
      await message({
        process: processId,
        tags: [
          { name: "Action", value: "Balances" }
        ],
        signer: createDataItemSigner(wallet),
        data: "",
      })
      .then((id) => {
        messageId = id;
      })
      .catch(console.error);

      let { Messages } = await result({
        message: messageId,
        process: processId,
      });

      let { data } = getMessageData(Messages);

      data = parseBalances(data)
  
      expect(errorMessage).to.eql("Quantity is required!")
      expect(data[processId]).to.eql(balances[processId])
      expect(data[walletAddress]).to.eql(balances[walletAddress])
    })

    // TODO: Split out into separate test / file for non-mintable token
    // it("-ve should fail to mint when Process is not Mintable", async () => {
    //   let newInitData = initData
    //   newInitData.mintable = "false"
    //   await init(processId, wallet, newInitData)

    //   let messageId
    //   await message({
    //     process: processId,
    //     tags: [
    //       { name: "Action", value: "Mint" },
    //       { name: "Recipient", value: processId },
    //       { name: "Quantity", value: parseAmount(50, 10) }
    //     ],
    //     signer: createDataItemSigner(wallet),
    //     data: "",
    //   })
    //   .then((id) => {
    //     messageId = id;
    //   })
    //   .catch(console.error);
    
    //   let { Error } = await result({
    //     message: messageId,
    //     process: processId,
    //   });
  
    //   let errorMessage = getErrorMessage(Error);

    //   // Get balance
    //   await message({
    //     process: processId,
    //     tags: [
    //       { name: "Action", value: "Balances" }
    //     ],
    //     signer: createDataItemSigner(wallet),
    //     data: "",
    //   })
    //   .then((id) => {
    //     messageId = id;
    //   })
    //   .catch(console.error);

    //   let { Messages } = await result({
    //     message: messageId,
    //     process: processId,
    //   });

    //   let { data } = getMessageData(Messages);

    //   data = parseBalances(data)
  
    //   expect(errorMessage).to.eql("Minting is not allowed!")
    //   expect(data[processId]).to.eql(parseAmount(100, 10))
    //   expect(data[walletAddress]).to.eql(parseAmount(200, 10))
    // })

    it("-ve should fail to mint when Sender is not Owner", async () => {
      // start test
      let messageId
      await message({
        process: processId,
        tags: [
          { name: "Action", value: "Mint" },
          { name: "Recipient", value: processId },
          { name: "Quantity", value: parseAmount(50, 10) }
        ],
        signer: createDataItemSigner(wallet2),
        data: "",
      })
      .then((id) => {
        messageId = id;
      })
      .catch(console.error);
    
      let { Error } = await result({
        message: messageId,
        process: processId,
      });
  
      let errorMessage = getErrorMessage(Error);

      // Get balance
      await message({
        process: processId,
        tags: [
          { name: "Action", value: "Balances" }
        ],
        signer: createDataItemSigner(wallet),
        data: "",
      })
      .then((id) => {
        messageId = id;
      })
      .catch(console.error);

      let { Messages } = await result({
        message: messageId,
        process: processId,
      });

      let { data } = getMessageData(Messages);
      data = parseBalances(data)
  
      expect(errorMessage).to.eql("Sender must be Owner!")
      expect(data[processId]).to.eql(balances[processId])
      expect(data[walletAddress]).to.eql(balances[walletAddress])
    })

    it("+ve should send required notices", async () => {
      await message({
        process: processId,
        tags: [
          { name: "Action", value: "Mint" },
          { name: "Recipient", value: walletAddress2 },
          { name: "Quantity", value: parseAmount(50, 10) }
        ],
        signer: createDataItemSigner(wallet),
        data: "",
      })
      .then((id) => {
        messageId = id;
      })
      .catch(console.error);

      // Get balance
      await message({
        process: processId,
        tags: [
          { name: "Action", value: "Balances" }
        ],
        signer: createDataItemSigner(wallet),
        data: "",
      })
      .then((id) => {
        messageId = id;
      })
      .catch(console.error);

      // Get notice cursor
      let resultsOut = await results({
        process: processId,
        sort: 'ASC',
        limit: 25,
      })

      // Get latest notices
      let resultsOut2 = resultsOut
      let nextPage = true
      while (nextPage) {
        let resultsOut_ = await results({
          process: processId,
          from: resultsOut2.edges?.[resultsOut2.edges.length - 1]?.cursor ?? null,
          sort: 'ASC',
          limit: 25,
        })
        nextPage = resultsOut_['edges'].length > 0
        resultsOut2 = nextPage ? resultsOut_ : resultsOut2

        if (resultsOut2['edges'].length < 25) {
          resultsOut_['edges'] = resultsOut2['edges'].concat(resultsOut_['edges'])
          resultsOut2 = resultsOut_
        }
      }

      // Get notice data
      let noticeData = getNoticeData(resultsOut2)

      // Transfer Notice
      expect(noticeData[noticeData.length-2]["data_array"][1]).to.equal(`You initiated the transfer of ${parseAmount(50, 10)} from nil to ${walletAddress2}`)
      expect(noticeData[noticeData.length-2]["tags_array"][1]["Action"]).to.equal("Transfer-Notice")
      expect(noticeData[noticeData.length-2]["tags_array"][1]["Sender"]).to.equal("nil")
      expect(noticeData[noticeData.length-2]["tags_array"][1]["Spender"]).to.equal(walletAddress)
      expect(noticeData[noticeData.length-2]["tags_array"][1]["Recipient"]).to.equal(walletAddress2)
      expect(noticeData[noticeData.length-2]["tags_array"][1]["Quantity"]).to.equal(parseAmount(50, 10))

      // Credit Notice
      expect(noticeData[noticeData.length-2]["data_array"][0]).to.equal(`You received ${parseAmount(50, 10)} from nil initiated by ${walletAddress}`)
      expect(noticeData[noticeData.length-2]["tags_array"][0]["Action"]).to.equal("Credit-Notice")
      expect(noticeData[noticeData.length-2]["tags_array"][0]["Spender"]).to.equal(walletAddress)
      expect(noticeData[noticeData.length-2]["tags_array"][0]["Sender"]).to.equal("nil")
      expect(noticeData[noticeData.length-2]["tags_array"][0]["Quantity"]).to.equal(parseAmount(50, 10))
    
      // update global balances
      balances[walletAddress2] = (Number(balances[walletAddress2]) + Number(parseAmount(50, 10))).toString()
    })
  })

  /* 
  * Burn
  */
  describe("ao20.Burn", function () {
    it("+ve should burn tokens from the Sender", async () => {
      let messageId
      await message({
        process: processId,
        tags: [
          { name: "Action", value: "Burn" },
          { name: "Quantity", value: parseAmount(50, 10) }
        ],
        signer: createDataItemSigner(wallet),
        data: "",
      })
      .then((id) => {
        messageId = id;
      })
      .catch(console.error);

      let { Error } = await result({
        message: messageId,
        process: processId,
      });

      if (Error) {
        console.log(Error)
      } 

      // Get balance
      await message({
        process: processId,
        tags: [
          { name: "Action", value: "Balances" }
        ],
        signer: createDataItemSigner(wallet),
        data: "",
      })
      .then((id) => {
        messageId = id;
      })
      .catch(console.error);

      let { Messages } = await result({
        message: messageId,
        process: processId,
      });

      let { data } = getMessageData(Messages);

      data = parseBalances(data)

      // update global balances
      balances[walletAddress] = (Number(balances[walletAddress]) - Number(parseAmount(50, 10))).toString()
      
      expect(data[processId]).to.eql(balances[processId])
      expect(data[walletAddress]).to.eql(balances[walletAddress])
    })

    it("-ve should fail to burn tokens when Quantity is greater than Total Supply", async () => {
      await message({
        process: processId,
        tags: [
          { name: "Action", value: "Burn" },
          { name: "Quantity", value: parseAmount(1000, 10) }
        ],
        signer: createDataItemSigner(wallet),
        data: "",
      })
      .then((id) => {
        messageId = id;
      })
      .catch(console.error);

      let { Error } = await result({
        message: messageId,
        process: processId,
      });

      // Get balance
      await message({
        process: processId,
        tags: [
          { name: "Action", value: "Balances" }
        ],
        signer: createDataItemSigner(wallet),
        data: "",
      })
      .then((id) => {
        messageId = id;
      })
      .catch(console.error);

      let { Messages } = await result({
        message: messageId,
        process: processId,
      });

      let { data } = getMessageData(Messages);

      data = parseBalances(data)
  
      expect(getErrorMessage(Error)).to.eql("Total Supply must be greater than quantity!")
      expect(data[processId]).to.eql(balances[processId])
      expect(data[walletAddress]).to.eql(balances[walletAddress])
    })

    it("-ve should fail to burn tokens when Quantity is greater than Sender balance", async () => {
      let messageId
      await message({
        process: processId,
        tags: [
          { name: "Action", value: "Burn" },
          { name: "Quantity", value: parseAmount(301, 10) }
        ],
        signer: createDataItemSigner(wallet),
        data: "",
      })
      .then((id) => {
        messageId = id;
      })
      .catch(console.error);

      let { Error } = await result({
        message: messageId,
        process: processId,
      });

      // Get balance
      await message({
        process: processId,
        tags: [
          { name: "Action", value: "Balances" }
        ],
        signer: createDataItemSigner(wallet),
        data: "",
      })
      .then((id) => {
        messageId = id;
      })
      .catch(console.error);

      let { Messages } = await result({
        message: messageId,
        process: processId,
      });

      let { data } = getMessageData(Messages);

      data = parseBalances(data)
  
      expect(getErrorMessage(Error)).to.eql("Balance must be greater than quantity!")
      expect(data[processId]).to.eql(balances[processId])
      expect(data[walletAddress]).to.eql(balances[walletAddress])
    })

    // TODO: Split out into separate test / file for non-burnable token
    // it("-ve should fail to burn when Process is not Burnable", async () => {
    //   // init burnable to false
    //   let newInitData = initData
    //   newInitData.burnable = "false"
    //   await init(processId, wallet, newInitData)

    //   let messageId
    //   await message({
    //     process: processId,
    //     tags: [
    //       { name: "Action", value: "Burn" },
    //       { name: "Quantity", value: parseAmount(301, 10) }
    //     ],
    //     signer: createDataItemSigner(wallet),
    //     data: "",
    //   })
    //   .then((id) => {
    //     messageId = id;
    //   })
    //   .catch(console.error);

    //   let { Error } = await result({
    //     message: messageId,
    //     process: processId,
    //   });

    //   // Get balance
    //   await message({
    //     process: processId,
    //     tags: [
    //       { name: "Action", value: "Balances" }
    //     ],
    //     signer: createDataItemSigner(wallet),
    //     data: "",
    //   })
    //   .then((id) => {
    //     messageId = id;
    //   })
    //   .catch(console.error);

    //   let { Messages } = await result({
    //     message: messageId,
    //     process: processId,
    //   });

    //   let { data } = getMessageData(Messages);

    //   data = parseBalances(data)
  
    //   expect(getErrorMessage(Error)).to.eql("Burning is not allowed!")
    //   expect(data[processId]).to.eql(balances[processId])
    //   expect(data[walletAddress]).to.eql(balances[walletAddress])
    // })

    it("-ve should fail to burn when Sender is not Owner", async () => {
      // set sender to wallet2
      let messageId
      await message({
        process: processId,
        tags: [
          { name: "Action", value: "Burn" },
          { name: "Quantity", value: parseAmount(50, 10) }
        ],
        signer: createDataItemSigner(wallet2),
        data: "",
      })
      .then((id) => {
        messageId = id;
      })
      .catch(console.error);

      let { Error } = await result({
        message: messageId,
        process: processId,
      });

      // Get balance
      await message({
        process: processId,
        tags: [
          { name: "Action", value: "Balances" }
        ],
        signer: createDataItemSigner(wallet),
        data: "",
      })
      .then((id) => {
        messageId = id;
      })
      .catch(console.error);

      let { Messages } = await result({
        message: messageId,
        process: processId,
      });

      let { data } = getMessageData(Messages);

      data = parseBalances(data)
  
      expect(getErrorMessage(Error)).to.eql("Sender must be Owner!")
      expect(data[processId]).to.eql(balances[processId])
      expect(data[walletAddress]).to.eql(balances[walletAddress])
    })

    it("+ve should send required notices", async () => {
      let messageId
      await message({
        process: processId,
        tags: [
          { name: "Action", value: "Burn" },
          { name: "Quantity", value: parseAmount(50, 10) }
        ],
        signer: createDataItemSigner(wallet),
        data: "",
      })
      .then((id) => {
        messageId = id;
      })
      .catch(console.error);

      let { Error } = await result({
        message: messageId,
        process: processId,
      });

      if (Error) {
        console.log(Error)
      } 

      // Get notice cursor
      let resultsOut = await results({
        process: processId,
        sort: 'ASC',
        limit: 25,
      })

      // Get latest notices
      let resultsOut2 = resultsOut
      let nextPage = true
      while (nextPage) {
        let resultsOut_ = await results({
          process: processId,
          from: resultsOut2.edges?.[resultsOut2.edges.length - 1]?.cursor ?? null,
          sort: 'ASC',
          limit: 25,
        })
        nextPage = resultsOut_['edges'].length > 0
        resultsOut2 = nextPage ? resultsOut_ : resultsOut2

        if (resultsOut2['edges'].length < 25) {
          resultsOut_['edges'] = resultsOut2['edges'].concat(resultsOut_['edges'])
          resultsOut2 = resultsOut_
        }
      }

      // Get notice data
      let noticeData = getNoticeData(resultsOut2)

      // Debit Notice
      expect(noticeData[noticeData.length-1]["data_array"][0]).to.equal(`You transferred ${parseAmount(50, 10)} to nil initiated by ${walletAddress}`)
      expect(noticeData[noticeData.length-1]["tags_array"][0]["Action"]).to.equal("Debit-Notice")
      expect(noticeData[noticeData.length-1]["tags_array"][0]["Spender"]).to.equal(walletAddress)
      expect(noticeData[noticeData.length-1]["tags_array"][0]["Recipient"]).to.equal("nil")
      expect(noticeData[noticeData.length-1]["tags_array"][0]["Quantity"]).to.equal(parseAmount(50, 10))

      // update global balances
      balances[walletAddress] = (Number(balances[walletAddress]) - Number(parseAmount(50, 10))).toString()
    })
  })

  /* 
  * Burn From
  */
  describe("ao20.BurnFrom", function () {
    it("+ve should burn tokens from the Spender when approved", async () => {
      let messageId
      // Wallet2 approves transfer
      await message({
        process: processId,
        tags: [
          { name: "Action", value: "Approve" },
          { name: "Spender", value: walletAddress },
          { name: "Quantity", value: parseAmount(50, 10) }
        ],
        signer: createDataItemSigner(wallet2),
        data: "",
      })
      .then((id) => {
        messageId = id;
      })
      .catch(console.error);

      // Wallet burns from Wallet2
      await message({
        process: processId,
        tags: [
          { name: "Action", value: "BurnFrom" },
          { name: "Sender", value: walletAddress2 },
          { name: "Quantity", value: parseAmount(50, 10) }
        ],
        signer: createDataItemSigner(wallet),
        data: "",
      })
      .then((id) => {
        messageId = id;
      })
      .catch(console.error);

      // Get balance
      await message({
        process: processId,
        tags: [
          { name: "Action", value: "Balances" }
        ],
        signer: createDataItemSigner(wallet),
        data: "",
      })
      .then((id) => {
        messageId = id;
      })
      .catch(console.error);

      let { Messages } = await result({
        message: messageId,
        process: processId,
      });

      let { data } = getMessageData(Messages);

      data = parseBalances(data)

      // update global balances
      balances[walletAddress2] = (Number(balances[walletAddress2]) - Number(parseAmount(50, 10))).toString()
      
      expect(data[walletAddress2]).to.eql(balances[walletAddress2])
    })

    it("+ve should fail to burn tokens from the Target when not approved", async () => {
      let messageId
      // Wallet2 sets approval amount to 0 
      await message({
        process: processId,
        tags: [
          { name: "Action", value: "Approve" },
          { name: "Spender", value: walletAddress },
          { name: "Quantity", value: parseAmount(0, 10) }
        ],
        signer: createDataItemSigner(wallet2),
        data: "",
      })
      .then((id) => {
        messageId = id;
      })
      .catch(console.error);

      // Wallet burns from Wallet2
      await message({
        process: processId,
        tags: [
          { name: "Action", value: "BurnFrom" },
          { name: "Sender", value: walletAddress2 },
          { name: "Quantity", value: parseAmount(50, 10) }
        ],
        signer: createDataItemSigner(wallet),
        data: "",
      })
      .then((id) => {
        messageId = id;
      })
      .catch(console.error);

      let { Error } = await result({
        message: messageId,
        process: processId,
      });

      // Get balance
      await message({
        process: processId,
        tags: [
          { name: "Action", value: "Balances" }
        ],
        signer: createDataItemSigner(wallet),
        data: "",
      })
      .then((id) => {
        messageId = id;
      })
      .catch(console.error);

      let { Messages } = await result({
        message: messageId,
        process: processId,
      });

      let { data } = getMessageData(Messages);

      data = parseBalances(data)

      expect(getErrorMessage(Error)).to.eql("Quantity must be less than or equal to allowance!")
      expect(data[walletAddress2]).to.eql(balances[walletAddress2])
    })

    it("-ve should fail to burn tokens when Quantity is greater than Total Supply", async () => {
      let messageId
      // Wallet2 approves transfer
      await message({
        process: processId,
        tags: [
          { name: "Action", value: "Approve" },
          { name: "Spender", value: walletAddress },
          { name: "Quantity", value: parseAmount(1000, 10) }
        ],
        signer: createDataItemSigner(wallet2),
        data: "",
      })
      .then((id) => {
        messageId = id;
      })
      .catch(console.error);

      // Wallet burns from Wallet2
      await message({
        process: processId,
        tags: [
          { name: "Action", value: "BurnFrom" },
          { name: "Sender", value: walletAddress2 },
          { name: "Quantity", value: parseAmount(1000, 10) }
        ],
        signer: createDataItemSigner(wallet),
        data: "",
      })
      .then((id) => {
        messageId = id;
      })
      .catch(console.error);

      let { Error } = await result({
        message: messageId,
        process: processId,
      });

      // Get balance
      await message({
        process: processId,
        tags: [
          { name: "Action", value: "Balances" }
        ],
        signer: createDataItemSigner(wallet),
        data: "",
      })
      .then((id) => {
        messageId = id;
      })
      .catch(console.error);

      let { Messages } = await result({
        message: messageId,
        process: processId,
      });

      let { data } = getMessageData(Messages);

      data = parseBalances(data)

      expect(getErrorMessage(Error)).to.eql("Total Supply must be greater than quantity!")
      expect(data[walletAddress2]).to.eql(balances[walletAddress2])
    })

    it("-ve should fail to burn tokens when Quantity is greater than Target balance", async () => {
      let messageId
      // Wallet2 approves transfer
      await message({
        process: processId,
        tags: [
          { name: "Action", value: "Approve" },
          { name: "Spender", value: walletAddress },
          { name: "Quantity", value: parseAmount(1000, 10) }
        ],
        signer: createDataItemSigner(wallet2),
        data: "",
      })
      .then((id) => {
        messageId = id;
      })
      .catch(console.error);

      // Wallet burns from Wallet2
      await message({
        process: processId,
        tags: [
          { name: "Action", value: "BurnFrom" },
          { name: "Sender", value: walletAddress2 },
          { name: "Quantity", value: parseAmount(450, 10) }
        ],
        signer: createDataItemSigner(wallet),
        data: "",
      })
      .then((id) => {
        messageId = id;
      })
      .catch(console.error);

      let { Error } = await result({
        message: messageId,
        process: processId,
      });

      // Get balance
      await message({
        process: processId,
        tags: [
          { name: "Action", value: "Balances" }
        ],
        signer: createDataItemSigner(wallet),
        data: "",
      })
      .then((id) => {
        messageId = id;
      })
      .catch(console.error);

      let { Messages } = await result({
        message: messageId,
        process: processId,
      });

      let { data } = getMessageData(Messages);

      data = parseBalances(data)

      expect(getErrorMessage(Error)).to.eql("Balance must be greater than quantity!")
      expect(data[walletAddress2]).to.eql(balances[walletAddress2])
    })

    // TODO: Split out into separate test / file for non-burnable token
    // it("-ve should fail to burn when Process is not Burnable", async () => {})

    it("+ve should send required notices", async () => {
      let messageId
      // Wallet2 approves transfer
      await message({
        process: processId,
        tags: [
          { name: "Action", value: "Approve" },
          { name: "Spender", value: walletAddress },
          { name: "Quantity", value: parseAmount(50, 10) }
        ],
        signer: createDataItemSigner(wallet2),
        data: "",
      })
      .then((id) => {
        messageId = id;
      })
      .catch(console.error);

      // Wallet burns from Wallet2
      await message({
        process: processId,
        tags: [
          { name: "Action", value: "BurnFrom" },
          { name: "Sender", value: walletAddress2 },
          { name: "Quantity", value: parseAmount(50, 10) }
        ],
        signer: createDataItemSigner(wallet),
        data: "",
      })
      .then((id) => {
        messageId = id;
      })
      .catch(console.error);

      // Get balance
      await message({
        process: processId,
        tags: [
          { name: "Action", value: "Balances" }
        ],
        signer: createDataItemSigner(wallet),
        data: "",
      })
      .then((id) => {
        messageId = id;
      })
      .catch(console.error);


      // Get notice cursor
      let resultsOut = await results({
        process: processId,
        sort: 'ASC',
        limit: 25,
      })

      // Get latest notices
      let resultsOut2 = resultsOut
      let nextPage = true
      while (nextPage) {
        let resultsOut_ = await results({
          process: processId,
          from: resultsOut2.edges?.[resultsOut2.edges.length - 1]?.cursor ?? null,
          sort: 'ASC',
          limit: 25,
        })
        nextPage = resultsOut_['edges'].length > 0
        resultsOut2 = nextPage ? resultsOut_ : resultsOut2

        if (resultsOut2['edges'].length < 25) {
          resultsOut_['edges'] = resultsOut2['edges'].concat(resultsOut_['edges'])
          resultsOut2 = resultsOut_
        }
      }

      // Get notice data
      let noticeData = getNoticeData(resultsOut2)

      // Debit Notice
      expect(noticeData[noticeData.length-2]["data_array"][0]).to.equal(`You transferred ${parseAmount(50, 10)} to nil initiated by ${walletAddress}`)
      expect(noticeData[noticeData.length-2]["tags_array"][0]["Action"]).to.equal("Debit-Notice")
      expect(noticeData[noticeData.length-2]["tags_array"][0]["Spender"]).to.equal(walletAddress)
      expect(noticeData[noticeData.length-2]["tags_array"][0]["Recipient"]).to.equal("nil")
      expect(noticeData[noticeData.length-2]["tags_array"][0]["Quantity"]).to.equal(parseAmount(50, 10))
      
      // Transfer Notice
      expect(noticeData[noticeData.length-2]["data_array"][1]).to.equal(`You initiated the transfer of ${parseAmount(50, 10)} from ${walletAddress2} to nil`)
      expect(noticeData[noticeData.length-2]["tags_array"][1]["Action"]).to.equal("Transfer-Notice")
      expect(noticeData[noticeData.length-2]["tags_array"][1]["Spender"]).to.equal(walletAddress)
      expect(noticeData[noticeData.length-2]["tags_array"][1]["Sender"]).to.equal(walletAddress2)
      expect(noticeData[noticeData.length-2]["tags_array"][1]["Recipient"]).to.equal("nil")
      expect(noticeData[noticeData.length-2]["tags_array"][1]["Quantity"]).to.equal(parseAmount(50, 10))

      // update global balances
      balances[walletAddress2] = (Number(balances[walletAddress2]) - Number(parseAmount(50, 10))).toString()
    })
  })

  /* 
  * Pause
  */
  describe("ao20.Pause", function () {
    it("+ve should pause update functionality", async () => {
      // Pause contract
      await message({
        process: processId,
        tags: [
          { name: "Action", value: "Pause" },
          { name: "Paused", value: "true" }
        ],
        signer: createDataItemSigner(wallet),
        data: "",
      })
      .then((id) => {
        messageId = id;
      })
      .catch(console.error);
      
      // Approve transfer 
      await message({
        process: processId,
        tags: [
          { name: "Action", value: "Approve" },
          { name: "Spender", value: processId },
          { name: "Quantity", value: parseAmount(50, 10) }
        ],
        signer: createDataItemSigner(wallet),
        data: "",
      })
      .then((id) => {
        messageId = id;
      })
      .catch(console.error);

      // Attempt to transfer tokens
      await message({
        process: processId,
        tags: [
          { name: "Action", value: "Transfer" },
          { name: "Recipient", value: processId },
          { name: "Quantity", value: parseAmount(50, 10) }
        ],
        signer: createDataItemSigner(wallet),
        data: "",
      })
      .then((id) => {
        messageId = id;
      })
      .catch(console.error);

      let { Error } = await result({
          message: messageId,
          process: processId,
        });

      // Get balance
      await message({
        process: processId,
        tags: [
          { name: "Action", value: "Balances" }
        ],
        signer: createDataItemSigner(wallet),
        data: "",
      })
      .then((id) => {
        messageId = id;
      })
      .catch(console.error);
    
      let { Messages } = await result({
        message: messageId,
        process: processId,
      });

      let { data } = getMessageData(Messages);
      
      data = parseBalances(data)

      expect(getErrorMessage(Error)).to.eql("Contract is paused!")
      expect(data[processId]).to.eql(balances[processId])
      expect(data[walletAddress]).to.eql(balances[walletAddress])
    })

    // TODO: Split out into separate test / file for non-pausable token
    // it("-ve should fail to pause when Process is not Pausable", async () => {
    //   // revert to initial state after previous test
    //   // setting paused to false
    //   await message({
    //     process: processId,
    //     tags: [
    //       { name: "Action", value: "Pause" },
    //       { name: "Paused", value: "false" }
    //     ],
    //     signer: createDataItemSigner(wallet),
    //     data: "",
    //   })
    //   .then((id) => {
    //     messageId = id;
    //   })
    //   .catch(console.error);
      
    //   // init pausable to false
    //   let newInitData = initData
    //   newInitData.pausable = "false"
    //   await init(processId, wallet, newInitData)

    //   // Pause contract
    //   await message({
    //     process: processId,
    //     tags: [
    //       { name: "Action", value: "Pause" },
    //       { name: "Paused", value: "true" }
    //     ],
    //     signer: createDataItemSigner(wallet),
    //     data: "",
    //   })
    //   .then((id) => {
    //     messageId = id;
    //   })
    //   .catch(console.error);

    //   let { Error } = await result({
    //     message: messageId,
    //     process: processId,
    //   });

    //   // Get balance
    //   await message({
    //     process: processId,
    //     tags: [
    //       { name: "Action", value: "Balances" }
    //     ],
    //     signer: createDataItemSigner(wallet),
    //     data: "",
    //   })
    //   .then((id) => {
    //     messageId = id;
    //   })
    //   .catch(console.error);
    
    //   let { Messages } = await result({
    //     message: messageId,
    //     process: processId,
    //   });

    //   let { data } = getMessageData(Messages);
      
    //   data = parseBalances(data)

    //   expect(getErrorMessage(Error)).to.eql("Pausing is not allowed!")
    //   expect(data[processId]).to.eql(balances[processId])
    //   expect(data[walletAddress]).to.eql(balances[walletAddress])
    // })

    it("-ve should fail to pause when Sender is not Owner", async () => {      
      // Pause contract from wallet2
      await message({
        process: processId,
        tags: [
          { name: "Action", value: "Pause" },
          { name: "Paused", value: "true" }
        ],
        signer: createDataItemSigner(wallet2),
        data: "",
      })
      .then((id) => {
        messageId = id;
      })
      .catch(console.error);

      let { Error } = await result({
        message: messageId,
        process: processId,
      });

      expect(getErrorMessage(Error)).to.eql("Sender must be Owner!")
    })

    it("+ve should send required notices", async () => {
      // Pause contract
      await message({
        process: processId,
        tags: [
          { name: "Action", value: "Pause" },
          { name: "Paused", value: "true" }
        ],
        signer: createDataItemSigner(wallet),
        data: "",
      })
      .then((id) => {
        messageId = id;
      })
      .catch(console.error);


      // Get notice cursor
      let resultsOut = await results({
        process: processId,
        sort: 'ASC',
        limit: 25,
      })

      // Get latest notices
      let resultsOut2 = resultsOut
      let nextPage = true
      while (nextPage) {
        let resultsOut_ = await results({
          process: processId,
          from: resultsOut2.edges?.[resultsOut2.edges.length - 1]?.cursor ?? null,
          sort: 'ASC',
          limit: 25,
        })
        nextPage = resultsOut_['edges'].length > 0
        resultsOut2 = nextPage ? resultsOut_ : resultsOut2

        if (resultsOut2['edges'].length < 25) {
          resultsOut_['edges'] = resultsOut2['edges'].concat(resultsOut_['edges'])
          resultsOut2 = resultsOut_
        }
      }

      // Get notice data
      let noticeData = getNoticeData(resultsOut2)

      // Pause-Notice
      expect(noticeData[noticeData.length-1]["data_array"][0]).to.equal(`Process ${processId} paused status set to true`)
      expect(noticeData[noticeData.length-1]["tags_array"][0]["Action"]).to.equal("Pause-Notice")
      expect(noticeData[noticeData.length-1]["tags_array"][0]["Process"]).to.equal(processId)
      expect(noticeData[noticeData.length-1]["tags_array"][0]["Paused"]).to.equal("true")
    })
  })

  /* 
  * Renounce Ownership
  */
  describe("ao20.RenounceOwnership", function () {
    it("-ve should fail to renounce ownership when Sender is not Owner", async () => {      
      // renounce ownership from wallet2
      await message({
        process: processId,
        tags: [
          { name: "Action", value: "RenounceOwnership" }
        ],
        signer: createDataItemSigner(wallet2),
        data: "",
      })
      .then((id) => {
        messageId = id;
      })
      .catch(console.error);

      let { Error } = await result({
        message: messageId,
        process: processId,
      })

      // get info
      await message({
        process: processId,
        tags: [
          { name: "Action", value: "Info" }
        ],
        signer: createDataItemSigner(wallet),
        data: "",
      })
      .then((id) => {
        messageId = id;
      })
      .catch(console.error);

      let { Messages } = await result({
        message: messageId,
        process: processId,
      });

      let { tags } = getMessageData(Messages);

      expect(getErrorMessage(Error)).to.eql("Sender must be Owner!")
      expect(tags["Owner"]).to.eql(walletAddress)
    })
    
    it("+ve should renounce ownership and send required notices", async () => {
      // renounce ownership
      await message({
        process: processId,
        tags: [
          { name: "Action", value: "RenounceOwnership" }
        ],
        signer: createDataItemSigner(wallet),
        data: "",
      })
      .then((id) => {
        messageId = id;
      })
      .catch(console.error);

      // get info
      await message({
        process: processId,
        tags: [
          { name: "Action", value: "Info" }
        ],
        signer: createDataItemSigner(wallet),
        data: "",
      })
      .then((id) => {
        messageId = id;
      })
      .catch(console.error);

      let { Messages } = await result({
        message: messageId,
        process: processId,
      });
      
      // get tags to check owner is nil 
      let { tags } = getMessageData(Messages);

      // Get notice cursor
      let resultsOut = await results({
        process: processId,
        sort: 'ASC',
        limit: 25,
      })

      // Get latest notices
      let resultsOut2 = resultsOut
      let nextPage = true
      while (nextPage) {
        let resultsOut_ = await results({
          process: processId,
          from: resultsOut2.edges?.[resultsOut2.edges.length - 1]?.cursor ?? null,
          sort: 'ASC',
          limit: 25,
        })
        nextPage = resultsOut_['edges'].length > 0
        resultsOut2 = nextPage ? resultsOut_ : resultsOut2

        if (resultsOut2['edges'].length < 25) {
          resultsOut_['edges'] = resultsOut2['edges'].concat(resultsOut_['edges'])
          resultsOut2 = resultsOut_
        }
      }

      // Get notice data
      let noticeData = getNoticeData(resultsOut2)

      // expect owner to be nil
      expect(tags["Owner"]).to.eql('nil')

      // Renounce-Ownership-Notice
      expect(noticeData[noticeData.length-2]["data_array"][0]).to.equal(`Process ${processId} ownership has been renounced`)
      expect(noticeData[noticeData.length-2]["tags_array"][0]["Action"]).to.equal("Renounce-Ownership-Notice")
      expect(noticeData[noticeData.length-2]["tags_array"][0]["Process"]).to.equal(processId)
      expect(noticeData[noticeData.length-2]["tags_array"][0]["Owner"]).to.equal("nil")
    })
  })

  /* 
  * Transfer Ownership
  */
  describe("ao20.TransferOwnership", function () {
    it("-ve should fail to transfer ownership when Sender is not Owner", async () => {      
      // transfer ownership from wallet2
      await message({
        process: processId,
        tags: [
          { name: "Action", value: "TransferOwnership" },
          { name: "NewOwner", value: walletAddress2 }
        ],
        signer: createDataItemSigner(wallet2),
        data: "",
      })
      .then((id) => {
        messageId = id;
      })
      .catch(console.error);

      let { Error } = await result({
        message: messageId,
        process: processId,
      })

      // get info
      await message({
        process: processId,
        tags: [
          { name: "Action", value: "Info" }
        ],
        signer: createDataItemSigner(wallet),
        data: "",
      })
      .then((id) => {
        messageId = id;
      })
      .catch(console.error);

      let { Messages } = await result({
        message: messageId,
        process: processId,
      });

      let { tags } = getMessageData(Messages);

      expect(getErrorMessage(Error)).to.eql("Sender must be Owner!")
      expect(tags["Owner"]).to.eql(walletAddress)
    })

    it("-ve should fail to transfer ownership when the new Owner is invalid", async () => {
      // transfer ownership to nil
      await message({
        process: processId,
        tags: [
          { name: "Action", value: "TransferOwnership" },
          { name: "NewOwner", value: "" }
        ],
        signer: createDataItemSigner(wallet),
        data: "",
      })
      .then((id) => {
        messageId = id;
      })
      .catch(console.error);

      let { Error } = await result({
        message: messageId,
        process: processId,
      })

      // get info
      await message({
        process: processId,
        tags: [
          { name: "Action", value: "Info" }
        ],
        signer: createDataItemSigner(wallet),
        data: "",
      })
      .then((id) => {
        messageId = id;
      })
      .catch(console.error);

      let { Messages } = await result({
        message: messageId,
        process: processId,
      });

      let { tags } = getMessageData(Messages);

      expect(getErrorMessage(Error)).to.eql("NewOwner Tag must exist!")
      expect(tags["Owner"]).to.eql(walletAddress)
    })

    it("+ve should transfer ownership of the contract", async () => {
      // transfer ownership
      await message({
        process: processId,
        tags: [
          { name: "Action", value: "TransferOwnership" },
          { name: "NewOwner", value: walletAddress2 }
        ],
        signer: createDataItemSigner(wallet),
        data: "",
      })
      .then((id) => {
        messageId = id;
      })
      .catch(console.error);

      // get info
      await message({
        process: processId,
        tags: [
          { name: "Action", value: "Info" }
        ],
        signer: createDataItemSigner(wallet),
        data: "",
      })
      .then((id) => {
        messageId = id;
      })
      .catch(console.error);

      let { Messages } = await result({
          message: messageId,
          process: processId,
        });
      
      // get tags to check owner is nil 
      let { tags } = getMessageData(Messages);

      // expect owner to be nil
      expect(tags["Owner"]).to.eql(walletAddress2)
    })

    it("+ve should send required notices", async () => {
      // transfer ownership
      await message({
        process: processId,
        tags: [
          { name: "Action", value: "TransferOwnership" },
          { name: "NewOwner", value: walletAddress2 }
        ],
        signer: createDataItemSigner(wallet),
        data: "",
      })
      .then((id) => {
        messageId = id;
      })
      .catch(console.error);

      // get info
      await message({
        process: processId,
        tags: [
          { name: "Action", value: "Info" }
        ],
        signer: createDataItemSigner(wallet),
        data: "",
      })
      .then((id) => {
        messageId = id;
      })
      .catch(console.error);

      // Get notice cursor
      let resultsOut = await results({
        process: processId,
        sort: 'ASC',
        limit: 25,
      })

      // Get latest notices
      let resultsOut2 = resultsOut
      let nextPage = true
      while (nextPage) {
        let resultsOut_ = await results({
          process: processId,
          from: resultsOut2.edges?.[resultsOut2.edges.length - 1]?.cursor ?? null,
          sort: 'ASC',
          limit: 25,
        })
        nextPage = resultsOut_['edges'].length > 0
        resultsOut2 = nextPage ? resultsOut_ : resultsOut2

        if (resultsOut2['edges'].length < 25) {
          resultsOut_['edges'] = resultsOut2['edges'].concat(resultsOut_['edges'])
          resultsOut2 = resultsOut_
        }
      }

      // Get notice data
      let noticeData = getNoticeData(resultsOut2)

      // New-Ownership-Notice
      expect(noticeData[noticeData.length-3]["data_array"][1]).to.equal(`You received ownership of ${processId} from ${walletAddress}`)
      expect(noticeData[noticeData.length-3]["tags_array"][1]["Action"]).to.equal("New-Ownership-Notice")
      expect(noticeData[noticeData.length-3]["tags_array"][1]["Process"]).to.equal(processId)

      // Transfer-Ownership-Notice
      expect(noticeData[noticeData.length-3]["data_array"][0]).to.equal(`You transferred ownership of ${processId} to ${walletAddress2}`)
      expect(noticeData[noticeData.length-3]["tags_array"][0]["Action"]).to.equal("Transfer-Ownership-Notice")
      expect(noticeData[noticeData.length-3]["tags_array"][0]["Process"]).to.equal(processId)
      expect(noticeData[noticeData.length-3]["tags_array"][0]["Owner"]).to.equal(walletAddress2)
    })
  })
})