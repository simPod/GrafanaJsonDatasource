package plugin

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"time"

	"github.com/grafana/grafana-plugin-sdk-go/backend"
	"github.com/grafana/grafana-plugin-sdk-go/backend/httpclient"
	"github.com/grafana/grafana-plugin-sdk-go/backend/instancemgmt"
	"github.com/grafana/grafana-plugin-sdk-go/data"
)

// Make sure Datasource implements required interfaces. This is important to do
// since otherwise we will only get a not implemented error response from plugin in
// runtime. In this example datasource instance implements backend.QueryDataHandler,
// backend.CheckHealthHandler interfaces. Plugin should not implement all these
// interfaces - only those which are required for a particular task.
var (
	_ backend.QueryDataHandler      = (*Datasource)(nil)
	_ backend.CheckHealthHandler    = (*Datasource)(nil)
	_ instancemgmt.InstanceDisposer = (*Datasource)(nil)
)

// NewDatasource creates a new datasource instance.
func NewDatasource(ctx context.Context, settings backend.DataSourceInstanceSettings) (instancemgmt.Instance, error) {
	backend.Logger.Debug("creating a new datasource", "settings", settings)

	opts, err := settings.HTTPClientOptions(ctx)
	if err != nil {
		return nil, fmt.Errorf("http client options: %w", err)
	}

	if settings.BasicAuthEnabled {
		opts.BasicAuth.User = settings.BasicAuthUser
		opts.BasicAuth.Password = settings.DecryptedSecureJSONData["basicAuthPassword"]
	}

	opts.Header.Add("Content-Type", "application/json")
	opts.Header.Add("User-Agent", "gtom/1.0")

	cli, err := httpclient.New(opts)
	if err != nil {
		return nil, fmt.Errorf("httpclient new: %w", err)
	}

	return &Datasource{
		settings.URL,
		cli,
	}, nil
}

// Datasource is an example datasource which can respond to data queries, reports
// its health and has streaming skills.
type Datasource struct {
	url        string
	httpClient *http.Client
}

// Check https://grafana.com/developers/plugin-tools/create-a-plugin/extend-a-plugin/add-resource-handler
func (d *Datasource) CallResource(ctx context.Context, req *backend.CallResourceRequest, sender backend.CallResourceResponseSender) error {
	backend.Logger.Debug("handling a resource query", "path", req.Path)
	switch req.Path {
	case "metrics":
		backend.Logger.Debug("handling metrics query", "body", req.Body)

		resp, err := d.httpClient.Post(d.url+"/metrics", "application/json", bytes.NewReader(req.Body))
		if err != nil {
			backend.Logger.Error("couldn't get metrics", "err", err)
			return sender.Send(&backend.CallResourceResponse{
				Status: http.StatusNotFound,
			})
		}

		if resp.StatusCode != http.StatusOK {
			backend.Logger.Error("couldn't get metrics", "rc", resp.StatusCode)
			return sender.Send(&backend.CallResourceResponse{
				Status: http.StatusNotFound,
				Body:   []byte(`{"err": "couldn't get the metrics"}`),
			})
		}

		body, err := io.ReadAll(resp.Body)
		if err != nil {
			backend.Logger.Error("couldn't read the returned metrics", "err", err)
			return sender.Send(&backend.CallResourceResponse{
				Status: http.StatusNotFound,
				Body:   []byte(`{"err": "couldn't read the returned metrics"}`),
			})
		}

		return sender.Send(&backend.CallResourceResponse{
			Status: http.StatusOK,
			Body:   body,
		})
	default:
		return sender.Send(&backend.CallResourceResponse{
			Status: http.StatusNotFound,
			Body:   []byte(`{"err": "requested non-existent path"}`),
		})
	}
}

// Dispose here tells plugin SDK that plugin wants to clean up resources when a new instance
// created. As soon as datasource settings change detected by SDK old datasource instance will
// be disposed and a new one will be created using NewSampleDatasource factory function.
func (d *Datasource) Dispose() {
	// Clean up datasource instance resources.
}

// QueryData handles multiple queries and returns multiple responses.
// req contains the queries []DataQuery (where each query contains RefID as a unique identifier).
// The QueryDataResponse contains a map of RefID to the response for each query, and each response
// contains Frames ([]*Frame).
func (d *Datasource) QueryData(ctx context.Context, req *backend.QueryDataRequest) (*backend.QueryDataResponse, error) {
	// create response struct
	response := backend.NewQueryDataResponse()

	// loop over queries and execute them individually.
	for _, q := range req.Queries {
		res := d.query(ctx, req.PluginContext, q)

		// save the response in a hashmap
		// based on with RefID as identifier
		response.Responses[q.RefID] = res
	}

	return response, nil
}

type queryModel struct{}

func (d *Datasource) query(_ context.Context, pCtx backend.PluginContext, query backend.DataQuery) backend.DataResponse {
	var response backend.DataResponse

	backend.Logger.Debug("making a query", "query", query, "pluginContext", pCtx)

	// Unmarshal the JSON into our queryModel.
	var qm queryModel

	err := json.Unmarshal(query.JSON, &qm)
	if err != nil {
		return backend.ErrDataResponse(backend.StatusBadRequest, fmt.Sprintf("json unmarshal: %v", err.Error()))
	}

	// create data frame response.
	// For an overview on data frames and how grafana handles them:
	// https://grafana.com/developers/plugin-tools/introduction/data-frames
	frame := data.NewFrame("response")

	// add fields.
	frame.Fields = append(frame.Fields,
		data.NewField("time", nil, []time.Time{query.TimeRange.From, query.TimeRange.To}),
		data.NewField("values", nil, []int64{10, 20}),
	)

	// add the frames to the response.
	response.Frames = append(response.Frames, frame)

	return response
}

// CheckHealth handles health checks sent from Grafana to the plugin.
// The main use case for these health checks is the test button on the
// datasource configuration page which allows users to verify that
// a datasource is working as expected.
func (d *Datasource) CheckHealth(_ context.Context, req *backend.CheckHealthRequest) (*backend.CheckHealthResult, error) {
	resp, err := d.httpClient.Get(d.url)
	if err != nil {
		backend.Logger.Error("couldn't reach the datasource", "err", err)
		return &backend.CheckHealthResult{
			Status:  backend.HealthStatusError,
			Message: fmt.Sprintf("Error making the request: %v", err),
		}, nil
	}

	if resp.StatusCode != http.StatusOK {
		return &backend.CheckHealthResult{
			Status:  backend.HealthStatusError,
			Message: fmt.Sprintf("The backend doesn't look too good, got response code %d", resp.StatusCode),
		}, nil
	}

	return &backend.CheckHealthResult{
		Status:  backend.HealthStatusOk,
		Message: "Data source is working!",
	}, nil
}
