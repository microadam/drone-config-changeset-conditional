const { promisify } = require('util')
const getCommit = gh => async data => {
  let commitData = null
  const options = {
    user: data.repo.namespace,
    repo: data.repo.name
  }

  let action = 'compareCommits'
  // github sends this in some instances: first commit on a new branch?
  if (!data.build.before || data.build.before === '0000000000000000000000000000000000000000') {
    options.sha = data.build.after
    action = 'getCommit'
  } else {
    options.base = data.build.before
    options.head = data.build.after
  }

  const comparison = await promisify(gh.repos[action])(options)
  return comparison.files.map(f => f.filename)
}

module.exports = getCommit