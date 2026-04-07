#!/usr/bin/env python3
import sys
import yaml


def main():
    if len(sys.argv) not in (2, 3):
        print("usage: yt <yaml-file> [key]", file=sys.stderr)
        sys.exit(1)

    try:
        raw = open(sys.argv[1], "rb").read()
    except Exception as e:
        print(e, file=sys.stderr)
        sys.exit(1)

    try:
        data = yaml.safe_load(raw)
    except Exception as e:
        print(e, file=sys.stderr)
        sys.exit(2)

    if len(sys.argv) == 2:
        print(data)
        return

    key = sys.argv[2]
    if not isinstance(data, dict) or key not in data:
        print("<nil>")
    else:
        print(data[key])


if __name__ == "__main__":
    main()
