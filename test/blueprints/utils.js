const getMessageData = (messages) => {
    let target = messages[0].Target;
    let data = messages[0].Data;
    let tags = Object.assign({}, ...messages[0]['Tags'].map((x) => ({[x.name]: x.value})));
    return { target, data, tags };
}

const getMessagesData = (messages) => {
    let target_array = []
    let data_array = []
    let tags_array = []
    for (let i = 0; i < messages.length; i++) {
        let target = messages[i].Target;
        let data = messages[i].Data;
        let tags = Object.assign({}, ...messages[i]['Tags'].map((x) => ({[x.name]: x.value})));
        target_array.push(target)
        data_array.push(data)
        tags_array.push(tags)
    }
    return { target_array, data_array, tags_array };
}

const getOutputData = (output) => {
    let data = ''
    if (typeof(output["data"]) == 'string') {
        data = output["data"]
    } else {
        data = output["data"]["output"]
    }
    return { data }
}

const getNoticeAction = (message) => {
    return message.split('Action = \x1B[34m')[1].split('\x1B[0m')[0]
}

const parseNoticeData = (x) => {
    if (x.node.Messages.length > 0) {
        return getMessagesData(x.node.Messages)
    } else {
        return getOutputData(x.node.Output)
    } 
}

const getNoticeData = (results) => {
    let res = results["edges"]
        .map((x) => parseNoticeData(x))   
    return res
}
  
const getErrorMessage = (error) => {
    return error.split(":")[4].trim()
}

const parseAmount = (amount, denomination, isNegative=false) => {
    amount = (amount * Math.pow(10, denomination)).toString();
    return isNegative ? '-' + amount : amount;
}

const parseBalances = (data) => {
    return JSON.parse(data)
}

const delay = ms => new Promise(res => setTimeout(res, ms));

module.exports = { 
    getMessageData, 
    getNoticeData, 
    getNoticeAction, 
    getErrorMessage, 
    parseAmount, 
    parseBalances,
    delay
}