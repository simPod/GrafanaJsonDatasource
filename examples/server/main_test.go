package main

import (
	"bytes"
	"encoding/json"
	"io/ioutil"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/stretchr/testify/require"
)

func Test_Hello(t *testing.T) {
	mux := newHandler()
	server := httptest.NewServer(mux)
	resp, err := http.Get(server.URL + "/api/grafana/json")
	require.NoError(t, err)
	require.Equal(t, resp.StatusCode, 200)
	rawBody, err := ioutil.ReadAll(resp.Body)
	resp.Body.Close()
	require.NoError(t, err)
	require.Equal(t, string(rawBody), "ok")
}

type payloadConfig struct {
	Label string `json:"label"`
	Name  string `json:"value"`
}

type metricConfig struct {
	Label    string          `json:"label"`
	Value    string          `json:"value"`
	Payloads []payloadConfig `json:"payloads"`
}

func Test_Metrics(t *testing.T) {
	mux := newHandler()
	server := httptest.NewServer(mux)
	resp, err := http.Post(server.URL+"/api/grafana/json/metrics", "application/json", bytes.NewBuffer([]byte("{}")))
	require.NoError(t, err)
	require.Equal(t, resp.StatusCode, 200)
	rawBody, err := ioutil.ReadAll(resp.Body)
	resp.Body.Close()
	require.NoError(t, err)
	var metrics []metricConfig
	require.NoError(t, json.Unmarshal(rawBody, &metrics))
	require.Len(t, metrics, 2)
	require.Len(t, metrics[0].Payloads, 2)

	payload := `{"metric":"DescribeMetricList","payload":{"namespace":"acs_rds"}}`
	resp, err = http.Post(server.URL+"/api/grafana/json/metrics", "application/json", bytes.NewBuffer([]byte(payload)))
	require.NoError(t, err)
	require.Equal(t, resp.StatusCode, 200)
	rawBody, err = ioutil.ReadAll(resp.Body)
	resp.Body.Close()
	require.NoError(t, err)
	metrics = []metricConfig{}
	require.NoError(t, json.Unmarshal(rawBody, &metrics))
	require.Len(t, metrics, 2)
	require.Len(t, metrics[0].Payloads, 3)
}

func Test_Options(t *testing.T) {
	mux := newHandler()
	server := httptest.NewServer(mux)
	payload := `{"metric":"DescribeMetricList","payload":{"namespace":"acs_rds"},"name":"instanceId"}`
	resp, err := http.Post(server.URL+"/api/grafana/json/metric-payload-options", "application/json", bytes.NewBuffer([]byte(payload)))
	require.NoError(t, err)
	require.Equal(t, resp.StatusCode, 200)
	rawBody, err := ioutil.ReadAll(resp.Body)
	resp.Body.Close()
	require.NoError(t, err)
	var metrics []metricConfig
	require.NoError(t, json.Unmarshal(rawBody, &metrics))
	require.Len(t, metrics, 3)
}
