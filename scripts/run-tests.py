#!/usr/bin/env python3
"""Run all YAML test cases against all parsers defined in parsers.yaml."""
import json
import os
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).parent.parent


def load_parsers():
    import yaml
    with open(ROOT / "parsers.yaml") as f:
        return yaml.safe_load(f)["parsers"]


def build_image(parser_id, parser_dir):
    tag = f"yt-{parser_id}"
    print(f"  building {tag}...", flush=True)
    result = subprocess.run(
        ["docker", "build", "-t", tag, str(ROOT / parser_dir)],
        capture_output=True, text=True
    )
    if result.returncode != 0:
        print(f"  ERROR building {tag}:\n{result.stderr}", file=sys.stderr)
        return None
    return tag


def run_test(image_tag, test_file, key="lang"):
    result = subprocess.run(
        [
            "docker", "run", "--rm",
            "-v", f"{ROOT / 'tests'}:/tests",
            image_tag,
            f"/tests/{test_file}", key,
        ],
        capture_output=True, text=True, timeout=30
    )
    output = result.stdout.strip()
    return output if output else "ERROR"


def main():
    parsers = load_parsers()
    test_files = sorted(p.name for p in (ROOT / "tests").glob("*.yaml"))

    results = {}

    for parser_id, parser_info in parsers.items():
        print(f"\n[{parser_info['name']}]", flush=True)
        tag = build_image(parser_id, parser_info["dir"])
        if tag is None:
            for tf in test_files:
                results.setdefault(tf, {})[parser_id] = "BUILD_ERROR"
            continue

        for test_file in test_files:
            try:
                value = run_test(tag, test_file)
            except subprocess.TimeoutExpired:
                value = "TIMEOUT"
            results.setdefault(test_file, {})[parser_id] = value
            print(f"  {test_file}: {value}", flush=True)

    output_path = ROOT / "results.json"
    with open(output_path, "w") as f:
        json.dump(results, f, indent=2)
    print(f"\nResults written to {output_path}")

    # Summary table
    parser_ids = list(parsers.keys())
    col = 22
    header = f"{'test':<38}" + "".join(f"{p:<{col}}" for p in parser_ids)
    print("\n" + header)
    print("-" * len(header))
    for tf in test_files:
        row = f"{tf:<38}"
        for pid in parser_ids:
            row += f"{results.get(tf, {}).get(pid, 'N/A'):<{col}}"
        print(row)


if __name__ == "__main__":
    main()
