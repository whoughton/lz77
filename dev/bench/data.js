window.BENCHMARK_DATA = {
  "lastUpdate": 1776896364812,
  "repoUrl": "https://github.com/whoughton/lz77",
  "entries": {
    "Benchmark": [
      {
        "commit": {
          "author": {
            "email": "whoughton@gmail.com",
            "name": "Weston Houghton",
            "username": "whoughton"
          },
          "committer": {
            "email": "noreply@github.com",
            "name": "GitHub",
            "username": "web-flow"
          },
          "distinct": true,
          "id": "9e7dc66e57f6bcbb35294fd5ba9ae9cce7361db0",
          "message": "Merge pull request #20 from whoughton/feat/security-speed\n\nSecurity, correctness, performance, and test coverage overhaul",
          "timestamp": "2026-04-22T18:18:51-04:00",
          "tree_id": "052abbad9984b5135e9d22f717f35d7975a22353",
          "url": "https://github.com/whoughton/lz77/commit/9e7dc66e57f6bcbb35294fd5ba9ae9cce7361db0"
        },
        "date": 1776896364031,
        "tool": "customBiggerIsBetter",
        "benches": [
          {
            "name": "compress/repetitive",
            "value": 828,
            "range": "± 1.45%",
            "unit": "ops/sec",
            "extra": "min 1.026 ms · max 2.565 ms · p99 2.213 ms"
          },
          {
            "name": "compressRollingHash/repetitive",
            "value": 536,
            "range": "± 1.07%",
            "unit": "ops/sec",
            "extra": "min 1.781 ms · max 6.660 ms · p99 2.304 ms"
          },
          {
            "name": "compressLegacy/repetitive",
            "value": 21,
            "range": "± 0.94%",
            "unit": "ops/sec",
            "extra": "min 47.311 ms · max 51.591 ms · p99 51.591 ms"
          },
          {
            "name": "compressHashTable/repetitive",
            "value": 1141,
            "range": "± 1.16%",
            "unit": "ops/sec",
            "extra": "min 0.790 ms · max 3.023 ms · p99 1.517 ms"
          },
          {
            "name": "decompress/repetitive",
            "value": 1807,
            "range": "± 1.35%",
            "unit": "ops/sec",
            "extra": "min 0.473 ms · max 2.573 ms · p99 1.275 ms"
          },
          {
            "name": "decompressLegacy/repetitive",
            "value": 289,
            "range": "± 0.37%",
            "unit": "ops/sec",
            "extra": "min 3.203 ms · max 4.125 ms · p99 3.842 ms"
          },
          {
            "name": "compress/prose",
            "value": 7064,
            "range": "± 0.68%",
            "unit": "ops/sec",
            "extra": "min 0.128 ms · max 0.606 ms · p99 0.427 ms"
          },
          {
            "name": "compressRollingHash/prose",
            "value": 4890,
            "range": "± 0.62%",
            "unit": "ops/sec",
            "extra": "min 0.192 ms · max 1.140 ms · p99 0.471 ms"
          },
          {
            "name": "compressLegacy/prose",
            "value": 281,
            "range": "± 1.02%",
            "unit": "ops/sec",
            "extra": "min 3.306 ms · max 6.940 ms · p99 5.188 ms"
          },
          {
            "name": "compressHashTable/prose",
            "value": 8197,
            "range": "± 0.68%",
            "unit": "ops/sec",
            "extra": "min 0.110 ms · max 0.623 ms · p99 0.384 ms"
          },
          {
            "name": "decompress/prose",
            "value": 24581,
            "range": "± 0.40%",
            "unit": "ops/sec",
            "extra": "min 0.038 ms · max 0.326 ms · p99 0.053 ms"
          },
          {
            "name": "decompressLegacy/prose",
            "value": 15639,
            "range": "± 0.53%",
            "unit": "ops/sec",
            "extra": "min 0.050 ms · max 0.885 ms · p99 0.191 ms"
          },
          {
            "name": "compress/adversarial",
            "value": 16696,
            "range": "± 0.38%",
            "unit": "ops/sec",
            "extra": "min 0.056 ms · max 0.404 ms · p99 0.075 ms"
          },
          {
            "name": "compressRollingHash/adversarial",
            "value": 12840,
            "range": "± 0.48%",
            "unit": "ops/sec",
            "extra": "min 0.073 ms · max 0.733 ms · p99 0.117 ms"
          },
          {
            "name": "compressLegacy/adversarial",
            "value": 921,
            "range": "± 0.63%",
            "unit": "ops/sec",
            "extra": "min 1.041 ms · max 3.651 ms · p99 1.305 ms"
          },
          {
            "name": "compressHashTable/adversarial",
            "value": 22726,
            "range": "± 0.43%",
            "unit": "ops/sec",
            "extra": "min 0.041 ms · max 0.443 ms · p99 0.063 ms"
          },
          {
            "name": "decompress/adversarial",
            "value": 23217,
            "range": "± 0.53%",
            "unit": "ops/sec",
            "extra": "min 0.038 ms · max 1.118 ms · p99 0.062 ms"
          },
          {
            "name": "decompressLegacy/adversarial",
            "value": 3006,
            "range": "± 0.66%",
            "unit": "ops/sec",
            "extra": "min 0.257 ms · max 0.970 ms · p99 0.474 ms"
          }
        ]
      }
    ]
  }
}