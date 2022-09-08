package main

import (
	"encoding/json"
	"log"
	"net/http"
)

func newHandler() http.Handler {
	mux := http.NewServeMux()
	mux.HandleFunc("/api/grafana/json/", hello)
	mux.HandleFunc("/api/grafana/json/metrics", getMetrics)
	mux.HandleFunc("/api/grafana/json/options", getOptions)
	return mux
}

func main() {
	log.Println("grafana api: /api/grafana/json/")
	log.Println("listen 0.0.0.0:8081")
	http.ListenAndServe(":8181", newHandler())
}

var defaultMetrics = `
[{
  "label": "Describe metric list",
  "value": "DescribeMetricList",
  "payloads": [{
    "label": "Namespace",
    "name": "namespace",
    "type": "select",
    "defaultValue": "acs_mongodb",
    "placeholder": "Please select namespace",
    "reloadMetric": true, 
    "options": [{ 
      "label": "acs_mongodb",
      "value": "acs_mongodb"
    },{
      "label": "acs_rds",
      "value": "acs_rds"
    }]
  },{
    "name": "metric",
    "type": "select"
  }]
},{
  "value": "DescribeMetricLast",
  "payloads": [{
    "name": "namespace",
    "type": "select"
  },{
    "name": "metric",
    "type": "input"
  },{
    "name": "instanceId",
    "type": "multi-select"
  }]
}]
`
var rdsMetrics = `
[{
  "label": "Describe metric list",
  "value": "DescribeMetricList",
  "payloads": [{
    "label": "Namespace",
    "name": "namespace",
    "type": "select",
    "defaultValue": "acs_mongodb",
    "placeholder": "Please select namespace",
    "reloadMetric": true, 
    "options": [{ 
      "label": "acs_mongodb",
      "value": "acs_mongodb"
    },{
      "label": "acs_rds",
      "value": "acs_rds"
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
    "type": "input"
  },{
    "name": "instanceId",
    "type": "multi-select"
  }]
}]
`

type MetricsRequest struct {
	Metric  string                 `json:"metric"`
	Payload map[string]interface{} `json:"payload"`
}

func getMetrics(writer http.ResponseWriter, request *http.Request) {
	var req MetricsRequest
	err := json.NewDecoder(request.Body).Decode(&req)
	if err != nil {
		writer.WriteHeader(500)
		return
	}
	writer.Header().Set("content-type", "application/json")
	if req.Metric == "DescribeMetricList" && req.Payload["namespace"] == "acs_rds" {
		writer.Write([]byte(rdsMetrics))
		return
	}
	writer.Write([]byte(defaultMetrics))
}

type OptionsRequest struct {
	Name    string                 `json:"name"`
	Metric  string                 `json:"metric"`
	Payload map[string]interface{} `json:"payload"`
}

func getOptions(writer http.ResponseWriter, request *http.Request) {
	var req OptionsRequest
	err := json.NewDecoder(request.Body).Decode(&req)
	if err != nil {
		writer.WriteHeader(500)
		return
	}
	writer.Header().Set("content-type", "application/json")
	switch req.Name {
	case "instanceId":
		writer.Write([]byte(`[{ 
      "label": "My Database 1",
      "value": "sadbip2kasdmnlo"
    },{
      "label": "My Database 2",
      "value": "sadbip2kasdmnla"
    },{
      "label": "My Database 3",
      "value": "sadbip2kasdmnlx"
    }]`))

	case "metric":
		writer.Write([]byte(`[{ 
      "label": "CPUUtilization",
      "value": "CPUUtilization"
    },{
      "label": "DiskReadIOPS",
      "value": "DiskReadIOPS"
    },{
      "label": "memory_freeutilization",
      "value": "memory_freeutilization"
    }]`))
	case "namespace":
		writer.Write([]byte(`[{ 
      "label": "MongoDB",
      "value": "acs_mongodb"
    },{
      "label": "RDS",
      "value": "acs_rds"
    },{
      "label": "Load balancer",
      "value": "acs_load_balancer"
    }]`))
	}
}
func hello(writer http.ResponseWriter, request *http.Request) {
	writer.Write([]byte("ok"))
}
