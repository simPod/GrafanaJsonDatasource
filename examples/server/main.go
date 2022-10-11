package main

import (
	"encoding/json"
	"log"
	"net/http"
)

func newHandler() http.Handler {
	mux := http.NewServeMux()
	mux.HandleFunc("/api/grafana/json", hello)
	mux.HandleFunc("/api/grafana/json/search", getSearch)
	mux.HandleFunc("/api/grafana/json/options", getOptions)
	return mux
}

func main() {
	log.Println("grafana api: /api/grafana/json")
	log.Println("listen 0.0.0.0:8081")
	http.ListenAndServe(":8181", newHandler())
}

var defaultMetrics = `
[{
  "text": "Lorem",
  "value": "a"
},{
  "text": "Ipsum",
  "value": "b"
}]
`

type MetricsRequest struct {
	Metric  string                 `json:"metric"`
	Payload map[string]interface{} `json:"payload"`
}

func getSearch(writer http.ResponseWriter, request *http.Request) {
	var req MetricsRequest
	err := json.NewDecoder(request.Body).Decode(&req)
	if err != nil {
		writer.WriteHeader(500)
		return
	}
	writer.Header().Set("content-type", "application/json")
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
