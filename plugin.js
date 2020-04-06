const express = require('express')
const bodyParser = require('body-parser')
const yaml = require('yaml')
const glob = require('globule')
const createGitHubFilesChangedDeterminer = require('./lib/github/files-changed-determiner')
const createGitHubParsedYamlRetriever = require('./lib/github/parsed-yaml-retriever')
const createBitbucketFilesChangedDeterminer = require('./lib/bitbucket/files-changed-determiner')
const createBitbucketParsedYamlRetriever = require('./lib/bitbucket/parsed-yaml-retriever')
const isValidSig = require('./lib/signature-validator')
const GhApi = require('github4')
const { Bitbucket } = require("bitbucket")

const githubToken = process.env.GITHUB_TOKEN
const bitbucketUsername = process.env.BITBUCKET_USERNAME
const bitbucketPassword = process.env.BITBUCKET_PASSWORD
const sharedKey = process.env.PLUGIN_SECRET

let determineFilesChanged;
let getParsedYaml;

if (githubToken) {
  const gh = new GhApi({ version: '3.0.0' })
  gh.authenticate({ type: 'token', token: githubToken })
  determineFilesChanged = createGitHubFilesChangedDeterminer(gh)
  getParsedYaml = createGitHubParsedYamlRetriever(gh)
} else if (bitbucketUsername && bitbucketPassword) {
  const bitbucket = new Bitbucket({ auth: { username: bitbucketUsername, password: bitbucketPassword } })
  determineFilesChanged = createBitbucketFilesChangedDeterminer(bitbucket)
  getParsedYaml = createBitbucketParsedYamlRetriever(bitbucket)
} else {
  throw new Error('Either GitHub or Bitbucket credentials are required')
}

const nullYaml = index => `kind: pipeline\nname: default_${index}\ntrigger:\n  event:\n    exclude: [ "*" ]`

const app = express()
app.post('/', bodyParser.json({limit: '50mb'}), async (req, res) => {
  console.log('Processing...')
  if (!req.headers.signature) return res.status(400).send('Missing signature')
  if (!isValidSig(req, sharedKey)) return res.status(400).send('Invalid signature')
  if (!req.body) return res.sendStatus(400)
  const data = req.body

  let filesChanged = []
  try {
    filesChanged = await determineFilesChanged(data)
  } catch (e) {
    console.log('ERROR:', e)
    return res.sendStatus(500)
  }

  console.log('Files changed:', filesChanged)

  let parsedYaml = null
  try {
    parsedYaml = await getParsedYaml(data)
  } catch (e) {
    if (e.code === 404) return res.sendStatus(204)
    console.log('ERROR:', e)
    return res.sendStatus(500)
  }

  const finalYamlDocs = parsedYaml.map((py, index) => {
    if (py.kind !== 'pipeline') return yaml.stringify(py)
    if (py.trigger && py.trigger.changeset && py.trigger.changeset.includes) {
      const requiredFiles = py.trigger.changeset.includes
      const matchedFiles = glob.match(requiredFiles, filesChanged, { dot: true })
      console.log('Matched files for pipeline:', matchedFiles.length, 'Allowed matches:', requiredFiles)
      if (!matchedFiles.length) {
        py.trigger = { event: { exclude: ['*'] } }
        return yaml.stringify(py)
      }
    }

    const trimmedSteps = py.steps.filter(s => {
      if (!s.when || !s.when.changeset || !s.when.changeset.includes) return true
      const requiredFiles = s.when.changeset.includes
      const matchedFiles = glob.match(requiredFiles, filesChanged, { dot: true })
      console.log('Matched files for step:', matchedFiles.length, 'Allowed matches:', requiredFiles)
      return matchedFiles.length
    })

    return trimmedSteps.length ? yaml.stringify({ ...py, steps: trimmedSteps }) : nullYaml(index)
  })

  res.json({ Data: finalYamlDocs.join('\n---\n') })
})

app.listen(3000)
