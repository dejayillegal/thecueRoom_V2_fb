
import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';

const errorRate = new Rate('errors');
const apiDuration = new Trend('api_duration');

export const options = {
  stages: [
    { duration: '2m', target: 100 }, // Ramp up
    { duration: '5m', target: 500 }, // Stay at peak
    { duration: '2m', target: 0 },   // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<2000', 'p(99)<5000'],
    errors: ['rate<0.01'],
    api_duration: ['p(95)<1000'],
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:5000';

export default function () {
  const scenarios = [
    () => testHomepage(),
    () => testPlaylistAPI(),
    () => testFeeds(),
    () => testNewsPage(),
  ];

  // Random scenario selection
  const scenario = scenarios[Math.floor(Math.random() * scenarios.length)];
  scenario();

  sleep(Math.random() * 5 + 1); // Random sleep 1-6s
}

function testHomepage() {
  const res = http.get(`${BASE_URL}/`);
  check(res, {
    'homepage OK': (r) => r.status === 200,
  }) || errorRate.add(1);
}

function testPlaylistAPI() {
  const start = Date.now();
  const res = http.get(`${BASE_URL}/api/playlists/monthly/latest`);
  apiDuration.add(Date.now() - start);
  
  check(res, {
    'playlist API OK': (r) => r.status === 200,
    'has playlist data': (r) => {
      try {
        const json = JSON.parse(r.body);
        return json.ok && json.playlist;
      } catch {
        return false;
      }
    },
  }) || errorRate.add(1);
}

function testFeeds() {
  const res = http.get(`${BASE_URL}/api/feeds?limit=24`);
  check(res, {
    'feeds API OK': (r) => r.status === 200,
  }) || errorRate.add(1);
}

function testNewsPage() {
  const res = http.get(`${BASE_URL}/news`);
  check(res, {
    'news page OK': (r) => r.status === 200,
  }) || errorRate.add(1);
}
