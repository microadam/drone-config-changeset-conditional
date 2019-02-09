const { promisify } = require('util')
const getCommit = gh => async data => {
  let commitData = null
  const options = {
    user: data.repo.namespace,
    repo: data.repo.name,
    base: data.build.before,
    head: data.build.after
  }
  const comparison = await promisify(gh.repos.compareCommits)(options)
  return comparison.files.map(f => f.filename)
}

module.exports = getCommit