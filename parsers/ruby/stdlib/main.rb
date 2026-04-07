#!/usr/bin/env ruby
require 'yaml'

if ARGV.length != 1 && ARGV.length != 2
  $stderr.puts "usage: yt <yaml-file> [key]"
  exit 1
end

begin
  raw = File.read(ARGV[0])
rescue => e
  $stderr.puts e.message
  exit 1
end

begin
  data = YAML.safe_load(raw)
rescue => e
  $stderr.puts e.message
  exit 2
end

if ARGV.length == 1
  puts data
  exit 0
end

key = ARGV[1]
if !data.is_a?(Hash) || !data.key?(key)
  puts "<nil>"
else
  puts data[key]
end
