const express = require('express')
const bodyParser = require('body-parser')
const { Octokit } = require('@octokit/rest')
const yaml = require('yaml')
const glob = require('globule')
const createFilesChangedDeterminer = require('./lib/files-changed-determiner')
const createParsedYamlRetriever = require('./lib/parsed-yaml-retriever')
const isValidSig = require('./lib/signature-validator')

const githubToken = process.env.GITHUB_TOKEN
const sharedKey = process.env.PLUGIN_SECRET

const gh = new Octokit({
  auth: githubToken
})

const determineFilesChanged = createFilesChangedDeterminer(gh)
const getParsedYaml = createParsedYamlRetriever(gh)

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

    const transformedSteps = py.steps.map(s => {
      if (!s.when || !s.when.changeset || !s.when.changeset.includes) {
        return s;
      }
      
      const requiredFiles = s.when.changeset.includes
      const matchedFiles = glob.match(requiredFiles, filesChanged, { dot: true })
      console.log('Matched files for step:', matchedFiles.length, 'Allowed matches:', requiredFiles)

      if (!matchedFiles.length) {
        // Add an impossible conditional which guarantees the step gets skipped
        s.when = {
          ...s.when,
          event: { exclude: ['*']},
        }
      }

      return s;
    })

    return transformedSteps.length ? yaml.stringify({ ...py, steps: transformedSteps }) : nullYaml(index)
  })

  res.json({ Data: finalYamlDocs.join('\n---\n') })
})

app.listen(3000)
