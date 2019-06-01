const nodeAbi = require('node-abi')
 
console.log(nodeAbi.getAbi('10.14.1', 'node'))
// '51'
console.log(nodeAbi.getAbi('5.0.2', 'electron'))