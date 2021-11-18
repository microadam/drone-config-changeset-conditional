const Jsonnet = require("jsonnet")
const { promisify } = require('util')
const yaml = require('yaml')
const jsonnet = new Jsonnet()
const getParsedYaml = gh => async data => {
  let contents = data.yaml
  if (!contents) {
    const options = {
      user: data.repo.namespace,
      repo: data.repo.name,
      ref: data.build.ref,
      path: data.repo.config_path
    }
    const file = await promisify(gh.repos.getContent)(options)
    if (!file.content) {
      console.log('GH Response:', file)
      throw new Error('Unexpected response from GitHub')
    }
    contents = Buffer.from(file.content, 'base64').toString()
  }
  const docs = contents.split('\n---\n')
  const parsedDocs = docs.map(d => {
    return yaml.parse(jsonnet.eval(d))
  })
  return parsedDocs
}

module.exports = getParsedYaml
