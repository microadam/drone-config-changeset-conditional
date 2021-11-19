const Jsonnet = require('@hanazuki/node-jsonnet')
const { promisify } = require('util')
const yaml = require('yaml')

const jsonnet = new Jsonnet.Jsonnet()

const getParsedYaml = (gh) => async (data) => {
  let contents = data.yaml
  if (!contents) {
    const options = {
      user: data.repo.namespace,
      repo: data.repo.name,
      ref: data.build.ref,
      path: data.repo.config_path,
    }
    const file = await promisify(gh.repos.getContent)(options)
    if (!file.content) {
      console.log('GH Response:', file)
      throw new Error('Unexpected response from GitHub')
    }
    contents = Buffer.from(file.content, 'base64').toString()
  }
  if (data.repo.config_path.endsWith('.jsonnet')) {
    // this returns formatted JSON that we can then parse to YAML as normal
    contents = await jsonnet.evaluateSnippet(contents)
  }
  const docs = contents.split('\n---\n')
  const parsedDocs = docs.map((d) => {
    return yaml.parse(d)
  })
  return parsedDocs
}

module.exports = getParsedYaml
