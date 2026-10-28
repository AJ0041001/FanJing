"""Standard-library GM(1,1) CLI. Reads browser-exported JSON; no third-party packages."""
import argparse
import json
import math
from datetime import datetime, timezone, timedelta
from pathlib import Path


def gm11(values, steps=3):
    x = [float(v) for v in values]
    n = len(x)
    if not 5 <= n <= 24 or any(not math.isfinite(v) or v <= 0 for v in x):
        raise ValueError("GM(1,1) requires 5-24 positive monthly values")
    if not isinstance(steps, int) or not 1 <= steps <= 12:
        raise ValueError("steps must be 1-12")
    total = x[0]
    z = []
    for value in x[1:]:
        z.append(-(total + value / 2))
        total += value
    m = n - 1
    sz, szz, sy = sum(z), sum(v * v for v in z), sum(x[1:])
    szy = sum(a * b for a, b in zip(z, x[1:]))
    determinant = szz * m - sz * sz
    if abs(determinant) <= 1e-10:
        raise ValueError("History is numerically singular")
    a = (szy * m - sz * sy) / determinant
    b = (szz * sy - sz * szy) / determinant

    def predict(k):
        if k == 1:
            return x[0]
        if abs(a) < 1e-10:
            return b
        return (x[0] - b / a) * math.exp(-a * (k - 2)) * math.expm1(-a)

    fitted = [predict(k) for k in range(1, n + 1)]
    future = [predict(k) for k in range(n + 1, n + steps + 1)]
    if any(not math.isfinite(v) or v <= 0 or v >= 1e10 for v in future):
        raise ValueError("Model output is unstable")
    mape = sum(abs(p - v) / v for p, v in zip(fitted[1:], x[1:])) / m * 100
    lo, hi = math.exp(-2 / (n + 1)), math.exp(2 / (n + 1))
    passed = all(lo < x[i - 1] / x[i] < hi for i in range(1, n))
    return {"a": a, "b": b, "fitted": [round(v, 2) for v in fitted], "forecast": [round(v, 2) for v in future], "mape": round(mape, 2), "ratioPassed": passed}


def shift_month(month, delta):
    year, index = map(int, month.split("-"))
    absolute = year * 12 + index - 1 + delta
    return f"{absolute // 12:04d}-{absolute % 12 + 1:02d}"


def compute(data, day=None):
    current = (day or datetime.now(timezone(timedelta(hours=8))).strftime("%Y-%m-%d"))[:7]
    output = []
    for garden in data["gardens"]:
        monthly = {}
        for record in data["harvests"]:
            month = record["date"][:7]
            if record["gardenId"] == garden["id"] and month < current:
                monthly[month] = round(monthly.get(month, 0) + float(record["amount"]), 2)
        keys = sorted(monthly)[-8:]
        try:
            if len(keys) < 5:
                raise ValueError("At least five completed months are required")
            if any(b != shift_month(a, 1) for a, b in zip(keys, keys[1:])):
                raise ValueError("History has missing months")
            if keys[-1] != shift_month(current, -1):
                raise ValueError("Previous calendar month is missing")
            values = [monthly[k] for k in keys]
            result = gm11(values)
            result.update(gardenId=garden["id"], gardenName=garden["name"], months=keys, values=values, futureMonths=[shift_month(keys[-1], i) for i in range(1, 4)])
            output.append(result)
        except (ValueError, OverflowError) as exc:
            output.append({"gardenId": garden["id"], "gardenName": garden["name"], "error": str(exc)})
    return {"generatedFor": current, "demo": True, "unit": "kg", "model": "GM(1,1)", "note": "Trend extrapolation only; historical fitting MAPE is not future accuracy.", "predictions": output}


def main():
    parser = argparse.ArgumentParser(description="Export GM(1,1) predictions from matcha demo JSON")
    parser.add_argument("--input", required=True, type=Path)
    parser.add_argument("--output", type=Path, default=Path("exports/predictions.json"))
    parser.add_argument("--as-of", help="YYYY-MM-DD, useful for a reproducible demo")
    args = parser.parse_args()
    data = json.loads(args.input.read_text(encoding="utf-8-sig"))
    output = compute(data, args.as_of)
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(output, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"Exported {len(output['predictions'])} gardens to {args.output}")


if __name__ == "__main__":
    main()
