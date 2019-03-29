# JSON Datasource - a generic backend datasource

The JSON Datasource executes JSON requests against arbitrary backends.   
_JSON Datasource is an enhanced version of the [Simple JSON Datasource](https://github.com/grafana/simple-json-datasource)._
 
 ## Contents
 - [Installation](#installation)
 - [Setup](#setup)
 - [API](#api)
   - [/search](#search)
   - [/query](#tquery)
   - [/annotations](#annotations)
   - [/tag-keys](#tag-keys)
   - [/tag-values](#tag-values)
- [Development Setup](#development-setup)

## Installation

To install this plugin using the `grafana-cli` tool:
```sh
 grafana-cli plugins install simpod-json-datasource
 ```

See [here](https://grafana.com/plugins/simpod-json-datasource/installation) for more
information.

## Setup

When adding datasource add your API endpoint to the `URL` field. That's where datasource will make requests to.

![Datasource setup](https://raw.githubusercontent.com/simPod/grafana-json-datasource/master/docs/images/datasource-setup.png)


## API

To work with this datasource the backend needs to implement 4 urls:

 * `/` should return 200 ok. Used for "Test connection" on the datasource config page.
 * `/search` used by the find metric options on the query tab in panels.
 * `/query` should return metrics based on input.
 * `/annotations` should return annotations.

Those two urls are optional:

 * `/tag-keys` should return tag keys for ad hoc filters.
 * `/tag-values` should return tag values for ad hoc filters.
 
### /search

Example request
``` json
{ "target": "upper_50" }
```

The search api can either return an array or map.

Example array response
``` json
["upper_25","upper_50","upper_75","upper_90","upper_95"]
```

Example map response
``` json
[ { "text" :"upper_25", "value": 1}, { "text" :"upper_75", "value": 2} ]
```

### /query

Example `timeseries` request
``` json
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
     { "target": "upper_50", "refId": "A", "type": "timeseries", "data": { "additional": "optional json" } },
     { "target": "upper_75", "refId": "B", "type": "timeseries" }
  ],
  "adhocFilters": [{
    "key": "City",
    "operator": "=",
    "value": "Berlin"
  }]
}
```

Example `timeseries` response
``` javascript
[
  {
    "target":"upper_75", // The field being queried for
    "datapoints":[
      [622,1450754160000],  // Metric value as a float , unixtimestamp in milliseconds
      [365,1450754220000]
    ]
  },
  {
    "target":"upper_90",
    "datapoints":[
      [861,1450754160000],
      [767,1450754220000]
    ]
  }
]
```

If the metric selected is `"type": "table"`, an example `table` response:
``` json
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

Sending additional data for each metric is supported via the Additional JSON Data input field that allows you to enter JSON.

For example when `{ "additional": "optional json" }` is entered into Additional JSON Data input, it is attached to the target data under `"data"` key:

```json
{ "target": "upper_50", "refId": "A", "type": "timeseries", "data": { "additional": "optional json" } }
``` 

You can also enter variables:

![Additional data input](https://raw.githubusercontent.com/simPod/grafana-json-datasource/master/docs/images/additional-data-input.png)

### /annotations

The annotation request from the Simple JSON Datasource is a POST request to
the `/annotations` endpoint in your datasource. The JSON request body looks like this:
``` json
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
    "query": "#deploy",
  },
   "variables" []
}
```

Grafana expects a response containing an array of annotation objects in the
following format:

``` javascript
[
  {
    "text": "text shown in body" // Text for the annotation. (required)
    "title": "Annotation Title", // The title for the annotation tooltip. (optional)
    "isRegion": true, // Whether is region. (optional) (http://docs.grafana.org/reference/annotations/#adding-regions-events)
    "time": "timestamp", // Time since UNIX Epoch in milliseconds. (required)
    "timeEnd": "timestamp", // Time since UNIX Epoch in milliseconds (required if `isRegion` is true )
    "tags": ["tag1"], // Tags for the annotation. (optional)
  }
]
```

Note: If the datasource is configured to connect directly to the backend, you
also need to implement an OPTIONS endpoint at `/annotations` that responds
with the correct CORS headers:

```
Access-Control-Allow-Headers:accept, content-type
Access-Control-Allow-Methods:POST
Access-Control-Allow-Origin:*
```

### /tag-keys

Example request
``` json
{ }
```

The tag keys api returns:
``` json
[
    {"type":"string","text":"City"},
    {"type":"string","text":"Country"}
]
```

### /tag-values

Example request
``` json
{"key": "City"}
```

The tag values api returns:
``` json
[
    {"text": "Eins!"},
    {"text": "Zwei"},
    {"text": "Drei!"}
]
```

## Development Setup

This plugin requires node 6.10.0. Use of [Yarn](https://yarnpkg.com/lang/en/docs/install/) is encouraged to build.

```
yarn install
yarn run build
```
