package main

import (
	"fmt"
	"os"

	"gopkg.in/yaml.v3"
)

func main() {
	if len(os.Args) != 3 {
		fmt.Fprintln(os.Stderr, "usage: yt <yaml-file> <key>")
		os.Exit(1)
	}

	raw, err := os.ReadFile(os.Args[1])
	if err != nil {
		fmt.Fprintln(os.Stderr, err)
		os.Exit(1)
	}

	var data map[string]any
	if err := yaml.Unmarshal(raw, &data); err != nil {
		fmt.Fprintln(os.Stderr, err)
		os.Exit(2)
	}

	v, ok := data[os.Args[2]]
	if !ok {
		fmt.Println("absent")
		os.Exit(0)
	}

	fmt.Println(v)
}
