# SCM Router
[![Version][npm-image]][npm-url] ![Downloads][downloads-image] [![Build Status][status-image]][status-url] [![Open Issues][issues-image]][issues-url] [![Dependency Status][daviddm-image]][daviddm-url] ![License][license-image]

> A generic scm plugin that routes builds to a specified scm

An SCM is a source control management system, like Github, Bitbucket, Gitlab, etc. This SCM Router module will allow multiple SCMs to be used within a single Screwdriver cluster.

i.e. Github, Bitbucket, Gitlab

The scm router will allow multiple scms to be used in a Screwdriver cluster.

## Usage

```bash
npm install screwdriver-scm-router
```

### Interface

It will initialize any routers specified in the [default.yaml](https://github.com/screwdriver-cd/screwdriver/blob/master/config/default.yaml#L123-L156) under the `scms` keyword.

**Example scm yaml section:**
```
scms:
    - plugin: github
      config:
        oauthClientId: YOU-PROBABLY-WANT-SOMETHING-HERE
        ......
    - plugin: bitbucket
      config:
        displayName: YOUR-BITBUCKET-DISPLAY-NAME
        oauthClientId: YOUR-BITBUCKET-OAUTH-CLIENT-ID
        ......
```

## Testing

```bash
npm test
```

## License

Code licensed under the BSD 3-Clause license. See LICENSE file for terms.

[npm-image]: https://img.shields.io/npm/v/screwdriver-scm-router.svg
[npm-url]: https://npmjs.org/package/screwdriver-scm-router
[downloads-image]: https://img.shields.io/npm/dt/screwdriver-scm-router.svg
[license-image]: https://img.shields.io/npm/l/screwdriver-scm-router.svg
[issues-image]: https://img.shields.io/github/issues/screwdriver-cd/scm-router.svg
[issues-url]: https://github.com/screwdriver-cd/scm-router/issues
[status-image]: https://cd.screwdriver.cd/pipelines/275/badge
[status-url]: https://cd.screwdriver.cd/pipelines/275
[daviddm-image]: https://david-dm.org/screwdriver-cd/scm-router.svg?theme=shields.io
[daviddm-url]: https://david-dm.org/screwdriver-cd/scm-router
