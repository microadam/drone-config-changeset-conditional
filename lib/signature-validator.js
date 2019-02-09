const httpSignature = require('http-signature')
const isValidSig = (req, hmac) => {
  req.headers.signature = 'Signature ' + req.headers.signature
  const parsedSig = httpSignature.parseRequest(req, { authorizationHeaderName: 'signature' })
  return httpSignature.verifyHMAC(parsedSig, hmac)
}

module.exports = isValidSig