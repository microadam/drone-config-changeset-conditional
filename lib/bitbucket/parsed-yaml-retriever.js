const yaml = require('yaml')
const getParsedYaml = bitbucket => async opts => {
  let contents = opts.yaml
  if (!contents) {
    const options = {
      workspace: opts.repo.namespace,
      repo_slug: opts.repo.name,
      node: opts.build.after,
      path: opts.repo.config_path
    }
    const { data } = await bitbucket.repositories.readSrc(options)
    contents = data
  }
  const docs = contents.split('\n---\n')
  const parsedDocs = docs.map(d => {
    return yaml.parse(d)
  })
  return parsedDocs
}

module.exports = getParsedYaml