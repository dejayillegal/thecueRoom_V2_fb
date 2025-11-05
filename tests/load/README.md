
# Load & Stress Tests

k6 scripts for load, stress, and scalability testing.

## Scenarios

- `smoke.js` - Light load validation (50 VUs)
- `load.js` - Normal peak load (500 VUs)
- `stress.js` - Stress to failure (ramp to 2000+ VUs)
- `spike.js` - Sudden traffic spikes
- `soak.js` - Extended duration testing

## Running Tests

```bash
k6 run tests/load/smoke.js
k6 run tests/load/load.js --out json=results.json
```

## Thresholds

- p95 latency < 2s
- Error rate < 1%
- Throughput > 100 req/s
