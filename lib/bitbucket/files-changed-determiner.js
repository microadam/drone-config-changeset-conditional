const getCommit = bitbucket => async opts => {
  const options = {
    workspace: opts.repo.namespace,
    repo_slug: opts.repo.name,
    spec: opts.build.after
  }

  const { data } = await bitbucket.repositories.listDiffStats(options)
  const newFiles = data.values.map(v => v.new ? v.new.path : null).filter(x => x)
  const oldFiles = data.values.map(v => v.old ? v.old.path : null).filter(x => x)

  return [...new Set([...oldFiles, ...newFiles])]
}

module.exports = getCommit