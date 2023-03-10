<p align="center">
  <a href="https://github.com/parkerholladay/gatsby-source-gcs-image">
    <img src="https://github.com/parkerholladay/gatsby-source-gcs-image/raw/master/assets/logo.svg" width="100" />
  </a>
</p>
<h1 align="center">
  gatsby-source-gcs-image
</h1>

[![build status](https://img.shields.io/github/actions/workflow/status/parkerholladay/gatsby-source-gcs-image/build.yaml?branch=master&logo=github&style=for-the-badge)](https://github.com/parkerholladay/gatsby-source-gcs-image/actions)
[![npm](https://img.shields.io/npm/v/gatsby-source-gcs-image?logo=npm&style=for-the-badge)](https://www.npmjs.com/package/gatsby-source-gcs-image)
![license](https://img.shields.io/npm/l/gatsby-source-gcs-image?style=for-the-badge)
![test coverage](https://img.shields.io/nycrc/parkerholladay/gatsby-source-gcs-image?label=functions&preferredThreshold=functions&style=for-the-badge)
![test coverage](https://img.shields.io/nycrc/parkerholladay/gatsby-source-gcs-image?label=lines&preferredThreshold=lines&style=for-the-badge)

## What Is This?

`gatsby-source-gcs-image` is a [GatsbyJS](https:///gatsbyjs.com) _source_ plugin that converts images from Google Cloud Storage into GatsbyJS `File` nodes--much like how [this plugin](https://gatsbyjs.com/plugins/gatsby-source-s3-image) works with AWS S3. See [here](https://github.com/jessestuart/gatsby-source-s3-image#but-i-can-just-query-s3-manually-client-side) for more.

The created GatsbyJS `File` nodes can then be manipulated with image processors like [sharp](https://gatsbyjs.com/plugins/gatsby-plugin-sharp).

## Usage

### Install

```bash
npm install --save-dev gatsby-source-gcs-image
```

_or_

```bash
yarn add -D gatsby-source-gcs-image
```

### Configure

At a minimum GCP creds must be provided with either `credsJson` or `pathToCreds`. Some example configurations are:

```javascript
// gatsby-config.js

module.exports = {
  plugins: [
    {
      resolve: 'gatsby-source-gcs-image',
      options: {
        bucketName: 'my-gcs-bucket.appspot.com',
        bucketPath: '/path/to/images',
        expires: 120,
        pathToCreds: `${__dirname}/.gcp-creds.json`,
        projectId: 'my-gcp-project',
      },
    },
    // ...image transform plugins
  ],
}
```

_or_

```javascript
// gatsby-config.js

module.exports = {
  plugins: [
    {
      resolve: 'gatsby-source-gcs-image',
      options: {
        credsJson: process.env.ENV_VAR_WITH_CREDS,
      },
    },
    // ...image transform plugins
  ],
}
```

#### Fields

| name        | type   | default | required | description |
| ----------- | ------ | :-----: | :------: | ----------- |
| bucketName  | string |         | *        | GCS bucket _(may exist in creds)_ |
| credsJson   | string |         | *        | JSON string with creds _(optional if `pathToCreds` is provided)_ |
| expires     | number | 900     |          | signed url expiration in seconds |
| pathToCreds | string |         | *        | JSON file with creds _(optional if `credsJson` is provided)_ |
| projectId   | string |         | *        | GCP project id _(may exist in creds)_ |

### Query Data

```javascript
export const pageQuery = graphql`
  {
    allGcsImage {
      edges {
        node {
          name
          childImageSharp {
            gatsbyImageData(layout: CONSTRAINED, width: 800)
          }
        }
      }
    }
  }
`
```
