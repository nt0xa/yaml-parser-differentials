#!/usr/bin/env python3
import sys
import yaml


def main():
    if len(sys.argv) != 3:
        print("usage: yt <yaml-file> <key>", file=sys.stderr)
        print("ERROR")
        sys.exit(0)

    try:
        data = yaml.safe_load(open(sys.argv[1], 'rb'))
    except yaml.YAMLError as e:
        print(e, file=sys.stderr)
        print("PARSE_ERROR")
        sys.exit(0)
    except Exception as e:
        print(e, file=sys.stderr)
        print("ERROR")
        sys.exit(0)

    key = sys.argv[2]
    if not isinstance(data, dict) or key not in data:
        print("absent")
    else:
        print(data[key])


if __name__ == "__main__":
    main()
