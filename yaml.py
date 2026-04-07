#!/usr/bin/env python3
import os
import sys
import argparse
import subprocess
import json

from dataclasses import dataclass, asdict
from pathlib import Path
from typing import Optional, Union

DOCKER_IMAGE_PREFIX = "yaml"


@dataclass
class Parser:
    """Information about a YAML parser, loaded from a manifest.json file."""

    id: str
    name: str
    dir: str

    @property
    def image_tag(self) -> str:
        return f"{DOCKER_IMAGE_PREFIX}/{self.id}"


@dataclass
class ParserResult:
    value: Optional[str]


@dataclass
class ParserError:
    error: str


@dataclass
class Results:
    parsers: dict[str, Parser]
    tests: dict[str, str]
    results: dict[str, dict[str, Union[ParserResult, ParserError]]]


def main():
    root = argparse.ArgumentParser(description="YAML parser testing tool")

    root.add_argument(
        "-d",
        "--dir",
        metavar="dir",
        type=dir_path,
        help="Directory with YAML parser test files",
        default="parsers",
    )

    sub = root.add_subparsers(dest="sub")

    sub.add_parser(
        "list",
        help="Lists all available YAML parsers",
    )

    build = sub.add_parser(
        "build",
        help="Builds docker images for YAML parsers",
    )

    build.add_argument(
        "-p",
        "--parser",
        metavar="parser_id",
        help="Only build the specified parser",
    )

    run = sub.add_parser(
        "run",
        help="Runs YAML tests using built docker images",
    )

    run.add_argument(
        "-p",
        "--parser",
        metavar="parser_id",
        help="Only run tests for the specified parser. If not specified, runs all parsers.",
    )

    run.add_argument(
        "--json",
        help="Output results in JSON format",
        action=argparse.BooleanOptionalAction,
    )

    run.add_argument(
        "yaml_file_or_dir",
        help="YAML file or directory with YAML files to parse",
    )

    run.add_argument(
        "yaml_key", help="Key in YAML file to get expected value from", nargs="?"
    )

    args = root.parse_args()

    parsers = load_parsers(args.dir)

    if args.sub == "list":
        cmd_list(parsers)
    elif args.sub == "build":
        cmd_build(parsers, args.parser)
    elif args.sub == "run":
        cmd_run(parsers, args.parser, args.yaml_file_or_dir, args.yaml_key, args.json)
    else:
        print(
            f"No subcommand specified. Use {', '.join(sub.choices.keys())}",
            file=sys.stderr,
        )
        sys.exit(1)


def cmd_list(parsers: dict[str, Parser]):
    """Lists all available YAML parsers by their ID."""
    for parser in parsers.values():
        print(parser.id)


def cmd_build(parsers: dict[str, Parser], parser_id: Optional[str]):
    """Builds docker images for the specified parser(s). If parser_id is None, builds all parsers."""
    if parser_id is not None and parser_id not in parsers:
        print(f"Error: No parser with ID '{parser_id}' found.", file=sys.stderr)
        sys.exit(1)

    for id, parser in parsers.items():
        if parser_id is not None and id != parser_id:
            continue
        print(f"Building {parser.image_tag}...", file=sys.stderr)

        res = docker_build(f"{parser.image_tag}", str(parser.dir))
        if res.returncode != 0:
            print(f"Error building {parser.image_tag}:\n{res.stderr}", file=sys.stderr)
            sys.exit(1)


def cmd_run(
    parsers: dict[str, Parser],
    parser_id: Optional[str],
    dir_or_file: str,
    yaml_key: Optional[str],
    json_output: bool,
):
    """Runs YAML tests using the specified parser(s). If parser_id is None, runs all parsers."""
    if parser_id is not None and parser_id not in parsers:
        print(f"Error: No parser with ID '{parser_id}' found.", file=sys.stderr)
        sys.exit(1)

    path = Path(dir_or_file)

    if not path.exists():
        print(f"Error: Path '{dir_or_file}' does not exist.", file=sys.stderr)
        sys.exit(1)

    if path.is_dir():
        paths = list(sorted(path.rglob("*.yaml")))
    else:
        paths = [path]

    results = Results(parsers={}, tests={}, results={})

    for id, parser in parsers.items():
        if parser_id is not None and id != parser_id:
            continue

        results.parsers[parser.id] = parser
        results.results[parser.id] = {}

        if not json_output:
            msg = f"### {parser.name} ###"

            print("#" * len(msg))
            print(f"### {parser.name} ###")
            print("#" * len(msg) + "\n")

        for yaml_file in paths:
            with open(yaml_file, "r") as f:
                results.tests[yaml_file.name] = f.read()

            res = run(parser, str(yaml_file.absolute()), yaml_key)

            if not json_output:
                print(
                    f"==== {yaml_file} ====:\n{res.value if isinstance(res, ParserResult) else res.error}\n\n",
                )
            else:
                results.results[parser.id][yaml_file.name] = res

    if json_output:
        print(json.dumps(asdict(results), indent=2))


def run(
    parser: Parser,
    yaml_file: str,
    yaml_key: Optional[str],
) -> Union[ParserResult, ParserError]:
    """Runs the specified parser on the given YAML file and key."""

    if not docker_image_exists(parser.image_tag):
        print(
            f"Image {parser.image_tag} not found locally. Building...",
            file=sys.stderr,
        )
        docker_build(parser.image_tag, str(parser.dir))

    args = ["/file.yaml"]
    if yaml_key is not None:
        args.append(yaml_key)

    res = docker_run(
        parser.image_tag,
        args,
        volumes={yaml_file: "/file.yaml"},
    )

    if res.returncode != 2 and res.returncode != 0:
        print(f"error: {res.stderr}", file=sys.stderr)
        sys.exit(1)

    if res.returncode == 2:
        return ParserError(res.stderr.strip())

    out = res.stdout.strip()
    if out == "<nil>":
        return ParserResult(None)
    else:
        return ParserResult(out)


def load_parsers(dir: str) -> dict[str, Parser]:
    """Loads YAML parsers from the given directory.
    Each parser should be defined in a subdirectory with a manifest.json file."""
    parsers = {}
    root = Path(dir)

    for path in root.rglob("manifest.json"):
        with open(path) as f:
            manifest = json.load(f)

        parser = Parser(
            id=manifest["id"],
            name=manifest["name"],
            dir=str(path.parent),
        )
        parsers[parser.id] = parser

    return parsers


def docker_image_exists(tag: str) -> bool:
    """Checks if a Docker image with the given tag exists locally."""
    res = cmd("docker", "images", "-q", tag)
    return res.returncode == 0 and res.stdout.strip() != ""


def docker_build(tag: str, dir: str):
    """Runs 'docker build' with the given tag and directory."""
    return cmd("docker", "build", "-t", tag, dir)


def docker_run(image: str, args: list[str], volumes: dict[str, str] = {}):
    """Runs 'docker run' with specified image, mounts, and arguments.
    Mounts should be a list of host paths to mount into the container."""
    return cmd(
        "docker",
        "run",
        "--rm",
        *[item for m in volumes.items() for item in ("-v", f"{m[0]}:{m[1]}")],
        image,
        *args,
    )


def cmd(*args):
    """Runs a command and raises an error if it fails."""
    return subprocess.run(
        args,
        capture_output=True,
        text=True,
    )


def dir_path(path: str):
    if os.path.isdir(path):
        return path
    else:
        raise NotADirectoryError(path)


if __name__ == "__main__":
    main()
