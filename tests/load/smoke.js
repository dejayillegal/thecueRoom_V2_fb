
import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate } from 'k6/metrics';

// Custom metrics
const errorRate = new Rate('errors');

export const options = {
  vus: 50, // 50 virtual users
  duration: '2m',
  thresholds: {
    http_req_duration: ['p(95)<2000'], // 95% of requests under 2s
    errors: ['rate<0.01'], // Error rate < 1%
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:5000';

export default function () {
  // Test homepage
  let res = http.get(`${BASE_URL}/`);
  check(res, {
    'homepage status 200': (r) => r.status === 200,
    'homepage has content': (r) => r.body.includes('thecueRoom'),
  }) || errorRate.add(1);
  
  sleep(1);

  // Test API: monthly playlists
  res = http.get(`${BASE_URL}/api/playlists/monthly/latest`);
  check(res, {
    'api status 200': (r) => r.status === 200,
    'api returns JSON': (r) => r.headers['Content-Type']?.includes('application/json'),
  }) || errorRate.add(1);
  
  sleep(1);

  // Test feeds
  res = http.get(`${BASE_URL}/api/feeds?limit=12`);
  check(res, {
    'feeds status 200': (r) => r.status === 200,
    'feeds return data': (r) => {
      try {
        const json = JSON.parse(r.body);
        return json.feeds && json.feeds.length > 0;
      } catch {
        return false;
      }
    },
  }) || errorRate.add(1);

  sleep(2);
}
