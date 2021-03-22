# JSON API Grafana Datasource

[![Build](https://github.com/simPod/GrafanaJsonDatasource/workflows/CI/badge.svg)](https://github.com/simPod/GrafanaJsonDatasource/actions?query=workflow%3A%22CI%22)
[![Marketplace](https://img.shields.io/badge/dynamic/json?logo=grafana&color=F47A20&label=marketplace&prefix=v&query=%24.items%5B%3F%28%40.slug%20%3D%3D%20%22simpod-json-datasource%22%29%5D.version&url=https%3A%2F%2Fgrafana.com%2Fapi%2Fplugins)](https://grafana.com/grafana/plugins/simpod-json-datasource)
[![Downloads](https://img.shields.io/badge/dynamic/json?logo=grafana&color=F47A20&label=downloads&query=%24.items%5B%3F%28%40.slug%20%3D%3D%20%22simpod-json-datasource%22%29%5D.downloads&url=https%3A%2F%2Fgrafana.com%2Fapi%2Fplugins)](https://grafana.com/grafana/plugins/simpod-json-datasource)

The JSON Datasource executes requests against arbitrary backends and parses JSON response into Grafana dataframes.

## Contents

- [Installation](#installation)
- [Setup](#setup)
- [API](#api)
  - [/search](#search)
  - [/query](#query)
  - [/annotations](#annotations)
  - [/tag-keys](#tag-keys)
  - [/tag-values](#tag-values)
- [Development Setup](#development-setup)

## Installation

To install this plugin using the `grafana-cli` tool:

```sh
 grafana-cli plugins install simpod-json-datasource
 ```

See [here](https://grafana.com/grafana/plugins/simpod-json-datasource/) for more information.

## Setup

When adding datasource add your API endpoint to the `URL` field. That's where datasource will make requests to.

![Datasource setup](./docs/images/datasource-setup.png)


## API

An OpenAPI definition is defined at [openapi.yaml](https://github.com/simPod/GrafanaJsonDatasource/blob/master/openapi.yaml).

To work with this datasource the backend needs to implement 4 endpoints:

- `GET /` with 200 status code response. Used for "Test connection" on the datasource config page.
- `POST /search` returning available metrics when invoked.
- `POST /query` returning metrics based on input.
- `POST /annotations` returning annotations.

Those two urls are optional:

- `POST /tag-keys` returning tag keys for ad hoc filters.
- `POST /tag-values` returning tag values for ad hoc filters.

### /search

`POST /search`

Grafana issues this request on 

1. _Variables > New/Edit_ page. `Query` field value is passed in a body as shown below (template variables are expanded as regex by default)

```json
{ "target": "query field value" }
```

Alternatively, flick on the "Raw JSON" switch to provide a full valid JSON string in the query field which will be passed in the request body as a native JSON object.
![Raw JSON Switch](./docs/images/template-var-query-raw-json.png)

Template variables will be expanded as a JSON array. For example, selecting two items in a multi-field dropdown `$myservers`
```string
{"selectedservers":$myservers}
```
will be expanded to
```json
{"selectedservers":["server1","server2"]}
```



2. `Panel > Queries` page. `Format As` and `Metric` values are passed in a body as

```json
{ "type": "timeseries", "target": "upper_50" }
```

The way you handle those values is up to you.

The response body can either contain an array or a map.

Example array response:

```json
["upper_25","upper_50","upper_75","upper_90","upper_95"]
```

Example map response:

```json
[ { "text": "upper_25", "value": 1}, { "text": "upper_75", "value": 2} ]
```

### /query

`POST /query`

Example `timeseries` request:

```json
{
  "panelId": 1,
  "range": {
    "from": "2016-10-31T06:33:44.866Z",
    "to": "2016-10-31T12:33:44.866Z",
    "raw": {
      "from": "now-6h",
      "to": "now"
    }
  },
  "rangeRaw": {
    "from": "now-6h",
    "to": "now"
  },
  "interval": "30s",
  "intervalMs": 30000,
  "maxDataPoints": 550,
  "targets": [
     { "target": "Packets", "refId": "A", "type": "timeseries", "data": { "additional": "optional json" } },
     { "target": "Errors", "refId": "B", "type": "timeseries" }
  ],
  "adhocFilters": [{
    "key": "City",
    "operator": "=",
    "value": "Berlin"
  }]
}
```

You can return anything that is or can be converted to a Grafana DataFrame using [this function](https://github.com/grafana/grafana/blob/1e024f22b8f767da01c9322f489d7b71aeec19c3/packages/grafana-data/src/dataframe/processDataFrame.ts#L284).
Returned data will be mapped to a DataFrame through that.

Example `timeseries` response (metric value as a float , unix timestamp in milliseconds):

```json
[
  {
    "target":"pps in",
    "datapoints":[
      [622,1450754160000],
      [365,1450754220000]
    ]
  },
  {
    "target":"pps out",
    "datapoints":[
      [861,1450754160000],
      [767,1450754220000]
    ]
  },
  {
    "target":"errors out",
    "datapoints":[
      [861,1450754160000],
      [767,1450754220000]
    ]
  },
  {
    "target":"errors in",
    "datapoints":[
      [861,1450754160000],
      [767,1450754220000]
    ]
  }
]
```

_The relation between `target` in request and response is 1:n. You can return multiple targets in response for one requested `target`._

Example `table` response to be returned if the metric selected is `"type": "table"`:

```json
[
  {
    "columns":[
      {"text":"Time","type":"time"},
      {"text":"Country","type":"string"},
      {"text":"Number","type":"number"}
    ],
    "rows":[
      [1234567,"SE",123],
      [1234567,"DE",231],
      [1234567,"US",321]
    ],
    "type":"table"
  }
]
```

#### Additional data

![Additional data input](./docs/images/additional-data-input.gif)

Sending additional data for each metric is supported via the Additional JSON Data input field that allows you to enter JSON.

For example when `{ "additional": "optional json" }` is entered into Additional JSON Data input, it is attached to the target data under `"data"` key:

```json
{ "target": "upper_50", "refId": "A", "type": "timeseries", "data": { "additional": "optional json" } }
```

You can also enter variables:

![Additional data varible input](./docs/images/additional-data-variable-input.png)

### /annotations

`POST /annotations`

The JSON request body looks like this:

```json
{
  "range": {
    "from": "2016-04-15T13:44:39.070Z",
    "to": "2016-04-15T14:44:39.070Z"
  },
  "rangeRaw": {
    "from": "now-1h",
    "to": "now"
  },
  "annotation": {
    "name": "deploy",
    "datasource": "JSON Datasource",
    "iconColor": "rgba(255, 96, 96, 1)",
    "enable": true,
    "query": "#deploy"
  },
   "variables": []
}
```

Grafana expects a response containing an array of annotation objects.

Field explanation:
* `text` - Text for the annotation. (required)
* `title` - The title for the annotation tooltip. (optional)
* `isRegion` - Whether is region. (optional) (http://docs.grafana.org/reference/annotations/#adding-regions-events)
* `time` - Time since UNIX Epoch in milliseconds. (required)
* `timeEnd` - Time since UNIX Epoch in milliseconds (required if `isRegion` is true )
* `tags` - Tags for the annotation. (optional)

```json
[
  {
    "text": "text shown in body",
    "title": "Annotation Title",
    "isRegion": true,
    "time": "timestamp",
    "timeEnd": "timestamp",
    "tags": ["tag1"]
  }
]
```


Note: If the datasource is configured to connect directly to the backend, you
also need to implement `OPTIONS /annotations` that responds
with the correct CORS headers:

```
Access-Control-Allow-Headers:accept, content-type
Access-Control-Allow-Methods:POST
Access-Control-Allow-Origin:*
```

### /tag-keys

`POST /tag-keys`

Example request body

```json
{ }
```

The tag keys api returns:

```json
[
    {"type":"string","text":"City"},
    {"type":"string","text":"Country"}
]
```

### /tag-values

`POST /tag-values`

Example request body

```json
{"key": "City"}
```

The tag values api returns:

```json
[
    {"text": "Eins!"},
    {"text": "Zwei"},
    {"text": "Drei!"}
]
```

## Development Setup

This plugin requires node 6.10.0. Use of [Yarn](https://yarnpkg.com/lang/en/docs/install/) is encouraged to build.

```sh
yarn install
yarn run build
```
