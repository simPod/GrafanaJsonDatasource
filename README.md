# JSON API Grafana Datasource

[![Build](https://github.com/simPod/GrafanaJsonDatasource/workflows/CI/badge.svg)](https://github.com/simPod/GrafanaJsonDatasource/actions?query=workflow%3A%22CI%22)
[![Marketplace](https://img.shields.io/badge/dynamic/json?logo=grafana&color=F47A20&label=marketplace&prefix=v&query=%24.items%5B%3F%28%40.slug%20%3D%3D%20%22simpod-json-datasource%22%29%5D.version&url=https%3A%2F%2Fgrafana.com%2Fapi%2Fplugins)](https://grafana.com/grafana/plugins/simpod-json-datasource)
[![Downloads](https://img.shields.io/badge/dynamic/json?logo=grafana&color=F47A20&label=downloads&query=%24.items%5B%3F%28%40.slug%20%3D%3D%20%22simpod-json-datasource%22%29%5D.downloads&url=https%3A%2F%2Fgrafana.com%2Fapi%2Fplugins)](https://grafana.com/grafana/plugins/simpod-json-datasource)

The JSON Datasource executes requests against arbitrary backends and parses JSON response into Grafana dataframes.

## Installation

To install this plugin using the `grafana-cli` tool:

```sh
 grafana-cli plugins install simpod-json-datasource
 ```

See [here](https://grafana.com/grafana/plugins/simpod-json-datasource/) for more information.

## Setup

When adding datasource add your API endpoint to the `URL` field. That's where datasource will make requests to.

![Datasource setup](https://raw.githubusercontent.com/simPod/grafana-json-datasource/0.6.x/docs/images/datasource-setup.png)

If you want to add custom headers, keep Access set to `Server`.

## API

An OpenAPI definition is at [openapi.yaml](https://github.com/simPod/GrafanaJsonDatasource/blob/0.6.x/openapi.yaml). 
_You can explore it using [Swagger Editor](https://editor-next.swagger.io/)_.

To work with this datasource the backend needs to implement 4 endpoints:

- `GET /` with 200 status code response. Used for "Test connection" on the datasource config page.
- `POST /metrics` to return available metrics.
- `POST /metric-payload-options` to return a list of metric payload options.
- `POST /query` to return panel data or annotations.

Those 3 endpoints are optional:

- `POST /variable` to return data for Variable of type `Query`.
- `POST /tag-keys` returning tag keys for ad hoc filters.
- `POST /tag-values` returning tag values for ad hoc filters.

### /metrics

`POST /metrics`

In `Panel > Queries` page. When configuring a query request using `Builder` mode, it will send the request to obtain the available metrics. The request body will carry the current metric and payload. In the `Builder` mode, if the `reloadMetric` value in the load configuration is true, the api will also be triggered when the value is modified / switched.

Example request:
```json
{}
```
Or. 
```json
{
  "metric": "DescribeMetricList",
  "payload":{
    "cloud": "cf6591c5dad211eaa22100163e120f6e",
    "namespace": "MySQL"
  }
}
```
Example response:
```json5
[{
  "label": "Describe metric list", // Optional. If the value is empty, use the value as the label
  "value": "DescribeMetricList", // The value of the option.
  "payloads": [{ // Configuration parameters of the payload.
    "label": "Namespace", // The label of the payload. If the value is empty, use the value as the label.
    "name": "namespace", // The name of the payload. If the value is empty, use the name as the label.
    "type": "select", // If the value is select, the UI of the payload is a radio box. If the value is multi-select, the UI of the payload is a multi selection box; if the value is input, the UI of the payload is an input box; if the value is textarea, the UI of the payload is a multiline input box. The default is input.
    "placeholder": "Please select namespace", // Input box / selection box prompt information.
    "reloadMetric": true, // Whether to overload the metrics API after modifying the value of the payload.
    "width": 10, // Set the input / selection box width to a multiple of 8px. 
    "options": [{ // If the payload type is select / multi-select, the list is the configuration of the option list.
      "label": "acs_mongodb", // The label of the payload select option.
      "value": "acs_mongodb", // The label of the payload value.
    },{
      "label": "acs_rds",
      "value": "acs_rds",
    }]
  },{
    "name": "metric",
    "type": "select"
  },{
    "name": "instanceId",
    "type": "select"
  }]
},{
  "value": "DescribeMetricLast",
  "payloads": [{
    "name": "namespace",
    "type": "select"
  },{
    "name": "metric",
    "type": "select"
  },{
    "name": "instanceId",
    "type": "multi-select"
  }]
}]
```
The display is as follows:
![Metrics in builder mode](https://raw.githubusercontent.com/simPod/grafana-json-datasource/0.6.x/docs/images/builder-metrics.png)

### /metric-payload-options

`POST /metric-payload-options`

When the payload `type` is `select` or `multi-select` and the payload `options` configuration is empty, expanding the drop-down menu will trigger this API. The request body will carry the current metric and payload. 

Example Request:
```json5
{
  "metric":"DescribeMetricList", // Current metric.
  "payload": { // Current payload.
    "namespace":"acs_ecs"
  },
  "name":"cms_metric" // The payload name of the option list needs to be obtained.
}
```

Example Response:
```json
[{ 
  "label": "CPUUtilization",
  "value": "CPUUtilization"
},{
  "label": "DiskReadIOPS",
  "value": "DiskReadIOPS"
},{
  "label": "memory_freeutilization",
  "value": "memory_freeutilization"
}]
```
The display is as follows:
![Metric options in builder mode](https://raw.githubusercontent.com/simPod/grafana-json-datasource/0.6.x/docs/images/builder-metric-options.png)

### /query

`POST /query`

Example request:

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
     { "target": "Packets", "refId": "A", "payload": { "additional": "optional json" } },
     { "target": "Errors", "refId": "B" }
  ],
  "adhocFilters": [{
    "key": "City",
    "operator": "=",
    "value": "Berlin"
  }]
}
```

**Response body can contain anything that is or can be converted to a Grafana DataFrame using [this function](https://github.com/grafana/grafana/blob/1e024f22b8f767da01c9322f489d7b71aeec19c3/packages/grafana-data/src/dataframe/processDataFrame.ts#L284).
Returned data will be mapped to a DataFrame through that.**

Example response (metric value as a float , unix timestamp in milliseconds):

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

_The relation between `target` in request and response is 1:n. You can return multiple targets in response for one requested `target`._

#### Payload

Sending additional data for each metric is supported via the `Payload` input field that allows you to enter any JSON string.

For example, when `{ "additional": "optional json" }` is entered into `Payload` input, it is attached to the target data under `"payload"` key:

```json
{ "target": "upper_50", "refId": "A", "payload": { "additional": "optional json" } }
```

You can also enter variables:

![Additional data variable input](https://raw.githubusercontent.com/simPod/grafana-json-datasource/0.6.x/docs/images/additional-data-variable-input.png)

### /variable

`POST /variable`

Example request body:

```json
{
  "payload":{"target":"systems"},
  "range":{
    "from":"2022-02-14T08:09:32.164Z",
    "to":"2022-02-21T08:09:32.164Z",
    "raw":{"from":"now-7d","to":"now"}
  }
}
```

`"payload"` is value from your input in Variable edit form.

Example response

```json
[
  {"__text":"Label 1", "__value":"Value1"},
  {"__text":"Label 2", "__value":"Value2"},
  {"__text":"Label 3", "__value":"Value3"}
]
```

DataFrame is also supported.

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
