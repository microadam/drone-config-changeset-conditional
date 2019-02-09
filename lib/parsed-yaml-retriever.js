const { promisify } = require('util')
const yaml = require('yamljs')
const getParsedYaml = gh => async data => {
  let file = null
  const options = {
    user: data.repo.namespace,
    repo: data.repo.name,
    ref: data.build.ref,
    path: data.repo.config_path
  }
  file = await promisify(gh.repos.getContent)(options)
  const contents = Buffer.from(file.content, 'base64').toString()
  const parsed = yaml.parse(contents)
  return parsed
}

module.exports = getParsedYaml