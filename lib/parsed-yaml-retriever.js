const yaml = require('yaml')
const getParsedYaml = gh => async data => {
  let contents = data.yaml
  if (!contents) {
    const options = {
      owner: data.repo.namespace,
      repo: data.repo.name,
      ref: data.build.ref,
      path: data.repo.config_path
    }
    const file = gh.rest.repos.getContent(options)
    if (!file.content) {
      console.log('GH Response:', file)
      throw new Error('Unexpected response from GitHub')
    }
    contents = Buffer.from(file.content, 'base64').toString()
  }
  const docs = contents.split('\n---\n')
  const parsedDocs = docs.map(d => {
    return yaml.parse(d)
  })
  return parsedDocs
}

module.exports = getParsedYaml