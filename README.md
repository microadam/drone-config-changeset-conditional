# Drone Config Plugin - Changeset Conditional

This implements the ability to have steps / pipelines only execute when certain files have changed, using the following additional YAML syntax:

```
pipeline:
  frontend:
    image: node
    commands:
      - cd app
      - npm run test
+   when:
+     changeset:
+       includes: [ **/**.js, **/**.css, **/**.html ]
  backend:
    image: golang
    commands:
      - go build
      - go test -v
+   when:
+     changeset:
+       includes: [ **/**.go ]

+changeset:
+  includes: [ **/**.go ]
```

This plugin is compatible with the [Drone Config Plugin Pipeline](https://github.com/microadam/drone-config-plugin-pipeline)

## Installation

PLEASE NOTE: At the moment it supports only github.com installations.

Generate a GitHub access token with repo permission. This token is used to fetch the `.drone.yml` file and details of the files changed.

Generate a shared secret key. This key is used to secure communication between the server and agents. The secret should be 32 bytes.
```
$ openssl rand -hex 16
558f3eacbfd5928157cbfe34823ab921
```

Run the container somewhere where the drone server can reach it:

```
docker run \
  -p ${PLUGIN_PORT}:3000 \
  -e PLUGIN_SECRET=558f3eacbfd5928157cbfe34823ab921 \
  -e GITHUB_TOKEN=GITHUB8168c98304b \
  --name drone-changeset-conditional \
  microadam/drone-config-plugin-changeset-conditional
```

Update your drone server with information about the plugin:

```
-e DRONE_YAML_ENDPOINT=http://${PLUGIN_HOST}:${PLUGIN_PORT}
-e DRONE_YAML_SECRET=558f3eacbfd5928157cbfe34823ab921
```

See [the official docs](https://docs.drone.io/extend/config) for extra information on installing a Configuration Provider Plugin.

## Pattern Matching

This uses the [Glob](https://www.npmjs.com/package/glob) module under the hood, so supports all pattern matching syntaxes of this module.